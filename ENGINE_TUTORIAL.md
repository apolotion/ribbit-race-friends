# Ribbit Race Friends 1.7.8 — Tutorial Polish

## Runtime design

The tutorial runs inside the real Park engine rather than a detached practice canvas. It wraps the existing jump, update, catch, render, input, pause, and victory functions only while the tutorial is active.

## Entry and authentication

First-boot startup waits for a valid signed-in or guest profile and for the complete login boundary to release: the cloud gate must be hidden, the page must no longer be auth-locked, the game frame must be interactive, and the input lock must be cleared. The tutorial therefore cannot skip the login/create/guest screen.

## Ember dialogue

- Five approved Ember portraits preload before the lesson starts.
- Ember changes expression from sentence to sentence, including within one scene.
- The compact top panel uses a thin two-pixel cyan frame and a symmetrical portrait box.
- The orange **EMBER** name plate is larger and centered.
- Dialogue uses one consistent text scale, centered vertically and horizontally, with up to two wrapped lines.
- Holding Space makes the typewriter run at exactly double speed. A quick tap still reveals or advances text.
- A two-frame down triangle appears only when another sentence remains. The final line has no control label and no triangle.

## Live-world dialogue

The Park sky, scenery clock, particles, and already-authored flies continue updating while Ember speaks. Only frog movement and jump charging are locked. The first matching fly poofs in before “Looks like dinner is ready,” and the fly-label and English-clue references flash during their matching explanations.

## Scene lifecycle

1. Configure the exact original Park platforms, normal start position, prompt, and authored flies.
2. Preserve the frog’s completed pose while the next Ember dialogue plays.
3. Poof the frog out, wait exactly 500 ms, apply the intended setup, start any needed fly spawn animation, and poof the frog back in.
4. Keep the background running during the transition while existing flies remain still.
5. On failure, retry only the relevant setup. In the three-catch lesson, completed catches remain completed and only the missed fly is replayed.

## Lesson-specific fixes

- Every successful long-jump landing uses the normal fly-catch sparkle and success sound.
- The tongue-range lesson begins on Park’s lower-left platform and uses the stock final-catch slow-motion camera and zoom.
- Multi-fly targets use reachable Park-aligned placements, including a second fly above the middle platform.
- The exact original Park platform geometry is restored for every tutorial scene.
- The frog remains frozen after success until the scripted poof transition.
- The trajectory preview is suppressed during dialogue and poofs.

## HUD and pause

- Current Goal copy is centered across the complete card instead of being offset by the trophy.
- Hovering Current Goal opens a main-menu-style **HOW TO** panel with the exact input needed for that objective.
- Pause works normally during the tutorial.
- The pause menu provides **RETRY SCENE** and **SKIP TUTORIAL**.

## Save safety

The tutorial uses the reversible Playtest snapshot lifecycle. Temporary tutorial catches, jumps, records, and unlocks are discarded when the tutorial ends. Legitimate progress is restored before the permanent **RIBBIT READY** completion achievement is applied.
