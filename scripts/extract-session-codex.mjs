#!/usr/bin/env node
// extract-session-codex.mjs — pull a Codex CLI session for a collected result.
//
// Usage:  node scripts/extract-session-codex.mjs <result-slug>
//
// Codex sibling of extract-session.mjs. Locates the Codex CLI rollout log
// (under ~/.codex/sessions/, matched by the result's bench-dir slug appearing
// in the session's recorded cwd), then writes into results/<slug>/session/:
//   - <rollout>.jsonl         raw rollout log, copied verbatim
//   - transcript.md           readable extracted text (prompts, tools, results)
//   - session-metadata.json   aggregated telemetry (tokens, time, tools)
// and a plaintext results/<slug>/runlog.txt run log.
//
// Reasoning is stored encrypted in Codex rollouts, so thinking text is not
// recoverable — those turns are noted but blank.
//
// Non-destructive: it does NOT modify the result's metadata.json. The key
// numbers are printed so they can be merged into metadata.json by hand.

import {
  readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync, statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/extract-session-codex.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- locate the rollout file --------------------------------------------------
// Codex stores sessions as ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl. Walk the
// tree and pick the rollout whose session_meta.cwd contains the result slug.
const SESSIONS = join(homedir(), ".codex", "sessions");
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.startsWith("rollout-") && e.endsWith(".jsonl")) out.push(p);
  }
  return out;
}
if (!existsSync(SESSIONS)) {
  console.error(`No Codex sessions dir at ${SESSIONS}.`);
  process.exit(1);
}
let rolloutPath = null;
for (const p of walk(SESSIONS)) {
  try {
    const first = readFileSync(p, "utf8").split("\n", 1)[0];
    const meta = JSON.parse(first);
    const cwd = meta?.payload?.cwd || meta?.cwd || "";
    if (cwd.includes(slug)) { rolloutPath = p; break; }
  } catch { /* skip unreadable */ }
}
if (!rolloutPath) {
  console.error(`No Codex rollout under ${SESSIONS} whose cwd matches "${slug}".`);
  process.exit(1);
}
const rolloutName = rolloutPath.split("/").pop();
console.log(`Rollout: ${rolloutPath}`);

// --- read all records in order ------------------------------------------------
const records = [];
for (const line of readFileSync(rolloutPath, "utf8").split("\n")) {
  if (!line.trim()) continue;
  try { records.push(JSON.parse(line)); } catch { /* skip bad line */ }
}

// --- output dir ---------------------------------------------------------------
const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
copyFileSync(rolloutPath, join(outDir, rolloutName));

// --- aggregate telemetry ------------------------------------------------------
const tokens = { input_tokens: 0, output_tokens: 0, cached_input_tokens: 0, reasoning_output_tokens: 0, total_tokens: 0 };
const tools = {};
const shellCommands = [];
const filesWritten = new Set();
const filesEdited = new Set();
const models = new Set();
let userMsgs = 0, assistantMsgs = 0;
let firstTs = null, lastTs = null;
let version = null, cwd = null, sessionId = null, provider = null, effort = null;
let durationMs = null, ttftMs = null, finalMessage = null;

const trunc = (s, n = 1500) =>
  typeof s === "string" && s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;

// Map call_id -> textual result so a tool call can render its output inline.
const outputs = {};
for (const r of records) {
  const p = r.payload || {};
  if (p.type === "function_call_output" || p.type === "custom_tool_call_output") {
    outputs[p.call_id] = typeof p.output === "string" ? p.output : JSON.stringify(p.output);
  }
}

// Parse an apply_patch body for the files it adds/updates/deletes.
function patchFiles(body) {
  const adds = [], updates = [];
  for (const line of String(body).split("\n")) {
    let m;
    if ((m = line.match(/^\*\*\* Add File: (.+)$/))) adds.push(m[1].trim());
    else if ((m = line.match(/^\*\*\* Update File: (.+)$/))) updates.push(m[1].trim());
    else if ((m = line.match(/^\*\*\* Delete File: (.+)$/))) updates.push(m[1].trim());
  }
  return { adds, updates };
}

const md = [];   // transcript.md body
const log = [];  // runlog.txt body

function logBlock(s) { log.push(s); }

for (const r of records) {
  const p = r.payload || {};
  if (r.timestamp) {
    if (!firstTs || r.timestamp < firstTs) firstTs = r.timestamp;
    if (!lastTs || r.timestamp > lastTs) lastTs = r.timestamp;
  }

  if (r.type === "session_meta") {
    sessionId ||= p.id;
    version ||= p.cli_version;
    cwd ||= p.cwd;
    provider ||= p.model_provider;
  } else if (r.type === "turn_context") {
    if (p.model) models.add(p.model);
    effort ||= p?.collaboration_mode?.settings?.reasoning_effort;
  } else if (r.type === "event_msg" && p.type === "token_count") {
    // total_token_usage is cumulative; keep the latest snapshot.
    const t = p.info?.total_token_usage;
    if (t) {
      tokens.input_tokens = t.input_tokens ?? tokens.input_tokens;
      tokens.output_tokens = t.output_tokens ?? tokens.output_tokens;
      tokens.cached_input_tokens = t.cached_input_tokens ?? tokens.cached_input_tokens;
      tokens.reasoning_output_tokens = t.reasoning_output_tokens ?? tokens.reasoning_output_tokens;
      tokens.total_tokens = t.total_tokens ?? tokens.total_tokens;
    }
  } else if (r.type === "event_msg" && p.type === "user_message") {
    userMsgs++;
    md.push(`\n---\n\n## 👤 User\n\n${trunc(p.message, 4000)}`);
    logBlock(`\n========================================\n[USER]\n${p.message}`);
  } else if (r.type === "event_msg" && p.type === "task_complete") {
    finalMessage = p.last_agent_message || finalMessage;
    durationMs = p.duration_ms ?? durationMs;
    ttftMs = p.time_to_first_token_ms ?? ttftMs;
  } else if (r.type === "response_item" && p.type === "message" && p.role === "assistant") {
    assistantMsgs++;
    const text = (p.content || []).map((c) => c.text || "").join("\n").trim();
    if (text) {
      md.push(`\n### 🤖 Assistant\n\n${text}`);
      logBlock(`\n[ASSISTANT]\n${text}`);
    }
  } else if (r.type === "response_item" && p.type === "reasoning") {
    md.push(`\n### 💭 Thinking\n\n> _(encrypted by Codex — not recoverable)_`);
  } else if (r.type === "response_item" && p.type === "function_call") {
    tools[p.name] = (tools[p.name] || 0) + 1;
    let args = {};
    try { args = JSON.parse(p.arguments); } catch { /* keep raw */ }
    if (p.name === "exec_command" && args.cmd) shellCommands.push(args.cmd);
    const argText = args.cmd ?? trunc(JSON.stringify(args, null, 2));
    const res = outputs[p.call_id];
    md.push(`\n### 🔧 Tool: \`${p.name}\`\n\n\`\`\`\n${trunc(argText)}\n\`\`\``);
    if (res != null) md.push(`\n*result*\n\n\`\`\`\n${trunc(res)}\n\`\`\``);
    logBlock(`\n[TOOL: ${p.name}]\n  ${String(argText).replace(/\n/g, "\n  ")}`);
    if (res != null) logBlock(`  [RESULT]\n  ${trunc(res).replace(/\n/g, "\n  ")}`);
  } else if (r.type === "response_item" && p.type === "custom_tool_call") {
    tools[p.name] = (tools[p.name] || 0) + 1;
    if (p.name === "apply_patch") {
      const { adds, updates } = patchFiles(p.input);
      adds.forEach((f) => filesWritten.add(f));
      updates.forEach((f) => filesEdited.add(f));
    }
    const res = outputs[p.call_id];
    md.push(`\n### 🔧 Tool: \`${p.name}\`\n\n\`\`\`\n${trunc(p.input)}\n\`\`\``);
    if (res != null) md.push(`\n*result*\n\n\`\`\`\n${trunc(res)}\n\`\`\``);
    logBlock(`\n[TOOL: ${p.name}]\n  ${trunc(p.input).replace(/\n/g, "\n  ")}`);
    if (res != null) logBlock(`  [RESULT]\n  ${trunc(res).replace(/\n/g, "\n  ")}`);
  }
}

const total = tokens.total_tokens
  || (tokens.input_tokens + tokens.output_tokens);
const wallSeconds = firstTs && lastTs
  ? Math.round((new Date(lastTs) - new Date(firstTs)) / 1000) : null;
// Prefer the harness-reported task duration; fall back to wall-clock span.
const durationSeconds = durationMs != null ? Math.round(durationMs / 1000) : wallSeconds;
const model = [...models][0] || null;

const meta = {
  extractedAt: new Date().toISOString(),
  sessionId,
  codexVersion: version,
  modelProvider: provider,
  models: [...models],
  effort,
  cwd,
  span: { start: firstTs, end: lastTs, wallSeconds, durationSeconds, timeToFirstTokenMs: ttftMs },
  messages: { user: userMsgs, assistant: assistantMsgs },
  tokens: { ...tokens, total },
  tools,
  filesWritten: [...filesWritten],
  filesEdited: [...filesEdited],
  shellCommands,
  finalMessage,
  files: { raw: [`session/${rolloutName}`], transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

// --- transcript.md ------------------------------------------------------------
const tHeader = `# Session transcript — ${slug}

- Session: \`${sessionId}\`
- Codex CLI: \`${version}\`  ·  provider: ${provider}  ·  model: ${model}  ·  effort: ${effort}
- Span: ${firstTs} → ${lastTs} (wall ${wallSeconds}s · task ${durationSeconds}s)
- Messages: ${userMsgs} user / ${assistantMsgs} assistant
- Tokens: ${total.toLocaleString()} total (in ${tokens.input_tokens.toLocaleString()}, out ${tokens.output_tokens.toLocaleString()}, cached-in ${tokens.cached_input_tokens.toLocaleString()}, reasoning-out ${tokens.reasoning_output_tokens.toLocaleString()})
- Tools: ${Object.entries(tools).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}

> Long tool inputs/results are truncated. Reasoning is encrypted by Codex and not recoverable. Raw log is alongside this file.
`;
writeFileSync(join(outDir, "transcript.md"), tHeader + md.join("\n") + "\n");

// --- runlog.txt ---------------------------------------------------------------
const rHeader = `NASA Harness Bench — run log
${slug}
Session ${sessionId} · Codex CLI ${version} · ${model} (${provider}, effort ${effort})
${firstTs} → ${lastTs} (task ${durationSeconds}s) · ${userMsgs} user / ${assistantMsgs} assistant turns
Tokens: input ${tokens.input_tokens.toLocaleString()} · output ${tokens.output_tokens.toLocaleString()} · total ${total.toLocaleString()}
(Extracted from the Codex CLI rollout JSONL. Reasoning encrypted; long tool inputs/results truncated.)
`;
writeFileSync(join(resultDir, "runlog.txt"), rHeader + log.join("\n") + "\n");

// --- report -------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - %s (raw)", rolloutName);
console.log("  - transcript.md");
console.log("  - session-metadata.json");
console.log("Wrote results/%s/runlog.txt", slug);
console.log("\n=== Telemetry (paste objective fields into metadata.json) ===");
console.log("  timeTakenSeconds:", durationSeconds, "(wall span", wallSeconds + "s)");
console.log("  tokenUsage:", JSON.stringify({
  input: tokens.input_tokens, output: tokens.output_tokens,
  cached: tokens.cached_input_tokens, reasoning: tokens.reasoning_output_tokens, total,
}));
console.log("  tools:", JSON.stringify(tools));
console.log("  files written:", filesWritten.size, "| edited:", filesEdited.size, "| shell cmds:", shellCommands.length);
