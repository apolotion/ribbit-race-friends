# Ribbit Race Friends 1.7.6 — Tutorial Cinematic Update

## Build

- Displayed version: `VERSION 1.7.6`
- Server build: `2026.10.11-friends-tutorial-cinematic-1`

## Recommended installation

Use the complete repository ZIP if your GitHub repository has ever reported a missing file during Cloudflare Builds.

1. Back up the current `apolotion/ribbit-race-friends` repository.
2. Extract the complete update ZIP.
3. Copy the extracted **contents** into the repository root, preserving all paths.
4. Confirm that these are directly at the root:

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
   Refine Ember tutorial dialogue, scenarios and victory flow
   ```

6. Keep the existing Cloudflare settings:

   ```text
   Build command:  npm run check && npm test
   Deploy command: npx wrangler deploy
   Root directory: /
   ```

7. Keep the current bindings:

   ```text
   HUB     → FriendsHub
   ROOMS   → FriendsRoom
   ASSETS  → public
   ```

8. Do not recreate or delete either Durable Object.
9. After deployment, open `/api/health` and confirm the build contains:

   ```text
   2026.10.11-friends-tutorial-cinematic-1
   ```

10. Hard-refresh desktop browsers. Fully close and reopen the iPhone Home Screen app.

## Tutorial retest

Append this to the deployed game URL:

```text
?tutorial=solo
```

## What to verify

- Ember's approved sunglasses/orange-shirt portrait is visible in the first dialogue frame.
- Dialogue advances one large line at a time.
- The last dialogue line closes into gameplay rather than charging a jump.
- Tutorial flies appear with the normal sparkle/grow animation after dialogue closes.
- An undercharged max jump resets only after the frog lands.
- Failed attempts poof out, wait about half a second, and poof back in with two sounds.
- The tongue lesson uses a normal upper Park fly location.
- Wrong-then-right must be completed in one jump and in that order.
- Wall Turn accepts either one or two jumps.
- Quick Drop, Buffer Drop, and Double Buffer use the unchanged Park platform layout.
- The Current Goal panel remains visible during dialogue and flashes red smoothly after failure.
- The final practice round uses the normal Single Player victory animation, message, buttons, and jingle.
