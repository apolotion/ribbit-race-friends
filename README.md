# Ribbit Race Friends Edition

Current release: **1.7.10**  
Server build: **2026.10.12-friends-tutorial-polish-4**

This repository contains the complete Cloudflare Friends Edition: static game assets, thirteen modular browser-game sources, the generated game bundle, account/save backend, WebSocket multiplayer, tests, and deployment configuration.

## 1.7.10 focus

This release finishes another presentation and sequencing pass on the first-boot real-engine Park tutorial.

Ember now uses the previously approved compact dark-blue dialogue panel with thin matching cyan outlines, a square portrait panel, larger left-aligned wrapped text, multiple expressions, and a slower two-frame continue triangle. During scripted transitions, the old sentence remains visible until the new sentence begins typing.

Authored tutorial flies now reveal with their corresponding frog poof-ins rather than appearing at scene load. The three-catch prompt stays blank between catches, the tongue target is higher, the first long-jump control handoff no longer adds an unnecessary poof, and Current Goal uses the exact normal footer height without touching the term card.

The wrong-fly lesson is now a complete sequence: touch a nonmatching fly, leave it on the field, poof into a follow-up with a matching fly, catch that match to update the clue, and return for the original fly after it becomes correct.

The tutorial still waits until the player signs in, creates an account, or chooses **Play Without Saving**. Temporary training activity is contained by the reversible playtest snapshot lifecycle so legitimate cloud saves and records are restored when training ends.

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
