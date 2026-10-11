# Ribbit Race Friends 1.7.9 — Test Report

## Result

- `npm run check`: **PASS**
- `npm test`: **157 passed, 0 failed**
- Browser runtime smoke: **PASS**
- Generated game bundle: **13 modules**
- Required external public assets: **22 present**

## Browser runtime smoke

A Chromium route-fulfilled smoke harness verified that:

- the initial body is both authentication-locked and tutorial-pending;
- the login/guest gate is visible before profile selection;
- selecting **Play Without Saving** activates the solo tutorial without exposing an intermediate main-menu frame;
- the larger Ember dialogue is open and the canvas is visible after tutorial activation;
- Pause opens during the lesson;
- Continue returns to the active tutorial with dialogue still open;
- the run produced no console errors and no uncaught page errors.

The browser harness uses a local in-memory API shim rather than a deployed Cloudflare Worker.

## Tutorial-focused automated coverage

The release tests verify:

- 1.7.9/build markers and all thirteen gameplay modules;
- synchronous first-paint tutorial gating after authentication;
- larger centered Pokémon-style dialogue, square equal-height Ember portrait, matching two-pixel borders, larger centered name, and the slower two-frame triangle;
- multiple Ember expressions within scenes and 2× hold-Space typing;
- consumption of the final dialogue Space press;
- delayed dinner-fly reveal plus the extra 500 ms announcement hold;
- late range and mixed-scene poofs;
- true mirrored Park platforms and Park fly anchors;
- exact Current Goal footer footprint and non-overlapping clue shadow;
- blank term/goal until player control returns;
- 500 ms correct-catch landing holds;
- missed-catch-only retry behavior;
- stock final-catch slow-motion and zoom eligibility in the tongue lesson;
- mirrored two-fly and diagram-aligned three-fly routes;
- deliberate match-and-spit prompt mismatch;
- drop-buffer jump-counter restoration;
- deferred wall/rebound success until landing;
- no resume countdown;
- suppression of every training achievement except **RIBBIT READY**;
- normal TIME/JUMPS/BEST metrics in the final round;
- reversible cloud-save snapshot behavior and existing Friends Edition features.

## Limits

Static and local-browser verification cannot reproduce every production network, mobile-browser, audio-device, or account state. After deployment, complete one desktop and one mobile tutorial playthrough using the real Cloudflare account/save backend.
