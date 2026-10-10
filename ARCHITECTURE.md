# Ribbit Race Friends Edition architecture

Build: `2026.10.10-friends-label-collision-polish-1`  
Displayed game version: `VERSION 1.2.0`

## Browser responsibilities

- `public/index.html` — semantic document structure only.
- `public/styles/base.css` — page, canvas, and accessibility foundations.
- `public/styles/cloud-ui.css` — authentication, account, and leaderboard presentation.
- `public/styles/game-shell.css` — fullscreen shell, queue rail, responsive rules, and auth lock.
- `public/scripts/friends-api-client.js` — `FriendsApiClient`; HTTP request policy.
- `public/scripts/auth-screen-controller.js` — `AuthScreenController`; login/game visibility, input boundary, and clean sign-out navigation.
- `public/scripts/cloud-client.js` — save hydration, accounts, vocabulary, leaderboard, and cloud lifecycle.
- `client/game/30-online-versus.js` — online lifecycle, disconnect notices, CPU takeover, and requeue routing.
- `client/game/60-versus-gameplay.js` — deterministic overlap classification, physical separation, rebound/bonk effects, and swept high-speed collision detection.
- `client/game/70-rendering.js` — top-only persistent word-plate placement, prerendered plate sprites, bitmap glyphs, settings, Pause UI, and version labels.
- `client/game/80-input-loop-startup.js` — frame composition and exact frozen-world pause rendering.
- `public/scripts/game.bundle.js` — generated closure-preserving browser runtime.

## Label-placement responsibility

`70-rendering.js` owns two caches:

- a placement cache keyed by mode/round/fly/vocabulary identity;
- a prerendered sprite cache keyed by the same identity and label signature.

Existing labels never reflow when another fly appears. Candidate rows are above the fly only. Online snapshot reconstruction reuses the same key, so minor network anchor changes do not move the plate.

## Collision responsibility

`60-versus-gameplay.js` owns:

- current-frame AABB overlap measurement;
- shallowest-axis classification;
- physical separation during cooldown;
- horizontal rebound handling;
- vertical bonk handling;
- swept AABB collision detection for between-frame crossings.

Rendering and online transport do not decide collision outcomes.

## Server responsibilities

- `src/rooms-core.js` owns matchmaking, room lifecycle, admission, CPU takeover, and per-participant Quickplay reservations.
- `src/hub.js` owns accounts, saves, PIN migration, and guarded owner recovery.
- `src/common.js` owns shared build/version constants and response helpers.

## Why the game bundle is generated

The historical game uses one large private lexical scope. Splitting declarations into independent runtime scripts would expose globals or require a risky simulation rewrite. Responsibility-focused source modules are assembled during the existing Cloudflare build, preserving scope and execution order while remaining human-readable.

Run `npm run build` after editing a game module. `npm run check` does this automatically.
