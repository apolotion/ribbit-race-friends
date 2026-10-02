# Ribbit Race — Friends Edition

Build: **2026.09.25-friends-1** · Standalone public Cloudflare installation

A complete fork of the Direct Connect 2 game, with independent public accounts, cloud saves, and server-relayed WebSocket multiplayer. This is a separate installation, **not an update to the school deployment**. All game HTML is in `public/index.html`; it is not a simplified remake.

**Start with `INSTALL.txt`.** Nothing in this package has been deployed to your Cloudflare or GitHub account. Test two real devices after your first deployment.

## What friends get

Anyone who has the public game link can open it without a Google account, school email, student ID, or class period. Players can create a username and keep a generated private save key, or play as temporary guests. The same username and key load a cloud save on another device. The key is displayed only when created or replaced; it acts as the account password. There is no email reset or recovery from the username alone.

The original solo/local modes, art, cosmetics, achievements, and simulation remain. Online uses the in-game Versus → Wi-Fi entry, private room codes, Ready buttons, Quickplay, delayed spectators, online display names, Battle Tags and level-five CPU replacement. Quickplay keeps best-of-three, 60-second Endless rounds, random stages and five-second round breaks. Saved records are visible in a Friends-wide leaderboard rather than a school-period leaderboard.

The initial vocabulary is the latest agreed **20 article-free classroom terms**. `src/vocabulary.json` belongs to this installation only. There is no connection to the school's Vocabulary sheet.

## Architecture and latency

```text
GitHub private repository
        │ source updates / Cloudflare Builds
        ▼
Cloudflare Worker ───────── public game, account pages, HTTPS API
        │
        ├── FriendsHub (SQLite Durable Object)
        │       accounts, sessions, saves, matchmaking, round barriers,
        │       audit/recovery snapshots, results, replays and history
        │
        └── FriendsRoom (one Durable Object per room/pair)
                Player A ⇄ authenticated WebSocket relay ⇄ Player B
```

The host's browser **still runs match physics**. The guest predicts locally, sends controls immediately, and receives current world snapshots through the relay. Cloudflare is the live transport and coordination server, not a headless server running both frogs. The build is intended for casual friends, not a cheat-proof competitive service.

There are no Google gameplay polls and no WebRTC/direct-LAN admission requirement. The room server uses the WebSocket Hibernation API, authenticates both room slots, separates match authority from the original host slot, checks frame size/rate/role/match identity, and keeps only one newest pending world update per slow recipient. That bounds obsolete state accumulation; it does not make TCP immune to packet loss or head-of-line blocking. The existing client prediction and approximately 30 Hz state delivery are retained.

The **SERVER … MS** display measures a round trip to the partner through the room relay. It is not a standalone ping to the nearest Cloudflare edge. Geography, the room's physical location, Wi-Fi, browser load, TCP loss, platform quotas and the host browser can still cause delay. No production latency was measured in this package's tests.

Cloudflare documents WebSockets for multiplayer coordination [1], full-stack static asset hosting [2], and regional Durable Object placement [3]. A room does not independently run beside both players worldwide.

## Account and save behavior

- Usernames: 3–20 letters/numbers/underscore/hyphen, case-insensitive for sign-in. Choose an alias, not a real name. Login usernames are immutable; the in-game online display name can be changed separately.
- Private key: 128 random bits, displayed as four groups of eight hexadecimal characters. The server stores a salted-by-account-ID SHA-256 hash, not the key. This is a high-entropy generated credential, not a user-chosen password or PIN.
- Browser sessions: HttpOnly, SameSite=Lax cookie; Secure on HTTPS; up to 30 days for saved accounts, six hours for guests. A local HTTP development cookie uses a separate name. School sessions are not imported.
- Cloud writes: revision checking, retry/merge on conflicts, preserved achievement/unlock unions, highest PvP/Endless values and lowest time/jump records. The recent online-match journal is protected from stale saves, and the separate award journal deduplicates result awards.
- Account management: export a JSON backup, replace a key, or delete the account at `account.html`. Key replacement/deletion require the current key and revoke other sessions. A backup is not a login key, and automatic backup import is not included.
- Guest sessions can play online but do not own a cloud save or a saved leaderboard result. Loading without the server permits local guest play only.

The application stores aliases, opaque IDs, progress, session hashes, credential hashes and game history. Rate limits use hashed network identifiers. Cloudflare can process connection metadata according to its own configuration/terms. Application request logging is disabled in the default configuration; do not add logging of keys, cookies, or full WebSocket URLs. The authenticated WebSocket URL contains a private room token.

Rooms can appear in delayed spectator listings. A “private room” is code-joined, not confidential. Deleting an account removes its own saved data/profile/rating/history; past opponents may retain their historical matchup entries. Temporary rooms/replays expire separately. There is no general chat feature.

## Public access, limits and cost

A private GitHub repository keeps the repository private, **not the game**. The deployed Worker has a public URL and can be reshared. This is not an invitation allowlist. The supplied defaults allow at most 500 saved accounts; guests are separate. Application limits include signup, sign-in, room creation, API, frame-rate and frame-size limits. They are not a complete bot-defense system or a spending cap.

For a small initial test, the SQLite-backed classes are eligible for Workers Free under Cloudflare's current rules. Free quotas include compute, requests and SQL reads/writes. Exceeding a free quota makes affected operations fail until reset; it does not guarantee uninterrupted free hosting. Workers Paid has a base charge plus metered usage. Active 30 Hz matches, control requests, replay writes, and repeated signups all count toward usage. Monitor the account's usage and billing before wider sharing. See official pricing [4,5].

`MAX_ACCOUNTS` and `ALLOW_REGISTRATION` are non-secret runtime variables in `wrangler.jsonc`. Set `ALLOW_REGISTRATION` to `"false"` to close new saved-account registration; that does **not** disable guests, existing accounts or all traffic. Review provider-level abuse protection before advertising the link broadly. No Turnstile or WAF rule is silently assumed to be installed.

## Maintenance

Change the Friends repository, commit to the connected production branch, and let Cloudflare build/deploy [6,7]. The old Google Sheet updater is not used here. Publish matching client/server changes together, stop active matches before a deployment, and have both players refresh afterward. Existing cloud records survive normal code updates under the same Worker/classes/bindings.

Keep `ribbit-race-friends`, `friends-main-v1`, `FriendsHub`, `FriendsRoom` and their migrations stable after launch. Renaming/removing namespaces or deleting the Worker can disconnect or destroy access to stored data. Do not point the build at school databases or import student records. For rollback, revert the Friends Git commit and redeploy; do not delete the database namespaces.

To change vocabulary, edit `src/vocabulary.json`, retaining an array of objects with `english` and `spanish` strings. Use 4–250 entries and no more than 80 characters per side. Commit, wait for deployment, and use Refresh Words or reload the game. The online API uses this JSON. The embedded offline fallback remains the release's original 20 words until `public/index.html` is also updated.

## Repository map

| File | Purpose |
|---|---|
| `public/index.html` | Entire current game, public cloud UI and live transport |
| `public/account.html`, `account.js` | Backup, key replacement and account deletion |
| `public/help.html` | Friend-facing instructions, key handling and privacy description |
| `public/_headers` | Static response security/cache headers |
| `src/index.js` | Public asset/API/WebSocket routing and same-origin checks |
| `src/hub.js` | Independent SQLite accounts, sessions, saves and matchmaking |
| `src/realtime.js` | Authenticated per-room WebSocket relay |
| `src/rooms-core.js` | Adapted current room/Quickplay/CPU/spectator lifecycle |
| `src/save-data.js` | Validated schema-2 save merges and leaderboard summaries |
| `src/common.js` | Small crypto, cookies, size checks and response helpers |
| `src/vocabulary.json` | Friends-only vocabulary |
| `wrangler.jsonc` | Worker, assets, SQLite classes/migrations and runtime defaults |
| `scripts/check.mjs` | Syntax and integration-presence checks |
| `tests/core.test.mjs` | Reproducible room/save/account-helper unit tests |
| `scripts/smoke.mjs` | Explicitly creates/deletes one test account against your URL |
| `TEST_REPORT.txt` | What was tested and what was not |

`npm run check` and `npm test` work with Node 22+ without downloading a runtime. `npm run dev` and `npm run deploy` require installation of the pinned Wrangler dependency. A lockfile was not generated here because dependency download was unavailable; `npm install` creates one on your machine. Commit that lockfile for reproducible dependency resolution. No license granting rights to third-party art has been added; review any external assets before broader distribution.

## Official references (checked September 25, 2026)

[1] https://developers.cloudflare.com/durable-objects/best-practices/websockets/
[2] https://developers.cloudflare.com/workers/static-assets/
[3] https://developers.cloudflare.com/durable-objects/reference/data-location/
[4] https://developers.cloudflare.com/durable-objects/platform/pricing/
[5] https://developers.cloudflare.com/workers/platform/pricing/
[6] https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/
[7] https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
[8] https://developers.cloudflare.com/workers/wrangler/install-and-update/
[9] https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories

Implementation details above describe this package. Provider pricing, limits and dashboard labels can change; the official references are the external basis for the platform setup.
