# Browser game runtime modules

These files are the human-readable source for the generated `public/scripts/game.bundle.js`.
They intentionally share the private lexical scope of `startRibbitRaceGame()`; the build step
concatenates them in the order below so the legacy simulation retains identical behavior.

1. `10-core-config.js` — core configuration, unlocks, levels, achievements, and assets
2. `20-models-and-state.js` — runtime models and shared game state
3. `30-online-versus.js` — Cloudflare rooms, Quickplay, spectators, and online synchronization
4. `40-ui-navigation-audio.js` — menus, navigation, settings, records, sound, and UI controllers
5. `50-solo-gameplay.js` — Single Player rules, physics, flies, and round lifecycle
6. `60-versus-gameplay.js` — local/online Versus rules, CPU, collisions, and match lifecycle
7. `70-rendering.js` — bitmap text, scenery, sprites, menus, HUD, and draw routines
8. `80-input-loop-startup.js` — scene composition, animation loop, input routing, and startup

`npm run build` validates every fragment and generates the browser bundle. Do not edit the
generated bundle directly; edit the responsible module, then run the build.
