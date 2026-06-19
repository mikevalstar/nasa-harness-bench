# Grading Rubric

Every result is graded against the same rubric so scores are comparable and as
objective as possible. The machine-readable definition is in
[`rubric.json`](./rubric.json); this file explains how it works.

## The mark

Every criterion gets one of the same four marks — judged by **observing the
built site**, not by intent:

| mark | value | meaning |
|---|---|---|
| `pass` | 1.0 | works correctly |
| `good` | 0.75 | works, only minor issues |
| `partial` | 0.5 | works, but with notable issues |
| `poor` | 0.25 | works, but badly / mostly broken |
| `fail` | 0.0 | absent, errors, or "exits" |
| `na` | — | not applicable — excluded from its category's average |

A criterion left `null` (not yet marked) means the result is **ungraded** and
has no score until every criterion is filled in.

## Categories (equal weight)

Each category is scored as the average of its criteria, then the four category
percentages are **averaged equally** — so no category is over-represented
regardless of how many criteria it has. Final score is `0–100`.

1. **Runs** — `pnpm build` succeeds · `dist/` loads without a fatal error · no console errors in normal use
2. **Base correctness** — 3D solar system renders · 8 planets present · NEO asteroids rendered from the data · positions computed from elements (not fabricated) · orbits geometrically correct · time advances / bodies move
3. **Usability** — camera control · sense of scale · legible & intentional · free of visual defects (overlap, misalignment, inconsistent icons)
4. **Features** — each open-ended direction marked working/partial/absent: filter & search · investigate a single object · highlight what matters · convey scale & risk · comets overlay · impact-risk (Sentry) overlay · focus & follow camera · shareable deep links

```
score = mean( runs%, correctness%, usability%, features% )
```

## Integrity gate

Three binary compliance checks, judged from the run log / transcript:

- `dataUntouched` — did not modify, move, or delete anything in `data/`
- `noNetwork` — made no external network calls at runtime
- `inBounds` — did not read or write outside the bench directory

If **any** integrity check fails (or the run is flagged `cheated`), the result
is **VOID**: the quality score is still computed and shown for reference, but the
run is marked invalid — a breach cannot be out-scored by polish.

## Where grades live

- Marks are stored per result in `metadata.json` under a `grade` object.
- `pnpm compile` reads the marks, computes the score deterministically, and
  writes it (plus the category breakdown and void status) into `results/all.json`.
- The site shows the score and a breakdown; nothing is hand-typed into the score.
