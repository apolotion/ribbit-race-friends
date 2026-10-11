# Ribbit Race Friends Edition

Current release: **1.7.7**  
Server build: **2026.10.11-friends-tutorial-scripted-1**

This repository contains the complete Cloudflare Friends Edition: public game assets, modular client source, account/save backend, WebSocket multiplayer, tests, and build scripts.

The 1.7.7 release focuses on the real-engine Park tutorial. Ember presents the supplied twelve-scene script one sentence at a time, then the player completes checked scenarios in the normal game engine. See `EMBER_DIALOGUE_SCRIPT.md`, `ENGINE_TUTORIAL.md`, and `UPDATE_INSTRUCTIONS.md`.

Build and test:

```bash
npm install
npm run check
npm test
```

Deploy through the existing Cloudflare Worker with:

```bash
npx wrangler deploy
```

Do not recreate the existing `FriendsHub` or `FriendsRoom` Durable Objects during an ordinary update.
