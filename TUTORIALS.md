# Tutorial Overview — Ribbit Race Friends 1.7.10

The first-boot Single Player tutorial starts only after account authentication or **Play Without Saving** and runs in the real Park engine without flashing the main menu first.

## Presentation and controls

- Ember uses the compact approved dark-blue dialogue box with thin cyan outlines and a matching square portrait frame.
- Dialogue uses larger, left-aligned text. Wrapped lines return to the same left edge.
- Ember changes expression between dialogue lines.
- Hold Space for 2× typing speed. Tap Space or Enter to reveal or advance; touch uses tap-and-release.
- The continue triangle alternates slowly between two frames only when more dialogue remains.
- Closing a scene's final line consumes that physical Space press, so gameplay begins only on the next press.
- Pause offers **Continue**, **Retry Scene**, and **Skip Tutorial**; Continue has no 3-2-1 countdown.
- The term and Current Goal remain blank whenever controls are locked.
- Authored flies reveal with their matching frog poof-ins rather than appearing at scene start.

## Lessons

1. Welcome and objective.
2. Three consecutive 90%-plus charged jumps, each confirmed by a landing sparkle. The first control handoff has no unnecessary poof.
3. Three matching catches, one per jump. Each correct landing pauses for 0.5 seconds, the term stays blank until the next target poofs in, and a miss retries only that catch.
4. A tongue-range catch from the exact center of the lower-left platform to a high target, using the normal final-catch slow-motion zoom.
5. Wrong-fly sequence: touch a nonmatch, preserve it, catch a newly spawned correct fly, let the clue update, then return for the original fly after it becomes correct.
6. One correct plus one wrong fly in a jump; the clue changes after the match so the second fly must be spat out.
7. Two correct flies from the mirrored opposite-side setup.
8. Three correct flies along the diagram-aligned left-platform-to-right-side route.
9. Wall turn within two actual jumps; the target appears with the scripted “Then jump back…” poof and platform-drop buffers do not count.
10. One-jump rebound catch, with success finalized only after landing.
11. Quick platform drop.
12. Buffered platform drop.
13. Double buffered drop with three catches.
14. Normal five-fly Park round with the standard TIME/JUMPS/BEST footer and victory flow.

Park uses the same horizontally mirrored geometry in training and normal play. Scene transitions use a frog poof-out, an exact 500 ms gap, and a timed poof-in while the background continues. Ordinary achievements are disabled during training; completion awards **RIBBIT READY** after legitimate save state has been restored.
