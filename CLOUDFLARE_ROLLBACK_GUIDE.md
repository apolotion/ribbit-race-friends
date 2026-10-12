# Cloudflare setup for smoother Ribbit Race online play

A dashboard setting alone cannot eliminate latency between two players. The best result comes from combining sensible Cloudflare placement with client prediction, a small input buffer, and rollback/resimulation.

## Recommended production shape

Use one Durable Object per active match. Both players should keep one direct WebSocket connection to that same object. The Durable Object should own the authoritative input timeline, match seed, fly state, scores, and periodic checksums. Avoid normal HTTP polling during a match.

When a room is first created, provide a location hint chosen from the two players' measured regions. For a private room, the first player's region is a practical fallback. For Quickplay, the matchmaker should prefer opponents with compatible latency and choose a midpoint-like region when possible. A location hint affects initial placement only and should be treated as best effort, so record the actual round-trip time after connection and adapt the client buffer.

Smart Placement can help Worker code that repeatedly talks to a centralized backend, but it is not a substitute for choosing a sensible Durable Object location. Test it with real match telemetry before enabling it globally.

## Rollback settings to start with

- Simulation: fixed 60 Hz locally.
- Network input packets: 30–60 per second, containing only compact input state and frame number.
- Local prediction: immediate for the local frog.
- Remote prediction: repeat the last known input for a few frames.
- Input delay: begin at 2 frames and raise to 3–4 only when jitter requires it.
- Rollback window: retain at least 8–12 simulation frames of state.
- Authoritative checkpoints: send compact checksums and key state periodically rather than full state every frame.
- Reconciliation: when late input arrives, restore the saved frame, apply the corrected input, and resimulate to the present.
- Visual smoothing: never interpolate the local frog; visually ease only corrected remote positions over a few render frames.

## Prevent one-sided choppiness

Measure latency in both directions instead of assuming both players have the same experience. Track per player:

- WebSocket round-trip time.
- Jitter over the last several seconds.
- Late-input percentage.
- Rollback frames per second.
- Largest rollback in the last minute.
- Resimulation cost.

Let each client independently choose its presentation delay from its own jitter. Do not make the lower-latency player inherit the other player's visual delay. The server should remain authoritative, but both clients should predict their own input immediately.

## Cloudflare dashboard and deployment checklist

1. Keep the match simulation inside a Durable Object and route WebSockets through the Worker to that object.
2. Use a location hint only when creating a new match object; do not recreate the object while a match is active.
3. Keep compatibility dates and Wrangler current, but deploy updates to a test environment before production.
4. Enable Workers observability and log match-region, RTT, jitter, late inputs, rollbacks, and disconnect cause without logging student vocabulary answers or private account data.
5. Compare real Houston-to-Houston, Houston-to-Florida, mobile-data, and school-Wi-Fi matches before changing global input-delay defaults.
6. Keep reconnect and requeue separate: leaving a match must release that player's queue lock immediately, even if the old Durable Object continues finishing or expiring the abandoned match.
7. Use WebSocket hibernation for idle lobby/room connections when appropriate, but keep active-match state compact enough to restore safely.

## Practical target

A good first target is immediate local control, a 2-frame input delay, and rollbacks that are usually under 4 frames. Increase delay only when telemetry shows repeated late inputs. A stable 3-frame buffer usually feels better than an unstable 1-frame buffer that constantly corrects the remote frog.
