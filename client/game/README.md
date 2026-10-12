# Browser game runtime modules

The files in this folder are the human-readable source for the generated
`public/scripts/game.bundle.js`. They intentionally share the private lexical
scope of `startRibbitRaceGame()`. The build script discovers files by numeric
prefix and concatenates them in that order.

## Core systems

- `10-core-config.js` — configuration, unlocks, levels, achievements, and assets
- `20-models-and-state.js` — shared runtime models and game state
- `30-online-versus.js` — Cloudflare rooms, Quickplay, spectators, and sync
- `40-ui-navigation-audio.js` — navigation, settings, records, and sound
- `50-solo-gameplay.js` — Single Player rules, flies, physics, and rounds

## Versus

- `60-versus-physics.js` — players, moving platforms, collisions, and bonks
- `61-versus-catches-rounds.js` — fly catches, cinematics, timers, and rounds
- `62-versus-cpu.js` — CPU threat analysis, planning, and input
- `63-versus-rendering-ui.js` — Versus rendering, setup, HUD, and results

## Rendering

- `70-rendering-text-world.js` — bitmap text, scenery, and platforms
- `71-rendering-entities-hud.js` — flies, frogs, tongues, and gameplay HUD
- `72-rendering-customization.js` — setup, hats, custom colors, and sandbox
- `73-rendering-menus-overlays.js` — menus, pause, achievements, and victory UI

## Runtime integration

- `80-input-loop-startup.js` — input routing, frame loop, and startup
- `90-extended-features.js` — records, hats, palettes, and replays
- `100-mobile-experience.js` — mobile controls and touch ownership
- `110-online-mobile-polish.js` — online/mobile refinements and diagnostics
- `115-v170-hooks.js` — version 1.7 integration hooks

## Tutorials and current polish layer

- `120-tutorial-config.js` — tutorial constants, scripts, portraits, and state
- `121-tutorial-runtime-dialogue.js` — runtime snapshots and dialogue lifecycle
- `122-tutorial-scenarios.js` — authored Solo and Versus scene layouts
- `123-tutorial-lifecycle.js` — poofs, retries, transitions, completion, and startup
- `124-tutorial-monitoring.js` — Solo/Versus objective validation and updates
- `125-tutorial-rendering.js` — dialogue, goals, pause, and completion rendering
- `126-tutorial-hooks.js` — input, achievements, stats, and engine integration
- `127-tutorial-refinements.js` — chapter navigation and final tutorial safeguards
- `130-polish-ui-replay-language.js` — account UI, leaderboard, replays, and language
- `131-progress-compatibility.js` — save-format and hat-progress compatibility
- `132-cross-screen-integration.js` — cross-screen controls and custom-frog polish

Run `npm run build` after editing a module. `npm run check` rebuilds automatically,
parses browser/server sources, verifies assets, and checks dependency restrictions.
Do not edit the generated bundle directly.
