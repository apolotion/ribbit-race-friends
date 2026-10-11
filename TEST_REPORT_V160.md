# Ribbit Race Friends 1.6.0 — validation report

The complete repository package was extracted into a fresh directory and ran:

- `npm run check` — PASS
- `npm test` — PASS

The project also rebuilt `public/scripts/game.bundle.js` from the modular `client/game/` sources. Static and integration tests cover the 1.6.0 mobile release-input layer, independent charge pointers, countdown precharge state, final-catch one-way label fade, remote audio monitor, CPU takeover interruption, Frog Tags replay archive, guest conversion, record-only replay lifecycle, separate online appearance preference, fullscreen controls, responsive login, and platform-drop bookkeeping.

## Remaining real-device checks

Nothing was deployed to the owner's Cloudflare account. The following still require production testing: physical iPhone Safari audio and Home Screen caching, actual two-device WebSocket latency/audio, native multi-touch on the owner's hardware, Cloudflare Durable Object persistence across deployments, and replay size/availability under real browser codecs.
