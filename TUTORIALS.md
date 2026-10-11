# Engine Tutorial Design

Ribbit Race Friends 1.7.2 no longer uses an isolated practice popup. Tutorial scenarios run inside the same Park engine used by normal play.

## Single Player sequence

1. **Welcome to Ribbit Race** — make one jump.
2. **Match the term** — catch the Spanish fly matching the English prompt.
3. **Charge a full jump** — hold until the jump reaches full charge.
4. **Automatic catch range** — catch with the body or tongue while in range.
5. **Wrong flies are safe** — intentionally catch a wrong fly and see it spat back out.
6. **Turn around with a wall** — use a wall collision to reach a fly behind the frog.
7. **Rebound catch** — turn at the wall and catch the fly during the same jump.
8. **Quick platform drop** — tap jump quickly from a platform and catch the fly below.
9. **Buffered platform drop** — charge toward a platform and tap just before landing to pass through.
10. **Two flies in one arc** — catch two consecutive matching flies before landing.
11. **Final practice round** — complete a normal five-fly Park round.

Each authored scenario uses the actual game objects and resets after a failed requirement.

## PvP engine sequence

The same controller contains a real-engine Park PvP tutorial for forced/manual testing:

1. Charged-jump introduction.
2. Falling bonk from above.
3. Higher sky bonk.
4. Wait for stun recovery, then bonk again.
5. Horizontal rebound.
6. Offensive rebound into a fly catch.

No floating tutorial button is shown. A test can be started with `?tutorial=pvp`.

## Save and leaderboard isolation

Starting a tutorial enters the existing reversible playtest snapshot system. On completion or exit, Ribbit Race restores the pre-tutorial storage/runtime snapshot and ends the playtest session. Tutorial catches, jumps, records, unlocks, achievements, and settings are not intended to overwrite the legitimate cloud save.

## First-boot behavior

The new tutorial uses a new completion key:

```text
rrFriendsEngineTutorialSoloSeenV2
```

This means an existing browser may see the corrected real-engine tutorial once even if it completed the older popup version. Once completed, it no longer opens automatically on that browser/profile.
