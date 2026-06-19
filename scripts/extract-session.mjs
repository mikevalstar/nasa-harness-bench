#!/usr/bin/env node
// extract-session.mjs — pull a Claude Code session for a collected result.
//
// Usage:  node scripts/extract-session.mjs <result-slug>
//
// Locates the harness's Claude Code session (under ~/.claude/projects/, matched
// by the result's bench-dir slug), then writes into results/<slug>/session/:
//   - <sessionId>.jsonl       raw session log(s), copied verbatim
//   - transcript.md           readable extracted text (prompts, thinking, tools)
//   - session-metadata.json   aggregated telemetry (tokens, time, tools, web use)
//
// Non-destructive: it does NOT modify the result's metadata.json. The key
// numbers are printed so they can be merged into metadata.json by hand.

import {
  readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync, statSync,
} from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/extract-session.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- locate the session directory ---------------------------------------------
const PROJECTS = join(homedir(), ".claude", "projects");
const candidates = existsSync(PROJECTS)
  ? readdirSync(PROJECTS).filter((d) => d.includes(slug) && statSync(join(PROJECTS, d)).isDirectory())
  : [];
if (!candidates.length) {
  console.error(`No Claude Code session dir under ${PROJECTS} matching "${slug}".`);
  process.exit(1);
}
const sessionDir = join(PROJECTS, candidates[0]);
const jsonls = readdirSync(sessionDir).filter((f) => f.endsWith(".jsonl")).sort();
if (!jsonls.length) {
  console.error(`No .jsonl session files in ${sessionDir}.`);
  process.exit(1);
}
console.log(`Session dir: ${sessionDir}`);
console.log(`Session files: ${jsonls.join(", ")}`);

// --- read all records in order ------------------------------------------------
const records = [];
for (const f of jsonls) {
  for (const line of readFileSync(join(sessionDir, f), "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { records.push(JSON.parse(line)); } catch { /* skip bad line */ }
  }
}

// --- output dir ---------------------------------------------------------------
const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
for (const f of jsonls) copyFileSync(join(sessionDir, f), join(outDir, f));

// --- aggregate telemetry ------------------------------------------------------
const tokens = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
const tools = {};
const bashCommands = [];
const filesWritten = new Set();
const filesEdited = new Set();
const models = new Set();
let web = { searchRequests: 0, fetchRequests: 0 };
let userMsgs = 0, assistantMsgs = 0;
let firstTs = null, lastTs = null;
let version = null, gitBranch = null, cwd = null, sessionId = null;

const trunc = (s, n = 1500) =>
  typeof s === "string" && s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;

const lines = []; // transcript
for (const r of records) {
  if (r.timestamp) {
    if (!firstTs || r.timestamp < firstTs) firstTs = r.timestamp;
    if (!lastTs || r.timestamp > lastTs) lastTs = r.timestamp;
  }
  version ||= r.version; gitBranch ||= r.gitBranch; cwd ||= r.cwd; sessionId ||= r.sessionId;

  if (r.type === "user") {
    userMsgs++;
    const c = r.message?.content;
    if (typeof c === "string") {
      lines.push(`\n---\n\n## 👤 User\n\n${trunc(c, 4000)}`);
    } else if (Array.isArray(c)) {
      for (const b of c) {
        if (b.type === "tool_result") {
          const txt = Array.isArray(b.content)
            ? b.content.map((x) => x.text || "").join("\n")
            : (b.content ?? "");
          lines.push(`\n*tool result* ${b.is_error ? "⚠️ (error)" : ""}\n\n\`\`\`\n${trunc(txt)}\n\`\`\``);
        }
      }
    }
  } else if (r.type === "assistant") {
    assistantMsgs++;
    const m = r.message || {};
    if (m.model) models.add(m.model);
    const u = m.usage || {};
    tokens.input_tokens += u.input_tokens || 0;
    tokens.output_tokens += u.output_tokens || 0;
    tokens.cache_creation_input_tokens += u.cache_creation_input_tokens || 0;
    tokens.cache_read_input_tokens += u.cache_read_input_tokens || 0;
    web.searchRequests += u.server_tool_use?.web_search_requests || 0;
    web.fetchRequests += u.server_tool_use?.web_fetch_requests || 0;
    for (const b of m.content || []) {
      if (b.type === "thinking") {
        lines.push(`\n### 💭 Thinking\n\n> ${trunc(b.thinking, 4000).replace(/\n/g, "\n> ")}`);
      } else if (b.type === "text") {
        lines.push(`\n### 🤖 Assistant\n\n${b.text}`);
      } else if (b.type === "tool_use") {
        tools[b.name] = (tools[b.name] || 0) + 1;
        if (b.name === "Bash" && b.input?.command) bashCommands.push(b.input.command);
        if (b.name === "Write" && b.input?.file_path) filesWritten.add(b.input.file_path);
        if (b.name === "Edit" && b.input?.file_path) filesEdited.add(b.input.file_path);
        if (/^(WebSearch|WebFetch)$/.test(b.name)) {
          if (b.name === "WebSearch") web.searchRequests++;
          else web.fetchRequests++;
        }
        lines.push(`\n### 🔧 Tool: \`${b.name}\`\n\n\`\`\`json\n${trunc(JSON.stringify(b.input, null, 2))}\n\`\`\``);
      }
    }
  }
}

const total = tokens.input_tokens + tokens.output_tokens
  + tokens.cache_creation_input_tokens + tokens.cache_read_input_tokens;
const durationSeconds = firstTs && lastTs
  ? Math.round((new Date(lastTs) - new Date(firstTs)) / 1000) : null;

const meta = {
  extractedAt: new Date().toISOString(),
  sessionId,
  claudeCodeVersion: version,
  models: [...models],
  cwd, gitBranch,
  span: { start: firstTs, end: lastTs, durationSeconds },
  messages: { user: userMsgs, assistant: assistantMsgs },
  tokens: { ...tokens, total },
  web,
  tools,
  filesWritten: [...filesWritten],
  filesEdited: [...filesEdited],
  bashCommands,
  files: { raw: jsonls.map((f) => `session/${f}`), transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

const header = `# Session transcript — ${slug}

- Session: \`${sessionId}\`
- Claude Code: \`${version}\`  ·  model(s): ${[...models].join(", ")}
- Span: ${firstTs} → ${lastTs} (${durationSeconds}s)
- Messages: ${userMsgs} user / ${assistantMsgs} assistant
- Tokens: ${total.toLocaleString()} total (in ${tokens.input_tokens.toLocaleString()}, out ${tokens.output_tokens.toLocaleString()}, cache-create ${tokens.cache_creation_input_tokens.toLocaleString()}, cache-read ${tokens.cache_read_input_tokens.toLocaleString()})
- Web: ${web.searchRequests} searches, ${web.fetchRequests} fetches
- Tools: ${Object.entries(tools).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}

> Long tool inputs/results are truncated. Raw log is alongside this file.
`;
writeFileSync(join(outDir, "transcript.md"), header + lines.join("\n") + "\n");

// --- report -------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - %s (raw)", jsonls.join(", "));
console.log("  - transcript.md");
console.log("  - session-metadata.json");
console.log("\n=== Telemetry (paste objective fields into metadata.json) ===");
console.log("  timeTakenSeconds:", durationSeconds);
console.log("  tokenUsage:", JSON.stringify({ input: tokens.input_tokens, output: tokens.output_tokens, total }));
console.log("  tokens (full):", JSON.stringify({ ...tokens, total }));
console.log("  web:", JSON.stringify(web), " (PLAN now allows internet search)");
console.log("  tools:", JSON.stringify(tools));
console.log("  files written:", filesWritten.size, "| edited:", filesEdited.size, "| bash cmds:", bashCommands.length);
