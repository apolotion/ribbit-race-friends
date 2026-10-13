# Ribbit Race Friends — Polish 33

Version: **1.7.21**  
Build: `2026.10.12-friends-polish-33`

The full modular project is included. All requested tutorial changes were made in the authored gameplay sources and compiled into `public/scripts/game.bundle.js`.

## Changes

- Swap player and Ember opening sides for the Borrow My Bounce demonstrations. The playable attempt retains its existing starting positions. Both sides have an authored, matching fly with its standard name label; the playable fly is on the opposite side of the map.
- Under-bonk demonstration uses a genuine 40%-charge jump from the right middle platform to the lower center platform and a close-range player under-bonk. Removed the midair teleport.
- Low-profile demonstration uses five actual jump/landing cycles with completion on the fifth clean landing, avoiding the previous restart poof.
- First rebound demonstration uses 75%-charge launches on both frogs.
- Three clean rebounds practice keeps cumulative progress after a miss and uses the middle-left/middle-right symmetrical second layout.
- Fix the apostrophe glyph and limit the orange emphasis in the rebound dialogue to “both turned around.”

## Verification

- `npm check` and 381/381 automated tests passed.
- In-memory Chromium ran the real engine and confirmed a natural under-bonk landing and collision, five low hops and completion without poof, 75%-charge rebound collision, the correct symmetric rebound practice positions, retaining progress through a missed rebound, and matching vocabulary fly on the opposite side.
- No live deployment or online integration test was performed. Cloudflare API schema and database unchanged.
