# Ribbit Race Friends 1.7.9 — Tutorial Polish Update

## Build

- Displayed version: `VERSION 1.7.9`
- Server build: `2026.10.11-friends-tutorial-polish-3`
- Platform: Cloudflare Worker + Durable Objects + static assets
- Apps Script: **not used**

## Installation

1. Back up the current Ribbit Race Friends repository and Cloudflare deployment.
2. Extract the complete update ZIP.
3. Copy the extracted **contents** into the repository root, preserving all folders.
4. Confirm the root directly contains:

   ```text
   package.json
   wrangler.jsonc
   client/
   public/
   scripts/
   src/
   tests/
   ```

5. Install dependencies when needed:

   ```bash
   npm install
   ```

6. Build and validate:

   ```bash
   npm run check
   npm test
   ```

7. Deploy through the existing Cloudflare project:

   ```bash
   npm run deploy
   ```

   or:

   ```bash
   npx wrangler deploy
   ```

8. Keep the existing bindings:

   ```text
   HUB     → FriendsHub
   ROOMS   → FriendsRoom
   ASSETS  → public
   ```

9. Do not recreate or delete either Durable Object.
10. Verify `/api/health` reports `2026.10.11-friends-tutorial-polish-3`.
11. Hard-refresh desktop browsers; fully close and reopen an installed iPhone Home Screen app.

No Apps Script or `code.gs` replacement is needed.

## Tutorial retest routes

Force the solo tutorial after authenticating:

```text
?tutorial=solo
```

Open the hidden Park PvP tutorial test route:

```text
?tutorial=pvp
```

## Verification checklist

### Startup and input

- The authentication gate remains visible until sign-in, account creation, or **Play Without Saving**.
- On first use, the canvas stays hidden between authentication and tutorial activation, so the main menu does not flash.
- The Space press that closes the final line is consumed; a second Space press begins a jump.
- Resuming the tutorial skips the ordinary 3-2-1 countdown.

### Ember dialogue

- Text uses a bright Pokémon-style panel, one consistent larger scale, centered one- or two-line wrapping, and a slow two-frame triangle.
- Ember changes expression between lines.
- The portrait is square, matches the text-panel height and border width, has a centered larger **EMBER** label, and has no extra indigo rail.
- Holding Space doubles typewriter speed.

### Timing and lesson behavior

- The dinner fly finishes its spawn poof and waits another 500 ms before its announcement.
- The range frog and fly enter during the intended dialogue line; the frog is centered on the lower-left platform.
- Correct three-catch landings hold for 500 ms before poofing.
- Terms and goals stay blank until control returns, including after Retry Scene.
- Multi-fly setups enter at their scripted lines rather than at scene start.
- Match-and-spit changes the second clue so the remaining fly is intentionally wrong.
- The two-match exercise is mirrored and the three-match route follows the supplied diagram.

### Park, physics, HUD, and achievements

- Park is a true horizontal mirror in all Park modes; only the two center platforms align vertically.
- Quick drops and buffered drops do not increment jump attempts.
- Wall-turn and rebound scenes wait for landing before freezing/completing.
- The tongue-range catch uses the stock Single Player final-catch slow-motion camera and zoom.
- Current Goal occupies the exact normal statistics footprint and cannot overlap the English clue.
- The final practice round shows normal TIME/JUMPS/BEST metrics.
- All ordinary achievements are suppressed during training; only **RIBBIT READY** can be awarded.
