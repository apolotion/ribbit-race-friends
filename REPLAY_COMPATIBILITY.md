# Ribbit Race Friends replay format compatibility

**Never delete or overwrite a user's replay just because its schema is old.**
These replays are game-state snapshots, not encoded camera video. Archived
recordings contain frog and fly positions/timing and must be adapted in memory
for changes to the live game engine.

| Format | Introduced | Playback support |
| --- | --- | --- |
| Frame data `version: 1` | Polish 44–51 | `ribbitReplayAdaptLegacy` (missing fields defaulted; archived payload unchanged) |
| Frame data `version: 2` | Polish 52 | Current schema with snapshot map geometry, voice/sound events, initial countdown, and score timeline |

The MIME type remains `application/vnd.ribbit-race.frames+json`, optionally gzip
compressed. `kind: "ribbit-engine-frames"` remains unchanged. No server migration
is needed and replay storage keeps the original JSON object as written.

## Schema rules for future changes

1. Keep `validateRibbitReplayData` and `ribbitReplayAdaptLegacy` support for both
   v1 and v2. Introduce a new reader or adapter for v3; do not reassign the
   meaning of a field in an existing version.
2. Preserve original frame timestamps, fly vocabulary indexes, sound timing,
   winner/score metadata, and source stage geometry. New fields must be
   additive. Older records may lack `phase`, `gameState`, `tongue`, `sounds`,
   `recordedAt`, `fps`, `duration`, `stageLayout` or `final`.
3. Replay-only migrations must run on a temporary view object. Never save the
   adapted object over the original data stored in IndexedDB/Cloudflare.
4. Continue using the embedded `vocab` and `stageLayout` for v2 records.
   Older v1 records use the current default stage if geometry is not saved.
5. Run `node --test tests/polish52-replay-compatibility.test.mjs` plus the
   complete `npm test` suite before packaging every future update. Maintain
   frozen fixtures for older schema versions to catch accidental regressions.
6. Files stored as historical video clips **without game-state frames** cannot
   be reconstructed by these adapters. Keep their original media available
   wherever it was stored, and distinguish that case in the replay UI.

Replays with the final-score animation use an independent timeline: first
1000ms of win animation alone, then a 3000ms centered score overlay while the
frog continues to animate. New replays record 3000ms of solo victory frames;
the last 1000ms of dance is generated during playback with the same animation
clock. Legacy v1 recordings with final frames are retimed for display without
changing the saved source or adding events that were never recorded.
