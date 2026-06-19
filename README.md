# NASA Harness Bench

A small, **transparent** benchmark that gives a coding **harness + model** combo
a single **1-shot prompt** and a fixed NASA dataset, then publishes exactly what
it produced. The site is static HTML; each result's compiled output is shown live
in an `<iframe>`.

> **Status: placeholder phase.** The concrete NASA task and dataset are not yet
> designed. The whole pipeline and site are scaffolded with clearly-marked
> `TODO`/`PLACEHOLDER` content so the shape can be reviewed first.

## How it works

```
bench/                     # the benchmark itself (source of truth)
  PLAN.md                  #   the 1-shot prompt given to every harness
  data/                    #   the canonical, read-only input dataset (one copy)

benches/                   # registry: a JSON note per created bench instance

results/                   # collected results (committed)
  all.json                 #   compiled index the site fetches  (pnpm compile)
  <slug>/
    metadata.json          #   machine + hand-graded fields
    notes.md               #   free-form notes (by hand)
    runlog.txt             #   pasted harness transcript (by hand)
    output/                #   the harness's source files
      data/                #     SYMLINK back to bench/data (no duplication)
      dist/                #     the harness's compiled static site (iframed)

src/, public/, astro.config.mjs   # the Astro display site
```

A `<slug>` is `YYYY-MM-DD-HH-MM-SS-<harness>-<model>-<effort>`.

## Workflow

Tooling is pinned with [mise](https://mise.jdx.dev). Install everything:

```sh
mise install        # node, pnpm, gum
pnpm install
```

### 1. Create a bench instance (for the harness to work in)

```sh
scripts/new-bench.sh /some/dir/OUTSIDE/this/repo
```

Prompts (via `gum`) for harness / model / effort, then creates
`/some/dir/.../<slug>/` containing `PLAN.md` + a real copy of `data/`, and writes
`benches/<slug>.json`. **Keep the directory outside this repo** — that's how we
watch whether the harness wanders the filesystem.

Then point the harness at that directory with `PLAN.md` as its only instruction.

### 2. Collect the finished result

```sh
scripts/collect-result.sh /some/dir/OUTSIDE/this/repo/<slug>
```

Copies the harness's source into `results/<slug>/output/` (minus `node_modules`),
replaces the data copy with a **symlink** to `bench/data`, and writes a
`metadata.json` with `null` placeholders for the hand-graded fields plus a
`notes.md` and `runlog.txt` to fill in.

### 3. Grade by hand, then compile

Fill in `results/<slug>/metadata.json` (`broken`, `cheated`, `buildSucceeded`,
`tokenUsage`, `estimatedCostUsd`, `timeTakenSeconds`, `tags`, `summary`), paste
the log into `runlog.txt`, write `notes.md`, then:

```sh
pnpm compile        # rebuilds results/all.json
```

### 4. Preview / build the site

```sh
pnpm dev            # sync + compile + astro dev
pnpm build          # -> dist/  (deploy this)
```

`prebuild`/`sync` copy `results/` into `public/results/` **dereferencing
symlinks** (GitHub Pages won't follow them), so the deployed site's runtime
`fetch`es resolve.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys on push to `main`. It sets
`BASE_PATH=/<repo-name>/` so all `fetch`/iframe URLs resolve under the project
sub-path. Enable Pages → "GitHub Actions" in repo settings.

## Metadata fields

| field | source | meaning |
|---|---|---|
| `harness`, `harnessVersion`, `model`, `effort` | auto (from note) | the combo under test |
| `createdAt`, `collectedAt` | auto | run date/time + collection time |
| `benchPath` | auto | where the harness ran (transparency) |
| `broken` | hand | does the output fail to work? |
| `cheated` | hand | touched `data/` or read/wrote outside the bench? |
| `buildSucceeded` | hand | did `pnpm build` succeed? |
| `tokenUsage` | hand | `{ input, output, total }` |
| `estimatedCostUsd` | hand | estimated $ |
| `timeTakenSeconds` | hand | wall-clock |
| `tags`, `summary` | hand | classification + one-liner |

Anything else worth recording: add the field to `metadata.json`; the site reads
it generically and you can extend the header in `src/pages/index.astro`.
