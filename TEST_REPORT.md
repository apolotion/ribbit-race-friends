# Test report — 2026.10.09-friends-online-word-stability-1

## Automated checks

- `npm run check`: PASS — server modules and complete HTML parse.
- `npm test`: PASS — **35/35** tests.
- Existing account/PIN, save merge, rooms, Quickplay, spectator, CPU-takeover, logout-lock, vocabulary, and 30-second connection checks remain green.
- New online-label test repeatedly rebuilds the same PvP fly from 90 simulated authoritative snapshots with small anchor drift and verifies its word rectangle never moves.
- Round changes clear old PvP placement cache entries so reused IDs cannot inherit an old round's position.
- Quickplay layout tests require the taller PLAY WHILE WAITING rectangle and centered two-line group; the previous bottom-edge sublabel positioning is rejected.

## Limits

These tests run locally and do not deploy to the user's Cloudflare account. Actual two-device WebSocket latency and rendering should still be checked after Cloudflare finishes the GitHub-triggered deployment.
