# Friends PIN-account compatibility

Current build: `2026.10.10-friends-visual-polish-1`

The Friends Edition uses a username plus a user-chosen four-digit PIN. PBKDF2-SHA-256 uses 100,000 iterations, within Cloudflare Workers' supported limit. Existing PIN accounts and saves remain compatible with this release.

The public old-private-key migration interface has been retired. Lost or obsolete legacy accounts are handled only through the installation owner's guarded recovery process. Do not recreate the Worker or Durable Objects during a normal update.
