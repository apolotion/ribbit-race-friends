# Ribbit Race Friends 1.7.0 — Update Instructions

Build: `2026.10.11-friends-tutorial-spectator-polish-1`

## Recommended installation

Use the complete repository ZIP because this installation is modular and prior GitHub uploads have occasionally omitted required files.

1. Back up the current `apolotion/ribbit-race-friends` repository.
2. Extract the complete update ZIP.
3. Copy the extracted **contents** into the repository root.
4. Confirm these paths exist directly at the root:

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
Ribbit Race Friends 1.7.0 tutorials and spectator polish
```

6. Cloudflare should run:

```text
npm run check && npm test
npx wrangler deploy
```

7. Keep the existing bindings:

```text
HUB     → FriendsHub
ROOMS   → FriendsRoom
ASSETS  → public
```

8. Do not recreate or delete the Durable Objects.
9. After deployment, open `/api/health` and confirm the build is:

```text
2026.10.11-friends-tutorial-spectator-polish-1
```

10. Hard-refresh desktop browsers. On iPhone, close and reopen the Home Screen app.

## First checks

- Open the centered account popup from the main-menu avatar.
- Open Achievements and use the gold medal button.
- Verify the top-right desktop Pause button and bottom-right Mobile Versus Pause button.
- Test two simultaneous touches across the full left/right bottom zones.
- Open Spectate and choose a private or Quickplay live match.
- Confirm custom frog palettes, trajectory previews, player-name meters, and animated round results.
- Test Close Call with both the human and CPU catching the deciding fly.
- Verify Lake win progress updates hats without reopening the menu.
- On a new browser profile, confirm the Single Player tutorial launches once.
