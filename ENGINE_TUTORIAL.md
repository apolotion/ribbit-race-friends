# Ribbit Race Friends 1.7.7 — Scripted Tutorial

## Runtime design

The tutorial runs inside the real Park engine rather than in a detached practice canvas. It wraps the existing jump, update, catch, render, input, and victory functions while the tutorial is active.

## Entry and authentication

First-boot tutorial startup waits until the player has signed in, created an account, or explicitly entered guest mode. The `rr-authenticated` event arms the startup check. The login page is never dismissed merely to start the tutorial.

## Dialogue

- Ember’s five approved portrait assets preload before tutorial startup.
- The dialogue box fits between the fly counter and Pause corner.
- One sentence is shown at a time with a 28 ms-per-character typewriter effect.
- Pressing Space/Enter once during typing reveals the complete sentence; the next press advances.
- The final press closes the dialogue, is consumed, and waits for key release before gameplay charging can begin.
- Mobile uses tap-and-release with the same reveal/advance behavior.

## Scenario lifecycle

1. Configure the real Park platforms, player start, prompt, and authored flies.
2. Keep authored flies hidden while Ember speaks.
3. Close the final dialogue line.
4. Arm flies at `spawnAge = 0` so the normal grow/sparkle animation plays.
5. Monitor real engine events until the exercise passes or fails.
6. On failure, clear the tongue and afterimages, poof out, wait 500 ms, restore, and poof in.
7. Move directly to the next Ember conversation without a separate “Nice work” banner.

## HUD and visual safeguards

- Tutorial Pause input is intercepted.
- The Current Goal panel replaces Time/Jumps/Best and remains present through dialogue transitions.
- Failure feedback is a smooth red pulse/fade in the Current Goal panel.
- A hidden frog stays at a valid world coordinate; it is not teleported far offscreen, preventing direction arrows.
- The dialogue panel uses an even light-blue border and no scrollbar/arrow affordance.

## Save safety

The tutorial enters the reversible Playtest snapshot lifecycle. Temporary tutorial catches, jumps, records, and unlocks are discarded when the tutorial ends. The legitimate state is restored before the permanent **RIBBIT READY** completion achievement is applied.
