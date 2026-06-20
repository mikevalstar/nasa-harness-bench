#!/usr/bin/env bash
#
# new-bench.sh — create a fresh bench instance for a harness to work in.
#
# Usage:
#   scripts/new-bench.sh <target-parent-dir>
#
# Creates <target-parent-dir>/<slug>/ containing:
#   - PLAN.md            (the prompt, copied from bench/PLAN.md)
#   - data/              (a REAL copy of bench/data — so the harness sees files)
# and drops a note JSON at benches/<slug>.json inside THIS repo recording the
# harness/model/effort/timestamp/path for later collection.
#
# Keep the target dir OUTSIDE this repo. The point is to watch whether the
# harness wanders the filesystem; a bench nested inside the repo defeats that.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PARENT="${1:-}"
[ -n "$PARENT" ] || die "Usage: scripts/new-bench.sh <target-parent-dir>"
PARENT="$(cd "$PARENT" 2>/dev/null && pwd)" || die "No such directory: ${1}"

# Guard against creating the bench inside this repo (cheating risk).
case "$PARENT/" in
  "$REPO_ROOT"/*) die "Target is inside this repo. Choose a directory OUTSIDE $REPO_ROOT" ;;
esac

say "New benchmark instance"

HARNESS="$(ask 'Harness (e.g. claude-code, cursor, aider)' 'claude-code')"
HARNESS_VERSION="$(ask 'Harness version (e.g. 1.2.3)' 'unknown')"
MODEL="$(ask 'Model (e.g. opus-4-8, gpt-5, sonnet-4-6)' 'opus-4-8')"
EFFORT="$(choose 'Effort / reasoning level' low medium high max none)"
# Free-form: many harnesses ship multiple surfaces (cli, ide, agent window, …).
INTERFACE="$(ask 'Interface / surface (e.g. cli, ide, agent-window)' 'cli')"

# Timestamp prefix gives chronological, sortable, unique slugs.
TS="$(date +%Y-%m-%d-%H-%M-%S)"
SLUG="${TS}-$(slugify "$HARNESS")-$(slugify "$MODEL")-$(slugify "$EFFORT")"
BENCH_DIR="$PARENT/$SLUG"

info "Slug:   $SLUG"
info "Create: $BENCH_DIR"
confirm "Create this bench instance?" || die "Aborted."

mkdir -p "$BENCH_DIR"
cp "$REPO_ROOT/bench/PLAN.md" "$BENCH_DIR/PLAN.md"
# Copy data in (dereferences any symlinks so the harness gets real files).
cp -RL "$REPO_ROOT/bench/data" "$BENCH_DIR/data"

# Record the note JSON in the repo's registry.
mkdir -p "$REPO_ROOT/benches"
CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "$REPO_ROOT/benches/$SLUG.json" <<JSON
{
  "slug": "$SLUG",
  "createdAt": "$CREATED_AT",
  "harness": "$HARNESS",
  "harnessVersion": "$HARNESS_VERSION",
  "model": "$MODEL",
  "effort": "$EFFORT",
  "interface": "$INTERFACE",
  "benchPath": "$BENCH_DIR",
  "collected": false
}
JSON

say "Done"
info "Bench ready at: $BENCH_DIR"
info "Note written:   benches/$SLUG.json"
echo
info "Next: point the harness at $BENCH_DIR with PLAN.md as its 1-shot prompt."
info "When it finishes, run: scripts/collect-result.sh '$BENCH_DIR'"
