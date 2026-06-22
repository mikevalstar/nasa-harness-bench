# Notes — 2026-06-19-15-34-26-claude-code-opus-4-8-medium

Free-form observations about this run. Fill in by hand.

## Summary

_TODO_

## What it got right

-

## What it got wrong / broke

-

## Cheating / out-of-bounds behaviour

- Did it touch `data/`?
- Did it read or write outside the bench directory?

## Cost note (vs other Opus 4.8 runs)

This run cost noticeably more than the Cursor ($8.13) and Copilot ($6.40) Opus 4.8
runs ($12.06). The work itself was nearly identical across all three — same playbook
(probe data → validate Kepler math → binary-preprocess + GPU-shader pipeline →
bottom-up build → elaborate headless-browser self-verification). Claude Code was
actually the fastest (~17 min vs 22/36) and hit zero algorithm bugs, so the extra
cost is not from rework or doing more.

The difference is loop granularity: Claude Code runs a tighter, finer-grained agent
loop (~120 assistant turns vs ~29 Cursor / ~35 Copilot). Each turn is its own model
invocation carrying an Opus 4.8 adaptive-thinking pass (billed as output even though
thinking display is omitted, so the log looks terse). That produces ~2x the output
tokens (193k vs ~90k) — the most expensive line at $25/M — and every one of those
turns re-reads the full cached context, keeping cache-read volume highest of the
three. Cursor/Copilot consolidate ~3 tool calls per turn via parallel tool use, so
fewer, denser round-trips. Net: tighter turns → more (hidden) thinking and more cache
reuse → higher cost, not more or worse work.
