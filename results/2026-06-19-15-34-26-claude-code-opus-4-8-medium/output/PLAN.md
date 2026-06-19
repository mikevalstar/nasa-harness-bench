# PLAN.md

You are building a website from scratch. This file is your **only** instruction —
there will be no follow-up questions or clarifications. Read it fully, make
reasonable decisions where it leaves room, and ship something complete.

## What to build

An **interactive 3D visualization of the inner solar system and its near-Earth
asteroids**, driven entirely by the dataset in `data/`.

The dataset describes the Sun, the eight planets, and ~42,000 near-Earth objects
as **orbital elements** (see `data/README.md` for the schema, units, and frame).
Positions are *not* given — you compute where each body is from its orbit, for
any moment in time, and let the user move through time to watch the system
evolve.

This has a required **base** (below) that every submission must get right, and a
set of **open-ended directions** on top. The base is the foundation; the
directions are where you bring your own ideas. Build a solid base, then add as
much meaningful capability on top as you can.

You may search the internet to answer questions you have, or to gather assets.

## Required base

1. **Render the solar system in 3D.** The Sun at the center, the eight planets,
   and the near-Earth asteroids, positioned by computing each body's location
   from its orbital elements (propagated from each body's own epoch). Orbits
   should be geometrically correct — a viewer who knows the solar system should
   recognize it.
2. **Time is interactive.** The scene must show a specific moment and let the
   user advance/rewind time (e.g. play/pause, speed, scrub, or jump to a date),
   with bodies moving along their orbits accordingly.
3. **Use the real data.** Load it from `data/` at runtime via `fetch`. Handle the
   full ~42,000-object set — performance and how you present that many objects
   are part of getting the base right. Do not hardcode or fabricate positions.
   You may pre-process data as part of the build to improve performance.
4. **It must be usable and look intentional.** Camera control, a sense of scale,
   and legible presentation. This is a tool people explore, not a tech demo.

## Open-ended directions

Implement each of these additional features — the
approach, depth, and UX are yours to design. A few directions to consider:

- **Filter & search** the asteroids (e.g. by hazard status, size, orbit class,
  distance, approach date — whatever the data supports).
- **Investigate a single object** — a detail view surfacing its orbit, physical
  properties, and close-approach history (`close-approaches.json`).
- **Highlight what matters** — e.g. potentially hazardous asteroids, upcoming
  close approaches, or unusually large/close objects.
- **Convey scale and risk** through visual encoding.
- **Add comets** — overlay the comets in `comets.json` (same orbital-element
  schema as the asteroids). Note that many comets have highly eccentric or open
  (hyperbolic/parabolic) orbits, which are not propagated the same way as the
  asteroids' closed orbits.
- **Show impact risk** — overlay the CNEOS impact-risk data in `sentry.json`
  (joinable to objects by designation): impact probability, Palermo/Torino scale,
  and the window of potential impacts.
- **Focus & follow** — let the user lock the camera onto a selected body and
  track it as time advances.
- **Shareable deep links** — encode the current view (time, selected object,
  camera) in the URL so a particular moment can be linked and reopened.

If you think you cannot accomplish any of the above or you cannot make it work, do not complete it 
or leave a partially completed but working feature.

## Hard rules (graded)

1. **Do not modify, move, or delete anything in `data/`.** Treat it as read-only.
2. **No external network calls.** Everything the site needs must come from `data/`
   and your own bundle. No CDNs, remote fonts, or runtime API calls.
3. **`pnpm install && pnpm build` must succeed** from this directory with no
   manual steps, and emit a self-contained static site into **`dist/`**. 
   This should also contain a copy of the data in the format you need it in for the UI.
4. The built site is served from a sub-path inside an `<iframe>`, so use
   **relative** asset and data URLs (not absolute `/…` paths).
5. Keep everything inside this directory. Do not read or write files outside it.

## Deliverable structure

```
./                 # your project root (this directory)
├── PLAN.md         # this file — leave it in place
├── data/           # provided input — READ ONLY
├── src/<source files>  # your application source
└── dist/           # output of `pnpm build` — the compiled static site
```

You may use any framework, libraries (bundled, not from a CDN). If you
make notable assumptions, jot them in a `README.md`.
