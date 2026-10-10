# Test report

Build: `2026.10.10-friends-label-collision-polish-1`  
Displayed game version: `VERSION 1.2.0`

## Automated results

Commands run:

```bash
npm run check
npm test
```

Result:

```text
50 tests
50 passed
0 failed
```

The full test command was repeated three additional times after the final bundle generation; all three runs again passed 50/50.

## New coverage in this release

- Executes the actual fly-label placement routine and checks eight representative fly positions; every generated word plate remains above its fly.
- Confirms existing fly placements remain stable while other flies are added and removed.
- Confirms online placements survive reconstructed WebSocket snapshot objects and small anchor drift.
- Confirms labels use prerendered sprites and whole-physical-pixel text scales to reduce shimmer.
- Verifies the bitmap font contains a `#` glyph and the achievement title remains `NEW FRIENDS #1!`.
- Confirms the Local Versus hover text contains `CLICK TO ENABLE LOCAL PVP`.
- Confirms `VERSION 1.2.0` is present in both settings screens and the Pause menu.
- Executes the collision-axis helpers and verifies horizontal overlaps separate fully and map to rebounds.
- Executes the collision-axis helpers and verifies vertical overlaps separate fully and map to bonks.
- Simulates two high-speed frogs crossing between frames and verifies swept collision detection reconstructs a valid horizontal or vertical contact rather than allowing tunneling.
- Confirms the Versus collision resolver has no silent overlap/no-effect fallback.

## Preserved regression coverage

The suite also retains checks for:

- PIN authentication and Cloudflare's 100,000-iteration PBKDF2 limit;
- current 15-word vocabulary and offline/server parity;
- cloud saves and achievement merging;
- clean sign-out and input locking;
- modular asset generation;
- 30-second Quickplay partner verification;
- centered Quickplay device-check text;
- failed-connect Local Play routing;
- disconnect notice, CPU takeover, and immediate requeue;
- spectators, private ratings, and guest display names;
- one-time legacy-account recovery protection.

## Static/build validation

- All Worker and browser JavaScript modules parse.
- The eight modular gameplay sources rebuild `public/scripts/game.bundle.js` successfully.
- Required public assets are present.
- The Friends Edition remains free of Google Apps Script and WebRTC runtime dependencies.

## Limits

These checks use local Node-based Cloudflare/Durable Object adapters and deterministic execution of extracted browser functions. This package was not deployed to the user's live Cloudflare account, and physical two-device collision play was not performed from this environment. Test the deployed Worker on real devices before broad use.
