# Browser game runtime modules

These thirteen files are the human-readable source for the generated `public/scripts/game.bundle.js`. They intentionally share the private lexical scope of `startRibbitRaceGame()`; the build step concatenates them in filename order so the historical simulation retains one closure.

1. `10-core-config.js` — configuration, unlocks, mirrored level geometry, achievements, and assets
2. `20-models-and-state.js` — runtime models and shared game state
3. `30-online-versus.js` — Cloudflare rooms, Quickplay, spectators, and online synchronization
4. `40-ui-navigation-audio.js` — menus, navigation, settings, records, sound, and UI controllers
5. `50-solo-gameplay.js` — Single Player rules, physics, flies, and round lifecycle
6. `60-versus-gameplay.js` — local/online Versus rules, CPU, collisions, and critical-catch camera
7. `70-rendering.js` — bitmap text, scenery, sprites, menus, HUD, and draw routines
8. `80-input-loop-startup.js` — scene composition, animation loop, input routing, and startup
9. `90-extended-features.js` — records, hats, palettes, replays, and Friends Edition extensions
10. `99-v170-hooks.js` — version 1.7 integration hooks
11. `100-mobile-experience.js` — canvas-native mobile controls and touch ownership
12. `110-online-mobile-polish.js` — online/mobile refinements and runtime diagnostics
13. `120-engine-tutorial.js` — authentication-gated real-engine tutorial, Ember dialogue, scripted checks, HUD, pause, and save isolation

Run `npm run build` after editing a module. `npm run check` rebuilds automatically, parses the browser/server sources, verifies assets, and checks dependency restrictions. Do not edit the generated bundle directly.
