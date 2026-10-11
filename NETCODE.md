# Online transport and smoothing

Ribbit Race Friends uses secure Cloudflare WebSockets (`wss://`). Browser WebSockets are reliable and ordered over TCP/TLS. They are not UDP, and there is no port-type switch that can turn a WebSocket into UDP.

The match remains host-authoritative:
- the authority browser runs the shared simulation;
- input changes are sent through the room WebSocket;
- authoritative snapshots correct the receiving client;
- the guest display now uses interpolation plus short velocity-based extrapolation;
- spectators use buffered interpolation and rendered charge trajectories.

This is rollback-inspired presentation smoothing, not a full deterministic rollback implementation. A true rollback conversion would require deterministic simulation on both clients, input history, state snapshots, resimulation, and a different reconciliation architecture. The current update improves visual symmetry without changing the validated scoring authority.
