# Ribbit Race Friends 1.7.5 — Tutorial Refinement Test Report

Build: `2026.10.11-friends-tutorial-refinement-1`

## Automated pipeline

```text
npm run check
Built game bundle from 13 modules.
Server and browser modules parse; 21 external assets are present.

npm test
135 tests
135 passed
0 failed
```

## Targeted tutorial checks

- New V5 first-boot marker and automatic post-authentication start retry.
- Compact top dialogue panel and right-side portraits.
- Five mirrored Ember portrait assets are packaged.
- No on-map Ember mentor frog is drawn during the Solo tutorial.
- Authored flies are no longer frozen to their base coordinates.
- Failed attempts call the scenario reset synchronously and render smoke at departure and arrival.
- The tongue lesson requires a catch whose source is `tongue`.
- The wrong-fly lesson checks wrong-then-right before landing.
- The wall-turn lesson allows two jumps while rebound remains one attempt.
- Existing PIN accounts, saves, Quickplay, online play, Mobile Mode, hats, replays, and previous regression checks remain green.

## Browser limitation

A local Chromium navigation test was attempted, but the managed environment blocked local HTTP access with `ERR_BLOCKED_BY_ADMINISTRATOR`. The production deployment still needs a manual playthrough of all tutorial scenarios.

Nothing was deployed to the live Cloudflare Worker from this environment.
