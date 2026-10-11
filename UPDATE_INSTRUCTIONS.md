# Ribbit Race Friends 1.5.0 update

Build: `2026.10.11-friends-mobile-experience-1`  
Displayed version: `VERSION 1.5.0`

## Install over the existing Friends Edition

This is an update to the existing `apolotion/ribbit-race-friends` GitHub repository and Cloudflare Worker. Do **not** create a second Worker, repository, `FriendsHub`, `FriendsRoom`, or database.

1. Choose a package:
   - Use the **patch ZIP** when the repository already contains `client/`, `public/`, `scripts/`, `src/`, and `tests/`.
   - Use the **complete repository ZIP** if any source, public asset, or build-script folder may be missing.
2. Extract the ZIP.
3. Copy the extracted **contents** into the root of `apolotion/ribbit-race-friends`, preserving every path. Do not upload the ZIP itself or an extra wrapper folder.
4. Confirm GitHub shows these directly at the repository root:

   ```text
   package.json
   wrangler.jsonc
   client/
   public/
   scripts/
   src/
   tests/
   ```

5. Commit directly to `main`. Suggested message:

   ```text
   Add iPhone app mode and reliable mobile touch controls
   ```

6. Let Cloudflare run:

   ```text
   npm run check && npm test
   npx wrangler deploy
   ```

7. Keep the current bindings:

   ```text
   HUB     → FriendsHub
   ROOMS   → FriendsRoom
   ASSETS  → public
   ```

8. Wait for `Success: Deploy command completed` and `Success! Build completed.`
9. Open `/api/health` on the deployed Worker and confirm:

   ```json
   {"build":"2026.10.11-friends-mobile-experience-1"}
   ```

10. Hard-refresh desktop browsers. On an iPhone Home Screen installation, close and reopen the app; remove and re-add the Home Screen icon only if Safari keeps an older cached shell.

## iPhone app-style installation

The login screen now includes **PLAYING ON MOBILE?**. On iPhone:

1. Open the game in Safari.
2. Tap Share.
3. Choose **Add to Home Screen**.
4. Tap Add.
5. Launch Ribbit Race from the new icon and rotate the phone sideways.

The installed Home Screen version uses the included web-app manifest, Apple mobile-web-app metadata, landscape orientation, safe-area handling, and dynamic viewport sizing. A normal Safari tab cannot remove all browser chrome; the Home Screen launch is the intended app-like mode.

## Mobile Mode controls

- The main menu now has an account/avatar button and a phone/computer button on the lower-left side.
- The phone/computer button asks for confirmation before changing modes.
- Enabling Mobile Mode repeats the iPhone Home Screen instructions.
- Single Player uses a hold-and-release jump meter.
- Human Local Versus uses independent **P1 JUMP** and **P2 JUMP** meters. Both can be held simultaneously without releasing the other player.
- Online Versus exposes only the local player's jump meter.
- A touch-tested pause button appears at the upper-right during Versus.
- Mobile instructions refer to tapping and jump meters rather than Space, WASD, or arrow keys.
- Mobile Mode hides the old corner account/fullscreen toolbar; the main-menu avatar opens saves, records, leaderboards, and sign-out controls.

## Performance changes

On coarse-touch/mobile devices the game renders at `960×540` instead of `1920×1080`, disables automatic record-video capture, throttles accessory monitoring loops, and limits physics catch-up work after a slow Safari frame. Core game physics and cloud protocols remain unchanged.

## Hat changes

- `hatstest` exposes the Hats feature without unlocking any individual hat.
- The no-hat choice is a dashed gray top-hat outline.
- Hat requirements begin from a post-unlock baseline and no longer require an online or human opponent.
- Requirements now use a broader set of default frog skins. See `HAT_REQUIREMENTS.md`.

## Rollback

Revert the Git commit and allow the same Cloudflare Worker to redeploy. Do not delete Durable Objects to roll back a client update.
