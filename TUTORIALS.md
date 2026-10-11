# Tutorial Overview — Ribbit Race Friends 1.7.9

The first-boot Single Player tutorial starts only after account authentication or **Play Without Saving** and runs in the real Park engine without flashing the main menu first.

## Presentation and controls

- Ember uses a large bright Pokémon-style textbox and changes expression between dialogue lines.
- Text is centered at one consistent size and may wrap to a second line.
- Hold Space for 2× typing speed. Tap Space or Enter to reveal/advance; touch uses tap-and-release.
- The continue triangle alternates slowly between two frames only when more dialogue remains.
- Closing a scene's final line consumes that physical Space press, so gameplay begins only on the next press.
- Pause offers **Continue**, **Retry Scene**, and **Skip Tutorial**; Continue has no 3-2-1 countdown.
- The term and Current Goal remain blank whenever controls are locked.

## Lessons

1. Welcome and objective.
2. Three consecutive 90%-plus charged jumps, each confirmed by a landing sparkle.
3. Three matching catches, one per jump; each correct landing pauses for 0.5 seconds and a miss retries only that catch.
4. A tongue-range catch from the exact center of the lower-left platform, using the normal final-catch slow-motion zoom.
5. Wrong-fly spit-back.
6. One correct plus one wrong fly in a jump; the clue changes after the match so the second fly must be spat out.
7. Two correct flies from the mirrored opposite-side setup.
8. Three correct flies along the diagram-aligned left-platform-to-right-side route.
9. Wall turn within two actual jumps; platform-drop buffers do not count.
10. One-jump rebound catch, with success finalized only after landing.
11. Quick platform drop.
12. Buffered platform drop.
13. Double buffered drop with three catches.
14. Normal five-fly Park round with the standard TIME/JUMPS/BEST footer and victory flow.

Park uses the same horizontally mirrored geometry in training and normal play. Scene transitions use a frog poof-out, an exact 500 ms gap, and a timed poof-in while the background continues. Ordinary achievements are disabled during training; completion awards **RIBBIT READY** after legitimate save state has been restored.
