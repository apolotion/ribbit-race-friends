# Ribbit Race Friends — Cloudflare build repair

The failed build reports:

```text
Error: Cannot find module '/opt/buildhome/repo/scripts/build-game.mjs'
```

This means the repository has the modular `package.json`, but the modular build script was not present at the repository root. The repair package restores the build script and all eight source modules it needs.

## Install

1. Extract this ZIP.
2. Open the existing GitHub repository `apolotion/ribbit-race-friends`.
3. Copy the extracted contents into the **repository root**, preserving these exact paths:

```text
package.json
scripts/build-game.mjs
scripts/check.mjs
client/game/10-core-config.js
client/game/20-models-and-state.js
client/game/30-online-versus.js
client/game/40-ui-navigation-audio.js
client/game/50-solo-gameplay.js
client/game/60-versus-gameplay.js
client/game/70-rendering.js
client/game/80-input-loop-startup.js
client/game/README.md
public/scripts/game.bundle.js
```

4. Make sure `scripts` and `client` are beside `package.json`; do not place them inside an extra patch folder.
5. Commit directly to `main`, for example:

```text
Restore modular game build sources
```

6. Cloudflare should rerun:

```text
npm run check && npm test
npx wrangler deploy
```

7. The build log should include:

```text
Built game bundle from 8 modules
Server and browser modules parse
```

## Cloudflare variable note

`OWNER_DELETE_LEGACY_USERNAME` must be a Worker **runtime** variable if you still need the one-time Nick cleanup. A Workers Builds variable is build-time only and is not available to `env` inside the running Worker. Add it under the Worker's Settings > Variables & Secrets, trigger the cleanup, and remove it immediately afterward.

Do not create a new Worker or new Durable Objects.
