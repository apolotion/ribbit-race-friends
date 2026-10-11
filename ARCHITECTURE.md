# Ribbit Race Friends Edition architecture

Build: `2026.10.10-friends-centered-labels-themed-book-1`  
Displayed game version: `VERSION 1.4.1`

## Browser responsibilities

- `public/index.html` — semantic document structure only.
- `public/styles/` — page, authentication, mobile, replay, and game-shell presentation.
- `public/scripts/friends-api-client.js` — `FriendsApiClient`; HTTP request policy.
- `public/scripts/auth-screen-controller.js` — login/game visibility, input boundary, and clean sign-out navigation.
- `public/scripts/cloud-client.js` — PIN accounts, save hydration, vocabulary, leaderboard formatting, and cloud lifecycle.
- `public/scripts/extended-features.js` — Mobile Mode, replay capture/viewing, palette tools, hat progression, and world-record notices.
- `client/game/70-rendering.js` — persistent fly plates, exact horizontal centering, pause-control opacity, themed How To Play book, cinematics, achievements, menus, and HUD.
- `public/scripts/game.bundle.js` — generated closure-preserving browser runtime.

## Label-placement responsibility

`70-rendering.js` owns a placement cache and a prerendered sprite cache keyed by mode/round/fly/vocabulary identity. A label keeps one stable rectangle for its fly's lifetime.

The horizontal coordinate is always:

```text
stable fly anchor X - plate width / 2
```

No HUD obstacle, screen-edge clamp, timer, or pause button may shift it sideways. Only the vertical row may change to avoid an older label.

## Pause-book theming responsibility

`getPauseBookTheme()` maps the selected frog's palette to the book frame, cover, page, page lines, spine, bookmark, open-book header, divider, and version footer. This keeps the help control consistent with default and custom frogs.

## Server responsibilities

- `src/rooms-core.js` owns matchmaking, room lifecycle, admission, CPU takeover, and Quickplay reservations.
- `src/hub.js` owns PIN accounts, saves, sessions, guarded owner recovery, and record-replay SQLite storage.
- `src/index.js` owns same-origin Worker routing, including replay requests.
- `src/common.js` owns shared build/version constants and response helpers.

## Why the game bundle is generated

The historical game uses one large private lexical scope. Responsibility-focused source modules are assembled during the Cloudflare build, preserving scope and execution order without exposing internal state globally.

Run `npm run build` after editing a game module. `npm run check` does this automatically.
