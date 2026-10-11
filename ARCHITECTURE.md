# Ribbit Race Friends Edition architecture

Build: `2026.10.11-friends-online-mobile-polish-1`  
Displayed game version: `VERSION 1.6.0`

## Browser responsibilities

- `public/index.html` — semantic authentication, leaderboard, account, game-shell, and mobile-install markup.
- `public/manifest.webmanifest` and `public/icons/` — standalone Home Screen identity, orientation, and icons.
- `public/styles/` — page, authentication, mobile, replay, safe-area, and game-shell presentation.
- `public/scripts/friends-api-client.js` — `FriendsApiClient`; HTTP request policy.
- `public/scripts/auth-screen-controller.js` — login/game visibility, input boundary, and clean sign-out navigation.
- `public/scripts/cloud-client.js` — PIN accounts, save hydration, vocabulary, leaderboard formatting, and cloud lifecycle.
- `public/scripts/mobile-experience.js` — Mobile/Computer confirmation, iPhone installation help, account-panel bridge, standalone detection, and native-gesture suppression.
- `public/scripts/extended-features.js` — replay capture/viewing, palette tools, hat progression, and world-record notices.
- `client/game/100-mobile-experience.js` — canvas-native avatar/device buttons, gradient jump meters, upper-right Versus pause, independent pointer ownership, and touch diagnostics.
- `public/scripts/game.bundle.js` — generated closure-preserving browser runtime.

## Touch-input responsibility

The mobile gameplay module receives pointer events in capture phase, maps them through the canvas's actual letterboxed drawing rectangle, and assigns each pointer ID to exactly one control. P1 and P2 can therefore hold separate Local Versus meters at the same time. Releasing or cancelling one contact cannot release the other contact.

The account/device controls are rendered inside the game canvas on the main menu. The old DOM corner toolbar is hidden while Mobile Mode is active, but its account panel remains accessible through the canvas avatar.

## Mobile performance responsibility

- `RENDER_SCALE` is 2 on coarse-touch devices and 4 on desktop.
- The fixed-step simulation remains compatible with the existing physics but caps catch-up work on slow mobile frames.
- Replay video capture is skipped on mobile/coarse-pointer devices.
- Accessory monitors use throttled timers rather than independent full-rate animation loops.
- Standalone mode uses dynamic viewport units and safe-area insets.

## Hat responsibility

`HatProgressController` records a post-feature baseline. It consumes Solo completion, general Versus wins, total flies, and total jumps without requiring an online or human opponent. `hatstest` creates only the feature baseline and dispatches the Hats-open event.

## Server responsibilities

- `src/rooms-core.js` owns matchmaking, room lifecycle, admission, CPU takeover, and Quickplay reservations.
- `src/hub.js` owns PIN accounts, saves, sessions, guarded owner recovery, and record-replay SQLite storage.
- `src/index.js` owns same-origin Worker routing, including replay requests.
- `src/common.js` owns shared build/version constants and response helpers.

## Why the game bundle is generated

The historical game uses one large private lexical scope. Ten responsibility-focused source modules are assembled during the Cloudflare build, preserving scope and execution order without exposing internal state globally.

Run `npm run build` after editing a game module. `npm run check` does this automatically.
