# Ribbit Race Friends Edition architecture

Build: `2026.10.10-friends-visual-polish-1`
Displayed game version: `VERSION 1.3.0`

## Browser responsibilities

- `public/index.html` — semantic document structure only; no public legacy-key migration form.
- `public/styles/base.css` — page, canvas, and accessibility foundations.
- `public/styles/cloud-ui.css` — authentication, account, and leaderboard presentation.
- `public/styles/game-shell.css` — fullscreen shell, queue rail, responsive rules, and auth lock.
- `public/scripts/friends-api-client.js` — `FriendsApiClient`; HTTP request policy.
- `public/scripts/auth-screen-controller.js` — `AuthScreenController`; login/game visibility, input boundary, and clean sign-out navigation.
- `public/scripts/cloud-client.js` — PIN accounts, save hydration, vocabulary, leaderboard formatting, and cloud lifecycle.
- `client/game/20-models-and-state.js` — sandbox fly creation and shared runtime state.
- `client/game/40-ui-navigation-audio.js` — menu navigation and Custom Frog editor geometry.
- `client/game/50-solo-gameplay.js` — shared normal/sandbox fly animation updates.
- `client/game/60-versus-gameplay.js` — deterministic contact, physical separation, rebound/bonk effects, and swept high-speed collision detection.
- `client/game/70-rendering.js` — persistent labels, physical-pixel text centering, final-catch attachment/fade, achievement visibility, custom preview, Pause book, and environment art.
- `client/game/80-input-loop-startup.js` — frame composition, frozen-world pause rendering, input, and startup.
- `public/scripts/game.bundle.js` — generated closure-preserving browser runtime.

## Label-placement responsibility

`70-rendering.js` owns two caches:

- a placement cache keyed by mode/round/fly/vocabulary identity;
- a prerendered sprite cache keyed by the same identity and label signature.

Existing labels never reflow when another fly appears. Candidate rows are above the fly only. Text is centered in physical pixels. During Final Catch, cached plates temporarily re-enter camera space, follow their flies, and fade with the cinematic.

## Achievement visibility responsibility

`70-rendering.js` checks the toast rectangle against fly bodies and cached vocabulary plates. If content would be obscured, the toast alpha is capped by `achievementToastObstructedOpacity`; the achievement remains visible without hiding the answer choices.

## Server responsibilities

- `src/rooms-core.js` owns matchmaking, room lifecycle, admission, CPU takeover, and per-participant Quickplay reservations.
- `src/hub.js` owns PIN accounts, saves, sessions, and guarded owner recovery. Public private-key migration is retired.
- `src/common.js` owns shared build/version constants and response helpers.

## Why the game bundle is generated

The historical game uses one large private lexical scope. Splitting declarations into independent runtime scripts would expose globals or require a risky simulation rewrite. Responsibility-focused source modules are assembled during the existing Cloudflare build, preserving scope and execution order while remaining human-readable.

Run `npm run build` after editing a game module. `npm run check` does this automatically.
