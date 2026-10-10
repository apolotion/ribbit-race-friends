# Ribbit Race Friends Edition — online word stability + Quickplay status layout

Build: `2026.10.09-friends-online-word-stability-1`

## What changed

1. **Online/Quickplay vocabulary labels no longer reflow between snapshots.** Each fly/word/round keeps one screen-space word-plate rectangle even when the guest rebuilds fly objects from authoritative WebSocket snapshots or receives tiny anchor differences.
2. **Quickplay status text is centered inside PLAY WHILE WAITING.** The two-line label is vertically centered as one group inside a taller button, and CANCEL is moved down slightly for clearance.
3. Existing behavior is preserved: 4-digit PIN accounts, 100,000-round PBKDF2, pure-login logout lock, 15-word vocabulary, 30-second Quickplay partner check, failed-connect Local Play routing, Versus hover tooltip, Cloudflare saves, Quickplay, spectators, and CPU takeover.

## Deploy to your existing GitHub/Cloudflare installation

Do **not** create a new Worker, repository, FriendsHub, or FriendsRoom.

Replace these files in `apolotion/ribbit-race-friends`:

```text
public/index.html
src/common.js
tests/friends-patch.test.mjs
```

Commit directly to `main`, for example:

```text
Fix online word jitter and Quickplay status alignment
```

Cloudflare should automatically run:

```text
npm run check && npm test
npx wrangler deploy
```

Wait for `Success! Build completed`, then hard-refresh both players before testing.

## Test

1. Start a private online match and a Quickplay match.
2. Watch several fly labels on the guest screen for at least 20 seconds. Existing labels should stay fixed even as new snapshots arrive.
3. In the Quickplay queue, confirm `DEVICE CHECK PASSED - PARTNER LINK NOT YET TESTED` is fully inside and centered under `PLAY WHILE WAITING`.
4. Confirm the connection check still ends at 30 seconds if a matched partner cannot finish verification.
