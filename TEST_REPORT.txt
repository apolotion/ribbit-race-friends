# Ribbit Race Friends 1.7.10 — Test Report

## Result

- `npm run check`: **PASS**
- `npm test`: **159 passed, 0 failed**
- Browser runtime smoke: **PASS**
- Generated game bundle: **13 modules, 1,210,610 bytes**
- Required external public assets: **22 present**
- Browser console errors: **0**
- Browser uncaught page errors: **0**

## Browser runtime smoke

Chromium loaded the complete production HTML, CSS, JavaScript, and Ember portrait assets through an inline static-asset harness with an in-memory Friends API stub. The harness verified that:

- the initial body remained `ribbit-auth-locked rr-tutorial-pending`;
- the login/create/guest gate was visible before profile selection;
- selecting **Play Without Saving** activated the solo tutorial and made the 1920×1080 canvas visible;
- the tutorial opened at step 0 with Ember dialogue active;
- Pause entered `paused` and displayed the tutorial pause menu;
- Continue returned directly to `playing` with `countdownNumber = 0` and `countdownTimer = 0`;
- a real long-jump instruction wrapped onto a second, left-aligned line;
- the frog remained at `(61, 200)` when the long-jump dialogue closed, confirming there was no first-control reposition or poof;
- the Current Goal card rendered level with the jump and term cards without clipping its second line.

Visual evidence is included in:

- `PREVIEWS/runtime-login-1.7.10.png`
- `PREVIEWS/runtime-dialogue-1.7.10.png`
- `PREVIEWS/runtime-dialogue-wrapped-1.7.10.png`
- `PREVIEWS/runtime-pause-1.7.10.png`
- `PREVIEWS/runtime-goal-alignment-1.7.10.png`

The structured browser result is stored in `BROWSER_SMOKE_TEST_1.7.10.json` and duplicated as `BROWSER_SMOKE_TEST.json`.

## Tutorial-focused automated coverage

The release tests verify:

- 1.7.10/build markers and all thirteen gameplay modules;
- synchronous first-paint tutorial gating after authentication;
- approved dark-blue dialogue panels, matching two-pixel outlines, square Ember portrait, larger centered name, and no right-side rail;
- larger left-aligned dialogue and same-left-edge two-line wrapping;
- multiple Ember expressions within scenes and 2× hold-Space typing;
- the slower 520 ms two-frame triangle;
- consumption of the final dialogue Space press;
- prior-line hold through delayed poofs and the first new typewriter tick;
- delayed dinner-fly reveal plus the extra 500 ms announcement hold;
- all authored tutorial flies remaining hidden until their matching frog poof-in;
- true mirrored Park platforms and fly anchors;
- exact Current Goal footer footprint, two-pixel card gutter, and non-overlapping clue shadow;
- blank term and goal until player control returns;
- immediate prompt blanking after each three-catch success;
- 500 ms correct-catch landing holds and missed-catch-only retries;
- raised tongue target and stock final-catch slow-motion/zoom eligibility;
- no redundant poof on the first long-jump control handoff;
- mirrored two-fly and diagram-aligned three-fly routes;
- deliberate match-and-spit prompt mismatch;
- full wrong-fly sequence: preserve nonmatch, spawn a new match after contact, update the clue, and require return for the original fly;
- drop-buffer jump-counter restoration;
- deferred wall/rebound success until landing;
- no resume countdown;
- suppression of every training achievement except **RIBBIT READY**;
- normal TIME/JUMPS/BEST metrics in the final round;
- reversible cloud-save snapshot behavior and existing Friends Edition features.

## Limits

The browser harness uses an in-memory API shim rather than a deployed Cloudflare Worker. Static and local-browser verification cannot reproduce every production network, mobile-browser, audio-device, or account state. After deployment, complete one desktop and one mobile tutorial playthrough using the real Cloudflare account/save backend.
