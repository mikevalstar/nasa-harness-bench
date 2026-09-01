#!/usr/bin/env node
// extract-session-cursor-cli.mjs — pull a Cursor CLI (`cursor-agent`) session.
//
// Usage:  node scripts/extract-session-cursor-cli.mjs <result-slug>
//
// Sibling of extract-session-cursor.mjs, which reads the *agent-window* chat out
// of Cursor's globalStorage. The CLI stores conversations somewhere else and in
// a different format:
//
//   ~/.cursor/chats/<workspace-hash>/<agent-id>/
//     meta.json   { createdAtMs, updatedAtMs, cwd, title }
//     store.db    sqlite: meta(key,value) + blobs(id,data), content-addressed
//
// `meta` row 0 is JSON with `latestRootBlobId`. That blob is a small protobuf
// whose repeated field 1 is the ordered list of message-blob hashes; each of
// those blobs is a JSON message in AI-SDK shape ({role, content:[parts]}).
// Other root fields carry the todo list (3), the final context-window breakdown
// (5), the workspace URI (9), attached/edited file records (15/18) and the
// interface tag (22).
//
// Writes into results/<slug>/session/:
//   - cursor-cli-session.json  raw: chat meta + every decoded message
//   - transcript.md            readable prompts / tool calls / results
//   - session-metadata.json    aggregated telemetry
// plus a plaintext results/<slug>/runlog.txt.
//
// Root field 8 points at a second, ordered event stream (tool results, file
// snapshots and — the useful part — the model's reasoning summaries in PLAIN
// TEXT). The JSON message stream carries reasoning as an encrypted signature
// with `text: ""`, so the summaries have to come from here; they are paired
// positionally with the empty reasoning parts, and only when the counts agree.
//
// Like the agent-window harness, the CLI does NOT persist cumulative token usage
// or cost locally — only the final context-window size (verified across every
// blob in the store, the agent-transcripts JSONL, ~/.cursor/ai-tracking and
// cli-config.json). tokenUsage is left null for the human to fill from Cursor's
// usage dashboard.
//
// Non-destructive: it does NOT modify the result's metadata.json.

import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { DatabaseSync } from "node:sqlite";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/extract-session-cursor-cli.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- locate the chat whose cwd is the bench dir -------------------------------
const CHATS = join(homedir(), ".cursor", "chats");
if (!existsSync(CHATS)) {
  console.error(`No Cursor CLI chat store at ${CHATS}.`);
  process.exit(1);
}

const candidates = [];
for (const ws of readdirSync(CHATS)) {
  const wsDir = join(CHATS, ws);
  let agents;
  try { agents = readdirSync(wsDir); } catch { continue; }
  for (const agentId of agents) {
    const dir = join(wsDir, agentId);
    const metaPath = join(dir, "meta.json");
    const dbPath = join(dir, "store.db");
    if (!existsSync(metaPath) || !existsSync(dbPath)) continue;
    let m;
    try { m = JSON.parse(readFileSync(metaPath, "utf8")); } catch { continue; }
    if (!m.cwd?.endsWith(slug) || !m.hasConversation) continue;
    candidates.push({ dir, dbPath, agentId, chatMeta: m });
  }
}
if (!candidates.length) {
  console.error(`No Cursor CLI chat under ${CHATS} has cwd ending in "${slug}".`);
  process.exit(1);
}
// If the bench was restarted, keep the longest-running conversation.
candidates.sort((a, b) =>
  (b.chatMeta.updatedAtMs - b.chatMeta.createdAtMs) - (a.chatMeta.updatedAtMs - a.chatMeta.createdAtMs));
if (candidates.length > 1) {
  console.log(`Note: ${candidates.length} chats for this bench dir; using the longest (${candidates[0].agentId}).`);
}
const { dbPath, agentId, chatMeta } = candidates[0];
console.log(`Agent: ${agentId}`);

// --- read the content-addressed blob store ------------------------------------
const db = new DatabaseSync(dbPath, { readOnly: true });
const asBytes = (v) => (typeof v === "string" ? Buffer.from(v, "hex") : Buffer.from(v));

const blobs = new Map();
for (const r of db.prepare("SELECT id, data FROM blobs").all()) {
  blobs.set(r.id, asBytes(r.data));
}
const storeMetaRow = db.prepare("SELECT value FROM meta WHERE key = '0'").get();
db.close();
if (!storeMetaRow) {
  console.error("store.db has no meta row 0 — unrecognised layout.");
  process.exit(1);
}
const storeMeta = JSON.parse(asBytes(storeMetaRow.value).toString("utf8"));

// Minimal protobuf reader: enough for the flat root message.
function readVarint(b, p) {
  let r = 0, s = 0;
  for (;;) {
    const x = b[p++];
    r += (x & 0x7f) * 2 ** s;
    s += 7;
    if (!(x & 0x80)) return [r, p];
  }
}
function protoFields(b) {
  const out = [];
  let p = 0;
  while (p < b.length) {
    let key;
    [key, p] = readVarint(b, p);
    const field = key >>> 3, wire = key & 7;
    if (wire === 2) {
      let len;
      [len, p] = readVarint(b, p);
      out.push([field, b.subarray(p, p + len)]);
      p += len;
    } else if (wire === 0) {
      let v;
      [v, p] = readVarint(b, p);
      out.push([field, v]);
    } else if (wire === 5) { out.push([field, b.subarray(p, p + 4)]); p += 4; }
    else if (wire === 1) { out.push([field, b.subarray(p, p + 8)]); p += 8; }
    else break; // unknown wire type — stop rather than misparse
  }
  return out;
}

const rootBlob = blobs.get(storeMeta.latestRootBlobId);
if (!rootBlob) {
  console.error(`Root blob ${storeMeta.latestRootBlobId} missing from store.`);
  process.exit(1);
}
const rootFields = protoFields(rootBlob);
const fieldsOf = (n) => rootFields.filter(([f]) => f === n).map(([, v]) => v);

// Field 1: ordered message-blob hashes.
const messages = [];
for (const h of fieldsOf(1)) {
  const b = blobs.get(Buffer.from(h).toString("hex"));
  if (!b) continue;
  try { messages.push(JSON.parse(b.toString("utf8"))); } catch { /* skip non-JSON */ }
}

// Field 5: final context-window breakdown (used / max, then per-bucket entries).
let contextWindow = { totalUsedTokens: null, maxTokens: null, buckets: {} };
const cwBlob = fieldsOf(5)[0];
if (cwBlob) {
  const outer = protoFields(cwBlob);
  const inner = outer.find(([f, v]) => f === 3 && Buffer.isBuffer(v));
  contextWindow.totalUsedTokens = outer.find(([f]) => f === 1)?.[1] ?? null;
  contextWindow.maxTokens = outer.find(([f]) => f === 2)?.[1] ?? null;
  if (inner) {
    for (const [f, v] of protoFields(inner[1])) {
      if (f !== 3 || !Buffer.isBuffer(v)) continue;
      const parts = protoFields(v);
      const id = parts.find(([pf]) => pf === 1)?.[1];
      const tokens = parts.find(([pf]) => pf === 3)?.[1] ?? 0;
      if (Buffer.isBuffer(id)) contextWindow.buckets[id.toString("utf8")] = tokens;
    }
  }
}

// Field 8: the ordered event stream. Pull the reasoning summaries out of it —
// each carrier blob holds the text at field 3 → field 1.
const reasoningTexts = [];
const eventsRef = fieldsOf(8)[0];
if (eventsRef) {
  const eventsBlob = blobs.get(Buffer.from(eventsRef).toString("hex"));
  if (eventsBlob) {
    const refs = [];
    for (const [, group] of protoFields(eventsBlob)) {
      if (!Buffer.isBuffer(group)) continue;
      for (const [, id] of protoFields(group)) {
        if (Buffer.isBuffer(id) && id.length === 32) refs.push(id.toString("hex"));
      }
    }
    for (const id of refs) {
      const b = blobs.get(id);
      if (!b || b[0] === 0x7b || b[0] === 0x5b) continue;   // skip JSON blobs
      for (const [f, v] of protoFields(b)) {
        if (f !== 3 || !Buffer.isBuffer(v)) continue;
        for (const [sf, sv] of protoFields(v)) {
          if (sf === 1 && Buffer.isBuffer(sv)) reasoningTexts.push(sv.toString("utf8"));
        }
      }
    }
  }
}

// Field 22: interface tag ("cli"). Field 9: workspace URI.
const interfaceTag = fieldsOf(22)[0]?.toString("utf8") ?? null;
const workspaceUri = fieldsOf(9)[0]?.toString("utf8") ?? null;

// --- walk the conversation ----------------------------------------------------
const trunc = (s, n = 1500) =>
  typeof s === "string" && s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;
const rel = (p) =>
  typeof p === "string" && p.includes(slug) ? p.slice(p.indexOf(slug) + slug.length + 1) : p;

const tools = {};
const filesEdited = new Set();
const filesRead = new Set();
const shellCommands = [];
let userMsgs = 0, assistantMsgs = 0, thinkingBlocks = 0;

const resultsById = new Map();
for (const m of messages) {
  if (m.role !== "tool" || !Array.isArray(m.content)) continue;
  for (const p of m.content) {
    if (p.type === "tool-result") resultsById.set(p.toolCallId, p.result);
  }
}

const reasoningPartCount = messages
  .filter((m) => m.role === "assistant" && Array.isArray(m.content))
  .reduce((n, m) => n + m.content.filter((p) => p.type === "reasoning").length, 0);
const pairReasoning = reasoningTexts.length === reasoningPartCount && reasoningPartCount > 0;
if (reasoningTexts.length && !pairReasoning) {
  console.log(`Note: ${reasoningTexts.length} reasoning summaries vs ${reasoningPartCount} reasoning parts — not pairing.`);
}

const md = [];
const log = [];

for (const m of messages) {
  const content = m.content;
  if (m.role === "system") continue;              // prompt, not conversation
  if (m.role === "tool") continue;                // folded into its call below

  if (m.role === "user") {
    const text = typeof content === "string"
      ? content
      : content.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    // The first user turn is Cursor's environment preamble, not the prompt.
    if (!/<user_query>/.test(text)) continue;
    userMsgs++;
    md.push(`\n---\n\n## 👤 User\n\n${trunc(text, 4000)}`);
    log.push(`\n========================================\n[USER]\n${text}`);
    continue;
  }

  for (const p of Array.isArray(content) ? content : []) {
    if (p.type === "reasoning") {
      // The JSON stream's reasoning text is empty (encrypted signature only);
      // the plaintext summary comes from the field-8 event stream, paired by
      // position. Only trust that pairing when the two streams agree in count.
      const text = p.text || (pairReasoning ? reasoningTexts[thinkingBlocks] : "");
      thinkingBlocks++;
      if (text) {
        md.push(`\n### 💭 Thinking\n\n${trunc(text, 4000)}`);
        log.push(`\n[THINKING]\n${trunc(text, 4000)}`);
      }
      continue;
    }
    if (p.type === "text" && p.text) {
      assistantMsgs++;
      md.push(`\n### 🤖 Assistant\n\n${p.text}`);
      log.push(`\n[ASSISTANT]\n${p.text}`);
      continue;
    }
    if (p.type !== "tool-call") continue;

    const name = p.toolName || "tool";
    tools[name] = (tools[name] || 0) + 1;
    const args = p.args ?? p.input ?? {};
    if (args.command) shellCommands.push(args.command);
    const path = args.path ?? args.target_directory ?? args.file_path;
    if (path) {
      if (/^(Write|StrReplace|Edit|MultiEdit|Delete)$/.test(name)) filesEdited.add(rel(path));
      else if (/^Read$/.test(name)) filesRead.add(rel(path));
    }
    const argText = args.command ?? trunc(JSON.stringify(args, null, 2));
    const res = resultsById.get(p.toolCallId);
    const resText = res == null ? null : (typeof res === "string" ? res : JSON.stringify(res));

    md.push(`\n### 🔧 Tool: \`${name}\`\n\n\`\`\`\n${trunc(argText)}\n\`\`\``);
    if (resText != null) md.push(`\n*result*\n\n\`\`\`\n${trunc(resText)}\n\`\`\``);
    log.push(`\n[TOOL: ${name}]\n  ${String(argText).replace(/\n/g, "\n  ")}`);
    if (resText != null) log.push(`  [RESULT]\n  ${trunc(resText).replace(/\n/g, "\n  ")}`);
  }
}

// --- telemetry ----------------------------------------------------------------
const start = new Date(chatMeta.createdAtMs).toISOString();
const end = new Date(chatMeta.updatedAtMs).toISOString();
const wallSeconds = Math.round((chatMeta.updatedAtMs - chatMeta.createdAtMs) / 1000);

const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "cursor-cli-session.json"),
  JSON.stringify({ agentId, chatMeta, storeMeta, interfaceTag, workspaceUri, messages }, null, 2) + "\n",
);

const meta = {
  extractedAt: new Date().toISOString(),
  agentId,
  cursorChatName: chatMeta.title || null,
  interface: interfaceTag,
  model: storeMeta.lastUsedModel || null,
  approvalMode: storeMeta.approvalMode || null,
  span: { start, end, wallSeconds },
  messages: {
    user: userMsgs,
    assistant: assistantMsgs,
    thinking: thinkingBlocks,
    thinkingChars: reasoningTexts.reduce((n, t) => n + t.length, 0),
    toolCalls: Object.values(tools).reduce((a, b) => a + b, 0),
  },
  // Cursor CLI does not persist cumulative token usage locally — fill from dashboard.
  tokenUsage: null,
  contextWindowFinal: {
    totalUsedTokens: contextWindow.totalUsedTokens,
    maxTokens: contextWindow.maxTokens,
    buckets: contextWindow.buckets,
    note: "Final context-window size at end of run — NOT cumulative input/output usage.",
  },
  tools,
  filesEdited: [...filesEdited],
  filesRead: [...filesRead],
  shellCommands,
  files: { raw: "session/cursor-cli-session.json", transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

const toolLine = Object.entries(tools).map(([k, v]) => `${k}×${v}`).join(", ") || "none";
const tHeader = `# Session transcript — ${slug}

- Agent: \`${agentId}\`  ·  Cursor CLI chat: "${chatMeta.title || "—"}"
- Model: ${meta.model}  ·  approval mode: ${meta.approvalMode}
- Span: ${start} → ${end} (wall ${wallSeconds}s)
- Messages: ${userMsgs} user / ${assistantMsgs} assistant text / ${thinkingBlocks} thinking / ${meta.messages.toolCalls} tool calls
- Tools: ${toolLine}
- Final context window: ${contextWindow.totalUsedTokens} / ${contextWindow.maxTokens} tokens

> Long tool inputs/results are truncated. Reasoning text is recovered from the
> store's event stream (the JSON messages carry only an encrypted signature).
> Cumulative token usage is not stored locally — see metadata.json for the
> dashboard figures. Raw message dump is alongside this file.
`;
writeFileSync(join(outDir, "transcript.md"), tHeader + md.join("\n") + "\n");

const rHeader = `NASA Harness Bench — run log
${slug}
Agent ${agentId} · Cursor CLI · ${meta.model} (approval: ${meta.approvalMode})
${start} → ${end} (wall ${wallSeconds}s) · ${userMsgs} user / ${assistantMsgs} assistant turns · ${thinkingBlocks} thinking blocks · ${meta.messages.toolCalls} tool calls
Tools: ${toolLine}
Final context window: ${contextWindow.totalUsedTokens} / ${contextWindow.maxTokens} tokens
(Extracted from ~/.cursor/chats/<ws>/<agent>/store.db. Token usage not stored locally; long tool inputs/results truncated.)
`;
writeFileSync(join(resultDir, "runlog.txt"), rHeader + log.join("\n") + "\n");

// --- report -------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - cursor-cli-session.json (raw)");
console.log("  - transcript.md");
console.log("  - session-metadata.json");
console.log("Wrote results/%s/runlog.txt", slug);
console.log("\n=== Telemetry (paste objective fields into metadata.json) ===");
console.log("  timeTakenSeconds:", wallSeconds);
console.log("  model:", meta.model, "| interface:", interfaceTag, "| approval:", meta.approvalMode);
console.log("  tools:", JSON.stringify(tools));
console.log("  files edited:", filesEdited.size, "| shell cmds:", shellCommands.length);
console.log("  contextWindowFinal:", contextWindow.totalUsedTokens, "/", contextWindow.maxTokens);
console.log("\n  NOTE: token usage + cost are NOT in Cursor's local store —");
console.log("        fill tokenUsage / estimatedCostUsd from the Cursor dashboard.");
