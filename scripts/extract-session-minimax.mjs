#!/usr/bin/env node
// extract-session-minimax.mjs — pull a MiniMax Code session for a collected result.
//
// Usage:  node scripts/extract-session-minimax.mjs <result-slug>
//
// MiniMax-Code sibling of extract-session.mjs / -codex / -cursor. MiniMax Code is
// an opencode-based desktop agent that stores everything in one SQLite DB at
//   ~/.minimax/sqlite.db
// We locate the session whose `workspace_dir` contains the result's bench-dir
// slug, then read:
//   - session_messages  one row per turn. Assistant rows carry `thinking_content`,
//                        `msg_content`, and a `tool_calls` array where each call
//                        embeds BOTH its args (`tool_call_args`) and its output
//                        (`tool_call_result_data`) — so there are no separate
//                        tool-result rows. (role=null / msg_type=3 rows are todo
//                        snapshots.)
//   - token_usage       per-turn token + cost rows; summed for the cumulative
//                        figures (input/output/cache + real cost_usd).
// and writes into results/<slug>/session/:
//   - minimax-session.json    raw dump (session row + every message + token rows)
//   - transcript.md           readable extracted text (prompts, thinking, tools)
//   - session-metadata.json   aggregated telemetry (tokens, cost, time, tools)
// plus a plaintext results/<slug>/runlog.txt run log.
//
// Unlike Cursor, MiniMax persists cumulative token usage AND cost locally, so
// tokenUsage / estimatedCostUsd are recovered here in full.
//
// Non-destructive: it does NOT modify the result's metadata.json. The key
// numbers are printed so they can be merged into metadata.json by hand.

import {
  writeFileSync, mkdirSync, existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { DatabaseSync } from "node:sqlite";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/extract-session-minimax.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- open the MiniMax SQLite DB (read-only) -----------------------------------
const DB = join(homedir(), ".minimax", "sqlite.db");
if (!existsSync(DB)) {
  console.error(`No MiniMax DB at ${DB}.`);
  process.exit(1);
}
const db = new DatabaseSync(DB, { readOnly: true });

// --- locate the session by workspace_dir --------------------------------------
// Every bench runs in its own dir whose name is the result slug.
const session = db
  .prepare("SELECT * FROM sessions WHERE workspace_dir LIKE ? ORDER BY created_at DESC LIMIT 1")
  .get(`%${slug}%`);
if (!session) {
  console.error(`No MiniMax session whose workspace_dir matches "${slug}".`);
  process.exit(1);
}
const SID = session.session_id;
console.log(`Session: ${SID}  (framework ${session.framework_type} ${session.framework_session_id || ""})`);

const model = session.effective_model || null;
const variant = session.effective_model_variant || null;

// --- read every message in order ----------------------------------------------
const msgRows = db
  .prepare("SELECT id, role, data, timestamp FROM session_messages WHERE session_id=? ORDER BY id")
  .all(SID);
const messages = [];
for (const r of msgRows) {
  let d; try { d = JSON.parse(r.data); } catch { continue; }
  messages.push({ id: r.id, role: r.role, timestamp: r.timestamp, ...d });
}

// --- cumulative token usage + cost (sum of per-turn rows) ----------------------
const tokenRows = db
  .prepare("SELECT model, ts, input_tokens, output_tokens, reasoning_tokens, cache_read_tokens, cache_write_tokens, cost_usd FROM token_usage WHERE session_id=? ORDER BY ts")
  .all(SID);
const tokens = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 };
let costUsd = 0;
for (const t of tokenRows) {
  tokens.input += t.input_tokens || 0;
  tokens.output += t.output_tokens || 0;
  tokens.reasoning += t.reasoning_tokens || 0;
  tokens.cacheRead += t.cache_read_tokens || 0;
  tokens.cacheWrite += t.cache_write_tokens || 0;
  costUsd += t.cost_usd || 0;
}
tokens.total = tokens.input + tokens.output;
costUsd = Math.round(costUsd * 1e6) / 1e6;

// --- output dir ---------------------------------------------------------------
const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
// Raw bundle: session row + every parsed message + token rows, verbatim.
writeFileSync(
  join(outDir, "minimax-session.json"),
  JSON.stringify({ session, messages, tokenUsage: tokenRows }, null, 2) + "\n",
);

// --- walk the turns -----------------------------------------------------------
const trunc = (s, n = 1500) =>
  typeof s === "string" && s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;
// Strip the stray "</think>" sentinel MiniMax leaves in msg_content when the
// turn was pure reasoning (the real thinking lives in thinking_content).
const clean = (s) => String(s ?? "").replace(/^\s*<\/think>\s*/, "").trim();
// Make an absolute path readable: drop everything up to and including the slug.
const rel = (f) => {
  if (typeof f !== "string") return f;
  const i = f.indexOf(slug);
  return i >= 0 ? f.slice(i + slug.length + 1) || f : f;
};

const tools = {};
const filesWritten = new Set();
const filesEdited = new Set();
const filesRead = new Set();
const shellCommands = [];
let userMsgs = 0, assistantMsgs = 0, thinkingBlocks = 0;
let firstTs = null, lastTs = null, finalMessage = null;

const md = [];   // transcript.md body
const log = [];  // runlog.txt body

for (const m of messages) {
  if (m.timestamp) {
    if (!firstTs || m.timestamp < firstTs) firstTs = m.timestamp;
    if (!lastTs || m.timestamp > lastTs) lastTs = m.timestamp;
  }

  // role=null / msg_type=3 → todo snapshot
  if (m.msg_type === 3 || (!m.role && !m.tool_calls)) {
    let todos = null;
    try { todos = JSON.parse(m.msg_content)?.todos; } catch { /* skip */ }
    if (todos) {
      const line = todos.map((t) => `  [${t.status === "completed" ? "x" : t.status === "in_progress" ? "~" : " "}] ${t.content}`).join("\n");
      md.push(`\n### ✅ Todo update\n\n\`\`\`\n${line}\n\`\`\``);
      log.push(`\n[TODO]\n${line}`);
    }
    continue;
  }

  if (m.role === "user") {
    userMsgs++;
    const text = typeof m.msg_content === "string" ? m.msg_content : JSON.stringify(m.msg_content);
    md.push(`\n---\n\n## 👤 User\n\n${trunc(text, 4000)}`);
    log.push(`\n========================================\n[USER]\n${text}`);
    continue;
  }

  // assistant
  const think = m.thinking_content;
  if (think) {
    thinkingBlocks++;
    md.push(`\n### 💭 Thinking\n\n${trunc(think)}`);
    log.push(`\n[THINKING]\n${trunc(think)}`);
  }

  const text = clean(m.msg_content);
  if (text) {
    assistantMsgs++;
    finalMessage = text;   // last non-empty assistant text wins
    md.push(`\n### 🤖 Assistant\n\n${text}`);
    log.push(`\n[ASSISTANT]\n${text}`);
  }

  for (const tc of m.tool_calls || []) {
    const name = tc.tool_name || "tool";
    tools[name] = (tools[name] || 0) + 1;
    let args = {};
    try { args = JSON.parse(tc.tool_call_args); } catch { /* keep raw */ }
    if (name === "bash" && args.command) shellCommands.push(args.command);
    if (args.filePath) {
      const f = rel(args.filePath);
      if (name === "write") filesWritten.add(f);
      else if (name === "edit") filesEdited.add(f);
      else if (name === "read") filesRead.add(f);
    }
    const argText = args.command ?? trunc(JSON.stringify(args, null, 2));
    let res = tc.tool_call_result_data;
    if (res != null && typeof res !== "string") res = JSON.stringify(res);
    md.push(`\n### 🔧 Tool: \`${name}\`\n\n\`\`\`\n${trunc(argText)}\n\`\`\``);
    if (res != null) md.push(`\n*result*\n\n\`\`\`\n${trunc(res)}\n\`\`\``);
    log.push(`\n[TOOL: ${name}]\n  ${String(argText).replace(/\n/g, "\n  ")}`);
    if (res != null) log.push(`  [RESULT]\n  ${trunc(res).replace(/\n/g, "\n  ")}`);
  }
}

const wallSeconds = firstTs && lastTs ? Math.round((lastTs - firstTs) / 1000) : null;
// Final context-window snapshot from the last assistant turn that reported usage.
let contextWindowFinal = null;
for (let i = messages.length - 1; i >= 0; i--) {
  const u = messages[i].usage;
  if (u && (u.total_tokens || u.context_window)) {
    contextWindowFinal = { totalUsedTokens: u.total_tokens ?? null, maxTokens: u.context_window ?? null };
    break;
  }
}

const meta = {
  extractedAt: new Date().toISOString(),
  sessionId: SID,
  frameworkType: session.framework_type,
  frameworkSessionId: session.framework_session_id,
  agentName: session.agent_name,
  title: session.title,
  model,
  modelVariant: variant,
  workspaceDir: session.workspace_dir,
  span: { start: firstTs, end: lastTs, wallSeconds },
  messages: { user: userMsgs, assistant: assistantMsgs, thinking: thinkingBlocks },
  tokenUsage: tokens,
  estimatedCostUsd: costUsd,
  contextWindowFinal,
  tools,
  filesWritten: [...filesWritten],
  filesEdited: [...filesEdited],
  filesRead: [...filesRead],
  shellCommands,
  finalMessage,
  files: { raw: "session/minimax-session.json", transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

// --- transcript.md ------------------------------------------------------------
const fmt = (n) => Number(n).toLocaleString();
const tHeader = `# Session transcript — ${slug}

- Session: \`${SID}\`  ·  framework: ${session.framework_type} (\`${session.framework_session_id || "—"}\`)
- Model: ${model}${variant ? ` (${variant})` : ""}  ·  agent: ${session.agent_name}
- Span: ${firstTs ? new Date(firstTs).toISOString() : "—"} → ${lastTs ? new Date(lastTs).toISOString() : "—"} (wall ${wallSeconds}s)
- Messages: ${userMsgs} user / ${assistantMsgs} assistant text / ${thinkingBlocks} thinking
- Tokens: ${fmt(tokens.total)} total (in ${fmt(tokens.input)}, out ${fmt(tokens.output)}, cache-read ${fmt(tokens.cacheRead)}, reasoning ${fmt(tokens.reasoning)})
- Cost: $${costUsd}
- Tools: ${Object.entries(tools).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}

> Long tool inputs/results are truncated. Tool results are embedded inline with
> their call. Raw session dump is alongside this file.
`;
writeFileSync(join(outDir, "transcript.md"), tHeader + md.join("\n") + "\n");

// --- runlog.txt ---------------------------------------------------------------
const rHeader = `NASA Harness Bench — run log
${slug}
Session ${SID} · MiniMax Code (${session.framework_type}) · ${model}${variant ? ` (${variant})` : ""}
${firstTs ? new Date(firstTs).toISOString() : "—"} → ${lastTs ? new Date(lastTs).toISOString() : "—"} (wall ${wallSeconds}s) · ${userMsgs} user / ${assistantMsgs} assistant turns · ${thinkingBlocks} thinking blocks
Tokens: input ${fmt(tokens.input)} · output ${fmt(tokens.output)} · cache-read ${fmt(tokens.cacheRead)} · total ${fmt(tokens.total)} · cost $${costUsd}
(Extracted from ~/.minimax/sqlite.db. Tool results embedded inline; long inputs/results truncated.)
`;
writeFileSync(join(resultDir, "runlog.txt"), rHeader + log.join("\n") + "\n");

db.close();

// --- report -------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - minimax-session.json (raw)");
console.log("  - transcript.md");
console.log("  - session-metadata.json");
console.log("Wrote results/%s/runlog.txt", slug);
console.log("\n=== Telemetry (paste objective fields into metadata.json) ===");
console.log("  timeTakenSeconds:", wallSeconds);
console.log("  model:", model, variant ? `(${variant})` : "");
console.log("  tokenUsage:", JSON.stringify({ input: tokens.input, output: tokens.output, total: tokens.total }));
console.log("  cacheRead:", fmt(tokens.cacheRead), "| reasoning:", fmt(tokens.reasoning));
console.log("  estimatedCostUsd:", costUsd);
console.log("  tools:", JSON.stringify(tools));
console.log("  files written:", filesWritten.size, "| edited:", filesEdited.size, "| read:", filesRead.size, "| shell cmds:", shellCommands.length);
