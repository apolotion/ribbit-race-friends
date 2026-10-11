# Test report — Ribbit Race Friends 1.3.0

Build: `2026.10.10-friends-visual-polish-1`
Displayed game version: `VERSION 1.3.0`

## Automated project checks

The exact production commands completed successfully:

```text
npm run check
npm test
```

Results:

```text
59 tests
59 passed
0 failed
```

The complete 59-test suite was then run three additional times. Every repeated run again passed 59/59.

## Coverage added for this release

- Achievement toast opacity is capped when its rectangle covers a fly body or cached vocabulary plate.
- The Jungle center-trunk snake drawing code is absent.
- Final Catch labels use camera-space fly offsets and a timed fade.
- Friends first-place messaging says `FRIENDS LEADER!` and documents its leaderboard meaning.
- PvP leaderboard grammar uses `1 WIN` and plural `WINS` otherwise.
- Main and Single Player menus use one `MADE BY NICK` credit constant and baseline.
- Fly-label text is centered in physical pixels.
- Version `1.3.0` remains in settings and appears in the How To Play book footer.
- The Custom Frog editor includes a large live preview and relocated controls.
- Sandbox flies begin with `spawnAge: 0` and pass through the same grow/spark rendering functions as normal flies.
- Public private-key migration controls and handlers are absent.

## Existing regression coverage retained

The suite also covers PIN derivation, save merging, achievements, private rooms, direct admission, Quickplay, spectators, CPU takeover, immediate disconnect requeue, label persistence, pause-frame stability, Local Play routing, Versus tooltip behavior, collision separation, swept collision detection, vocabulary parity, clean sign-out, modular bundle construction, and guarded legacy-owner recovery.

## Browser rendering smoke test

The built production assets were assembled in their normal load order and executed in headless Chromium at 1280×720 with test-only API and storage adapters. The following screens rendered without JavaScript errors:

- Friends login
- main menu
- Frog Color
- redesigned Custom Frog editor
- Lake Single Player with live vocabulary plates
- Pause menu
- How To Play book with `VERSION 1.3.0` footer
- Sandbox immediately after fly spawn and after the spawn effect completed

The early Sandbox frame visibly showed the normal sparkle/grow effect; the later frame showed the same flies at full size.

## Limits

Nothing was deployed to the user's Cloudflare account. The browser environment blocks real network navigation, so the rendering smoke test used local test-only API/storage adapters and did not verify production cookies, live Durable Objects, real two-device WebSockets, or production latency. Final Catch, achievement overlap, and online behavior are covered by source/function tests but still require a live post-deployment play check.
