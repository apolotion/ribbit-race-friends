# Ribbit Race Friends — Polish 21 Optimization Report

## Goals

1. Keep the game functionally identical.
2. Separate responsibilities into smaller, readable source modules.
3. Reduce avoidable allocations and repeated browser-layout work in frequently executed code.
4. Reduce the generated browser bundle without minifying the human-readable source.

## Module map

See `client/game/README.md` for the complete responsibility map. The largest former modules were separated as follows:

- Versus: `60`–`63`
- Rendering: `70`–`73`
- Tutorial and current integration layer: `120`–`132`

The build script now discovers numbered modules automatically. Numeric prefixes are the single source of truth for load order.

## Runtime work removed

- Repeated Unicode normalization and text-width calculations for unchanged HUD/menu strings.
- Nested glyph-string scans for every bitmap-text draw.
- Repeated `getBoundingClientRect()` calls during multiple pointer events in the same frame.
- Per-frame `filter()`, `map()`, and `Map` allocation in moving-platform updates.
- Per-frame replacement arrays when retiring impact effects and tutorial smoke.
- Repeated construction of static tutorial Sets and offset arrays.
- Unreachable legacy Online UI and duplicate tooltip code.

## Bundle strategy

Source files remain readable and commented. The generated bundle removes only blank and comment-only lines. This keeps the source suitable for human editing while reducing the production payload and parser workload.

## Measured static results

| Metric | Polish 20 | Polish 21 | Difference |
|---|---:|---:|---:|
| Runtime modules | 13 | 29 | More focused modules |
| Largest module | 7,910 lines | 2,819 lines | -64.4% |
| Source bytes | 1,466,876 | 1,449,567 | -17,309 |
| Bundle bytes | 1,467,752 | 1,391,524 | -76,228 (-5.2%) |
| Bundle lines | 30,662 | 27,959 | -2,703 (-8.8%) |

These figures measure source organization and generated payload size. Actual frame-rate improvement varies by device and scene; the biggest expected runtime benefit is in text-heavy menus, pointer-heavy screens, Versus moving-platform scenes, and effect-heavy collisions.
