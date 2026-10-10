# Free the lost legacy `Nick` username

Build: `2026.10.10-friends-label-collision-polish-1`

The old `Nick` row is stored in the live `FriendsHub` Durable Object SQLite database, not in a GitHub JSON file. The screenshot saying **That username is taken** means the row still exists.

This recovery deletes only an account that still has no PIN. It refuses to delete a modern PIN account.

## Why the earlier attempt could fail

The earlier modular patch ZIP did not include `src/hub.js`. If that ZIP was used without first installing the full recovery package, the live Worker never received the legacy-delete handler. This repair patch includes the missing backend file and also checks the recovery variable on every Hub API request instead of relying only on a Durable Object cold start.

## 1. Install the repair files

Copy these files from the repair patch into the existing `apolotion/ribbit-race-friends` repository, preserving their paths:

```text
src/hub.js
src/common.js
public/scripts/cloud-client.js
tests/friends-patch.test.mjs
```

Commit directly to `main`, for example:

```text
Repair one-time legacy Nick deletion
```

Wait for Cloudflare to finish both:

```text
npm run check && npm test
npx wrangler deploy
```

Open:

```text
https://ribbit-race-friends.apolotion.workers.dev/api/health
```

Before continuing, verify the response contains:

```json
"build": "2026.10.10-friends-label-collision-polish-1"
```

## 2. Arm the one-time deletion

In Cloudflare:

**Workers & Pages → ribbit-race-friends → Settings → Variables and Secrets**

Add a plain-text variable:

```text
Name:  OWNER_DELETE_LEGACY_USERNAME
Value: nick
```

Save/deploy the setting and wait for that deployment to finish.

## 3. Trigger and verify it

Open the normal Friends game in a fresh tab. Its automatic `apiBootstrap` request triggers the cleanup.

Then check:

**ribbit-race-friends → Observability → Logs**

Search for:

```text
Owner legacy account cleanup
```

Success looks like:

```text
Owner legacy account cleanup: {"status":"deleted-legacy","username":"nick",...}
```

Other statuses:

- `not-found`: the account is already gone; proceed to create it.
- `refused-pin-account`: the account already has a PIN. Stop; use an owner PIN reset instead of deletion.
- no matching log: the new build or environment variable is not active yet. Recheck `/api/health` and the latest deployment.

## 4. Disarm the deletion immediately

Return to **Settings → Variables and Secrets**, delete:

```text
OWNER_DELETE_LEGACY_USERNAME
```

Save/deploy again.

The code also stores a one-time V2 tombstone, but removing the variable is still the correct cleanup.

## 5. Recreate Nick

Hard-refresh the game, choose **Create Account**, and enter:

```text
Username: Nick
PIN: your new 4 digits
Confirm PIN: the same 4 digits
```

This creates a fresh account. The old private-key save is permanently discarded.

## Do not do this

Do not delete the `FriendsHub` Durable Object. That would risk every Friends account and save.
