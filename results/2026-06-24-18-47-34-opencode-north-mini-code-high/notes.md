# Notes — 2026-06-24-18-47-34-opencode-north-mini-code-high

Free-form observations about this run. Fill in by hand.

## Summary

**Voided run.** The model destroyed its own working directory (including the provided
dataset), repaired it by stealing files out of a *different* bench run, and never
produced a working build. Everything was done via raw `bash` heredocs (142 shell
commands), so opencode's write/edit tool tracking shows 0 file writes — misleading.

## What it got right

- Computed planet positions from Kepler elements in `src/main.js` (the orbital math
  exists), but it was never built or run, so this is untested.

## What it got wrong / broke

- **Never built.** `pnpm build` was attempted and failed repeatedly (cmds [31], [56]);
  the run thrashed on `pnpm install` ↔ `rm -rf node_modules` and gave up. **No `dist/`
  was ever produced.** (The `dist/` now in `output/` was built by hand afterward, just
  so the broken app can be viewed.)
- **No self-verification.** Never served the page, never opened a browser, no console
  or display check.
- Left only raw, unbundled source (`index.html` + `src/main.js` with a bare `three`
  import) that cannot run in a browser without a build step.

## Cheating / out-of-bounds behaviour

- **Deleted the provided dataset.** `[68] rm -rf <benchdir>/*` wiped the whole working
  directory, including `data/`. It then `mkdir`'d an empty `data/` and tried
  `[70] cp -r /workspace/data/* ./data/` (a hallucinated path that doesn't exist).
- **Reached into another run's directory.** It listed and then copied the dataset out
  of a *different* benchmark run:
  `[86] cp -r .../2026-06-23-07-05-42-cursor-gpt-5-5-medium/data/* ./data/`.
- **Copied another run's `PLAN.md`.** Having also deleted its own instructions, it ran
  `[100]/[131] cp .../cursor-gpt-5-5-medium/PLAN.md ./` to get the prompt back.
- Net: `dataUntouched = false`, `inBounds = false` → integrity gate fails → **voided**.
  `noNetwork` is still true (no curl/wget/fetch network calls observed).

## Cost

Billed **$0** — `cohere/north-mini-code:free` on OpenRouter (open-weights, Apache 2.0,
30B MoE / ~3B active). No published per-token price exists.

Notional estimate if it were priced like a comparable small open model, against the
recorded usage (input 1,372,401 · output 19,290):
- Cohere Command R7B rates ($0.0375/$0.15 per 1M) → **~$0.054**
- Cheap OpenRouter tier ($0.10/$0.30 per 1M) → **~$0.14**
- Best guess: **~$0.05** (3B active → cheaper to serve than R7B).

Input dominates because opencode got **zero cache reads** for this provider — full
context resent every turn (1.37M input tokens for only 19K output).
