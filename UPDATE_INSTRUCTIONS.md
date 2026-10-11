# Ribbit Race Friends 1.7.8 — Tutorial Polish Update

## Build

- Displayed version: `VERSION 1.7.8`
- Server build: `2026.10.11-friends-tutorial-polish-2`
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
10. Verify `/api/health` reports `2026.10.11-friends-tutorial-polish-2`.
11. Hard-refresh desktop browsers; fully close and reopen an installed iPhone Home Screen app.

No Apps Script or `code.gs` replacement is needed.

## Tutorial retest

To force the solo tutorial after logging in or choosing guest mode, append:

```text
?tutorial=solo
```

For the hidden Park PvP tutorial test route, append:

```text
?tutorial=pvp
```

## Verification checklist

- The login/create/guest screen remains visible until the player chooses an authentication path.
- The tutorial starts only after the auth gate and input lock are released.
- Ember changes expression between dialogue lines.
- Dialogue is consistently sized, centered, and wraps to no more than two lines.
- Holding Space doubles typewriter speed; a quick tap still advances normally.
- The thin cyan border and symmetrical portrait frame have no black notch or scroll-wheel shape.
- The larger **EMBER** name is centered in the orange plate.
- Background scenery and authored fly movement continue while dialogue is open.
- The dinner fly poofs in before “Looks like dinner is ready.”
- The fly term and bottom English clue flash during their explanation lines.
- Frog poof-out and poof-in are separated by exactly 0.5 seconds.
- Existing flies remain in place during frog-only poofs and do not replay their spawn animation unless eaten or missing.
- Long-jump successes sparkle on landing.
- The range lesson begins on the lower-left platform and triggers the stock final-catch zoom.
- Multi-fly placements are reachable in one jump.
- Park platforms match the normal Park level exactly.
- The frog stays frozen after scene completion until the scripted poof.
- Current Goal text is centered over the full card.
- Hovering Current Goal displays an objective-specific **HOW TO** panel.
- Pause works and offers **Retry Scene** and **Skip Tutorial**.
- The three-catch lesson retries only the missed fly.
- No trajectory line appears during dialogue or a poof.
- The final round uses the normal Single Player victory screen and jingle.
