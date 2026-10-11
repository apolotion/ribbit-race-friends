# Ribbit Race Friends 1.7.7 — Scripted Tutorial Update

## Build

- Displayed version: `VERSION 1.7.7`
- Server build: `2026.10.11-friends-tutorial-scripted-1`

## Installation

Use the complete repository ZIP when the GitHub repository has previously reported missing source or public files.

1. Back up `apolotion/ribbit-race-friends`.
2. Extract the complete update ZIP.
3. Copy the extracted **contents** into the repository root, preserving every directory.
4. Confirm the repository root directly contains:

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
   Ribbit Race Friends 1.7.7 scripted tutorial fixes
   ```

6. Keep Cloudflare configured as:

   ```text
   Build command:  npm run check && npm test
   Deploy command: npx wrangler deploy
   Root directory: /
   ```

7. Keep the existing bindings:

   ```text
   HUB     → FriendsHub
   ROOMS   → FriendsRoom
   ASSETS  → public
   ```

8. Do not recreate or delete either Durable Object.
9. Wait for the build and tests to succeed.
10. Check `/api/health` for `2026.10.11-friends-tutorial-scripted-1`.
11. Hard-refresh desktop browsers; fully close and reopen the iPhone Home Screen app.

## Tutorial retest

Append:

```text
?tutorial=solo
```

## Verification checklist

- Login/create/guest selection completes before the tutorial starts.
- The first Ember line appears immediately.
- Text types one sentence at a time and advances correctly.
- Space used to close dialogue does not charge a jump.
- The compact top panel does not cover the fly counter or Pause corner.
- No scrollbar, lower-right arrow, or detached “Nice work” message appears.
- Flies sparkle into existence after the final dialogue line.
- Failed attempts clear the tongue and use two poofs with a 0.5-second gap.
- No offscreen frog-direction arrow appears during a poof.
- Three 90%-plus jumps are required in Scene 2.
- Scene 3 awards three one-jump matching catches.
- Scene 4 requires a true tongue catch and shows a brief slow-motion emphasis.
- Scene 5 demonstrates an incorrect catch and spit-back.
- Scene 6 checks mixed, two-match, and three-match arcs.
- Wall Turn accepts one or two jumps; Rebound Catch remains one jump.
- Buffer and Double Buffer recognize distinct platform transitions.
- Current Goal fully replaces Time/Jumps/Best and fades smoothly after failure.
- The final round uses the normal Single Player victory screen and jingle.
