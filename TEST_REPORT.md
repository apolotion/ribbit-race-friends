# Ribbit Race Friends 1.7.0 — Test Report

Build: `2026.10.11-friends-tutorial-spectator-polish-1`

## Automated pipeline

| Check | Result |
|---|---|
| JavaScript syntax scan | PASS |
| `npm run build` | PASS |
| `node scripts/check.mjs` | PASS |
| `npm run check` final | PASS |
| `npm test` final | FAIL |

Node test summary:
- Tests: 119
- Passed: 105
- Failed: 14

## Covered by automated source/runtime assertions

- modular game bundle and new v1.7 assets
- centered account modal and removal of the old corner account control
- release-based mobile controls and independent left/right pointer ownership
- mobile/desktop Versus Pause controls
- achievement leaderboard shortcut
- first-run Single Player tutorial and Versus tutorial content
- Close Call local-player ownership guard
- duplicate catch/super-catch idempotency guard
- real-time hat evaluation and Lake/Beanie fallback
- private plus Quickplay live-match discovery
- spectator palette preservation, trajectory overlay, player-name meters, and round overlay
- main-menu account/device controls and centered tooltips

## Manual production checks still required

- real iPhone Safari/Home Screen multi-touch and audio
- two physical clients plus a third spectator
- Cloudflare live-match heartbeat storage
- custom-frog spectator appearance across accounts
- CPU takeover and immediate requeue
- actual latency/jitter across different networks
- the supplied Close Call, standing-bonk, spectator-path, and super-catch scenarios

No deployment to the user's Cloudflare account was performed.
