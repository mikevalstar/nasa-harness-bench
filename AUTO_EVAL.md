# AUTO_EVAL.md — the machine-checkable half of grading a run

Everything in `metadata.json` splits into two kinds of field: things that can be
**derived from evidence** (the session log, the repo, the built output, an
external source of truth) and things that need **a human looking at the running
app**. This file is the procedure for the first kind, so an assistant can do it
consistently on every run and hand you a result where only the judgment calls are
left.

The rule that makes this worth anything: **every filled field must be traceable
to something checked, not to something read.** The harness's own claims in its
README and wrap-up message are input to verify, never evidence.

> Written for the current bench (the NASA orbital-elements task), but §1–§6 are
> task-agnostic. §7 is where the task-specific correctness check lives — swap
> that section when the bench changes.

---

## What to fill vs. what to leave

| Field | Who | How |
|---|---|---|
| `tokenUsage`, `timeTakenSeconds` | auto | §2 session extraction |
| `estimatedCostUsd`, `costNote` | auto | §3 pricing |
| `buildSucceeded`, `grade.runs.builds` | auto | §4 clean rebuild |
| `cheated`, `grade.integrity.*` | auto | §5 integrity |
| `selfVerificationNotes` | auto | §6 self-verification audit |
| `grade.selfVerification.*` | judgment | §6 — propose a mark, say why, let the human set it |
| `grade.correctness.computedPositions`, `orbitsCorrect` | auto-informed | §7 — verify the math, propose marks |
| `broken`, `summary`, `tags` | human | needs the running app |
| `grade.runs.loads`, `noConsoleErrors`, `usability.*`, `features.*` | human | needs the running app |

Leave everything else `null`. A partially-filled `grade` keeps the result
`ungraded` in `results/all.json`, which is the correct state until a human
finishes it — `pnpm compile` handles that.

---

## 1. Start from the collected result

`scripts/collect-result.sh` has already run and produced
`results/<slug>/` with `output/`, a stub `metadata.json`, `notes.md` and a
placeholder `runlog.txt`. Read `benches/<slug>.json` for the harness, model,
effort and `benchPath` — you need the bench path to locate the session.

---

## 2. Extract the session

One extractor per harness; all take the result slug and are non-destructive
(they never touch `metadata.json`):

| Harness | Command |
|---|---|
| Claude Code | `node scripts/extract-session.mjs <slug>` |
| Codex CLI | `node scripts/extract-session-codex.mjs <slug>` |
| Cursor | `node scripts/extract-session-cursor.mjs <slug>` |
| Copilot CLI | `node scripts/extract-session-copilot.mjs <slug>` |
| opencode | `node scripts/extract-session-opencode.mjs <slug>` |
| MiniMax Code | `node scripts/extract-session-minimax.mjs <slug>` |
| Muse Code | `node scripts/extract-session-muse.mjs <slug>` |

Muse persists no cost, so its extractor recomputes one from list price — the
rates live in the `PRICING` constant at the top of the script and must be updated
per model under test. **Treat that recomputation as a lower bound and prefer
muse's own dev-console figure:** on the first muse run it came out ~39% low
($0.518 vs $0.72), apparently because the log reports `cache_write_tokens: 0` on
every call even though the prefix is plainly being cached. When the two disagree,
put the console number in `estimatedCostUsd` and keep the recomputation in
`recomputedCostUsd` so the gap stays on the record. It also folds in the internal "reminder observer" helper
agents muse spawns on its own (`subagent/*/session.jsonl`); they are harness
overhead but real billed tokens, and `session-metadata.json` breaks them out
under `tokenUsageBreakdown`.

Each writes `results/<slug>/session/` — the raw log, a readable `transcript.md`,
and `session-metadata.json` with the aggregated numbers. Copy from
`session-metadata.json` into `metadata.json`:

- `tokens` → `tokenUsage` (keep `cacheCreation` / `cacheRead` as separate keys
  when the harness reports them; `total` is the sum of all four)
- `span.durationSeconds` → `timeTakenSeconds`
- `models` — if more than one model appears, say so in `costNote`; a silent
  fallback to a different model changes what was actually benchmarked

**Where the harness has no local session log** (web UIs — ChatGPT, some Cursor
modes), the numbers come from the product's own usage display and must be
labelled as such in `costNote`. Do not silently mix a UI-reported total with
per-bucket rates that were never disclosed.

Then render `runlog.txt` from the extracted session so the log is readable
without the raw format. Match the existing runs' shape: a header (slug, session
id, harness version, model, span, turn counts, tokens) then `[USER]`,
`[THINKING]`, `[ASSISTANT]`, `[TOOL: Name]` / `[RESULT]` blocks with long
inputs and results truncated.

---

## 3. Price it

Cost is `Σ (bucket tokens × that bucket's rate)`, always at **public list
prices** for the model actually used — never a subscription's effective price,
and never a blended per-token guess.

Buckets to price separately when the harness reports them: input, output, cache
write, cache read. Cache write and read are multiples of the input rate, and the
write multiplier depends on the TTL the harness uses — get this wrong and the
number is off by 30%+ on a cache-heavy agent run.

For Anthropic models, load the `claude-api` skill for current list rates rather
than recalling them. As of the Opus 5 run: **$5 / $25 per MTok in/out, cache
write at the 1-hour TTL 2× ($10), cache read 0.1× ($0.50)** — the same rates as
Opus 4.8 and 4.7. Claude Code uses the 1-hour TTL.

**Sanity check the multiplier against a previous run of the same model family**
before trusting it. Recomputing an already-priced run and landing on its
recorded `estimatedCostUsd` to the cent is the cheapest possible confirmation
that the rate table and TTL assumption are right. (The 1-hour multiplier was
confirmed this way: it reproduces the opus-4-8 run's $12.06 exactly, where the
5-minute multiplier gives $11.17.)

Write `costNote` with the rates used, the per-bucket breakdown, what dominates,
and any caveat (multi-model runs, UI-sourced numbers, an intro-priced model).

---

## 4. Rebuild from clean

Don't trust the committed `dist/`, and don't trust the log's last build line.
Copy `results/<slug>/output/` to a scratch directory, replace the `data`
symlink with a real copy of `bench/data`, delete `node_modules` and `dist`, then
run the project's documented install + build.

Record:

- Did it succeed, including any typecheck the build script runs? → `buildSucceeded`, `grade.runs.builds`
- Does the fresh `dist/` match the committed one? `diff -rq` the two. A clean
  diff means the committed output is reproducible from the committed source; a
  dirty one is worth a line in the notes.

A build that only works because of a stale `node_modules` or a hand-edited
`dist/` is not a passing build.

---

## 5. Integrity

Three binary checks, all from evidence rather than from the harness saying so.

**`dataUntouched`** — `git status --porcelain bench/` from the repo root must be
clean. Also read the build/prepare step in `output/` and confirm it only *reads*
`data/` and writes elsewhere.

**`noNetwork`** — this means *at runtime*, in the browser. Grep the source for
`fetch(` / `XMLHttpRequest` / `import(` with absolute URLs, then grep the built
bundle for `https?://` and account for every hit. Library-internal strings (an
XHTML namespace, a paper citation in a shader comment) are not network calls.
Package installs and version lookups during the build are tooling, not runtime —
note them, don't fail on them.

**`inBounds`** — read every command the harness ran (`bashCommands` in
`session-metadata.json`) plus `filesWritten` / `filesEdited`. Writes must be
inside the bench directory. The harness's own session scratchpad is sanctioned
temp space; reads of system paths to locate a browser or check a tool version
are fine. Flag anything touching the user's other projects, home-directory
config, or this repo.

`cheated` is `true` only if one of the three fails. Say which, and quote the
command.

---

## 6. Self-verification audit

The question is narrow: **from the run log, did the harness open its own running
app in a browser and look at it?** Two marks — console review and display review
— and the honest answer is often different for each.

Walk the log for:

- A server being started and a real browser (headless or not) pointed at it
- Screenshots *taken and then read back* — a screenshot the harness never opened
  is not a review
- Whether findings changed the code afterwards. Iteration is the strongest
  evidence that a review actually happened
- DOM dumps and assertions on live values
- The **channel** used to capture console output. This is where runs most often
  fail on a technicality: grepping a browser's stderr without enabling page-level
  logging (and without a CDP/devtools listener) surfaces browser-process noise
  only, so "no errors found" proves nothing about the page. Say so explicitly
  rather than crediting the attempt.
- Any numeric self-checks the harness ran against its own output

Write all of it into `selfVerificationNotes` — what it did, with specifics, and
what the evidence does and doesn't establish. Propose marks (`pass` = reviewed
and succeeded, `partial` = tried but the check couldn't establish the claim,
`fail` = no attempt) but leave `grade.selfVerification.*` for the human when the
channel question is arguable.

---

## 7. Verify the task's core computation

The bench exists to test whether the harness got the *hard, checkable* part
right. Verify it independently — never by re-reading the harness's code and
agreeing with it, and never by trusting the numbers it quotes in its wrap-up.

The general shape, whatever the task:

1. **Re-implement a reference** for the same computation, independently and at
   full precision.
2. **Replay the harness's actual code path** against it, over the *whole* input,
   not a spot check. Transcribe its algorithm exactly — same iteration counts,
   same thresholds, same branch conditions — because those are usually where the
   defects are.
3. **Emulate the numeric environment.** If the work happens on the GPU in
   float32, emulate float32 (`Math.fround` around every operation), because a
   double-precision replay of a float32 shader silently hides its real error.
4. **Anchor to an external source of truth** for a handful of cases, so the
   reference itself is validated and not just self-consistent.
5. **Quantify the blast radius, not just the error.** An error only matters if
   the user can see it. Filter by whatever the app actually displays — a
   visibility cutoff, a filter default, the visible date range.
6. **Check the harness's own claims** against your reference, including whether
   its documentation describes what its code actually does.

### For the current (orbital) bench

- Reference: a damped-Newton Kepler solve iterated to machine precision.
- Replay both paths — the CPU module and a float32 emulation of the shader —
  over all ~42k asteroids and ~4k comets, at several dates (J2000, today, and
  ±50 yr, since propagation error grows with epoch distance).
- External truth: **JPL Horizons** vector ephemerides, heliocentric, J2000
  ecliptic. Query `https://ssd.jpl.nasa.gov/api/horizons.api` with
  `EPHEM_TYPE=VECTORS&CENTER=500@10&REF_PLANE=ECLIPTIC&VEC_TABLE=1` and a
  `TLIST` Julian date. Use `curl --get --data-urlencode` and keep the single
  quotes inside the `COMMAND` value; a numbered asteroid is `COMMAND='433;'`.
  **Verify Horizons returned the object you asked for** — check the
  `Target body name` line, since an ambiguous designation silently returns a
  different body and will look like a catastrophic bug in the harness's code.
- Expect two-body propagation to disagree with Horizons by ~1e-3 relative for
  planets from J2000 mean elements, and to grow with the age of an asteroid's
  epoch. That residual is physics, not a defect. A **frame, sign, or rotation
  error is O(r)** and unmistakable against it.
- Things that reliably hide defects here: fixed iteration counts that don't
  converge at high eccentricity; a parabolic approximation applied to a *band*
  around e = 1 instead of exactly e = 1; propagating a hyperbolic body from `ma`
  instead of `tp`; float32 storage of raw Julian dates.

Put the findings in `notes.md` with numbers — worst case, percentiles, how many
objects are affected, and how many of those are actually visible. Propose marks
for the correctness criteria and say what they're based on.

---

## 8. Write it up and compile

`notes.md` gets: a summary, the math verification with its numbers, what it got
right, what it got wrong, integrity findings, and — importantly — an explicit
**"filled vs. left for hand-grading"** section so the human knows exactly what
they're picking up.

Then `pnpm compile` and confirm the run appears in `results/all.json`. If
`compile` reports invalid JSON, fix it before finishing; a skipped result looks
identical to one that was never collected.

Don't commit unless asked.

---

## Failure modes to avoid

- **Believing the harness.** Its README, its wrap-up, and its self-reported
  verification are claims. Every one this procedure covers is cheap to check.
- **Reading code instead of running it.** Formulae can be textbook-correct and
  still produce wrong output through an iteration count or a branch threshold.
  Only execution finds that.
- **Spot checks.** Defects in this kind of work concentrate in the tail — the
  highest eccentricities, the oldest epochs, the degenerate branch. Run the
  whole catalogue.
- **Reporting an error without its blast radius.** "Off by 1500 au" and "off by
  1500 au, but every affected object is outside the view" are different findings
  and lead to different marks.
- **Filling a judgment call to make the row look complete.** An honest `null`
  with a paragraph of evidence beats a mark nobody can defend.
- **Blaming the harness for your own tooling error.** When a cross-check shows a
  wild discrepancy, re-verify the query before writing it up.
