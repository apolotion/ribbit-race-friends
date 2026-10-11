# Ribbit Race Friends 1.7.2 — Test Report

Build: `2026.10.11-friends-engine-tutorial-2`

## Automated project pipeline

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `node scripts/check.mjs` | PASS |
| `npm run check` | PASS |
| `npm test` | PASS — 121/121 |
| Game bundle module count | 13 |
| Required public assets | 21 |

The automated checks cover the existing Friends server, PIN accounts, saves, Quickplay, spectators, mobile controls, records/replays, hats, collisions, fly labels, and the new tutorial behavior.

## Tutorial-specific checks

- The tutorial source selects `park` and invokes the normal `resetGame(true)` path.
- The former `rr170-tutorial-shell`, isolated tutorial canvas, and floating tutorial buttons are absent.
- The floating Live Matches button is absent; the normal in-canvas Spectate flow remains.
- Scenario definitions cover charged jumps, automatic catches, wrong-fly spit-back, wall turns, wall rebound catches, quick drops, buffered drops, two-fly arcs, and a normal five-fly round.
- The tutorial invokes the reversible playtest snapshot lifecycle.
- CSS explicitly hides overlay buttons carrying the `hidden` attribute, preventing inactive account/device/medal controls from appearing over the tutorial.

## Browser runtime check

The final production HTML/CSS/scripts were assembled into a self-contained Chromium test page with test-only storage and same-origin API adapters.

Observed state after entering as a guest:

```json
{
  "tutorialActive": true,
  "tutorialKind": "solo",
  "tutorialStep": 0,
  "gameState": "playing",
  "mode": "solo",
  "level": "park",
  "oldTutorialPopupPresent": false,
  "floatingSoloTutorialButtonPresent": false,
  "floatingPvpTutorialButtonPresent": false,
  "floatingLiveMatchesButtonPresent": false,
  "accountButtonHidden": true,
  "deviceButtonHidden": true,
  "achievementMedalHidden": true,
  "javascriptPageErrors": 0
}
```

See `PREVIEWS/Tutorial_Engine_Park.png` for the rendered first scenario.

## Limits

- No deployment to the user’s Cloudflare account was performed.
- The test API and storage were local adapters; live Durable Object storage and production WebSocket traffic were not modified.
- The full sequence still needs one manual playthrough after deployment, particularly on iPhone and a classroom touchscreen.
