#!/usr/bin/env node
// extract-session-muse.mjs — pull a Muse Code CLI session for a collected result.
//
// Usage:  node scripts/extract-session-muse.mjs <result-slug>
//
// Muse Code stores each session as an append-only event log at
//   ~/.local/share/muse/sessions/YYYY/MM/DD/<session-uuid>/session.jsonl
// with nested `subagent/<uuid>/session.jsonl` files for its internal helper
// agents (in 0.1.0 these are the "reminder observer" agents the harness spawns
// on its own — they are not task subagents, but they DO burn real tokens).
//
// Every line is one envelope: {sequence, recorded_at (µs), payload_type,
// payload:{kind, ...}}. The interesting ones:
//   runtime.session.metadata   -> workspace_root, build sha/semver   (session id match)
//   run.model.configured       -> provider/profile/model id
//   payload.kind == "run"      -> .event.kind:
//        started                        the user prompt
//        reasoning_committed            thinking (text may be empty + encrypted)
//        assistant_tool_calls_committed tool calls (args as a JSON string)
//        tool_result_batch_committed    results, joined by tool_call_id
//        assistant_message_committed    assistant text
//        model_completed                per-call token usage + duration
//   payload.kind == "approval" -> .event.kind == "requested"/"decision_applied"
//                                 sandbox escapes (network hosts, fs writes)
//   session.end                -> uptime_ms + resource usage
//
// Muse does NOT persist a cost, so estimatedCostUsd is recomputed here from the
// operator-supplied list price (PRICING below). input_tokens is the FULL input
// including the cached prefix, so billable uncached input = input - cache_read.
//
// !! The recomputation UNDERCOUNTS. On the first muse run (muse-spark-1.2,
// 2026-08-07) it produced $0.518 against $0.72 shown in muse's own dev console —
// ~39% low. The gap is not spillover from other sessions. The leading suspect is
// a cache-WRITE charge the log never surfaces: every `model_completed` reports
// `cache_write_tokens: 0` even though the prefix is demonstrably cached and
// re-read on the very next call. So treat this number as a LOWER BOUND and take
// the dev-console figure as authoritative whenever it is available.
//
// Writes into results/<slug>/session/:
//   - muse-session.jsonl        raw main-session log, verbatim
//   - muse-subagent-*.jsonl     raw helper-agent logs, verbatim
//   - transcript.md             readable extracted text (prompt, thinking, tools)
//   - session-metadata.json     aggregated telemetry (tokens, cost, time, tools)
// plus a plaintext results/<slug>/runlog.txt run log.
//
// Non-destructive: it does NOT modify the result's metadata.json. The key
// numbers are printed so they can be merged into metadata.json by hand.

import {
  readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, existsSync, statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// --- pricing (USD per 1M tokens) ----------------------------------------------
// Supplied by the operator for the model under test; muse persists no cost.
const PRICING = { input: 1.25, cachedInput: 0.15, output: 4.25 };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/extract-session-muse.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- locate the session by workspace_root -------------------------------------
const SESSIONS = join(homedir(), ".local", "share", "muse", "sessions");
if (!existsSync(SESSIONS)) {
  console.error(`No muse sessions dir at ${SESSIONS}.`);
  process.exit(1);
}

// sessions/YYYY/MM/DD/<uuid>/session.jsonl — walk the date tree.
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (!statSync(p).isDirectory()) continue;
    if (existsSync(join(p, "session.jsonl"))) out.push(p);
    else walk(p, out);
  }
  return out;
};

const readJsonl = (f) => {
  const recs = [];
  for (const line of readFileSync(f, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { recs.push(JSON.parse(line)); } catch { /* skip bad line */ }
  }
  return recs;
};

const matches = [];
for (const dir of walk(SESSIONS)) {
  const recs = readJsonl(join(dir, "session.jsonl"));
  const meta = recs.find((r) => r.payload?.kind === "metadata")?.payload?.record;
  if (meta?.workspace_root?.includes(slug)) matches.push({ dir, recs, meta });
}
if (!matches.length) {
  console.error(`No muse session whose workspace_root matches "${slug}".`);
  process.exit(1);
}
// Longest log wins — a bench dir may have been opened and abandoned first.
matches.sort((a, b) => b.recs.length - a.recs.length);
const { dir: sessionDir, recs: records, meta: sessionMeta } = matches[0];
const SID = sessionDir.split("/").pop();
if (matches.length > 1) {
  console.log(`Note: ${matches.length} sessions matched; using the longest (${SID}).`);
}
console.log(`Session dir: ${sessionDir}`);

// --- helper (sub)agent sessions ------------------------------------------------
const subDir = join(sessionDir, "subagent");
const subAgents = existsSync(subDir)
  ? readdirSync(subDir)
      .filter((d) => existsSync(join(subDir, d, "session.jsonl")))
      .map((d) => ({ id: d, file: join(subDir, d, "session.jsonl"), recs: readJsonl(join(subDir, d, "session.jsonl")) }))
  : [];
console.log(`Helper agent sessions: ${subAgents.length}`);

// --- model / build --------------------------------------------------------------
const runModel = records.find((r) => r.payload?.kind === "run_model")?.payload?.record ?? {};
const model = runModel.model_id ?? null;
const providerId = runModel.provider_id ?? sessionMeta?.provider_id ?? null;
const profileId = runModel.profile_id ?? null;
const build = sessionMeta?.build ?? {};
const harnessVersion = build.semver ?? null;
console.log(`Model: ${model} (provider ${providerId}${profileId ? `, profile ${profileId}` : ""})`);

// --- token usage ----------------------------------------------------------------
const zero = () => ({ input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, calls: 0 });
const addUsage = (acc, u) => {
  acc.input += u.input_tokens || 0;
  acc.output += u.output_tokens || 0;
  acc.reasoning += u.reasoning_tokens || 0;
  acc.cacheRead += u.cache_read_tokens || 0;
  acc.cacheWrite += u.cache_write_tokens || 0;
  acc.calls += 1;
  return acc;
};
const usagesOf = (recs) => recs
  .filter((r) => r.payload?.event?.kind === "model_completed")
  .map((r) => r.payload.event.usage || {});

const mainUsage = usagesOf(records).reduce(addUsage, zero());
const helperUsage = subAgents.flatMap((s) => usagesOf(s.recs)).reduce(addUsage, zero());
const tokens = {
  input: mainUsage.input + helperUsage.input,
  output: mainUsage.output + helperUsage.output,
  reasoning: mainUsage.reasoning + helperUsage.reasoning,
  cacheRead: mainUsage.cacheRead + helperUsage.cacheRead,
  cacheWrite: mainUsage.cacheWrite + helperUsage.cacheWrite,
};
tokens.total = tokens.input + tokens.output;
// input_tokens already contains the cached prefix; only the remainder is full price.
const uncachedInput = tokens.input - tokens.cacheRead;
const costUsd = Math.round((
  (uncachedInput / 1e6) * PRICING.input
  + (tokens.cacheRead / 1e6) * PRICING.cachedInput
  + (tokens.output / 1e6) * PRICING.output
) * 1e6) / 1e6;

// --- output dir -----------------------------------------------------------------
const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
copyFileSync(join(sessionDir, "session.jsonl"), join(outDir, "muse-session.jsonl"));
for (const s of subAgents) copyFileSync(s.file, join(outDir, `muse-subagent-${s.id}.jsonl`));

// --- walk the event log -----------------------------------------------------------
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
const approvals = [];
const networkHosts = new Set();
let userMsgs = 0, assistantMsgs = 0, thinkingBlocks = 0;
let firstTs = null, lastTs = null, finalMessage = null;

const md = [];   // transcript.md body
const log = [];  // runlog.txt body

// Tool results arrive in a later batch record, keyed by tool_call_id.
const resultsByCallId = new Map();
for (const r of records) {
  const e = r.payload?.event;
  if (e?.kind !== "tool_result_batch_committed") continue;
  for (const res of e.results || []) resultsByCallId.set(res.tool_call_id, res.text ?? "");
}

const sorted = [...records].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
for (const r of sorted) {
  const ts = r.recorded_at ? Math.round(r.recorded_at / 1000) : null;   // µs -> ms
  if (ts) {
    if (!firstTs || ts < firstTs) firstTs = ts;
    if (!lastTs || ts > lastTs) lastTs = ts;
  }
  const p = r.payload;
  const e = p?.event;

  if (p?.kind === "approval" && e?.kind === "requested") {
    approvals.push({ tool: e.tool_name, args: e.raw_args });
    if (e.tool_name === "network" && typeof e.raw_args === "string") {
      const host = e.raw_args.split(/\s+/)[1];
      if (host) networkHosts.add(host);
    }
    md.push(`\n### 🔓 Approval requested — \`${e.tool_name}\`\n\n\`\`\`\n${trunc(String(e.raw_args))}\n\`\`\``);
    log.push(`\n[APPROVAL: ${e.tool_name}] ${e.raw_args}`);
    continue;
  }
  if (p?.kind !== "run" || !e) continue;

  switch (e.kind) {
    case "started": {
      userMsgs++;
      const text = (e.prompt || "").trim() || "(no text)";
      md.push(`\n---\n\n## 👤 User\n\n${trunc(text, 4000)}`);
      log.push(`\n========================================\n[USER]\n${text}`);
      break;
    }
    case "reasoning_committed": {
      const text = (e.text || "").trim();
      thinkingBlocks++;
      if (text) {
        md.push(`\n### 💭 Thinking\n\n${trunc(text)}`);
        log.push(`\n[THINKING]\n${trunc(text)}`);
      } else {
        // muse returns encrypted reasoning from the provider; only the fact of
        // a thinking block survives locally.
        md.push(`\n### 💭 Thinking\n\n*(encrypted by the provider — not recoverable)*`);
        log.push(`\n[THINKING] (encrypted, not recoverable)`);
      }
      break;
    }
    case "assistant_message_committed": {
      const text = (e.text || "").trim();
      if (!text) break;
      assistantMsgs++;
      finalMessage = text;   // last non-empty assistant text wins
      md.push(`\n### 🤖 Assistant\n\n${text}`);
      log.push(`\n[ASSISTANT]\n${text}`);
      break;
    }
    case "assistant_tool_calls_committed": {
      for (const call of e.tool_calls || []) {
        const name = call.name || "tool";
        tools[name] = (tools[name] || 0) + 1;
        let args = {};
        try { args = JSON.parse(call.args || "{}"); } catch { args = { _raw: call.args }; }
        if (name === "bash" && args.command) shellCommands.push(args.command);
        const f = args.path ?? args.file_path ?? args.filePath;
        if (f) {
          const rp = rel(f);
          if (name === "write_file") filesWritten.add(rp);
          else if (name === "edit_file") filesEdited.add(rp);
          else if (name === "read_file") filesRead.add(rp);
        }
        const argText = args.command ?? trunc(JSON.stringify(args, null, 2));
        const res = resultsByCallId.get(call.call_id);
        md.push(`\n### 🔧 Tool: \`${name}\`\n\n\`\`\`\n${trunc(argText)}\n\`\`\``);
        if (res != null) md.push(`\n*result*\n\n\`\`\`\n${trunc(res)}\n\`\`\``);
        log.push(`\n[TOOL: ${name}]\n  ${String(argText).replace(/\n/g, "\n  ")}`);
        if (res != null) log.push(`  [RESULT]\n  ${trunc(res).replace(/\n/g, "\n  ")}`);
      }
      break;
    }
    default:
      break;
  }
}

// Prefer the harness's own uptime over the log span when available.
const sessionEnd = records.find((r) => r.payload?.kind === "session_end")?.payload?.record;
const spanSeconds = firstTs && lastTs ? Math.round((lastTs - firstTs) / 1000) : null;
const wallSeconds = sessionEnd?.uptime_ms != null
  ? Math.round(sessionEnd.uptime_ms / 1000)
  : spanSeconds;

const meta = {
  extractedAt: new Date().toISOString(),
  sessionId: SID,
  harness: "muse",
  harnessVersion,
  harnessBuild: build.sha ?? null,
  model,
  providerId,
  profileId,
  workspaceDir: sessionMeta?.workspace_root ?? null,
  span: { start: firstTs, end: lastTs, wallSeconds, logSpanSeconds: spanSeconds },
  messages: { user: userMsgs, assistant: assistantMsgs, thinking: thinkingBlocks },
  modelCalls: { main: mainUsage.calls, helperAgents: helperUsage.calls },
  tokenUsage: tokens,
  tokenUsageBreakdown: { main: mainUsage, helperAgents: helperUsage },
  pricingUsdPerMTok: PRICING,
  estimatedCostUsd: costUsd,
  costBasis: {
    uncachedInput,
    cacheRead: tokens.cacheRead,
    output: tokens.output,
    note: "input_tokens includes the cached prefix; uncachedInput = input - cacheRead. "
      + "LOWER BOUND: this recomputation ran ~39% under muse's own dev-console figure on "
      + "the first muse run, likely an unsurfaced cache-write charge. Prefer the dev console.",
  },
  tools,
  helperAgentSessions: subAgents.map((s) => s.id),
  approvals,
  networkHosts: [...networkHosts],
  filesWritten: [...filesWritten],
  filesEdited: [...filesEdited],
  filesRead: [...filesRead],
  shellCommands,
  finalMessage,
  resourceUsage: sessionEnd?.resource_usage ?? null,
  exitReason: sessionEnd?.exit_reason ?? null,
  files: { raw: "session/muse-session.jsonl", transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

// --- transcript.md ---------------------------------------------------------------
const fmt = (n) => Number(n).toLocaleString();
const tHeader = `# Session transcript — ${slug}

- Session: \`${SID}\`  ·  harness: muse ${harnessVersion}${build.sha ? ` (${build.sha})` : ""}
- Model: ${model}  ·  provider: ${providerId}${profileId ? `  ·  profile: ${profileId}` : ""}
- Span: ${firstTs ? new Date(firstTs).toISOString() : "—"} → ${lastTs ? new Date(lastTs).toISOString() : "—"} (wall ${wallSeconds}s)
- Messages: ${userMsgs} user / ${assistantMsgs} assistant text / ${thinkingBlocks} thinking
- Model calls: ${mainUsage.calls} main + ${helperUsage.calls} helper-agent
- Tokens: ${fmt(tokens.total)} total (in ${fmt(tokens.input)}, out ${fmt(tokens.output)}, cache-read ${fmt(tokens.cacheRead)}, reasoning ${fmt(tokens.reasoning)})
- Cost: $${costUsd} (list price ${PRICING.input}/${PRICING.cachedInput}/${PRICING.output} per Mtok in/cached/out)
- Tools: ${Object.entries(tools).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}
- Network approvals: ${[...networkHosts].join(", ") || "none"}

> Long tool inputs/results are truncated. Tool results are embedded inline with
> their call. Reasoning text is encrypted by the provider — only the fact of a
> thinking block survives. Raw session logs are alongside this file.
`;
writeFileSync(join(outDir, "transcript.md"), tHeader + md.join("\n") + "\n");

// --- runlog.txt --------------------------------------------------------------------
const rHeader = `NASA Harness Bench — run log
${slug}
Session ${SID} · muse ${harnessVersion} · ${model} (${providerId})
${firstTs ? new Date(firstTs).toISOString() : "—"} → ${lastTs ? new Date(lastTs).toISOString() : "—"} (wall ${wallSeconds}s) · ${userMsgs} user / ${assistantMsgs} assistant turns · ${thinkingBlocks} thinking blocks
Tokens: input ${fmt(tokens.input)} · output ${fmt(tokens.output)} · cache-read ${fmt(tokens.cacheRead)} · total ${fmt(tokens.total)} · cost $${costUsd}
(Extracted from ~/.local/share/muse/sessions/. Tool results embedded inline; long inputs/results truncated.)
`;
writeFileSync(join(resultDir, "runlog.txt"), rHeader + log.join("\n") + "\n");

// --- report ------------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - muse-session.jsonl (raw) + %d helper-agent logs", subAgents.length);
console.log("  - transcript.md");
console.log("  - session-metadata.json");
console.log("Wrote results/%s/runlog.txt", slug);
console.log("\n=== Telemetry (paste objective fields into metadata.json) ===");
console.log("  harnessVersion:", harnessVersion, build.sha ? `(${build.sha})` : "");
console.log("  model:", model);
console.log("  timeTakenSeconds:", wallSeconds, `(log span ${spanSeconds}s)`);
console.log("  tokenUsage:", JSON.stringify(tokens));
console.log("    main:", JSON.stringify(mainUsage));
console.log("    helper agents:", JSON.stringify(helperUsage));
console.log("  estimatedCostUsd:", costUsd);
console.log("  tools:", JSON.stringify(tools));
console.log("  network:", [...networkHosts].join(", ") || "none");
console.log("  files written:", filesWritten.size, "| edited:", filesEdited.size, "| read:", filesRead.size, "| shell cmds:", shellCommands.length);
