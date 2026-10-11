# Ribbit Race Friends 1.7.4 — Ember Dialogue Update

Build: `2026.10.11-friends-ember-dialogue-1`

## What changed

- Added five close-up Ember portraits based on the approved black-frog/orange-shirt tutorial concept.
- Ember speaks from the **right side** of a dark teal, cyan-bordered dialogue panel.
- Every checked tutorial scenario begins with personable Ember dialogue.
- The real Park game is frozen while the dialogue is open.
- Press **Space** or **Enter** to close the dialogue; on mobile, tap and release.
- The closing Space press cannot accidentally become a jump: gameplay remains locked until Space is released.
- After the dialogue closes, the player uses the normal game engine until the current scenario goal is completed.
- Completing a goal opens the next Ember dialogue and then the next checked exercise.
- Failed one-attempt exercises reset their authored layout without forcing the player to reread the full dialogue.
- The existing Ember Park layouts, Current Goal HUD, disabled tutorial pause, completion screen, and `RIBBIT READY` achievement remain intact.

The full script is documented in `EMBER_DIALOGUE_SCRIPT.md`.

## Install over the existing GitHub repository

Use the complete repository ZIP if GitHub has ever reported a missing source, build script, or public asset. Use the patch ZIP only when the complete modular project is already present.

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

4. In particular, confirm these portrait assets exist:

   ```text
   public/tutorial/ember-confident.png
   public/tutorial/ember-smile.png
   public/tutorial/ember-cool.png
   public/tutorial/ember-laughing.png
   public/tutorial/ember-thinking.png
   ```

5. Commit directly to `main`, for example:

   ```text
   Add Ember dialogue portraits and tutorial conversation flow
   ```

6. Keep the existing Cloudflare configuration:

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

8. Do not create, delete, or replace either Durable Object.
9. Wait for the build and deployment to finish.
10. Open `/api/health` and confirm the response includes:

   ```text
   2026.10.11-friends-ember-dialogue-1
   ```

11. Hard-refresh desktop browsers. Fully close and reopen the iPhone Home Screen app.

## Expected build result

```text
Built game bundle from 13 modules
Server and browser modules parse; 21 external assets are present

125 tests
125 passed
0 failed

Success: Deploy command completed
Success! Build completed.
```

## Manual verification

Use a browser/profile that has not completed the V4 tutorial, or append `?tutorial=solo` to the deployed URL.

Confirm:

- Park loads before the conversation appears.
- Ember’s close-up portrait is on the right side of the dialogue box.
- Ember has black skin, orange markings, an orange shirt, sunglasses, and a gold chain.
- The game world does not advance while dialogue is open.
- Pressing Space closes the dialogue but does not immediately make the frog jump.
- Releasing Space re-enables normal jump input.
- The player can complete the exercise using the normal game engine.
- Completing the exercise opens the next dialogue.
- On mobile, tap and release closes the dialogue.
- The final normal round still opens the congratulations screen and awards `RIBBIT READY`.
