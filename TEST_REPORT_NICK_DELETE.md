# Test report — Nick legacy-delete repair

Build: `2026.10.10-friends-centered-labels-themed-book-1`

## Passed

- Complete browser bundle rebuilt from the eight modular game source files.
- Server and browser modules parse.
- All required external assets are present.
- 59/59 automated tests passed in the current complete project.
- Recovery variable is read from `OWNER_DELETE_LEGACY_USERNAME`.
- Recovery runs during Durable Object construction and at the start of every Hub request.
- V2 one-shot marker prevents a later replacement PIN account from being deleted.
- PIN accounts are explicitly refused.
- Legacy cleanup removes sessions, awards, private online profile/rating data, and the user row.
- Existing PIN hashing, logout reset, vocabulary, Quickplay, online word stability, and modular client tests still pass.

## Limits

The tests do not access the user's live Cloudflare Durable Object or delete any production account. The owner must verify the production log status after deploying and setting the temporary environment variable.
