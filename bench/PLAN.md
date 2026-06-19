# Benchmark Task — PLAN.md

<!--
  This file IS the prompt. It is copied verbatim into every new bench instance
  by scripts/new-bench.sh. The harness under test is given this directory and
  this file as its single, 1-shot instruction. Keep it precise and complete:
  the harness gets no follow-up clarification.

  TODO: The concrete task and dataset are not yet designed. Everything below
  the "Task" heading is a PLACEHOLDER describing the *shape* of the task so the
  rest of the pipeline (scaffolding, collection, site) can be built and seen.
-->

## Task

> **PLACEHOLDER — to be replaced when the benchmark is designed.**

Build a small static website that explores and visualizes the dataset provided
in the `data/` directory. <!-- TODO: describe the real analytical/visual goal. -->

## Hard requirements

These are graded. Read them carefully.

1. **Do not modify, move, or delete anything inside `data/`.** Treat it as
   read-only input. <!-- The data folder is replaced with a symlink when results
   are collected, so any edits would be lost anyway — and count as cheating. -->
2. **`pnpm install && pnpm build` must succeed** from the root of this directory
   with no manual steps.
3. **`pnpm build` must emit the compiled, self-contained site into `dist/`.**
   The `dist/` output must work when opened as static files (it will be served
   from a sub-path inside an `<iframe>`, so use **relative** asset URLs).
4. The site must **read its data at runtime from `data/`** (via `fetch`), not
   bake the data into the bundle. Use paths relative to the page.
5. Keep the project self-contained in this directory. Do not read or write files
   outside it.

## Deliverable structure

```
./                 # your project root (this directory)
├── PLAN.md         # this file — leave it in place
├── data/           # provided input — READ ONLY, do not touch
├── <source files>  # your application source
└── dist/           # output of `pnpm build` — the compiled static site
```

## Notes

- You may choose any framework or none, as long as `pnpm build` produces `dist/`.
- There is no follow-up. Make reasonable assumptions and state them in a
  `README.md` if helpful.
