# Ribbit Race Friends 1.7.6 — Test Report

## Commands run

```text
npm run check
npm test
```

## Final result

```text
Built game bundle from 13 modules
Server and browser modules parse; 21 external assets are present

146 tests
146 passed
0 failed
```

## Tutorial-specific coverage

The automated checks verify:

- 1.7.6 build and V6 first-boot marker;
- portrait preloading and no gameplay-frog portrait fallback;
- one-line dialogue progression and dynamic text scaling;
- hidden authored flies during dialogue;
- normal sparkle/grow spawning after dialogue;
- 500 ms two-stage smoke reset and both poof sounds;
- max-charge failure only after landing;
- tongue-only completion on a normal Park spawn;
- wrong-then-right order enforcement;
- unchanged Park platform geometry for drop lessons;
- trophy Current Goal panel and red failure flash;
- normal Single Player victory screen and melody reuse.

## Limits

No files were deployed to the user's Cloudflare account. Exact feel on a physical iPhone, Promethean board, and the full twelve-step production tutorial still requires a manual post-deployment playthrough.
