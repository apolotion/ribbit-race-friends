# Ribbit Race Friends — 4-Digit PIN Login

Build `2026.10.10-friends-label-collision-polish-1` changes saved Friends accounts from generated private keys to a username plus a user-chosen four-digit PIN.

Security: PINs are never stored in plaintext. Each account receives a random salt and stores a PBKDF2-SHA256 derived hash using 100,000 iterations. Login and account-management requests remain rate-limited. Because four digits have only 10,000 possibilities, players should not reuse a PIN that protects another service.

Existing accounts are preserved. An account with the old private-key credential can use **Migrate Old Private-Key Account** once. Successful migration sets the new PIN, clears the old key hash, signs out older sessions, and keeps the existing save.

Do not roll the application back to the private-key build after users begin migrating.
