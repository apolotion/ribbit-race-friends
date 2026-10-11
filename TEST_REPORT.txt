# Ribbit Race Friends 1.7.8 — Test Report

## Result

- `npm run check`: **PASS**
- `npm test`: **150 passed, 0 failed**
- Browser runtime smoke: **PASS**
- Game bundle: **13 modules**
- Required external public assets: **21 present**

## Browser runtime smoke

A Chromium smoke harness verified that:

- the login gate is visible and input remains locked before authentication;
- the tutorial becomes active only after **Play Without Saving**;
- the polished Ember dialogue renders without page errors;
- the intro advances into the long-jump scene;
- the Current Goal hover explanation appears;
- Pause opens during the tutorial;
- selecting **Skip Tutorial** exits the tutorial cleanly.

## Tutorial-focused automated coverage

Automated checks verify the 1.7.8/build markers, auth boundary, global lexical cloud-profile lookup, five portrait assets and per-line expression sequences, fixed centered typography, 2× hold-to-type behavior, two-frame continue triangle, thin symmetrical framing, live background/fly animation, pre-line dinner-fly spawn timing, flashing term/clue references, exact 500 ms poof timing, preserved flies, exact Park geometry, normal Park start, long-jump landing sparkles, stock final-catch zoom, reachable multi-fly layouts, missed-fly-only retries, frozen success poses, centered Current Goal copy, hover help, pause retry/skip actions, trajectory suppression, reversible cloud snapshots, and the normal victory/achievement flow.

## Limits

The browser smoke uses a local in-memory API shim rather than a deployed Cloudflare Worker. After deployment, complete one manual playthrough on desktop and one on mobile to confirm touch feel, audio level, and real account/save behavior in the production environment.
