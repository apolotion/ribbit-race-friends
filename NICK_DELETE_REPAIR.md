# Guarded legacy-account cleanup

Current compatible build: `2026.10.10-friends-visual-polish-1`

The FriendsHub owner-recovery hook remains available for deleting a specifically named, pre-PIN legacy account whose private key is permanently lost. It refuses to delete a modern PIN account.

Use `OWNER_DELETE_LEGACY_USERNAME` only as a temporary **runtime** Worker variable under Settings > Variables & Secrets—not as a Cloudflare build variable. Open the game once to trigger the request-time check, verify the Observability log, then remove the variable immediately.

Do not delete the FriendsHub Durable Object. That would affect every Friends account.
