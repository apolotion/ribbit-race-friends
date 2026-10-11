# Ribbit Race Friends Edition

Current release: **1.7.9**  
Server build: **2026.10.11-friends-tutorial-polish-3**

This repository contains the complete Cloudflare Friends Edition: static game assets, thirteen modular browser-game sources, generated game bundle, account/save backend, WebSocket multiplayer, tests, and deployment configuration.

## 1.7.9 focus

This release polishes the first-boot real-engine Park tutorial. It adds a larger Pokémon-style Ember dialogue panel, first-paint tutorial gating, exact input consumption between dialogue and gameplay, delayed authored fly reveals, symmetric Park geometry, corrected multi-fly routes, stock final-catch zoom, training-only achievement isolation, safer wall/drop completion checks, and a footer layout that matches the normal TIME/JUMPS/BEST footprint.

The tutorial still waits until the player signs in, creates an account, or chooses **Play Without Saving**. Temporary tutorial activity is contained by the reversible playtest snapshot lifecycle so legitimate cloud saves and records are restored when training ends.

## Build and test

```bash
npm install
npm run check
npm test
```

## Deploy

Deploy to the existing Cloudflare Worker:

```bash
npm run deploy
```

or:

```bash
npx wrangler deploy
```

No Apps Script or `code.gs` replacement is used. Preserve the existing `FriendsHub`, `FriendsRoom`, and `ASSETS` bindings during an ordinary update.
