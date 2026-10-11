# Ribbit Race Friends 1.4.0 update

Build: `2026.10.10-friends-mobile-replay-hats-1`  
Displayed version: `VERSION 1.4.0`

## Install
1. Extract the patch ZIP into the root of the existing `apolotion/ribbit-race-friends` repository.
2. Preserve `client/`, `public/`, `scripts/`, `src/`, and `tests/` exactly; do not upload an extra wrapper folder.
3. Commit to `main` and let Cloudflare run `npm run check && npm test`, then `npx wrangler deploy`.
4. Keep the existing HUB, ROOMS, and ASSETS bindings. Do not recreate Durable Objects.
5. Confirm `/api/health` reports `2026.10.10-friends-mobile-replay-hats-1` and hard-refresh every device.

## New systems
- **New World Record** notification with hover details and repeat suppression for an account already first in Most PvP Wins or Most Flies Eaten.
- Canvas-recorded replay storage for Fastest Time and Fewest Jumps. Click a corresponding leaderboard row to watch its available replay.
- Post-Hats baseline progression, thematic requirements, and `HATS UNLOCKED` / `HAT UNLOCKED` notifications.
- `apolotion` removed; `playtest` is the only unlock-all code. A persistent pre-playtest snapshot rolls back on normal exit, reload, tab close, or browser close.
- Default/custom palette copying, right-click and Cmd/Ctrl+C/V shortcuts, and commit-on-slot-switch behavior.
- Revised Custom Frog 3 target: 100 flies, 3 Versus wins, and wins on 3 different levels after the new progression baseline.
- Mobile Mode toggle and simultaneous independent local-PvP jump pads.
- Current selected skin preferred on Versus entry.
- Exact top-centered fly plates, including behind HUD/timer areas.
- Bonk validation requiring a falling upper frog or a rising lower opponent.

## Replay note
Record replay capture uses the browser MediaRecorder API. Older leaderboard records and browsers without canvas capture will show “Replay not available.” Replays are casual visual records, not tamper-proof verification.

- Fastest Time/Fewest Jumps leaderboard names receive a frog button; click it to request the stored run.
- Existing PvP achievement gates now accept either active human player index.

See `HAT_REQUIREMENTS.md` for the complete thematic progression table.
