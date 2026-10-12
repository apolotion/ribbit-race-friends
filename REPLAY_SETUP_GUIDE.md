# Ribbit Race Friends — Replay Setup and Troubleshooting

## Is another replay server required?

No. This build already stores personal-best replay videos through the same Cloudflare Worker used by the Friends game.

The Worker routes `/api/replays/submit`, `/api/replays/get`, and `/api/replays/health` to the `FriendsHub` Durable Object. `FriendsHub` creates its own SQLite `record_replays` table and keeps one current recording per signed-in player, level, and ranked category (`time` and `jumps`).

## What must be deployed

Deploy the complete project as a Worker, not as static files only. Preserve the existing bindings in `wrangler.jsonc`:

- `HUB` → `FriendsHub`
- `ROOMS` → `FriendsRoom`
- `ASSETS` → `./public`
- the existing Durable Object migration

Use the normal commands:

```bash
npm install
npm run check
npm test
npx wrangler deploy
```

No new binding, database, secret, or separate video host is required for this replay implementation.

## How to confirm the replay backend is live

After deployment, sign in to the game and open this same-origin path in the browser:

```text
/api/replays/health
```

A working signed-in response should include values equivalent to:

```json
{
  "ok": true,
  "service": "record-replays",
  "storage": "durable-object-sqlite",
  "signedIn": true,
  "guest": false
}
```

You can also run the included production smoke test:

```bash
npm run smoke -- https://YOUR-GAME-DOMAIN
```

The smoke test creates and deletes a temporary account and now verifies that the replay service is reachable through the authenticated Worker session.

## When a replay is recorded

A leaderboard replay is created only when all of the following are true:

1. The player is signed into a saved Friends account. Guest sessions do not upload recordings.
2. The run is played after this replay-enabled Worker build is deployed.
3. The browser supports canvas capture and `MediaRecorder` WebM recording.
4. Mobile performance mode is not active.
5. The run improves the player’s personal best for fastest time and/or fewest jumps.
6. The encoded recording remains under the configured upload limit.

The client currently limits its recording blob to about 2.8 MB before upload. The Worker accepts replay payload data up to about 3.9 MB.

## Why older leaderboard rows may say no replay is available

Old personal bests cannot be reconstructed retroactively. A player must set a new personal best after replay capture is live. The new recording then replaces that player’s previous recording for the matching level and category.

## Error meanings

- **Replay server unreachable / Worker route unavailable:** the public domain is still serving an older Worker, a static-only deployment, or a deployment missing the existing `HUB` binding.
- **Sign in to watch replays:** the browser does not have a valid Friends session cookie.
- **This record has no saved video:** the record predates replay capture, the recording exceeded the limit, or the upload did not finish.
- **Replay upload skipped:** inspect the browser console for the Worker’s returned message and HTTP status.

## Fast end-to-end test

1. Deploy this complete project.
2. Hard-refresh the game.
3. Sign in to a saved account in desktop Chrome.
4. Play a Solo level and set a new fastest-time or fewest-jumps personal best.
5. Wait several seconds after the result screen for recording finalization and upload.
6. Open the in-game leaderboard, choose the same level/category, and click the player name or replay control.

A second video server is therefore not needed to make replays work in this build. The first step is ensuring the current Worker—not only the updated browser assets—is deployed to the same domain as the game.
