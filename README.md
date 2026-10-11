# Ribbit Race Friends Edition

Current release: **1.7.8**  
Server build: **2026.10.11-friends-tutorial-polish-2**

This repository contains the complete Cloudflare Friends Edition: public game assets, modular client source, account/save backend, WebSocket multiplayer, tests, and build scripts.

The 1.7.8 tutorial-polish release keeps the first-boot lesson inside the real Park engine while refining Ember dialogue, scene transitions, fly timing, Current Goal help, and pause controls. The tutorial now waits for sign-in or **Play Without Saving**, keeps the animated Park running behind dialogue, and preserves legitimate cloud progress through the reversible playtest snapshot lifecycle.

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

No Apps Script or `code.gs` replacement is used by this edition. Do not recreate the existing `FriendsHub` or `FriendsRoom` Durable Objects during an ordinary update.
