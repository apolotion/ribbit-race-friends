# Ribbit Race Friends 1.7.10 — Tutorial Runtime

## Runtime design

The tutorial runs inside the real Park engine instead of a detached practice canvas. `client/game/120-engine-tutorial.js` temporarily wraps normal jump, update, catch, render, input, pause, achievement, and victory functions only while training is active.

## First-paint entry gate

`public/index.html` begins in `ribbit-auth-locked rr-tutorial-pending`. The synchronous `tutorial-preboot.js` keeps first-time gameplay hidden until the account gate has released and the tutorial has actually started. Returning players who already completed training have the pending class removed immediately. This prevents the main menu from appearing for a split second before a first tutorial.

## Dialogue presentation

- The text panel uses the previously approved compact dark-blue fill and thin cyan outline.
- Dialogue keeps the larger bitmap-text scale introduced in the prior pass.
- All dialogue is left-aligned. Every wrapped continuation begins at the same left edge.
- Ember's portrait is a true square, equal in height to the text panel, with the same two-pixel outline width.
- The orange name strip carries a larger centered **EMBER** label and has no extra right-side rail.
- Ember cycles among five approved expressions from line to line.
- Holding Space types at exactly 2× speed.
- A two-frame down triangle changes every 520 ms and appears only when another line remains.
- The Space keydown that closes a scene's final line is blocked until its matching keyup, preventing the same press from charging a jump.

When a dialogue line is delayed for a scripted poof or fly reveal, the previous sentence and portrait remain visible through the first typewriter tick of the replacement line. The panel therefore never flashes empty between the staged action and Ember's next sentence.

## Authored fly reveal lifecycle

Authored tutorial flies are created in a hidden, unarmed state. `armTutorialFlies()` reveals them at the same instant that `completePendingReset()` makes the frog visible and draws the poof-in cloud. This rule covers normal scene entries, dialogue-timed entries, three-catch retries and advances, and the dynamic wrong-fly follow-up.

Scene-specific timing includes:

- The dinner fly poofs in with the frog, then the prior sentence remains for another 500 ms before “Looks like dinner is ready!” starts.
- The tongue-range frog and target poof in before the distant-fly line.
- The mixed multi-fly frog and targets enter after “So why stop at one fly per jump?”
- The wall-turn target enters with the frog when “Then jump back…” begins.
- The three-fly route and every other authored target remain hidden until their matching poof-in.

Park animation continues while Ember speaks. Frog control, charging, tongue use, and trajectory previews remain locked. During a poof, the background continues while already-visible flies remain still.

## Prompt and goal visibility

The English term and Current Goal remain visually blank while controls are locked, during scene restarts, and through poof transitions. In the three-catch exercise, the term is hidden immediately after each correct catch and is not shown again until the next target fly appears.

Current Goal uses `{ x: 328, y: 234, w: 150, h: 33 }`, matching the normal TIME/JUMPS/BEST panel's y-level and height. A two-pixel gutter separates it from the 172-pixel vocabulary card. Compact trophy and text placement keep both goal lines inside the card.

## Wrong-fly teaching sequence

The wrong-fly scene is a three-stage exercise:

1. The player touches a nonmatching fly. It does not score and remains active after its spit-back.
2. After the frog lands and the skipped fly is active again, a poof transition preserves that fly and introduces a new matching fly.
3. Catching the new matching fly changes the English prompt to the skipped fly's vocabulary. The original fly is now correct, and the player must return and catch it before the lesson completes.

This demonstrates that a fly which is wrong for the current clue may become useful after a later correct catch updates the clue.

## Park geometry and exercise safety

Every normal and tutorial Park run uses one horizontally mirrored layout. The left low and middle platforms have exact right-side counterparts. Only the two center platforms share a vertical column. Park fly anchors are mirrored as well.

- Long-jump successes sparkle on landing.
- The first long-jump handoff starts at the normal Park position without a redundant poof.
- Three-catch successes hold the landing pose for 500 ms before the next poof; a miss retries only the active catch.
- The tongue target is raised into the upper gap and extends the engine's own `shouldStartSoloCriticalCatch` check so the standard Single Player slow motion, camera zoom, impact overlay, and sound sequence run unchanged.
- Quick and buffered platform drops restore the normal jump counters and do not consume tutorial attempts.
- Wall techniques set a pending success and continue real physics until the frog lands, preventing midair freezes.
- The mixed, mirrored two-match, and diagram-aligned three-match routes use authored reachable placements.

## Pause, achievements, and saves

Pause adds **Retry Scene** and **Skip Tutorial**. Continue restores `playing` directly with `countdownNumber` and `countdownTimer` set to zero.

During training, ordinary Solo and PvP achievement functions return without awarding anything. The only allowed unlock is `tutorial-graduate` (**RIBBIT READY**) after completion. The reversible playtest snapshot restores legitimate cloud progress, records, and unlock state before that permanent completion achievement is applied.
