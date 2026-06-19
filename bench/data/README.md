# Benchmark Data (canonical copy)

**PLACEHOLDER — the real NASA dataset has not been chosen yet.**

This directory is the single canonical copy of the benchmark input data.

- `scripts/new-bench.sh` **copies** this whole folder into each new (external)
  bench instance, so the harness under test operates on real files.
- `scripts/collect-result.sh` **replaces** the copied folder with a **symlink**
  back to here when pulling a result into `results/`, so the data is never
  duplicated inside this repo.

TODO: drop the actual data files here (e.g. CSV/JSON exports from a NASA source)
and document their provenance, license, and schema below.

## Provenance

- Source: _TBD_
- License: _TBD_
- Retrieved: _TBD_

## Schema

_TBD_
