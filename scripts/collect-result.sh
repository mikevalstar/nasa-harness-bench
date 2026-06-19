#!/usr/bin/env bash
#
# collect-result.sh — pull a finished bench into this repo's results/.
#
# Usage:
#   scripts/collect-result.sh <bench-dir>
#
# Produces results/<slug>/ with:
#   - metadata.json   (note fields + placeholders for the hand-graded fields)
#   - notes.md        (free-form notes template)
#   - runlog.txt      (placeholder — you paste the harness transcript here)
#   - output/         (the harness's source files, minus node_modules)
#   - output/data/    (SYMLINK back to bench/data — no duplication)
#   - output/dist/    (the compiled site, if the harness produced one)

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

BENCH_DIR="${1:-}"
[ -n "$BENCH_DIR" ] || die "Usage: scripts/collect-result.sh <bench-dir>"
BENCH_DIR="$(cd "$BENCH_DIR" 2>/dev/null && pwd)" || die "No such directory: ${1}"

SLUG="$(basename "$BENCH_DIR")"
NOTE="$REPO_ROOT/benches/$SLUG.json"
[ -f "$NOTE" ] || warn "No note found at benches/$SLUG.json — metadata fields will be blank."

DEST="$REPO_ROOT/results/$SLUG"
if [ -d "$DEST" ]; then
  confirm "results/$SLUG already exists. Overwrite?" || die "Aborted."
  rm -rf "$DEST"
fi

say "Collecting $SLUG"
mkdir -p "$DEST/output"

# --- copy source, excluding heavy/irrelevant dirs and the data folder ----------
EXCLUDES=(node_modules .git .DS_Store)
if command -v rsync >/dev/null 2>&1; then
  args=(); for e in "${EXCLUDES[@]}"; do args+=(--exclude "$e"); done
  # Anchor the data exclude to the transfer root (leading slash) so we drop ONLY
  # the top-level data/ (replaced by a symlink below) and KEEP the harness's own
  # self-contained copy at dist/data, which the rendered site needs.
  args+=(--exclude "/data")
  rsync -a "${args[@]}" "$BENCH_DIR"/ "$DEST/output"/
else
  cp -R "$BENCH_DIR"/ "$DEST/output"/
  for e in "${EXCLUDES[@]}"; do rm -rf "$DEST/output/$e"; done
  rm -rf "$DEST/output/data" # top-level only; leaves dist/data intact
fi
info "Copied source -> output/"

# --- replace data with a symlink back to the canonical copy --------------------
ln -s "../../../bench/data" "$DEST/output/data"
info "Linked output/data -> bench/data"

[ -d "$DEST/output/dist" ] && info "Found compiled dist/" || warn "No dist/ found — site will not render in the viewer until built."

# --- runlog placeholder --------------------------------------------------------
cat > "$DEST/runlog.txt" <<'TXT'
PLACEHOLDER — paste the harness run transcript / log here by hand.
TXT

# --- notes template ------------------------------------------------------------
cat > "$DEST/notes.md" <<MD
# Notes — $SLUG

Free-form observations about this run. Fill in by hand.

## Summary

_TODO_

## What it got right

-

## What it got wrong / broke

-

## Cheating / out-of-bounds behaviour

- Did it touch \`data/\`?
- Did it read or write outside the bench directory?
MD

# --- metadata.json: note fields + hand-graded placeholders ---------------------
# Pull recorded fields from the note if jq is available; else leave blanks.
get() { # get <key> <fallback>
  if command -v jq >/dev/null 2>&1 && [ -f "$NOTE" ]; then
    jq -r --arg k "$1" '.[$k] // empty' "$NOTE"
  fi
}
HARNESS="$(get harness)"; HARNESS_VERSION="$(get harnessVersion)"
MODEL="$(get model)"; EFFORT="$(get effort)"
CREATED_AT="$(get createdAt)"; BENCH_PATH="$(get benchPath)"
[ -n "$BENCH_PATH" ] || BENCH_PATH="$BENCH_DIR"
COLLECTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > "$DEST/metadata.json" <<JSON
{
  "slug": "$SLUG",
  "harness": "$HARNESS",
  "harnessVersion": "$HARNESS_VERSION",
  "model": "$MODEL",
  "effort": "$EFFORT",
  "createdAt": "$CREATED_AT",
  "collectedAt": "$COLLECTED_AT",
  "benchPath": "$BENCH_PATH",

  "_comment": "Fields below are graded BY HAND after collection. null = not yet filled.",
  "broken": null,
  "cheated": null,
  "buildSucceeded": null,
  "tokenUsage": { "input": null, "output": null, "total": null },
  "estimatedCostUsd": null,
  "timeTakenSeconds": null,
  "tags": [],
  "summary": ""
}
JSON
info "Wrote metadata.json (hand-grade the null fields)"

# Mark the note as collected (best-effort).
if command -v jq >/dev/null 2>&1 && [ -f "$NOTE" ]; then
  tmp="$(mktemp)"; jq '.collected = true' "$NOTE" > "$tmp" && mv "$tmp" "$NOTE"
fi

say "Done"
info "Result at: results/$SLUG"
info "Now: 1) paste runlog.txt  2) fill metadata.json + notes.md  3) run: pnpm compile"
