#!/usr/bin/env node
// extract-session-copilot.mjs — pull a GitHub Copilot CLI session for a result.
//
// Usage:  node scripts/extract-session-copilot.mjs <result-slug>
//
// Copilot sibling of extract-session.mjs / extract-session-cursor.mjs. The
// Copilot CLI stores each run as an append-only event log at
//   ~/.copilot/session-state/<sessionId>/events.jsonl
// (one JSON object per line: session.start, assistant.message, tool.execution_*,
// session.shutdown, …) plus an index DB at ~/.copilot/session-store.db that maps
// sessionId → cwd. We find the session whose cwd contains the result's bench
// slug AND that carries a `session.shutdown` event (the completed main run, which
// holds authoritative cumulative telemetry), then write into results/<slug>/session/:
//   - copilot-events.jsonl    raw event log, copied verbatim
//   - transcript.md           readable extracted text (prompt, thinking, tools)
//   - session-metadata.json   aggregated telemetry (tokens, cost, time, tools)
// and a plaintext results/<slug>/runlog.txt run log.
//
// Unlike Cursor, Copilot DOES persist full cumulative token usage and code-change
// stats locally — in the `session.shutdown` event's `modelMetrics`/`tokenDetails`/
// `codeChanges` fields. We read those directly. Copilot bills in premium requests
// + nano-AIU, not USD, so estimatedCostUsd is COMPUTED from Anthropic list pricing
// for the model (same basis as the other opus-4-8 results in this repo) so the
// harnesses are comparable on a token-cost basis. See PRICING below.
//
// CACHE-WRITE TTL CAVEAT: cost depends on whether cache writes are billed at the
// 5-minute (1.25x input) or 1-hour (2x input) rate. Copilot does not record which
// TTL it uses, so we default to 5-minute (Anthropic's default, matching the Cursor
// sibling — also a 3rd-party CLI) and print BOTH figures. Adjust by hand if needed.
//
// Non-destructive: does NOT modify the result's metadata.json. Key numbers are
// printed so they can be merged into metadata.json by hand.

import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/extract-session-copilot.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- Anthropic list pricing, USD per token (same basis as other results) -------
// Opus 4.8: $5 / $25 per MTok in/out; cache write 1.25x (5m) or 2x (1h) of input;
// cache read 0.1x of input. Keyed by the slug's model field.
const PRICING = {
  "opus-4-8": { input: 5 / 1e6, output: 25 / 1e6, cacheWrite5m: 6.25 / 1e6, cacheWrite1h: 10 / 1e6, cacheRead: 0.5 / 1e6 },
};

// --- locate the Copilot session for this slug ---------------------------------
const STATE = join(homedir(), ".copilot", "session-state");
if (!existsSync(STATE)) {
  console.error(`No Copilot session-state dir at ${STATE}.`);
  process.exit(1);
}

// A slug can map to several sessions (init probes, retries). The real run is the
// one whose cwd contains the slug and that emitted a session.shutdown with model
// metrics. Among ties, take the one with the most events.
let best = null;
for (const id of readdirSync(STATE)) {
  const file = join(STATE, id, "events.jsonl");
  if (!existsSync(file)) continue;
  const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
  let cwd = null, shutdown = null;
  const events = [];
  for (const line of lines) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    events.push(e);
    if (e.type === "session.start") cwd = e.data?.context?.cwd ?? cwd;
    if (e.type === "session.shutdown") shutdown = e;
  }
  if (!cwd || !cwd.includes(slug)) continue;
  if (!shutdown) continue;                       // not a completed run
  if (!best || events.length > best.events.length) best = { id, events, shutdown, cwd, file };
}

if (!best) {
  console.error(`No completed Copilot session (with session.shutdown) for "${slug}" under ${STATE}.`);
  process.exit(1);
}
console.log(`Session: ${best.id}`);

// --- walk the event log -------------------------------------------------------
const trunc = (s, n = 1500) =>
  typeof s === "string" && s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;

const tools = {};
const shellCommands = [];
const filesTouched = new Set();
let userMsgs = 0, assistantMsgs = 0, thinkingBlocks = 0, outputTokensSum = 0;
let firstTs = null, lastTs = null;
let copilotVersion = null, model = null, effort = null;

const md = [];   // transcript.md body
const log = [];  // runlog.txt body

for (const e of best.events) {
  if (e.timestamp) {
    if (!firstTs || e.timestamp < firstTs) firstTs = e.timestamp;
    if (!lastTs || e.timestamp > lastTs) lastTs = e.timestamp;
  }
  const d = e.data || {};

  switch (e.type) {
    case "session.start":
      copilotVersion ||= d.copilotVersion;
      break;
    case "session.model_change":
      model ||= d.newModel;
      effort ||= d.reasoningEffort;
      break;
    case "user.message": {
      userMsgs++;
      const text = typeof d.content === "string" ? d.content : JSON.stringify(d.content);
      md.push(`\n---\n\n## 👤 User\n\n${trunc(text, 4000)}`);
      log.push(`\n========================================\n[USER]\n${text}`);
      break;
    }
    case "assistant.message": {
      model ||= d.model;
      outputTokensSum += d.outputTokens || 0;
      const think = d.reasoningText;
      if (think) {
        thinkingBlocks++;
        md.push(`\n### 💭 Thinking\n\n${trunc(think)}`);
        log.push(`\n[THINKING]\n${trunc(think)}`);
      }
      const text = d.content;
      if (text && text.trim()) {
        assistantMsgs++;
        md.push(`\n### 🤖 Assistant\n\n${text}`);
        log.push(`\n[ASSISTANT]\n${text}`);
      }
      for (const tr of d.toolRequests || []) {
        const name = tr.name || "tool";
        tools[name] = (tools[name] || 0) + 1;
        const args = tr.arguments || {};
        if (args.command) shellCommands.push(args.command);
        const f = args.path || args.filePath || args.file_path;
        if (f && /write|edit|create|str_replace|apply/i.test(name)) filesTouched.add(f);
        const argText = args.command ?? trunc(JSON.stringify(args, null, 2));
        md.push(`\n### 🔧 Tool: \`${name}\`${tr.intentionSummary ? ` — ${tr.intentionSummary}` : ""}\n\n\`\`\`\n${trunc(argText)}\n\`\`\``);
        log.push(`\n[TOOL: ${name}] ${tr.intentionSummary || ""}\n  ${String(argText).replace(/\n/g, "\n  ")}`);
      }
      break;
    }
    case "tool.execution_complete": {
      let res = d.result?.content ?? d.result;
      if (res != null && typeof res !== "string") res = JSON.stringify(res);
      if (res != null) {
        md.push(`\n*result* ${d.success === false ? "⚠️ (error)" : ""}\n\n\`\`\`\n${trunc(res)}\n\`\`\``);
        log.push(`  [RESULT${d.success === false ? " ERROR" : ""}]\n  ${trunc(res).replace(/\n/g, "\n  ")}`);
      }
      break;
    }
  }
}

// --- authoritative cumulative telemetry from session.shutdown -----------------
const sd = best.shutdown.data || {};
const mm = sd.modelMetrics?.[model] || Object.values(sd.modelMetrics || {})[0] || {};
const usage = mm.usage || {};
const td = sd.tokenDetails || {};

// inputTokens here is all-in (fresh input + cache read + cache write), matching
// how the other results record tokenUsage.input. Break out the components.
const inputAll = usage.inputTokens ?? ((td.input?.tokenCount || 0) + (td.cache_read?.tokenCount || 0) + (td.cache_write?.tokenCount || 0));
const output = usage.outputTokens ?? td.output?.tokenCount ?? outputTokensSum;
const cacheRead = usage.cacheReadTokens ?? td.cache_read?.tokenCount ?? 0;
const cacheWrite = usage.cacheWriteTokens ?? td.cache_write?.tokenCount ?? 0;
const freshInput = Math.max(0, inputAll - cacheRead - cacheWrite);
const total = inputAll + output;

const wallSeconds = firstTs && lastTs
  ? Math.round((new Date(lastTs) - new Date(firstTs)) / 1000) : null;

// --- cost (computed from Anthropic list pricing) ------------------------------
const p = PRICING[slug.match(/-(opus-[\d-]+)-/)?.[1]] || PRICING[Object.keys(PRICING).find((k) => slug.includes(k))] || null;
let cost5m = null, cost1h = null;
if (p) {
  const base = freshInput * p.input + output * p.output + cacheRead * p.cacheRead;
  cost5m = +(base + cacheWrite * p.cacheWrite5m).toFixed(2);
  cost1h = +(base + cacheWrite * p.cacheWrite1h).toFixed(2);
}

// --- output dir ---------------------------------------------------------------
const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "copilot-events.jsonl"), readFileSync(best.file));

const meta = {
  extractedAt: new Date().toISOString(),
  sessionId: best.id,
  copilotVersion,
  model,
  effort,
  cwd: best.cwd,
  span: { start: firstTs, end: lastTs, wallSeconds },
  apiDurationSeconds: sd.totalApiDurationMs != null ? Math.round(sd.totalApiDurationMs / 1000) : null,
  messages: { user: userMsgs, assistant: assistantMsgs, thinking: thinkingBlocks },
  tokenUsage: {
    input: inputAll,
    output,
    cached: cacheRead,
    cacheWrite,
    freshInput,
    reasoning: usage.reasoningTokens ?? null,
    total,
  },
  premiumRequests: sd.totalPremiumRequests ?? null,
  requestCount: mm.requests?.count ?? null,
  nanoAiu: sd.totalNanoAiu ?? null,
  estimatedCostUsd: cost5m,                       // default: 5-minute cache-write rate
  estimatedCostUsd_1hCache: cost1h,               // alternative: 1-hour cache-write rate
  costNote: "Computed from Anthropic list pricing. cacheWrite billed at 5-min rate "
    + "(1.25x input); estimatedCostUsd_1hCache uses the 1-hour rate (2x). Copilot does "
    + "not record cache TTL — adjust by hand if the 1-hour figure is correct.",
  linesChanged: {
    added: sd.codeChanges?.linesAdded ?? null,
    removed: sd.codeChanges?.linesRemoved ?? null,
  },
  filesModifiedCount: sd.codeChanges?.filesModified?.length ?? null,
  tools,
  filesTouched: [...filesTouched],
  shellCommands,
  files: { raw: "session/copilot-events.jsonl", transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

// --- transcript.md ------------------------------------------------------------
const tHeader = `# Session transcript — ${slug}

- Session: \`${best.id}\`  ·  Copilot CLI ${copilotVersion}
- Model: ${model}  ·  effort: ${effort}
- Span: ${firstTs} → ${lastTs} (wall ${wallSeconds}s, API ${meta.apiDurationSeconds}s)
- Messages: ${userMsgs} user / ${assistantMsgs} assistant text / ${thinkingBlocks} thinking
- Tokens: ${total.toLocaleString()} total (in ${inputAll.toLocaleString()} [cache-read ${cacheRead.toLocaleString()}, cache-write ${cacheWrite.toLocaleString()}, fresh ${freshInput.toLocaleString()}], out ${output.toLocaleString()})
- Premium requests: ${meta.premiumRequests}  ·  est. cost $${cost5m} (5m cache) / $${cost1h} (1h cache)
- Tools: ${Object.entries(tools).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}
- Lines changed: +${meta.linesChanged.added} / -${meta.linesChanged.removed} across ${meta.filesModifiedCount} files

> Long tool inputs/results are truncated. Raw event log is alongside this file.
`;
writeFileSync(join(outDir, "transcript.md"), tHeader + md.join("\n") + "\n");

// --- runlog.txt ---------------------------------------------------------------
const rHeader = `NASA Harness Bench — run log
${slug}
Session ${best.id} · GitHub Copilot CLI ${copilotVersion} · ${model} (effort ${effort})
${firstTs} → ${lastTs} (wall ${wallSeconds}s · API ${meta.apiDurationSeconds}s) · ${userMsgs} user / ${assistantMsgs} assistant turns · ${thinkingBlocks} thinking blocks
Tokens: ${total.toLocaleString()} total (in ${inputAll.toLocaleString()}, out ${output.toLocaleString()}, cache-read ${cacheRead.toLocaleString()}, cache-write ${cacheWrite.toLocaleString()})
Premium requests: ${meta.premiumRequests} · est. cost $${cost5m} (5m cache) / $${cost1h} (1h cache)
Lines changed: +${meta.linesChanged.added} / -${meta.linesChanged.removed} across ${meta.filesModifiedCount} files
(Extracted from ~/.copilot/session-state/<id>/events.jsonl. Long tool inputs/results truncated.)
`;
writeFileSync(join(resultDir, "runlog.txt"), rHeader + log.join("\n") + "\n");

// --- report -------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - copilot-events.jsonl (raw)");
console.log("  - transcript.md");
console.log("  - session-metadata.json");
console.log("Wrote results/%s/runlog.txt", slug);
console.log("\n=== Telemetry (paste objective fields into metadata.json) ===");
console.log("  timeTakenSeconds:", wallSeconds, "(wall) |", meta.apiDurationSeconds, "(API)");
console.log("  model:", model, "| effort:", effort, "| copilot:", copilotVersion);
console.log("  tokenUsage:", JSON.stringify({ input: inputAll, output, cached: cacheRead, cacheWrite, total }));
console.log("  estimatedCostUsd:", cost5m, "(5m cache) |", cost1h, "(1h cache)");
console.log("  premiumRequests:", meta.premiumRequests, "| nanoAiu:", meta.nanoAiu);
console.log("  tools:", JSON.stringify(tools));
console.log("  files touched:", filesTouched.size, "| shell cmds:", shellCommands.length);
console.log("  lines: +%s / -%s across %s files",
  meta.linesChanged.added, meta.linesChanged.removed, meta.filesModifiedCount);
