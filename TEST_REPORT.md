# Test report — Single Player word stability

Build: `2026.10.09-friends-stable-word-labels-1`

## Passed

- `npm run check`: passed; server modules and full game HTML parse successfully.
- `npm test`: 34 tests passed, 0 failed.
- Existing PIN, save, room, Quickplay, logout, vocabulary, Local Play, and Versus-tooltip checks remain green.
- Added/updated checks verify that fly labels use a persistent placement cache rather than per-frame collision re-solving.
- Existing label placements remain cached until the corresponding fly leaves the active fly list.
- The actual extracted label-placement function was executed for 120 repeated frames; existing label rectangles stayed byte-for-byte identical when another fly was added and when a different fly was removed.
- Fly vocabulary labels no longer contain the old fractional `translate(0.25, 0)` duplicate draw pass.
- The Single Player prompt also uses one bitmap draw pass to avoid scaling shimmer.

## Why this addresses the reported Single Player jitter

The previous build cleared the label-collision layout on every screen paint. Even though that fixed paused-frame accumulation, it meant label placement was continually re-solved as flies entered and left the active set. The new build treats a word plate as part of its fly: once a placement is selected, it stays there for that fly's lifetime. Replacement flies route around already-placed labels instead of moving the labels that are already visible.

## Limits

- No deployment was made to the user's Cloudflare account.
- Production browser/GPU scaling and the user's specific display were not available here.
- The package should be hard-refreshed after Cloudflare finishes deploying so the old HTML is not retained by the browser.
