# Ribbit Race Friends 1.7.4 — Ember Dialogue Test Report

Build: `2026.10.11-friends-ember-dialogue-1`

## Automated pipeline

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `node scripts/check.mjs` | PASS |
| `npm run check` | PASS |
| `npm test` | PASS — 125/125 |
| Game bundle module count | 13 |
| Required public assets | 21 |

## Dialogue-specific checks

- Five required Ember portrait assets are included under `public/tutorial/`.
- The portrait frame is positioned on the right side of the dialogue panel.
- The Ember nameplate and speech notch are also right-aligned.
- Every Single Player tutorial scenario contains dialogue text and a selected portrait expression.
- The game input lock remains active while a dialogue is open.
- Space, Enter, and mobile tap-release can close the dialogue.
- A Space close sets a block-until-release guard, preventing the same keypress from triggering a jump.
- Scenario state is armed only after the dialogue closes.
- The simulation does not advance while dialogue is open.
- Completing a checked scenario advances to the next scenario and opens its dialogue.
- The existing authored Park scenarios, save isolation, completion screen, and `RIBBIT READY` achievement remain installed.

## Existing regression coverage

The full suite also covers the existing account, save, Quickplay, spectator, mobile, replay, hat, collision, fly-label, Cloudflare, and engine-tutorial systems.

## Visual inspection

The generated portrait crops were inspected as a five-image set. They retain the approved concept’s:

- black frog skin;
- orange markings and orange Hawaiian-style shirt;
- sunglasses;
- gold chain;
- distinct confident, smiling, cool, laughing, and thinking gestures.

A constructed layout preview is included as:

```text
PREVIEWS/Ember_Dialogue_Welcome.png
```

## Browser-runtime limitation

A full interactive browser run was attempted, but the managed Chromium environment available here blocks locally hosted, `file:`, and `data:` test pages by organization policy. Therefore, no claim is made that a complete deployed browser playthrough was performed in this environment.

The source parsing, bundle build, asset checks, and 125 automated tests passed. The deployed build should still receive a manual desktop and iPhone check, especially for Space-close input consumption, tap-release dialogue closing, and the complete twelve-step tutorial sequence.

## Deployment status

Nothing was deployed to the user’s Cloudflare account from this environment.

## Packaged-repository verification

The final complete repository ZIP was extracted into a fresh directory and run through the same commands. It again completed with:

```text
Built game bundle from 13 modules
Server and browser modules parse; 21 external assets are present

125 tests
125 passed
0 failed
```
