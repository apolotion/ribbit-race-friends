import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readGameModuleGroup } from "./source-reader.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

function between(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} -> ${end}`);
  return source.slice(from, to);
}

test("Polish 21 uses responsibility-focused modules instead of giant runtime files", () => {
  const directory = join(root, "client/game");
  const modules = readdirSync(directory).filter((name) => /^\d+-.+\.js$/.test(name));
  assert.equal(modules.length, 29);
  const lineCounts = modules.map((name) => read(`client/game/${name}`).split(/\r?\n/).length);
  assert.ok(Math.max(...lineCounts) < 3000, `largest module has ${Math.max(...lineCounts)} lines`);
  for (const name of [
    "60-versus-physics.js",
    "61-versus-catches-rounds.js",
    "62-versus-cpu.js",
    "63-versus-rendering-ui.js",
    "70-rendering-text-world.js",
    "71-rendering-entities-hud.js",
    "72-rendering-customization.js",
    "73-rendering-menus-overlays.js",
    "120-tutorial-config.js",
    "125-tutorial-rendering.js",
    "130-polish-ui-replay-language.js"
  ]) assert.ok(modules.includes(name), name);
});

test("bundle builder discovers ordered modules and compacts only generated output", () => {
  const builder = read("scripts/build-game.mjs");
  assert.match(builder, /discoverModules\(\)/);
  assert.match(builder, /Number\.parseInt\(left, 10\)/);
  assert.match(builder, /compactForProduction\(source\)/);
  assert.match(builder, /!trimmed\.startsWith\("\/\/"\)/);
  assert.match(read("client/game/README.md"), /Do not edit the generated bundle directly/);
});

test("bitmap text hot paths use bounded normalization, measurement, and glyph caches", () => {
  const rendering = read("client/game/70-rendering-text-world.js");
  assert.match(rendering, /BITMAP_TEXT_CACHE_LIMIT = 2048/);
  assert.match(rendering, /bitmapNormalizeCache = new Map\(\)/);
  assert.match(rendering, /bitmapMeasureCache = new Map\(\)/);
  assert.match(rendering, /bitmapGlyphPixelCache = new Map\(\)/);
  assert.match(rendering, /Int8Array\.from\(coordinates\)/);
  assert.match(rendering, /measureNormalizedBitmapText/);
});

test("Versus hot loops avoid per-frame filter, map, and Map allocations", () => {
  const versus = readGameModuleGroup(60, 69);
  const platforms = between(versus, "function updatePvpMovingPlatforms", "function emitPvpPlayerSfx");
  assert.doesNotMatch(platforms, /\.filter\(|\.map\(|new Map\(/);
  assert.match(platforms, /playerOneCarrier/);
  const impacts = between(versus, "function updatePvpImpactEffects", "function drawPvpImpactEffects");
  assert.match(impacts, /writeIndex/);
  assert.doesNotMatch(impacts, /\.filter\(/);
});

test("pointer conversion shares one canvas rectangle read per animation frame", () => {
  const input = read("client/game/80-input-loop-startup.js");
  const mobile = read("client/game/110-online-mobile-polish.js");
  assert.match(input, /cachedCanvasPointMetrics/);
  assert.match(input, /requestAnimationFrame\(invalidateCanvasPointMetrics\)/);
  assert.match(mobile, /typeof getCanvasPoint === "function"/);
});

test("unreachable legacy Online rendering and duplicate tooltip code are removed", () => {
  const currentPolish = readGameModuleGroup(130, 139);
  assert.doesNotMatch(currentPolish, /legacy block inert so the real menu owns rendering\/input/);
  assert.doesNotMatch(currentPolish, /function getSpec\(\)[\s\S]*function bubble\(spec\)/);
});
