# Ribbit Race Friends 1.7.10 — Tutorial Polish Update

## Build

- Displayed version: `VERSION 1.7.10`
- Server build: `2026.10.12-friends-tutorial-polish-4`
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
10. Verify `/api/health` reports `2026.10.12-friends-tutorial-polish-4`.
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
- The first long-jump exercise starts at the normal Park position without an extra poof.
- Resuming the tutorial returns directly to play with no 3-2-1 countdown.

### Ember dialogue

- The box uses the compact dark-blue style and thin cyan outline from the approved earlier version.
- Dialogue text is larger and left-aligned. A wrapped second line begins at the same left edge.
- Ember's portrait is a same-height square with the same border width as the text panel.
- The orange name strip contains a larger centered **EMBER** label and no indigo rail appears to its right.
- Ember changes expression between lines.
- Holding Space doubles typewriter speed.
- The two-frame triangle changes every 520 ms and appears only when another line remains.
- During a delayed fly reveal, the prior sentence remains visible until the new line begins typing.

### Fly and prompt timing

- Every authored tutorial fly reveals with the frog's corresponding poof-in rather than appearing at scene load.
- The dinner fly finishes its spawn poof, waits another 500 ms, and then line 2 begins.
- The range target appears with the frog during the distant-fly line and sits high above the platforms.
- The three-fly route appears with the frog's scene poof.
- The wall-turn target appears with the frog on “Then jump back...”
- During the three-catch exercise, the term goes blank immediately after a catch and stays blank until the next fly poofs in.

### Wrong-fly sequence

- The first nonmatching fly does not score and remains on the field after its spit-back.
- A new matching fly appears only after the first fly has been touched, and it enters with the frog's follow-up poof.
- Catching the new matching fly updates the English clue to the skipped fly's term.
- The scene does not complete until the player returns and catches the original fly after it becomes correct.

### Park, physics, HUD, and achievements

- Park is a true horizontal mirror in all Park modes; only the two center platforms align vertically.
- Quick drops and buffered drops do not increment jump attempts.
- Wall-turn and rebound scenes wait for landing before freezing or completing.
- The tongue-range catch uses the stock Single Player final-catch slow-motion camera and zoom.
- Current Goal is level with the jump meter and term card, has a two-pixel gutter beside the term card, and does not clip its second line.
- The final practice round shows normal TIME/JUMPS/BEST metrics.
- All ordinary achievements are suppressed during training; only **RIBBIT READY** can be awarded.
