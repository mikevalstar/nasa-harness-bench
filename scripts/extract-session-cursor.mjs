#!/usr/bin/env node
// extract-session-cursor.mjs — pull a Cursor (agent-window) session for a result.
//
// Usage:  node scripts/extract-session-cursor.mjs <result-slug>
//
// Cursor sibling of extract-session.mjs / extract-session-codex.mjs. Cursor's
// agent stores its chat in a SQLite DB at
//   ~/Library/Application Support/Cursor/User/globalStorage/state.vscdb
// in the `cursorDiskKV` table: one `composerData:<id>` row per conversation
// plus one `bubbleId:<composerId>:<bubbleId>` row per message/tool turn. We find
// the composer whose bubbles reference the result's bench-dir slug, then write
// into results/<slug>/session/:
//   - cursor-composer.json    raw composerData + every bubble, copied verbatim
//   - transcript.md           readable extracted text (prompts, thinking, tools)
//   - session-metadata.json   aggregated telemetry (time, tools, files)
// and a plaintext results/<slug>/runlog.txt run log.
//
// Cursor does NOT persist cumulative token usage or cost in this DB (those live
// on the server-side dashboard), so token/cost fields are left for the human to
// fill from the Cursor usage page. Everything else — wall time, tool counts,
// files touched, the full transcript — is recovered here.
//
// Non-destructive: it does NOT modify the result's metadata.json. The key
// numbers are printed so they can be merged into metadata.json by hand.

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { DatabaseSync } from "node:sqlite";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/extract-session-cursor.mjs <result-slug>");
  process.exit(1);
}

const resultDir = join(ROOT, "results", slug);
if (!existsSync(resultDir)) {
  console.error(`No such result: results/${slug}`);
  process.exit(1);
}

// --- open the Cursor global storage DB (read-only) ----------------------------
const DB = join(
  homedir(), "Library", "Application Support", "Cursor",
  "User", "globalStorage", "state.vscdb",
);
if (!existsSync(DB)) {
  console.error(`No Cursor global storage DB at ${DB}.`);
  process.exit(1);
}
const db = new DatabaseSync(DB, { readOnly: true });

// --- locate the composer whose bubbles mention the bench slug -----------------
// The conversation isn't keyed by workspace, but every tool call records the
// absolute bench path (which contains the slug). Find one such bubble and pull
// the composerId out of its key: bubbleId:<composerId>:<bubbleId>.
const hit = db
  .prepare(
    "SELECT key FROM cursorDiskKV WHERE key LIKE 'bubbleId:%' AND value LIKE ? LIMIT 1",
  )
  .get(`%${slug}%`);
if (!hit) {
  console.error(`No Cursor bubble references "${slug}" in ${DB}.`);
  process.exit(1);
}
const composerId = hit.key.split(":")[1];
console.log(`Composer: ${composerId}`);

const composerRow = db
  .prepare("SELECT value FROM cursorDiskKV WHERE key = ?")
  .get(`composerData:${composerId}`);
if (!composerRow) {
  console.error(`No composerData:${composerId} row.`);
  process.exit(1);
}
const composer = JSON.parse(composerRow.value);

// --- gather every bubble, indexed by id ---------------------------------------
const bubbleRows = db
  .prepare("SELECT key, value FROM cursorDiskKV WHERE key LIKE ?")
  .all(`bubbleId:${composerId}:%`);
const bubbles = {};
for (const r of bubbleRows) {
  const id = r.key.split(":")[2];
  try { bubbles[id] = JSON.parse(r.value); } catch { /* skip */ }
}

// fullConversationHeadersOnly is the ordered turn list (with per-bubble timestamps).
const headers = composer.fullConversationHeadersOnly || [];

// --- output dir ---------------------------------------------------------------
const outDir = join(resultDir, "session");
mkdirSync(outDir, { recursive: true });
// Raw bundle: composerData + every bubble, verbatim.
writeFileSync(
  join(outDir, "cursor-composer.json"),
  JSON.stringify({ composerData: composer, bubbles }, null, 2) + "\n",
);

// --- walk the ordered turns ---------------------------------------------------
const trunc = (s, n = 1500) =>
  typeof s === "string" && s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;

const tools = {};
const filesEdited = new Set();
const shellCommands = [];
let userMsgs = 0, assistantMsgs = 0, thinkingBlocks = 0;
let firstTs = null, lastTs = null;

const md = [];   // transcript.md body
const log = [];  // runlog.txt body

for (const h of headers) {
  const b = bubbles[h.bubbleId];
  if (!b) continue;
  if (h.createdAt) {
    if (!firstTs || h.createdAt < firstTs) firstTs = h.createdAt;
    if (!lastTs || h.createdAt > lastTs) lastTs = h.createdAt;
  }

  // type 1 = user, type 2 = assistant (text / thinking / tool call)
  if (b.type === 1) {
    userMsgs++;
    md.push(`\n---\n\n## 👤 User\n\n${trunc(b.text || "", 4000)}`);
    log.push(`\n========================================\n[USER]\n${b.text || ""}`);
    continue;
  }

  const think = b.thinking?.text;
  if (think) {
    thinkingBlocks++;
    md.push(`\n### 💭 Thinking\n\n${trunc(think)}`);
    log.push(`\n[THINKING]\n${trunc(think)}`);
  }

  const tf = b.toolFormerData;
  if (tf) {
    const name = tf.name || `tool_${tf.tool}`;
    tools[name] = (tools[name] || 0) + 1;
    // Args: prefer parsed params; fall back to rawArgs.
    let args = tf.params || tf.rawArgs || "";
    let argObj = null;
    try { argObj = JSON.parse(args); } catch { /* keep raw */ }
    if (argObj) {
      if (argObj.command) shellCommands.push(argObj.command);
      const f = argObj.relativeWorkspacePath || argObj.targetFile || argObj.path || argObj.relativePath;
      if (f && /edit_file|write|create|apply/.test(name)) {
        // Store the path relative to the bench dir for readability.
        filesEdited.add(f.includes(slug) ? f.slice(f.indexOf(slug) + slug.length + 1) : f);
      }
    }
    const argText = argObj?.command ?? trunc(typeof args === "string" ? args : JSON.stringify(args, null, 2));
    let res = tf.result;
    if (res != null && typeof res !== "string") res = JSON.stringify(res);
    md.push(`\n### 🔧 Tool: \`${name}\`\n\n\`\`\`\n${trunc(argText)}\n\`\`\``);
    if (res != null) md.push(`\n*result*\n\n\`\`\`\n${trunc(res)}\n\`\`\``);
    log.push(`\n[TOOL: ${name}]\n  ${String(argText).replace(/\n/g, "\n  ")}`);
    if (res != null) log.push(`  [RESULT]\n  ${trunc(res).replace(/\n/g, "\n  ")}`);
  }

  const text = b.text;
  if (text) {
    assistantMsgs++;
    md.push(`\n### 🤖 Assistant\n\n${text}`);
    log.push(`\n[ASSISTANT]\n${text}`);
  }
}

const wallSeconds = firstTs && lastTs
  ? Math.round((new Date(lastTs) - new Date(firstTs)) / 1000) : null;

// Final context-window snapshot (NOT cumulative usage — see header note).
const ptb = composer.promptTokenBreakdown || {};
const model = composer.modelConfig?.modelName || null;
const effort = composer.modelConfig?.selectedModels?.[0]?.parameters
  ?.find((p) => p.id === "effort")?.value || null;

const meta = {
  extractedAt: new Date().toISOString(),
  composerId,
  cursorChatName: composer.name || null,
  model,
  effort,
  span: { start: firstTs, end: lastTs, wallSeconds },
  messages: { user: userMsgs, assistant: assistantMsgs, thinking: thinkingBlocks },
  // Cursor does not persist cumulative token usage locally — fill from dashboard.
  tokenUsage: null,
  contextWindowFinal: {
    totalUsedTokens: ptb.totalUsedTokens ?? null,
    maxTokens: ptb.maxTokens ?? null,
    note: "Final context-window size at end of run — NOT cumulative input/output usage.",
  },
  linesChanged: {
    added: composer.totalLinesAdded ?? null,
    removed: composer.totalLinesRemoved ?? null,
  },
  filesChangedCount: composer.filesChangedCount ?? null,
  tools,
  filesEdited: [...filesEdited],
  shellCommands,
  files: { raw: "session/cursor-composer.json", transcript: "session/transcript.md" },
};
writeFileSync(join(outDir, "session-metadata.json"), JSON.stringify(meta, null, 2) + "\n");

// --- transcript.md ------------------------------------------------------------
const tHeader = `# Session transcript — ${slug}

- Composer: \`${composerId}\`  ·  Cursor chat: "${composer.name || "—"}"
- Model: ${model}  ·  effort: ${effort}
- Span: ${firstTs} → ${lastTs} (wall ${wallSeconds}s)
- Messages: ${userMsgs} user / ${assistantMsgs} assistant text / ${thinkingBlocks} thinking
- Tools: ${Object.entries(tools).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}
- Lines changed: +${meta.linesChanged.added} / -${meta.linesChanged.removed} across ${meta.filesChangedCount} files

> Long tool inputs/results are truncated. Token usage is not stored in Cursor's
> local DB — see metadata.json for the dashboard figures. Raw composer dump is
> alongside this file.
`;
writeFileSync(join(outDir, "transcript.md"), tHeader + md.join("\n") + "\n");

// --- runlog.txt ---------------------------------------------------------------
const rHeader = `NASA Harness Bench — run log
${slug}
Composer ${composerId} · Cursor · ${model} (effort ${effort})
${firstTs} → ${lastTs} (wall ${wallSeconds}s) · ${userMsgs} user / ${assistantMsgs} assistant turns · ${thinkingBlocks} thinking blocks
Lines changed: +${meta.linesChanged.added} / -${meta.linesChanged.removed} across ${meta.filesChangedCount} files
(Extracted from Cursor's globalStorage state.vscdb. Token usage not stored locally; long tool inputs/results truncated.)
`;
writeFileSync(join(resultDir, "runlog.txt"), rHeader + log.join("\n") + "\n");

db.close();

// --- report -------------------------------------------------------------------
console.log("\nWrote results/%s/session/", slug);
console.log("  - cursor-composer.json (raw)");
console.log("  - transcript.md");
console.log("  - session-metadata.json");
console.log("Wrote results/%s/runlog.txt", slug);
console.log("\n=== Telemetry (paste objective fields into metadata.json) ===");
console.log("  timeTakenSeconds:", wallSeconds);
console.log("  model:", model, "| effort:", effort);
console.log("  tools:", JSON.stringify(tools));
console.log("  files edited:", filesEdited.size, "| shell cmds:", shellCommands.length);
console.log("  lines: +%s / -%s across %s files",
  meta.linesChanged.added, meta.linesChanged.removed, meta.filesChangedCount);
console.log("  contextWindowFinal:", ptb.totalUsedTokens, "/", ptb.maxTokens);
console.log("\n  NOTE: token usage + cost are NOT in Cursor's local DB —");
console.log("        fill tokenUsage / estimatedCostUsd from the Cursor dashboard.");
