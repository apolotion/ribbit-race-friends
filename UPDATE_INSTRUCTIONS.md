# Ribbit Race Friends 1.4.1 update

Build: `2026.10.10-friends-centered-labels-themed-book-1`  
Displayed version: `VERSION 1.4.1`

## Install

1. Extract the patch ZIP into the root of the existing `apolotion/ribbit-race-friends` repository.
2. Preserve `client/`, `public/`, `scripts/`, `src/`, and `tests/` exactly; do not upload an extra wrapper folder.
3. Commit directly to `main`. Suggested message:

   ```text
   Center Lake labels and theme the pause book
   ```

4. Let Cloudflare run:

   ```text
   npm run check && npm test
   npx wrangler deploy
   ```

5. Keep the existing `HUB`, `ROOMS`, and `ASSETS` bindings. Do not recreate Durable Objects.
6. Confirm `/api/health` reports:

   ```json
   {"build":"2026.10.10-friends-centered-labels-themed-book-1"}
   ```

7. Hard-refresh every test device.

## What changed

### Fly plates

The plate's horizontal center is now always the fly's stable anchor. The placement system does not consult HUD obstacles or clamp the plate sideways. When multiple plates compete for space, the system can move a newer plate upward only.

This intentionally permits a wide upper-right plate to overlap the pause-button area rather than appearing left of its fly.

### Pause button

The button's clickable rectangle is unchanged. Its running-state rendering is now 56% opaque; Sandbox uses 66%, and the already-paused state uses 84%.

### Themed How To Play book

The compact book icon and the open How To Play panel use the active frog's `dark`, `mid`, `light`, and `belly` colors. Custom Frog palettes are supported through the same selected-skin function.

### Replay storage repair

The previously added Fastest Time/Fewest Jumps replay UI now has matching SQLite storage and same-origin Worker routes. The table is created automatically inside the existing FriendsHub Durable Object.

## Rollback

Revert the Git commit and allow Cloudflare to redeploy. Do not delete Durable Objects to roll back a visual update.
