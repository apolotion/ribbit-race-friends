# Ribbit Race Friends 1.7.7 — Test Report

## Result

- `npm run check`: **PASS**
- `npm test`: **148 passed, 0 failed**
- Game bundle: **13 modules**
- Required external public assets: **21 present**

## Tutorial-focused coverage

Automated checks verify:

- current version/build markers and V7 first-boot key;
- authentication-gated tutorial startup;
- portrait preload and no map Ember fallback;
- compact top dialogue geometry between HUD corners;
- one-line typewriter timing and line advancement;
- no faux scrollbar/continue-arrow rendering;
- post-dialogue fly sparkle/spawn lifecycle;
- tongue and afterimage cleanup during resets;
- 500 ms two-poof reset timing;
- no offscreen frog sentinel coordinates;
- all requested scripted scene/setup identifiers;
- three-long-jump and three-matching-catch progression;
- tongue-only range lesson and slow-motion emphasis;
- wrong-fly and multi-fly sequence checks;
- wall/rebound and unchanged Park platform layouts;
- robust distinct buffered-drop counting;
- trophy Current Goal panel and smooth red fade;
- suppression of the old “Nice Work” transition;
- normal Single Player victory/jingle and RIBBIT READY registration.

## Limits

The automated suite validates source structure, parsing, build output, and scenario state logic. It does not replace a complete physical playthrough on the deployed Cloudflare build. After deployment, manually test the tongue position, all multi-fly arcs, the wall/rebound shots, and buffered-drop timing on both desktop and iPhone.
