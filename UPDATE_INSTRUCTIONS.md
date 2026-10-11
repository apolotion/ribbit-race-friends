# Ribbit Race Friends 1.6.0 — installation

Build: `2026.10.11-friends-online-mobile-polish-1`

## Install

1. Back up the current `apolotion/ribbit-race-friends` repository.
2. Extract `Ribbit_Race_Friends_Online_Mobile_Polish_Update.zip`.
3. Copy the extracted **contents** into the repository root. Do not upload the ZIP itself and do not add an extra wrapper folder.
4. Confirm the repository root contains `package.json`, `wrangler.jsonc`, `client/`, `public/`, `scripts/`, `src/`, and `tests/`.
5. Commit to `main`, e.g. `Ribbit Race Friends 1.6.0 online and mobile polish`.
6. Wait for Cloudflare to run `npm run check && npm test`, then `npx wrangler deploy`.
7. Keep the existing bindings: `HUB → FriendsHub`, `ROOMS → FriendsRoom`, `ASSETS → public`. Do not recreate or delete Durable Objects.
8. Open `/api/health` and confirm build `2026.10.11-friends-online-mobile-polish-1`.
9. Hard-refresh desktop browsers. On iPhone, remove and re-add the Home Screen shortcut if iOS keeps the previous icon.

## Recommended production checks

- iPhone Home Screen icon and favicon.
- Release-based menu taps and simultaneous Local Versus hold/release controls.
- Countdown precharge.
- Quickplay layout and all online menu hover targets.
- Opponent name, remote jump audio, countdown beeps, and three-second CPU takeover interruption.
- Frog Tags opponent rows and archived replays.
- World Record previous-holder tooltip.
- Solo replay from run start through finish; non-record runs should be discarded.
- Guest → Create Account & Keep Save.
- Pause Reset spawn position and Fullscreen option/F shortcut.
- Buffered platform drop jump count and momentum.

## Browser limitation

A web page cannot display its own custom dialog after the user has already closed the tab. Guest mode therefore uses the browser's standard leave confirmation and preserves a pending guest save snapshot. The in-game account panel provides `CREATE ACCOUNT & KEEP SAVE` while the page is open.
