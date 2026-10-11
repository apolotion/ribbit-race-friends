# Friends PIN-account compatibility

Current build: `2026.10.11-friends-mobile-experience-1`

The Friends Edition uses a username plus a user-chosen four-digit PIN. PBKDF2-SHA-256 uses 100,000 iterations, within the configured Cloudflare implementation limit. Existing PIN accounts and saves remain compatible with this release.

The public old-private-key migration interface remains retired. Lost or obsolete legacy accounts are handled only through the installation owner's guarded recovery process. Do not recreate the Worker or Durable Objects during a normal update.
