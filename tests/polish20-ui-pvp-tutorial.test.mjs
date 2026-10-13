import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = readGameModuleGroup(120, 139);
const rendering = readGameModuleGroup(70, 79);
const nav = read("client/game/40-ui-navigation-audio.js");
const index = read("public/index.html");
const common = read("src/common.js");

function block(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} -> ${end}`);
  return source.slice(from, to);
}

test("Polish 21 cache marker is wired through the Worker, client, and asset URLs", () => {
  for (const source of [tutorial, common, index, read("public/scripts/cloud-client.js")]) {
    assert.match(source, /2026\.10\.13-friends-polish-43/);
  }
});

test("Account and device windows reuse the main-menu frame and have themed headers", () => {
  const frame = block(tutorial, "function drawUtilityWindowFrame", "function drawUtilityRow");
  assert.match(frame, /const panel = \{ x:38, y:15, w:404, h:228 \}/);
  assert.match(frame, /drawBackground\(previewLevelId\)/);
  assert.match(frame, /const header = \{ x:52, y:25, w:376, h:29 \}/);
  assert.match(tutorial, /drawUtilityWindowFrame\("ACCOUNT & LANGUAGE", "PLAYER SETTINGS"\)/);
  assert.match(tutorial, /drawUtilityWindowFrame\("COMPUTER \/ MOBILE MODE", "CHOOSE AN INPUT STYLE"\)/);
});

test("keyboard focus gives profile and device icons the same themed halo as utility icons", () => {
  const menu = block(rendering, "const drawSmallMainIconButton", "drawBitmapText(isRibbitMobileMode()");
  assert.match(menu, /ctx\.fillRect\(rect\.x - 2, rect\.y - 2, rect\.w \+ 4, rect\.h \+ 4\)/);
  assert.match(menu, /drawSmallMainIconButton\(MAIN_UI\.profileButton, "profile"/);
  assert.match(menu, /drawSmallMainIconButton\(MAIN_UI\.deviceButton, "device"/);
  assert.match(nav, /Object\.freeze\(\["profile", "device", "achievements", "stats"\]\)/);
});

test("adjacent icon groups keep breathing room and Tutorial hover suppresses Random highlight", () => {
  assert.match(nav, /profileButton: Object\.freeze\(\{ id: "profile", x: 48, y: 211, w: 24, h: 24 \}\)/);
  assert.match(nav, /deviceButton: Object\.freeze\(\{ id: "device", x: 78, y: 211, w: 24, h: 24 \}\)/);
  assert.match(nav, /settingsButton: Object\.freeze\(\{ id: "settings", x: 349, y: 211, w: 24, h: 24 \}\)/);
  assert.match(nav, /tutorialButton: Object\.freeze\(\{ id: "tutorial", x: 379, y: 211, w: 24, h: 24 \}\)/);
  assert.match(nav, /timeButton: Object\.freeze\(\{ x: 409, y: 211, w: 24, h: 24 \}\)/);
  assert.match(rendering, /anotherControlHovered[\s\S]{0,220}game\.homeTutorialButtonHovered/);
});

test("Achievements leaderboard displays the selected trophy-and-wreath image inside the button", () => {
  const medal = block(tutorial, "function drawMiniMedalButton", "const LEADERBOARD_METRICS");
  assert.match(tutorial, /leaderboardMedalSprite\.src = "\/icons\/leaderboard-trophy-wreath\.png"/);
  assert.match(medal, /ctx\.drawImage\(leaderboardMedalSprite,rect\.x\+1,rect\.y\+2,26,23\)/);
  assert.match(medal, /ctx\.imageSmoothingEnabled=false/);
  assert.match(medal, /const skin=getSelectedSkin\(\)/);
});

test("Undo and Redo arrows stay inside their boxes and no longer show helper bubbles", () => {
  const history = block(rendering, "function drawCustomHistoryButton", "function getCurrentHatTargetSkinId");
  assert.match(history, /ctx\.scale\(direction < 0 \? 0\.72 : -0\.72, 0\.72\)/);
  const tooltips = block(tutorial, "function drawCustomTooltips", "function toggleFullscreen");
  assert.doesNotMatch(tooltips, /UNDO|REDO/);
});

test("PvP chapter navigation previews while paused and applies only on resume", () => {
  const select = block(tutorial, "function selectTutorialChapter", "function applyTutorialChapterPreview");
  assert.match(select, /tutorial\.pauseChapterPreviewIndex = nextIndex/);
  assert.doesNotMatch(select, /tutorial\.dialogueOpen = false/);
  assert.doesNotMatch(select, /configurePvpStep|configureSoloStep/);
  assert.match(tutorial, /if \(Number\.isInteger\(tutorial\.pauseChapterPreviewIndex\)\) applyTutorialChapterPreview\(\)/);
  assert.match(tutorial, /function polish19ApplyChapterPreview\(\)[\s\S]{0,100}return applyTutorialChapterPreview\(\)/);
});

test("PvP tutorial chapter strip is hidden during gameplay and dialogue is centered between scoreboards", () => {
  assert.match(tutorial, /function drawTutorialProgress\(\) \{\s*if \(!tutorial\.active \|\| tutorial\.kind === "pvp"\) return/);
  const dialogue = block(tutorial, "function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const textPanel = \{ x: 90, y: 6, w: 239, h: 54 \}/);
  assert.match(dialogue, /const portraitPanel = \{ x: 335, y: 6, w: 54, h: 54 \}/);
});

test("PvP transitions hide stale dialogue during authored poofs", () => {
  assert.match(tutorial, /transitionHeldLineText/);
  assert.match(tutorial, /beginDialogueLine\(0, \{ delayMs:POOF_TRANSITION_MS \+ \(tutorialStep\(\)\?\.setup === "pvpSkyBonk" \? 500 : 300\), holdPreviousText:false \}\)/);
  assert.match(tutorial, /tutorial\.dialogueHeldLineText = ""/);
  assert.match(tutorial, /tutorial\.dialogueHeldUntil = 0/);
});

test("Ember retains her facing unless she hits a wall or performs a side rebound", () => {
  const runtime = block(tutorial, "function polish19PvpRuntimeCorrection", "const polish19OriginalUpdateTutorial");
  assert.doesNotMatch(runtime, /(?:ember|player)\.dir\s*=/);
  assert.doesNotMatch(runtime, /(?:ember|player)\.chargeFacingDir\s*=/);
  const scriptedPress = block(tutorial, "function scriptPvpPress", "function scriptPvpRelease");
  assert.match(scriptedPress, /player\.grounded &&/);

});

test("high and low drop-bonk layouts use mirrored clear lanes and correct facing", () => {
  assert.match(tutorial, /case "pvpDemoDropLow"[\s\S]{0,420}positionPvpOnPlatform\(ember, lowerMiddle, -1, emberOffset\)/);
  assert.match(tutorial, /case "pvpDropLow"[\s\S]{0,360}positionPvpOnPlatform\(p1, lowerMiddle, 1, playerOffset\)/);
  assert.match(tutorial, /case "pvpDemoDropHigh"[\s\S]{0,360}positionPvpOnPlatform\(ember, top, -1, offset\)/);
  assert.match(tutorial, /case "pvpDemoDropHigh"[\s\S]{0,420}positionPvp\(p1, PARK_PLATFORMS\[3\]\.x - p1\.w - 4, CONFIG\.groundY - p1\.h, 1\)/);
  assert.match(tutorial, /case "pvpDropHigh"[\s\S]{0,360}positionPvpOnPlatform\(p1, top, 1, 4\)/);
  assert.match(tutorial, /case "pvpDropHigh"[\s\S]{0,420}positionPvp\(ember, PARK_PLATFORMS\[3\]\.x \+ PARK_PLATFORMS\[3\]\.w \+ 4, CONFIG\.groundY - ember\.h, -1\)/);
});

test("scripted player jumps and poof transitions cannot be canceled by live input", () => {
  assert.match(tutorial, /tutorial\.pvpPlayerScriptLocked/);
  assert.match(tutorial, /tutorialBlocksLiveInput\(\)[\s\S]{0,380}tutorial\.pvpPlayerScriptLocked/);
  assert.match(tutorial, /pressPvpButton = function\(index[\s\S]{0,450}if \(!finalCpu && tutorialBlocksLiveInput\(\)\) return/);
  assert.match(tutorial, /releasePvpButton = function\(index[\s\S]{0,450}if \(!finalCpu && tutorialBlocksLiveInput\(\)\) return/);
  assert.match(tutorial, /tutorial\.pvpFrogsHidden/);
});
