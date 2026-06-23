#!/usr/bin/env node
// extract-session-opencode.mjs — pull an opencode CLI session for a collected result.
//
// Usage:  node scripts/extract-session-opencode.mjs <result-slug>
//
// opencode (the CLI) stores everything in one SQLite DB at
//   ~/.local/share/opencode/opencode.db
// Schema (v1.17+):
//   - session   one row per session; carries the cumulative `cost` and
//               `tokens_input/output/reasoning/cache_read/cache_write` columns
//               (verified equal to the sum of the per-step `step-finish` parts),
//               plus `model` (JSON {id,providerID,variant}) and `directory`.
//   - message   one row per turn; `data` JSON carries role + time.
//   - part      one row per content block, linked by message_id/session_id.
//               types: text · reasoning · tool · step-start · step-finish.
//               A `tool` part embeds BOTH its `state.input` and `state.output`,
//               so there are no separate tool-result rows.
//
// We locate the session whose `directory` contains the result slug, then write
// into results/<slug>/session/:
//   - opencode-session.json   raw dump (session row + messages + parts)
//   - transcript.md           readable extracted text (prompts, thinking, tools)
//   - session-metadata.json   aggregated telemetry (tokens, cost, time, tools)
// plus a plaintext results/<slug>/runlog.txt run log.
//
// opencode persists cumulative token usage AND real cost locally, so
// tokenUsage / estimatedCostUsd are recovered here in full. (The cost is priced
// by opencode from models.dev rates — for the public minimax provider these are
// $0.60/M input, $2.40/M output, $0.12/M cache-read.)
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
  console.error("Usage: node scripts/extract-session-opencode.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- open the opencode SQLite DB (read-only) ----------------------------------
const DB = join(homedir(), ".local", "share", "opencode", "opencode.db");
if (!existsSync(DB)) {
  console.error(`No opencode DB at ${DB}.`);
  process.exit(1);
}
const db = new DatabaseSync(DB, { readOnly: true });

// --- locate the session by directory ------------------------------------------
// Every bench runs in its own dir whose name is the result slug.
const session = db
  .prepare("SELECT * FROM session WHERE directory LIKE ? ORDER BY time_created DESC LIMIT 1")
  .get(`%${slug}%`);
if (!session) {
  console.error(`No opencode session whose directory matches "${slug}".`);
  process.exit(1);
}
const SID = session.id;

let modelObj = {};
try { modelObj = JSON.parse(session.model || "{}"); } catch { /* keep empty */ }
const model = modelObj.providerID && modelObj.id ? `${modelObj.providerID}/${modelObj.id}` : (modelObj.id || null);
const variant = modelObj.variant || null;
console.log(`Session: ${SID}  (${model}${variant ? ` (${variant})` : ""})`);

// --- cumulative token usage + cost (from the authoritative session row) -------
const tokens = {
  input: session.tokens_input || 0,
  output: session.tokens_output || 0,
  reasoning: session.tokens_reasoning || 0,
  cacheRead: session.tokens_cache_read || 0,
  cacheWrite: session.tokens_cache_write || 0,
};
tokens.total = tokens.input + tokens.output;
const costUsd = Math.round((session.cost || 0) * 1e6) / 1e6;

// --- read every message + its parts, in order --------------------------------
const msgRows = db
  .prepare("SELECT id, data, time_created FROM message WHERE session_id=? ORDER BY time_created, id")
  .all(SID);
const partStmt = db
  .prepare("SELECT data, time_created FROM part WHERE message_id=? ORDER BY time_created, id");

const messages = [];
for (const r of msgRows) {
  let d; try { d = JSON.parse(r.data); } catch { d = {}; }
  const parts = [];
  for (const p of partStmt.all(r.id)) {
    let pd; try { pd = JSON.parse(p.data); } catch { continue; }
    parts.push(pd);
  }
  messages.push({ id: r.id, time_created: r.time_created, ...d, parts });
}

// --- output dir ---------------------------------------------------------------
const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
// Raw bundle: session row + every parsed message (with parts), verbatim.
writeFileSync(
  join(outDir, "opencode-session.json"),
  JSON.stringify({ session, messages }, null, 2) + "\n",
);

// --- walk the turns -----------------------------------------------------------
const trunc = (s, n = 1500) =>
  typeof s === "string" && s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;
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
  const ts = m.time?.created || m.time_created;
  if (ts) {
    if (!firstTs || ts < firstTs) firstTs = ts;
    if (!lastTs || ts > lastTs) lastTs = ts;
  }

  if (m.role === "user") {
    userMsgs++;
    const text = m.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n").trim()
      || "(no text)";
    md.push(`\n---\n\n## 👤 User\n\n${trunc(text, 4000)}`);
    log.push(`\n========================================\n[USER]\n${text}`);
    continue;
  }

  // assistant — emit parts in their recorded order
  let emittedText = false;
  for (const p of m.parts) {
    if (p.type === "reasoning" && p.text?.trim()) {
      thinkingBlocks++;
      md.push(`\n### 💭 Thinking\n\n${trunc(p.text.trim())}`);
      log.push(`\n[THINKING]\n${trunc(p.text.trim())}`);
    } else if (p.type === "text" && p.text?.trim()) {
      emittedText = true;
      finalMessage = p.text.trim();   // last non-empty assistant text wins
      md.push(`\n### 🤖 Assistant\n\n${p.text.trim()}`);
      log.push(`\n[ASSISTANT]\n${p.text.trim()}`);
    } else if (p.type === "tool") {
      const name = p.tool || "tool";
      tools[name] = (tools[name] || 0) + 1;
      const st = p.state || {};
      const args = st.input || {};
      if (name === "bash" && args.command) shellCommands.push(args.command);
      const f = args.filePath || args.path;
      if (f) {
        const r = rel(f);
        if (name === "write") filesWritten.add(r);
        else if (name === "edit") filesEdited.add(r);
        else if (name === "read") filesRead.add(r);
      }
      const argText = args.command ?? trunc(JSON.stringify(args, null, 2));
      let res = st.output;
      if (res != null && typeof res !== "string") res = JSON.stringify(res);
      md.push(`\n### 🔧 Tool: \`${name}\`\n\n\`\`\`\n${trunc(argText)}\n\`\`\``);
      if (res != null) md.push(`\n*result*\n\n\`\`\`\n${trunc(res)}\n\`\`\``);
      log.push(`\n[TOOL: ${name}]\n  ${String(argText).replace(/\n/g, "\n  ")}`);
      if (res != null) log.push(`  [RESULT]\n  ${trunc(res).replace(/\n/g, "\n  ")}`);
    }
  }
  if (emittedText) assistantMsgs++;
}

const wallSeconds = firstTs && lastTs ? Math.round((lastTs - firstTs) / 1000) : null;

const meta = {
  extractedAt: new Date().toISOString(),
  sessionId: SID,
  harness: "opencode",
  harnessVersion: session.version,
  title: session.title,
  agent: session.agent,
  model,
  modelVariant: variant,
  workspaceDir: session.directory,
  span: { start: firstTs, end: lastTs, wallSeconds },
  messages: { user: userMsgs, assistant: assistantMsgs, thinking: thinkingBlocks },
  tokenUsage: tokens,
  estimatedCostUsd: costUsd,
  tools,
  filesWritten: [...filesWritten],
  filesEdited: [...filesEdited],
  filesRead: [...filesRead],
  shellCommands,
  finalMessage,
  files: { raw: "session/opencode-session.json", transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

// --- transcript.md ------------------------------------------------------------
const fmt = (n) => Number(n).toLocaleString();
const tHeader = `# Session transcript — ${slug}

- Session: \`${SID}\`  ·  harness: opencode ${session.version}
- Model: ${model}${variant ? ` (${variant})` : ""}  ·  agent: ${session.agent}
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
Session ${SID} · opencode ${session.version} · ${model}${variant ? ` (${variant})` : ""}
${firstTs ? new Date(firstTs).toISOString() : "—"} → ${lastTs ? new Date(lastTs).toISOString() : "—"} (wall ${wallSeconds}s) · ${userMsgs} user / ${assistantMsgs} assistant turns · ${thinkingBlocks} thinking blocks
Tokens: input ${fmt(tokens.input)} · output ${fmt(tokens.output)} · cache-read ${fmt(tokens.cacheRead)} · total ${fmt(tokens.total)} · cost $${costUsd}
(Extracted from ~/.local/share/opencode/opencode.db. Tool results embedded inline; long inputs/results truncated.)
`;
writeFileSync(join(resultDir, "runlog.txt"), rHeader + log.join("\n") + "\n");

db.close();

// --- report -------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - opencode-session.json (raw)");
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
