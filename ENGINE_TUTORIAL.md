# Ribbit Race Friends 1.7.9 — Tutorial Runtime

## Runtime design

The tutorial runs inside the real Park engine instead of a detached practice canvas. `client/game/120-engine-tutorial.js` temporarily wraps normal jump, update, catch, render, input, pause, achievement, and victory functions only while training is active.

## First-paint entry gate

`public/index.html` begins in `ribbit-auth-locked rr-tutorial-pending`. The synchronous `tutorial-preboot.js` keeps first-time gameplay hidden until the account gate has released and the tutorial has actually started. Returning players who already completed training have the pending class removed immediately. This prevents the main menu from appearing for a split second before a first tutorial.

## Dialogue presentation

- The text panel is bright and high contrast, with a larger consistent bitmap-text scale and centered one- or two-line wrapping.
- Ember's portrait is a true square, equal in height to the text panel, with the same two-pixel border width.
- The orange name strip carries a larger centered **EMBER** label and no extra right-side rail.
- Ember cycles among five approved expressions from line to line.
- Holding Space types at exactly 2× speed.
- A two-frame down triangle changes every 520 ms and appears only when another line remains.
- The Space keydown that closes a scene's final line is blocked until its matching keyup, preventing the same press from charging a jump.

## Live-world dialogue and scripted reveals

Park animation continues while Ember speaks. Frog control, charge, tongue trajectory, and tutorial input remain locked, but background rendering and authored fly animation continue. Scene-specific poofs can occur during dialogue:

- The first dinner fly completes its spawn animation and then waits 500 ms before its announcement line begins.
- The tongue-range frog and target poof into place before Ember describes the distant fly.
- The mixed multi-fly frog and targets enter together after the matching dialogue line rather than existing at scene start.

The English term and Current Goal remain visually blank until the player has control.

## Park geometry

Every normal and tutorial Park run uses one horizontally mirrored layout. The left low and middle platforms have exact right-side counterparts. Only the two center platforms share a vertical column. Park fly anchors are mirrored as well.

## Exercise safety

- Long-jump successes sparkle on landing.
- Three-catch successes hold the landing pose for 500 ms before the next poof; a miss retries only the active catch.
- The tongue exercise extends the engine's own `shouldStartSoloCriticalCatch` check so the standard Single Player slow-motion, camera zoom, impact overlay, and sound sequence run unchanged.
- Quick and buffered platform drops restore the normal jump counters and do not consume tutorial attempts.
- Wall techniques set a pending success and continue real physics until the frog lands, preventing midair freezes.
- The mixed, mirrored two-match, and diagram-aligned three-match routes use authored reachable placements.

## HUD and pause

Current Goal uses the exact rectangle normally occupied by TIME/JUMPS/BEST, and the vocabulary card's shadow stops at that boundary. The final practice round removes the tutorial goal override and exposes the normal statistics panel. Pause adds **Retry Scene** and **Skip Tutorial**; Continue restores `playing` directly without the standard countdown.

## Achievement and save isolation

During training, ordinary Solo and PvP achievement functions return without awarding anything. The only allowed unlock is `tutorial-graduate` (**RIBBIT READY**) after completion. The reversible playtest snapshot restores legitimate cloud progress, records, and unlock state before that permanent completion achievement is applied.
