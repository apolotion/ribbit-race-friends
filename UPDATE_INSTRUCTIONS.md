# Ribbit Race Friends 1.7.2 — Engine Tutorial Update

Build: `2026.10.11-friends-engine-tutorial-2`

## What this update changes

- The first-boot tutorial now starts directly inside the real Park level.
- Tutorial tasks use the normal Ribbit Race frog, flies, tongue, collisions, platforms, HUD, pause system, and physics.
- Each task has a pass/fail check and resets its authored scenario when the required action is missed.
- The previous separate tutorial popup/practice canvas has been removed.
- The former left-side floating tutorial/account/device controls are hidden while a tutorial is active.
- The floating middle Live Matches control has been removed. Spectating remains available through the normal Online → Spectate menu.
- Tutorial activity runs through the reversible playtest snapshot system so it cannot replace the player’s legitimate cloud progress or leaderboard records.

## Install over the existing GitHub repository

Use the complete repository ZIP if the repository has ever reported a missing file. Use the patch ZIP only when all modular folders already exist.

1. Extract the selected ZIP.
2. Copy the extracted **contents** into the root of `apolotion/ribbit-race-friends`.
3. Confirm GitHub directly shows:

   ```text
   package.json
   wrangler.jsonc
   client/
   public/
   scripts/
   src/
   tests/
   ```

4. Commit directly to `main`, for example:

   ```text
   Replace popup tutorial with real Park engine scenarios
   ```

5. Keep the existing Cloudflare settings:

   ```text
   Build command:  npm run check && npm test
   Deploy command: npx wrangler deploy
   Root directory: /
   ```

6. Keep the current bindings:

   ```text
   HUB     → FriendsHub
   ROOMS   → FriendsRoom
   ASSETS  → public
   ```

7. Do not create, delete, or replace either Durable Object.
8. Wait for the Cloudflare build and deployment to finish.
9. Open `/api/health` and confirm the build is:

   ```text
   2026.10.11-friends-engine-tutorial-2
   ```

10. Hard-refresh desktop browsers. Fully close and reopen the iPhone Home Screen app.

## Expected build result

```text
Built game bundle from 13 modules
Server and browser modules parse; 21 external assets are present
121 tests
121 passed
0 failed
Success: Deploy command completed
Success! Build completed.
```

## Testing the tutorial

A browser/profile that has not completed the new tutorial starts it automatically after entering the game.

The tutorial should:

- immediately open the real Park level;
- show a compact tutorial instruction panel over the actual game;
- show no separate tutorial popup window;
- show no floating left-side account/device/tutorial buttons;
- show no floating Live Matches button;
- preserve the normal Pause control;
- restore the player’s legitimate save state when the tutorial ends or is abandoned.

For a deliberate retest without adding another visible menu button, use:

```text
?tutorial=solo
```

or:

```text
?tutorial=pvp
```

at the end of the deployed game URL.
