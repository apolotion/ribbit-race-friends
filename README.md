# Ribbit Race Friends — Polish 68 / 1.7.55

This is the GitHub-ready Cloudflare Worker + static game repository. Replace the previous repo files with the contents of this ZIP.

- `public/`: browser game bundle, graphics, styles, and sign-in pages.
- `src/`: Cloudflare Worker APIs and save/replay handling.
- `client/game/`: editable, numbered game source modules. The bundle is generated from these modules.
- `scripts/`: game bundling and predeployment checks.
- `wrangler.jsonc`: existing Cloudflare deployment settings.
- `UPDATE_NOTE_POLISH_67.txt`: latest changes only.
- `TEST_REPORT.txt`: build and browser interaction checks for this release.

Build: `npm run build` (Node.js 22+). Validate: `npm run check`. Deploy: `npm run deploy` if your Cloudflare account is already configured.

**Note persistence:** Flashcard notes are stored locally in this browser under the current account name, not in the remote/cloud save. Vocabulary list entries are read from the game's active Friends vocabulary source; refreshing requires a cloud connection.

The deployment archive omits historical update notes, unused design previews, and internal test fixtures to keep the release compact. The replay compatibility format has not been modified by this update.


## Flash card redesign

The flash-card study screen now uses the approved stacked-card interface with an optional Sort Mode, term notes, bookmark stars, continuous progress, and icon-only corner controls.
