# Ribbit Race Friends 1.4.1 — test report

Build: `2026.10.10-friends-centered-labels-themed-book-1`  
Displayed version: `VERSION 1.4.1`

Overall: **PASS**

## Build and source validation

The exact project source completed:

```text
npm run check
```

Result:

```text
Built game bundle from 9 modules (1029324 bytes).
Server and browser modules parse; 11 external assets are present; no Google or WebRTC runtime dependency.
```

This validates the responsibility-based game modules, generated browser bundle, Worker source, public assets, and script/style references.

## Automated tests

The exact project source completed:

```text
npm test
```

Result:

```text
82 tests
82 passed
0 failed
```

The complete test suite was then repeated three additional times. Every repeated run again passed **82/82**.

The suite includes targeted checks for:

- exact fly-label centering at the upper-right edge of Lake;
- deliberate overlap with the pause-button region rather than horizontal label displacement;
- translucent running-state pause rendering;
- frog-palette-derived compact book and open How To Play panel;
- persistent Single Player and online label placements;
- pause-frame stability;
- PIN authentication and save compatibility;
- Quickplay, disconnect CPU takeover, and immediate requeue;
- Fastest Time/Fewest Jumps replay storage and Worker forwarding;
- Mobile Mode and independent two-player touch pointers;
- thematic hat progression and reversible Playtest state;
- collision, bonk, rebound, and anti-tunneling behavior.

## Browser visual smoke test

The production HTML, CSS, and generated scripts were executed in Chromium with test-only in-memory storage and mocked same-origin API responses. No JavaScript errors occurred.

Verified visually:

- Lake fly plates remain centered directly over the flies, including a wide upper-right plate near the pause control;
- the running pause button is visibly translucent;
- Pause uses a book icon derived from the active Azure frog palette;
- the open How To Play book uses the same frog palette for its header, page, divider, and version footer;
- `VERSION 1.4.1` appears inside the book footer.

Preview files:

- `Ribbit_Race_1.4.1_Lake_Centered_Labels.png`
- `Ribbit_Race_1.4.1_Pause_Themed_Book_Button.png`
- `Ribbit_Race_1.4.1_Themed_How_To_Play.png`

The managed Chromium environment blocks ordinary localhost and `file:` navigation, so the visual run used an inline test document assembled from the exact production assets. Cloudflare deployment, real account storage, production replay upload, and physical multitouch hardware were not exercised here.

## Packaging verification

The final complete repository ZIP was extracted to a fresh directory and the exact commands below were rerun successfully:

```text
npm run check
npm test
```

No live Cloudflare Worker or Durable Object was modified by these tests.
