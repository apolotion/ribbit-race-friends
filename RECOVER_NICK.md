# Recover the lost legacy `Nick` username

This is a one-time owner cleanup for an account that **still uses the old private-key format** and whose key is permanently lost. It does not delete PIN accounts.

## Important
- The account is in the live FriendsHub Durable Object SQLite database, not a GitHub JSON file.
- This operation permanently deletes the old legacy `Nick` cloud save. If the old key is truly lost, that save cannot be authenticated or recovered by the public app.
- Do **not** delete the FriendsHub Durable Object. That would affect every Friends account.

## Install the recovery-capable code
1. Replace `src/hub.js`, `src/common.js`, `public/index.html`, and `tests/friends-patch.test.mjs` in the existing GitHub repository with the files in this package.
2. Commit to `main`. Suggested message: `Add one-time lost legacy account cleanup`.
3. Wait for the existing Cloudflare build to finish successfully. Keep the same Worker and Durable Objects.

## Delete only the old `nick` legacy row
1. Cloudflare → Workers & Pages → `ribbit-race-friends` → Settings → Variables and Secrets.
2. Add a plain-text environment variable:
   - Name: `OWNER_DELETE_LEGACY_USERNAME`
   - Value: `nick`
3. Save/deploy the setting.
4. Open the normal Friends game once in a fresh tab. The game's bootstrap request wakes FriendsHub and runs the one-time cleanup.
5. Refresh the login page and choose Create Account. Enter `Nick`. If the old row was removed, the username can now be created normally.
6. Immediately return to Cloudflare Settings → Variables and Secrets and delete `OWNER_DELETE_LEGACY_USERNAME`. Save/deploy again.

The code records a one-shot tombstone before a replacement account can be affected. Even if the variable is accidentally left behind, a newly recreated `Nick` account will not be deleted on later requests. The cleanup also refuses to delete an account that already has a PIN.

## Recreate the account
Use the normal Friends login page:
- Create Account
- Username: `Nick`
- Choose a new 4-digit PIN
- Confirm the PIN

This creates a fresh account. The old legacy save is not copied into it.
