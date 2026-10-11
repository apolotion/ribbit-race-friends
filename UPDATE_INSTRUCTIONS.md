# Ribbit Race Friends 1.7.5 — Tutorial Refinement

Build: `2026.10.11-friends-tutorial-refinement-1`

## Changes

- The Park tutorial now auto-starts the first time a player enters the game on that browser/profile.
- A new V5 first-boot marker ensures the corrected tutorial is shown once even if an older tutorial version was completed.
- Ember’s five tutorial portraits are horizontally mirrored and remain on the right side of the compact dialogue panel.
- The dialogue panel is smaller, uses more proportional text, and sits at the top of the game.
- The first dialogue is drawn immediately when the tutorial starts.
- Ember is no longer rendered as a second frog inside the playable Park arena.
- Tutorial flies use the normal fly hover/bob animation instead of being frozen.
- Failed one-attempt scenarios immediately teleport the frog back with an out-and-in pixel smoke effect.
- The tongue lesson uses a fly outside normal body-contact jump range and only passes after a tongue catch.
- The wrong-fly lesson requires catching the wrong fly and then the correct fly during the same jump.
- The wall-turn lesson permits two jumps: one to turn at the wall and one to catch the fly.
- The rebound and quick-drop scenarios remain one-attempt checks.

## Install

1. Back up the current `apolotion/ribbit-race-friends` repository.
2. Extract the complete update ZIP.
3. Copy the extracted contents into the repository root, preserving all folders.
4. Confirm these paths remain directly at the root:

   ```text
   package.json
   wrangler.jsonc
   client/
   public/
   scripts/
   src/
   tests/
   ```

5. Commit to `main`, for example:

   ```text
   Refine first-boot tutorial scenarios and Ember dialogue
   ```

6. Keep the existing Cloudflare configuration:

   ```text
   Build command:  npm run check && npm test
   Deploy command: npx wrangler deploy
   Root directory: /
   ```

7. Keep the existing bindings and Durable Objects:

   ```text
   HUB     → FriendsHub
   ROOMS   → FriendsRoom
   ASSETS  → public
   ```

8. After deployment, confirm `/api/health` reports:

   ```text
   2026.10.11-friends-tutorial-refinement-1
   ```

9. Hard-refresh desktop browsers. Fully close and reopen the iPhone Home Screen app.

To deliberately retest the tutorial, use `?tutorial=solo` on the deployed URL.
