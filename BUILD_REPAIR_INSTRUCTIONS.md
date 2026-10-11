# Ribbit Race Friends 1.7.0 — Cloudflare build repair

This patch repairs the failed `npm run check && npm test` deployment gate for 1.7.0.

## Root cause
The game bundle itself built successfully. The failure came from historical regression tests that still expected older release markers, old module counts, and older Quickplay geometry. Several isolated label tests also evaluated browser code without a `window` guard.

The repair also fixes two small production issues discovered while reproducing the failure:
- adds the existing 180×180 Ribbit Race icon to `manifest.webmanifest`;
- defines the Local PvP hover message correctly and supports both `CLICK TO ENABLE LOCAL PVP` and `LOCAL PVP ENABLED`.

## Install
1. Extract this patch.
2. Copy the extracted contents into the root of `apolotion/ribbit-race-friends`, preserving paths.
3. Commit to `main`, e.g. `Repair 1.7.0 Cloudflare regression tests`.
4. Let Cloudflare run its existing build and deploy commands.

Do not create or delete the Worker, FriendsHub, FriendsRoom, or any database.

## Expected build
The game remains display version `1.7.0`.
The repaired server build marker is:

`2026.10.11-friends-tutorial-spectator-polish-1a`

A successful deployment should show 119 tests passed and 0 failed.
