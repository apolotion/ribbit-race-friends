# Ribbit Race Friends 1.5.0 — test report

Build: `2026.10.11-friends-mobile-experience-1`  
Displayed version: `VERSION 1.5.0`

Overall: **PASS**

## Build and source validation

The exact project source completed:

```text
npm run check
```

Result:

```text
Built game bundle from 10 modules (1048255 bytes).
Server and browser modules parse; 14 external assets are present; no Google or WebRTC runtime dependency.
```

This validates the responsibility-based modules, generated browser bundle, Worker source, manifest, icons, public references, and script/style assets.

## Automated tests

The exact project completed:

```text
npm test
```

Result:

```text
91 tests
91 passed
0 failed
```

The entire test suite was repeated three additional times. Every repeated run again passed **91/91**.

Targeted coverage includes:

- iPhone Home Screen metadata, standalone manifest, icons, and landscape orientation;
- Mobile/Computer confirmation and repeat installation instructions;
- canvas-native account and device controls;
- hiding the legacy guest/fullscreen toolbar in Mobile Mode;
- iOS long-press/callout suppression;
- letterbox-aware touch mapping;
- gradient Single Player and Versus touch meters;
- independent simultaneous P1/P2 pointer ownership;
- touch pause routing in Versus;
- mobile-specific instruction language and obstruction opacity;
- one-time Versus round awarding and a real result-state transition;
- mobile render scale, replay suppression, throttled loops, and catch-up limits;
- `hatstest`, post-unlock baselines, dashed no-hat art, and no online/human-only hat requirements;
- active-human PvP achievements for either player slot;
- existing PIN, saves, vocabulary, Quickplay, CPU takeover/requeue, labels, replays, custom palettes, collision, and Playtest rollback behavior.

## Trusted browser touch test

The production HTML, CSS, and generated scripts were assembled into an inline browser test document with test-only in-memory storage and same-origin API responses. Chromium was launched in a mobile, touch-enabled context.

The test used trusted browser touch input to verify:

1. Login-page **PLAYING ON MOBILE?** opens the iPhone installation instructions.
2. Guest play initializes the real game runtime.
3. Mobile Mode selects render scale 2.
4. Trusted taps navigate to Local Versus, switch CPU to a second human, and start the match.
5. Two simultaneous touch contacts hold P1 and P2 jump meters at the same time.
6. Ending P1's contact leaves P2 held; ending P2 clears the final held pointer.
7. A trusted tap on the upper-right Versus pause control enters the real `paused` state.
8. No JavaScript page errors occurred.

Diagnostics:

```json
{
  "renderScale": 2,
  "simultaneousPointers": true,
  "independentRelease": true,
  "pauseTouch": true,
  "errors": []
}
```

Preview files:

- `Login_iPhone_Install_Help.png`
- `Mobile_Main_Menu.png`
- `Mobile_Local_Versus_Meters.png`
- `Mobile_Versus_Pause.png`

## Packaging verification

The final complete repository ZIP was extracted into a fresh directory and completed `npm run check` plus all **91/91** tests.

## Limits

- No live Cloudflare Worker or Durable Object was modified.
- A physical iPhone, iOS Safari installation, Promethean board, production network, and production WebSocket match were not available in this environment.
- The trusted Chromium touch test verifies the browser event path and independent pointers, but final feel, battery use, and Safari-specific scheduling still require testing on the target iPhone.
- Normal Safari tabs retain Safari chrome; the included Home Screen installation is the intended app-style full-screen route.
