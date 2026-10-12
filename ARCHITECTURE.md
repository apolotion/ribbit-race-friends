# Ribbit Race Friends Edition architecture

Build: `2026.10.12-friends-tutorial-polish-4`  
Displayed game version: `VERSION 1.7.10`

## Browser responsibilities

- `public/index.html` — semantic authentication, first-paint tutorial-pending class, leaderboard, account, game-shell, and mobile-install markup.
- `public/manifest.webmanifest` and `public/icons/` — standalone Home Screen identity, orientation, and icons.
- `public/styles/` — page, authentication, mobile, replay, safe-area, and game-shell presentation.
- `public/scripts/friends-api-client.js` — `FriendsApiClient`; HTTP request policy.
- `public/scripts/auth-screen-controller.js` — login/game visibility, input boundary, and clean sign-out navigation.
- `public/scripts/cloud-client.js` — PIN accounts, save hydration, vocabulary, leaderboard formatting, and cloud lifecycle.
- `public/scripts/mobile-experience.js` — Mobile/Computer confirmation, iPhone installation help, account-panel bridge, standalone detection, and native-gesture suppression.
- `public/scripts/extended-features.js` — replay capture/viewing, palette tools, hat progression, and world-record notices.
- `client/game/100-mobile-experience.js` — canvas-native avatar/device buttons, gradient jump meters, upper-right Versus pause, independent pointer ownership, and touch diagnostics.
- `client/game/120-engine-tutorial.js` — authentication-gated real-engine Park/PvP tutorial, approved dark-blue Ember dialogue with left-aligned wrapping, authored fly/poof timing, checked scenarios, stock final-catch zoom bridge, compact HUD footprint, wrong-fly clue-conversion sequence, achievement isolation, and pause overrides.
- `public/scripts/tutorial-preboot.js` — synchronous first-paint suppression of the menu while a first tutorial is pending.
- `public/scripts/rr-170-polish.js` — post-auth tutorial startup and Friends Edition interface polish.
- `public/scripts/game.bundle.js` — generated closure-preserving browser runtime.

## Park layout responsibility

`client/game/10-core-config.js` owns one true horizontal-mirror Park layout used by regular play, Sandbox inheritance, and tutorial scenarios. The low-left and middle-left platforms have exact right-side counterparts. Only the lower-center and top-center platforms share a vertical column. Park fly anchors are mirrored around the 240-pixel center line.

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

The historical game uses one large private lexical scope. Thirteen responsibility-focused source modules are assembled during the Cloudflare build, preserving scope and execution order without exposing internal state globally.

Run `npm run build` after editing a game module. `npm run check` does this automatically.
