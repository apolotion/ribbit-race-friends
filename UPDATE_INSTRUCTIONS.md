# Ribbit Race Friends Edition — Single Player word stability

Build: `2026.10.09-friends-stable-word-labels-1`

## What changed

- Fly word plates now keep a persistent placement for each fly instead of recomputing their position every animation frame.
- New flies choose an open label location around labels already on screen; existing labels do not jump when another fly appears or disappears.
- Removed the fractional duplicate text pass from fly vocabulary labels and the Single Player prompt to prevent subpixel shimmer when the high-resolution canvas is rescaled.
- Existing PIN login, logout lock, 30-second Quickplay verification, Local Play routing, Versus hover tooltip, saves, and vocabulary are unchanged.

## Update the live Cloudflare Friends Edition

Use the existing GitHub repository and Cloudflare Worker. Do **not** create a new Worker, FriendsHub, FriendsRoom, or database.

Replace these files in `apolotion/ribbit-race-friends`:

- `public/index.html`
- `src/common.js`
- `tests/friends-patch.test.mjs`

Then commit directly to `main`, for example:

`Fix Single Player word label jitter`

Cloudflare should automatically run:

`npm run check && npm test`

and then:

`npx wrangler deploy`

Wait for the build/deploy to succeed, then hard-refresh the game.

## Quick verification

1. Open Single Player and start Park.
2. Watch all visible word plates for at least 15 seconds as flies bob and additional flies spawn.
3. Catch one fly and wait for its replacement. Existing word plates should remain in the same location.
4. Pause and resume. Labels should remain stable.
5. Confirm the vocabulary is still the current 15-word list.

No Durable Object reset or account migration is required.
