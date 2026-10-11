# Ribbit Race Friends 1.7.5 — Ember Dialogue Tutorial

Build: `2026.10.11-friends-tutorial-refinement-1`

The tutorial runs inside the normal Park engine. It does not use a separate popup minigame.

## Conversation-to-practice loop

Each scenario follows this exact sequence:

1. Park is reset into the authored exercise layout.
2. The simulation freezes and Ember speaks from a right-sided portrait panel.
3. Pressing **Space** or **Enter**—or tapping and releasing on mobile—closes the conversation.
4. The closing input is consumed, so Space cannot also start a jump.
5. The simulation resumes and the player attempts the current goal.
6. Success advances to the next exercise and opens the next Ember conversation.
7. A failed one-attempt exercise resets in place without repeatedly replaying the speech.

See `EMBER_DIALOGUE_SCRIPT.md` for the exact conversation and portrait expression used at every step.

## Presentation

- Ember is the black-and-cream frog with orange markings.
- Close-up Ember portraits retain the orange patterned shirt, sunglasses, gold chain, and expressive hand poses.
- The portrait and Ember nameplate appear on the right side of the panel.
- The panel is dark teal with bright cyan pixel borders and a speech notch pointing toward Ember.
- The lower-right normal Time/Jumps/Best panel is replaced by the current tutorial goal after the dialogue closes.
- The normal Hold Space instruction bubble is suppressed during tutorial play.
- Pause, Escape, and the onscreen Pause control cannot open the Pause menu during the tutorial.
- Authored flies remain fixed at their lesson positions and their word cards remain centered above them.

## Single Player sequence

1. Welcome — make one normal jump.
2. Match the term — catch the Spanish fly matching the English term.
3. Full jump — max-charge and catch the authored fly in one attempt.
4. Catch range — use the normal body or tongue range.
5. Wrong fly — observe normal spit-back behavior.
6. Wall turn — pass the fly, touch the right wall, turn, and catch it.
7. Rebound catch — complete the catch in one wall-rebound jump.
8. Quick platform drop — drop through and catch the fly in one attempt.
9. Buffered drop — charge to the top platform, buffer through it, and catch the fly below.
10. Double buffer — pass through two platforms and catch three sequential flies.
11. Two flies in one arc — catch two terms during one jump.
12. Final practice — complete a normal five-fly Park round.

## Completion

The final practice round opens a normal-style congratulations screen and awards:

```text
RIBBIT READY
Complete the Park Tutorial
```

## Save isolation

Tutorial play uses the reversible Playtest snapshot lifecycle. Temporary tutorial catches, jumps, resets, and authored records do not replace the legitimate cloud save. The pre-tutorial state is restored before the permanent completion achievement is awarded.

## First-boot and retest behavior

The updated tutorial uses:

```text
rrFriendsEngineTutorialSoloSeenV4
```

To deliberately retest it, append:

```text
?tutorial=solo
```

The checked PvP tutorial remains available for testing through:

```text
?tutorial=pvp
```
