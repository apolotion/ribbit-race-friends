# Ribbit Race Friends — Replay Setup and Troubleshooting

## Honest answer: is the replay system possible?

Yes. The project can record a desktop browser's game canvas as WebM video, upload a new personal-best recording, store it with the player's account, and play it in the in-game leaderboard window.

The important limitation is that the video does not exist retroactively. A leaderboard record created before replay capture was deployed cannot be reconstructed. That player must set a new personal best after the complete replay-enabled Worker build is live.

## Is a second replay server required?

No—not for the current design.

The same Cloudflare Worker that serves Ribbit Race already includes:

- `POST /api/replays/submit`
- `GET /api/replays/get`
- `GET /api/replays/health`

The routes use the existing `FriendsHub` Durable Object and its SQLite `record_replays` table. Recordings are keyed by immutable account ID, level, and metric (`time` or `jumps`). The leaderboard sends the account ID when available, avoiding display-name ambiguity.

## What you must deploy

Deploy the **entire project**, not only the `public/` directory. Preserve the existing `wrangler.jsonc` bindings:

- `HUB` → `FriendsHub`
- `ROOMS` → `FriendsRoom`
- `ASSETS` → `./public`
- the existing Durable Object migration

Use:

```bash
npm install
npm run check
npm test
npx wrangler deploy
```

No new binding, secret, `code.gs`, D1 database, R2 bucket, or separate video host is required.

## Confirm that the live replay backend is enabled

1. Deploy this complete project to the same domain as the game.
2. Sign in to a saved Friends account.
3. Open this path on that domain:

```text
/api/replays/health
```

A healthy signed-in response resembles:

```json
{
  "ok": true,
  "service": "record-replays",
  "storage": "durable-object-sqlite",
  "signedIn": true,
  "guest": false,
  "maxReplayBytes": 3900000
}
```

You may also run:

```bash
npm run smoke -- https://YOUR-GAME-DOMAIN
```

The smoke test creates a temporary account, verifies the replay service, and deletes the account afterward.

## How a PB video is created

A recording is uploaded only when all of these are true:

1. The player is signed in to a saved account. Guest runs are not uploaded.
2. The run occurs after this Worker build is deployed.
3. Desktop canvas capture and `MediaRecorder` WebM recording are supported.
4. Mobile performance mode is not active.
5. The run improves fastest time and/or fewest jumps for that level.
6. The recording stays below the size limit.

The client currently rejects recording blobs above roughly 2.8 MB. The Worker accepts encoded replay data up to roughly 3.9 MB.

## End-to-end test

1. Deploy the complete project.
2. Hard-refresh the browser.
3. Sign in on desktop Chrome.
4. Play a Solo level and set a new fastest-time or fewest-jumps PB.
5. Remain on the result screen for several seconds while the recorder stops and uploads.
6. Open Achievements → Leaderboard.
7. Select the same metric and level.
8. Click the player's rendered frog/name or replay icon.

The new replay window should open with normal video controls, a close button, and Play From Start.

## Error meanings

### “Replay server unreachable”
The domain is likely serving an older Worker, a static-only deployment, or a deployment without the existing `HUB` Durable Object binding. Re-uploading only `public/` will not install the replay routes.

### “Sign in to watch replays”
The browser does not currently have a valid Friends session cookie for that game domain.

### “No video for this PB”
The record predates replay capture, the player's run was not a new PB, recording was unsupported, the video exceeded the limit, or the upload did not complete.

### The leaderboard shows the player but playback finds the wrong account
Polish 19 sends the immutable account ID and login username in the leaderboard response. Both the Worker and browser files from this ZIP must be deployed together.

## When a separate video host would make sense

A separate storage service such as R2 would only become useful if you later want many long recordings, permanent replay history rather than one PB per metric, or videos substantially larger than the current limits. It is not required to make the present PB replay system work.

## What cannot be verified in this container

The source, Worker routes, database table, client upload flow, account-ID lookup, video window, and automated tests are included. A real upload/download against your production Cloudflare account still has to be verified after deployment because this environment cannot access your authenticated live account.
