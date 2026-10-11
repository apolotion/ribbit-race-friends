# Engine Tutorial Notes — 1.7.6

The tutorial runs inside the real Park engine. It does not use a separate practice canvas.

## Dialogue

- Approved Ember close-up portraits are preloaded before first boot.
- Portraits use the black-and-cream frog, orange markings, orange patterned shirt, sunglasses, gold chain, and right-side placement.
- The small gameplay frog is never used as a portrait fallback.
- One dialogue line is displayed at a time and dynamically scaled to the available panel width.
- The final close input is consumed before gameplay resumes.

## Scenario spawning

- Authored flies remain hidden during dialogue.
- Closing the final dialogue line arms the flies at `spawnAge = 0` and plays the normal fly-spawn sound.
- Flies retain normal bobbing and horizontal hover movement after spawning.

## Failure reset

- Failure is detected immediately when the prerequisite is known to be missed.
- For the max-charge exercise, failure waits for landing so the jump can finish naturally.
- The frog poofs out and is hidden.
- The authored scenario resets 500 milliseconds later.
- A second smoke cloud and sound accompany the reappearance.
- The Current Goal panel flashes red instead of creating a separate failure banner.

## Park geometry

Quick Drop, Buffer Drop, and Double Buffer all use the original `PARK_PLATFORMS` geometry. Their flies use normal `PARK_FLY_SPAWNS` coordinates.

## Completion

The final lesson completes through Ribbit Race's ordinary Single Player win state. The normal victory message, dance, rounded pixel panel, buttons, and victory melody are shown. The reversible tutorial snapshot remains active until the player leaves the victory screen, then the legitimate save is restored and `RIBBIT READY` is awarded.
