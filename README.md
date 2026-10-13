# Ribbit Race Friends — Polish 40

Version **1.7.27** · build **2026.10.13-friends-polish-40**

This is a repository-root optimization release based on Polish 39 / 1.7.26. The
existing modes, tutorials, collision rules, vocabulary, accounts and save formats
are retained. It is a hosted Friends project, not an offline HTML export.

## Update GitHub / Cloudflare

Extract this archive and place its contents directly in the existing repository
root. Keep the existing Cloudflare project and Durable Object bindings; do not
create replacement namespaces or change the `friends-v1` migration. The supplied
`wrangler.jsonc` has the same bindings and migrations as the input release.

Run the build before deploying. The production bundle is already included, and
this also removes a narrowly defined list of superseded assets from an old tree:

```sh
npm install
npm run check
npm test
npm run deploy
```

Node 22 or later is required. `npm run check` rebuilds and validates the project.
Cloudflare must still have the account authorization and bindings for your own
project. This release does not publish a deployment automatically.

**Removing old GitHub files:** uploading replacements does not delete old tracked
files. In a local checkout, run the build, review `git status`, and commit the
listed removals together with the updated files. With browser-only GitHub uploads,
remove the obsolete files listed in `scripts/clean-release.mjs` from the repository
as well. The cleanup is an exact allowlist: it does not remove unknown custom
files, saved progress, cloud records, or stored replay videos. Repository history
is not rewritten.

## Optimization work

- The 29 readable `client/game/` modules remain authoritative. A conservatively
  minified production bundle removes formatting without renaming variables or
  applying expression rewrites. This preserves name-based compatibility hooks.
- Twelve distinct Ember portraits are stored in one lossless WebP atlas; the
  existing sixteen portrait names map to those frames. Decoded pixels match the
  original PNGs, including transparency. App icons use lossless WebP where
  appropriate; the Apple touch icon remains PNG.
- Duplicate portrait aliases, unused medal alternatives, copied favicons and
  superseded stylesheets have been removed. The five game stylesheets are merged
  in their original cascade order. The selected medal and required app assets
  remain installed.
- Park's stationary scenery is drawn once into two small reusable surfaces.
  Clouds, the kite, characters, flies, effects and simulation continue updating.
- Repeated bitmap-text runs are cached at their native drawing resolution. The
  least-recently-used cache is limited to 256 entries / 6 MiB. Nonstandard
  transforms use the original drawing path. Park scenery uses under 1 MiB more.
- The duplicate legacy Solo video recorder is disabled. The canonical replay
  recorder owns one capture session, pauses with the game and releases video
  tracks on completion, exit or restart. Temporary video data stays bounded;
  saved replay history is not pruned. Online replay capture remains available.
- Legacy DOM cleanup scans run on relevant screen transitions, not every frame.

## Validation and limitations

The included `scripts/release.test.mjs` consolidates 47 checks covering save
merging, account/security boundaries, simulated online-room behavior, rendering
cache limits, build integrity, cleanup safety and replay-session lifecycle.

In-memory Chromium checks loaded the atlas, rendered all 15 Solo tutorial steps
and 34 Versus tutorial steps, exercised all six Solo stages, and observed real
CPU jumps with valid fly vocabulary indices. These are startup/render/runtime
checks, not proof that every authored tutorial objective was played through.

Static Park output and all portrait/app-icon decoded pixels were compared with
the previous release. Steady-state test scenes required roughly 81–96% fewer
individual canvas rectangle draws after warm-up. Actual frame rate depends on
the device and browser; this is not an FPS guarantee.

The browser checks used mocked HTTP/storage. Your deployed Cloudflare site,
live multiplayer and authenticated online replay exchange have not been tested.
