import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";

const ui = readFileSync("client/game/130-polish-ui-replay-language.js", "utf8");
const source = (start,end) => {
  const i=ui.indexOf(start),j=ui.indexOf(end,i+start.length);
  assert.ok(i>=0 && j>i,`${start} should precede ${end}`);
  return ui.slice(i,j);
};
function png(path){
  const bytes=readFileSync(path);
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes};
}

test("chosen green laurel and gold trophy renders in the existing achievements leaderboard box",()=>{
  const sprite=png("public/icons/leaderboard-trophy-wreath.png");
  assert.ok(sprite.width<=28 && sprite.height<=28);
  assert.match(ui,/leaderboardMedalSprite\.src = "\/icons\/leaderboard-trophy-wreath\.png"/);
  const draw=source("function drawMiniMedalButton","const LEADERBOARD_METRICS");
  assert.match(draw,/ctx\.drawImage\(leaderboardMedalSprite,rect\.x\+1,rect\.y\+2,26,23\)/);
  assert.match(draw,/ctx\.imageSmoothingEnabled=false/);
});

test("exact user-supplied star is delivered as a transparent pixel PNG",()=>{
  const star=png("public/icons/flashcard-star.png");
  assert.ok(star.width<=24 && star.height<=24);
  assert.ok(statSync("public/icons/flashcard-star.png").size>100);
  assert.match(ui,/flashcardStarSprite\.src = "\/icons\/flashcard-star\.png"/);
  assert.match(ui,/ctx\.drawImage\(flashcardStarSprite,x,y,width,height\)/);
});

test("flashcard star sits inside the sliding and flipping card surface, not a fixed screen overlay",()=>{
  const card=source("function drawFlashcardsMenu()","function drawDeviceModeIcon");
  const inner=card.slice(card.indexOf("const drawCardFace="),card.indexOf("const slideDuration"));
  assert.match(inner,/ctx\.clip\(\)/);
  assert.match(inner,/ctx\.translate\(offsetX,0\)/);
  assert.match(inner,/ctx\.scale\(flipScale,1\)/);
  assert.match(inner,/drawFlashcardStar\(starButton\.x\+starButton\.w\/2,starButton\.y\+starButton\.h\/2,starred\)/);
  assert.doesNotMatch(card.slice(card.indexOf("const slideDuration")),/drawFlashcardStar/);
});

test("left and right changes slide the old and new cards in opposite directions",()=>{
  const movement=source("function moveToFlashcard","function rebuildFlashcardDeck");
  assert.match(movement,/polish\.flashcardSlideDirection = direction < 0 \? -1 : 1/);
  assert.match(movement,/polish\.flashcardIndex = destination/);
  assert.match(movement,/resetFlashcardFace\(\)/);
  const drawing=source("function drawFlashcardsMenu()","function drawDeviceModeIcon");
  assert.match(drawing,/const ease=1-Math\.pow\(1-slideT,3\)/);
  assert.match(drawing,/drawCardFace\(polish\.flashcardSlideFromIndex,polish\.flashcardSlideFromFace,-direction\*card\.w\*ease\)/);
  assert.match(drawing,/drawCardFace\(polish\.flashcardIndex,"english",direction\*card\.w\*\(1-ease\)\)/);
});

test("BACK is visibly labelled and Space at the unstarred deck end restarts all cards",()=>{
  const card=source("function drawFlashcardsMenu()","function drawDeviceModeIcon");
  assert.match(card,/\["back","BACK",""\]/);
  assert.match(card,/polish\.flashcardStars\.length\?"VIEW STARRED":"RESTART DECK"/);
  const button=source("function drawCardButton","const flashcardStarSprite");
  assert.match(button,/if\(title==="BACK"\)/);
  assert.match(button,/drawBitmapText\("BACK"/);
  const action=source("function activateFlashcardButton","function setCanvasMobileMode");
  assert.match(action,/if\(polish\.flashcardStars\.length\)rebuildFlashcardDeck\(true,false\)/);
  assert.match(action,/else rebuildFlashcardDeck\(false,polish\.flashcardShuffled\)/);
  assert.match(ui,/\["Space","Enter","NumpadEnter"\]\.includes\(event\.code\)\)activateFlashcardButton\(1\)/);
});
