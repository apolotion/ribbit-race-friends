import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectFile as read} from './source-reader.mjs';

const versus=read('client/game/63-versus-rendering-ui.js');
const tutorial=read('client/game/125-tutorial-rendering.js');
const hooks=read('client/game/126-tutorial-hooks.js');
const pauseControls=read('client/game/73-rendering-menus-overlays.js');
const online=read('client/game/110-online-mobile-polish.js');
const integrations=read('client/game/132-cross-screen-integration.js');

function between(s,from,to) {
  const a=s.indexOf(from); assert.ok(a>=0,from);
  const b=s.indexOf(to,a+from.length); assert.ok(b>a,to);
  return s.slice(a,b);
}

test('Polish 24 does not overlay a second Versus pause panel during tutorials',()=>{
  const branch=versus.slice(versus.indexOf('function drawPvpScene()'));
  assert.match(branch,/game\.state === "paused" && !tutorial\.active/);
  const drawing=between(hooks,'const originalDrawScene = drawScene','// Script actions use wall-clock deadlines');
  assert.match(drawing,/drawTutorialOverlay\(\)[\s\S]{0,260}drawTutorialPauseOverlay\(\)/);
});

test('Solo pause defers to one panel and paints dialogue below that panel',()=>{
  const interception=between(hooks,'const originalDrawSoloPauseOverlayForTutorial','const originalResumePausedGameForTutorial');
  assert.match(interception,/if \(tutorial\.active\) return/);
  assert.doesNotMatch(interception,/drawTutorialDialogue\(/);
  const overlay=between(tutorial,'function drawTutorialOverlay()','function getTutorialCompletionButtonRects');
  assert.match(overlay,/if \(game\.state === "paused"\) \{[\s\S]{0,180}drawTutorialDialogue\(\)/);
});

test('Tutorial pause uses standard Versus pause shell and shared control buttons',()=>{
  const draw=between(tutorial,'function drawTutorialPauseOverlay()','function drawTutorialOverlay()');
  assert.match(draw,/drawOverlayPanel\([\s\S]{0,60}"PAUSED"/);
  assert.match(draw,/drawPauseControls\(\)/);
  assert.match(draw,/TUTORIAL CHAPTERS/);
  assert.match(draw,/CHAPTER \$\{previewIndex \+ 1\} \/ \$\{catalog\.length\}/);
  assert.match(draw,/getTutorialPauseChapterRects\(\)/);
  assert.match(pauseControls,/tutorial\.active && game\.state === "paused" \? "RESTART SCENE" : "RESTART"/);
  assert.match(pauseControls,/tutorial\.active && game\.state === "paused" \? "EXIT TUTORIAL" : "HOME MENU"/);
});

test('Chapter browse retains Ember dialogue and works by mouse, keyboard and scroll',()=>{
  const selection=between(tutorial,'function selectTutorialChapter','function applyTutorialChapterPreview');
  assert.match(selection,/tutorial\.pauseChapterPreviewIndex = nextIndex/);
  assert.doesNotMatch(selection,/tutorial\.dialogueOpen\s*=\s*false/);
  assert.match(hooks,/\["ArrowLeft", "ArrowRight"\]/);
  assert.match(hooks,/canvas\.addEventListener\("pointerdown"/);
  assert.match(hooks,/canvas\.addEventListener\("wheel"/);
  assert.match(hooks,/tutorialPauseLastWheelAt/);
  assert.match(hooks,/game\.pauseHelpOpen/);
  assert.match(hooks,/Number\.isInteger\(tutorial\.pauseChapterPreviewIndex\)\) applyTutorialChapterPreview\(\)/);
});

test('Restart/exit discard uncommitted chapter previews and no DOM fullscreen tile overlaps the pause panel',()=>{
  const activate=between(hooks,'const originalActivatePauseSelectionForTutorial','function tutorialBlocksLiveInput');
  assert.match(activate,/if \(game\.pauseSelection === "home"\) \{\s*tutorial\.pauseChapterPreviewIndex = null/);
  assert.match(activate,/if \(game\.pauseSelection === "restart"\) \{[\s\S]{0,300}restartTutorialSceneImmediately\(\)/);
  assert.match(online,/fsButton\.style\.display="none";/);
  assert.match(integrations,/game\.state==="playing"&&e\.kindPolish19==="pvp"/);
});
