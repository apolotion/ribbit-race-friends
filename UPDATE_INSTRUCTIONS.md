# Ribbit Race Friends 1.3.0 — update instructions

Build: `2026.10.10-friends-visual-polish-1`

This updates the existing GitHub-connected Cloudflare Friends Edition. It does not create a new installation.

## Install the patch

1. Back up the current `apolotion/ribbit-race-friends` repository or note the current working commit.
2. Extract `Ribbit_Race_Friends_Visual_Polish_Patch.zip`.
3. Copy the extracted contents into the **root** of the existing repository, preserving every path and replacing matching files.
4. Confirm that examples such as these are directly under the repository root:

   ```text
   client/game/70-rendering.js
   public/scripts/cloud-client.js
   public/scripts/game.bundle.js
   src/common.js
   tests/friends-patch.test.mjs
   package.json
   ```

   Do not upload the patch ZIP itself or add an extra parent folder.
5. Commit directly to `main`. Suggested message:

   ```text
   Polish achievements, fly labels, Final Catch, custom frogs and Sandbox
   ```
6. Wait for the existing Cloudflare Git build to run:

   ```text
   npm run check && npm test
   npx wrangler deploy
   ```
7. Confirm the build log reports all 59 tests passing and a successful Wrangler deployment.
8. Open:

   ```text
   https://ribbit-race-friends.apolotion.workers.dev/api/health
   ```

   Confirm:

   ```json
   {
     "build": "2026.10.10-friends-visual-polish-1"
   }
   ```
9. Hard-refresh the game on each test device.

## Keep the existing infrastructure

Do not create or delete the Worker, repository, `FriendsHub`, `FriendsRoom`, or SQLite Durable Object namespaces. No database migration or account reset is required.

## Post-deployment checks

- Put a fly or word plate behind an achievement toast; the toast should become translucent instead of obscuring the answer.
- Open Jungle and confirm the center-tree snake is gone.
- Complete a Final Catch and confirm remaining vocabulary plates move with their flies and fade out.
- Trigger a Friends leaderboard first-place notice; it should say `FRIENDS LEADER!`.
- Open the PvP leaderboard and confirm exactly one victory is displayed as `1 WIN`.
- Compare the main menu and Single Player level menu; `MADE BY NICK` should stay on the same baseline.
- Play Lake and confirm labels—especially near the top-right edge—are centered.
- Open Pause > How To Play; the redesigned book panel should show `VERSION 1.3.0` in its footer.
- Open Custom Frog and confirm the larger live preview remains visible while editing Body, Belly, and Accents.
- Enter Sandbox; newly created flies should use the same grow-and-spark entrance as normal Single Player flies.
- Confirm the login page has no public old-private-key migration control.

## Rollback

Revert the Git commit and let Cloudflare redeploy the prior compatible version. Do not delete the Durable Objects to roll back visual or gameplay code.
