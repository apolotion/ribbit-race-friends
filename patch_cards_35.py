from pathlib import Path
p=Path('/mnt/data/rr-polish35-work/client/game/130-polish-ui-replay-language.js');s=p.read_text()
s=s.replace('''    flashcardHoverKey: "",
''','''    flashcardHoverKey: "",
    flashcardOrder: [],
    flashcardShuffled: false,
    flashcardOnlyStarred: false,
    flashcardComplete: false,
    flashcardFlipAt: 0,
    flashcardFlipFrom: "english",
    flashcardFlipTo: "english",
    flashcardStars: [],
''',1)
start=s.index('  const PROFILE_MENU_RECTS = Object.freeze(')
end=s.index('  const DEVICE_MENU_RECTS = Object.freeze({',start)
s=s[:start]+'''  const PROFILE_MENU_RECTS = Object.freeze(PROFILE_MENU_ROWS.map((row, index) => Object.freeze({
    ...row, x:91, y:78+index*30, w:298, h:26
  })));
  const FLASHCARD_BUTTON_RECTS = Object.freeze({
    previous:Object.freeze({id:"previous",x:72,y:190,w:96,h:26}),
    flip:Object.freeze({id:"flip",x:175,y:190,w:130,h:26}),
    next:Object.freeze({id:"next",x:312,y:190,w:96,h:26}),
    shuffle:Object.freeze({id:"shuffle",x:74,y:221,w:102,h:18}),
    starred:Object.freeze({id:"starred",x:181,y:221,w:118,h:18}),
    back:Object.freeze({id:"back",x:304,y:221,w:102,h:18}),
    star:Object.freeze({id:"star",x:376,y:88,w:24,h:21})
  });
  const FLASHCARD_BUTTON_ORDER = Object.freeze(Object.values(FLASHCARD_BUTTON_RECTS));
  const FLASHCARD_STARS_KEY = "ribbitRaceFlashcardStarsV1";
  function flashcardKey(entry) {return `${String(entry?.english || "").trim()}|${String(entry?.spanish || "").trim()}`;}
  function readFlashcardStars() {
    try {const data=JSON.parse(localStorage.getItem(FLASHCARD_STARS_KEY)||"[]");return Array.isArray(data)?data:[];}
    catch(_){return [];}
  }
  function flashcardEntries() {
    const words = getFlashcardVocabulary();
    if(polish.flashcardOrder.length!==words.length && !polish.flashcardOnlyStarred){
      polish.flashcardOrder=words.map((_,i)=>i);
      polish.flashcardIndex=Math.min(polish.flashcardIndex,Math.max(0,words.length-1));
    }
    const order=polish.flashcardOrder.filter(index=>Number.isInteger(index)&&words[index]);
    return order.map(index=>({entry:words[index],index}));
  }
  function resetFlashcardFace() {
    polish.flashcardFace="english";polish.flashcardFlipAt=0;
    polish.flashcardFlipFrom="english";polish.flashcardFlipTo="english";
  }
  function rebuildFlashcardDeck(starredOnly=false, shuffle=false) {
    const words=getFlashcardVocabulary();
    polish.flashcardOnlyStarred=starredOnly;
    const stars=new Set(polish.flashcardStars);
    const order=words.map((_,i)=>i).filter(i=>!starredOnly||stars.has(flashcardKey(words[i])));
    if(shuffle)for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    polish.flashcardOrder=order;polish.flashcardIndex=0;polish.flashcardComplete=false;
    resetFlashcardFace();
  }
''' +s[end:]
# custom profile option sprites
start=s.index('  function drawProfileMenu() {')
end=s.index('  function drawDeviceModeIcon(',start)
new='''  function drawProfileOptionIcon(kind,cx,cy,color="#48555a") {
    const r=(x,y,w,h,c=color)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(cx+x),Math.round(cy+y),w,h);};
    if(kind==="language") {r(-6,-6,12,12);r(-4,-4,8,8,"#f7fdff");r(-1,-6,2,12);r(-6,-1,12,2);}
    else if(kind==="flashcards") {r(-7,-5,10,12);r(-5,-3,6,7,"#f7fdff");r(0,-7,7,11);r(2,-5,3,5,"#f7fdff");}
    else if(kind==="manage") {r(-7,-6,14,12);r(-4,-5,8,4,"#f7fdff");r(-4,1,8,4,"#f7fdff");r(-1,2,3,3);}
    else if(kind==="signout") {r(-7,-6,8,12);r(-5,-4,4,8,"#f7fdff");r(0,-1,7,2);r(4,-4,3,3);r(4,1,3,3);}
    else {r(-1,-2,8,4);r(-3,-4,3,8);r(-6,-1,3,2);}
  }
  function drawProfileMenu() {
    drawUtilityWindowFrame("ACCOUNT & LANGUAGE", "PLAYER SETTINGS");
    drawBitmapText(`PLAYER: ${accountDisplayName().toUpperCase()}`,W/2,63,.55,"center","#48555a");
    const skin=getSelectedSkin();
    PROFILE_MENU_RECTS.forEach((rect,index)=>{
      const selected=index===polish.profileSelection;
      ctx.fillStyle="rgba(25,43,52,.20)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
      ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
      ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.12):"#f7fdff";
      ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
      const stripes={language:skin.light,flashcards:"#f3d171",manage:"#7ee0cf",signout:"#ed9eaa",back:"#b4c7ce"};
      ctx.fillStyle=stripes[rect.id];ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);
      drawProfileOptionIcon(rect.id,rect.x+17,rect.y+rect.h/2,selected?skin.dark:"#48555a");
      const value=rect.id==="language"?(getLanguageMode()==="es-en"?"ES > EN":"EN > ES"):
        rect.id==="flashcards"?`${getFlashcardVocabulary().length} CARDS`:"";
      const labelScale=Math.min(.69,195/Math.max(1,measureBitmapText(rect.label,1)));
      drawBitmapText(rect.label,rect.x+rect.w/2-(value?18:0),rect.y+9,labelScale,"center",selected?skin.dark:"#48555a");
      if(value)drawBitmapText(value,rect.x+rect.w-10,rect.y+10,.42,"right",selected?skin.dark:"#59666b");
    });
  }
  function drawCardButton(rect,title,hint="",selected=false){
    const skin=getSelectedSkin();
    ctx.fillStyle="rgba(25,43,52,.19)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
    ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.16):"#f7fdff";
    ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    if(selected){ctx.fillStyle=skin.light;ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);}
    const titleScale=Math.min(rect.h>20?.75:.55,(rect.w-10)/Math.max(1,measureBitmapText(title,1)));
    const mid=rect.x+rect.w/2;
    drawBitmapText(title,mid,rect.y+(hint?5:rect.h>20?9:6),titleScale,"center",selected?skin.dark:"#48555a");
    if(hint)drawBitmapText(hint,mid,rect.y+16,.49,"center",selected?skin.dark:"#59666b");
  }
  function drawFlashcardStar(cx,cy,isStarred=false){
    ctx.fillStyle=isStarred?"#db9300":"#657981";
    const pts=[[0,-6],[-1,-3],[1,-3],[-5,-2],[5,-2],[-3,0],[3,0],[-2,2],[2,2],[-4,5],[0,3],[4,5]];
    for(const [x,y] of pts)ctx.fillRect(cx+x,cy+y,2,2);
  }
  function drawFlashcardsMenu() {
    drawUtilityWindowFrame("FLASH CARDS", "STUDY YOUR VOCAB SETS");
    const skin=getSelectedSkin(), deck=flashcardEntries(), count=deck.length;
    if(count)polish.flashcardIndex=Math.min(Math.max(0,polish.flashcardIndex),count-1);
    const pair=count?deck[polish.flashcardIndex]:null,entry=pair?.entry;
    const currentKey=flashcardKey(entry),starred=Boolean(entry&&polish.flashcardStars.includes(currentKey));
    const prefix=polish.flashcardOnlyStarred?"STARRED TERMS":"FRIENDS VOCAB";
    drawBitmapText(`${prefix}  •  ${count} CARDS`,W/2,68,.48,"center","#48555a");
    const card={x:73,y:79,w:334,h:104};
    ctx.fillStyle="rgba(25,43,52,.15)";ctx.fillRect(card.x+3,card.y+3,card.w,card.h);
    ctx.fillStyle=COLORS.ink;ctx.fillRect(card.x,card.y,card.w,card.h);
    const flipT=polish.flashcardFlipAt?Math.min(1,(performance.now()-polish.flashcardFlipAt)/280):1;
    if(polish.flashcardFlipAt&&flipT>=1){polish.flashcardFace=polish.flashcardFlipTo;polish.flashcardFlipAt=0;}
    const face=polish.flashcardFlipAt&&flipT>=.5?polish.flashcardFlipTo:polish.flashcardFace;
    const scaleX=polish.flashcardFlipAt?Math.max(.05,Math.abs(Math.cos(Math.PI*flipT))):1;
    ctx.save();ctx.translate(card.x+card.w/2,0);ctx.scale(scaleX,1);ctx.translate(-(card.x+card.w/2),0);
    const secondary=face!=="english";
    ctx.fillStyle=secondary?mixHexColors(skin.mid,"#ffffff",.26):mixHexColors(skin.belly,"#ffffff",.18);
    ctx.fillRect(card.x+3,card.y+3,card.w-6,card.h-6);
    if(polish.flashcardComplete){
      drawBitmapText("DECK COMPLETE!",W/2,card.y+34,1.07,"center",skin.dark);
      drawBitmapText("RESTART OR STUDY STARRED TERMS",W/2,card.y+63,.57,"center","#59666b");
    }else if(entry){
      const label=secondary?"ESPAÑOL":"ENGLISH";
      const value=String(secondary?entry.spanish||"":entry.english||"").trim().toUpperCase();
      const fit=Math.min(1.20,(card.w-36)/Math.max(1,measureBitmapText(value,1)));
      drawBitmapText(`${polish.flashcardIndex+1} / ${count}`,card.x+card.w-48,card.y+12,.53,"right",skin.dark);
      drawBitmapText(label,W/2,card.y+15,.70,"center",skin.dark);
      ctx.save();ctx.beginPath();ctx.rect(card.x+12,card.y+30,card.w-24,45);ctx.clip();
      drawBitmapText(value,W/2,card.y+46,fit,"center",COLORS.ink);ctx.restore();
      drawBitmapText(secondary?"TARGET LANGUAGE":"ENGLISH FRONT",W/2,card.y+85,.48,"center","#59666b");
    }else{
      drawBitmapText("NO STARRED TERMS YET",W/2,card.y+42,.80,"center",skin.dark);
      drawBitmapText("PRESS BACK TO SEE ALL CARDS",W/2,card.y+69,.48,"center","#59666b");
    }
    ctx.restore();
    if(entry&&!polish.flashcardComplete){
      const r=FLASHCARD_BUTTON_RECTS.star;
      ctx.fillStyle=starred?"#fff4c7":"#f7fdff";ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.fillStyle=starred?"#be8000":COLORS.ink;ctx.fillRect(r.x+1,r.y+1,r.w-2,r.h-2);
      ctx.fillStyle=starred?"#ffe0a6":"#f7fdff";ctx.fillRect(r.x+3,r.y+3,r.w-6,r.h-6);
      drawFlashcardStar(r.x+r.w/2,r.y+8,starred);
      drawBitmapText("S /",r.x+r.w/2,r.y+14,.34,"center",starred?"#996000":"#59666b");
    }
    const selected=id=>polish.flashcardHoverKey===id;
    const buttons=[
      ["previous",polish.flashcardComplete?"RESTART DECK":"PREVIOUS","(LEFT)"],
      ["flip",polish.flashcardComplete?"VIEW STARRED":"FLIP CARD","(SPACE)"],
      ["next",polish.flashcardComplete?"ALL CARDS":"NEXT","(RIGHT)"],
      ["shuffle","SHUFFLE",""],["starred",polish.flashcardOnlyStarred?"ALL CARDS":"STARRED TERMS",""],["back","BACK",""],
    ];
    buttons.forEach(([id,title,hint])=>{
      const hints={shuffle:"H",starred:"V",back:"BACKSPACE"};
      if(hints[id]&&FLASHCARD_BUTTON_RECTS[id].h<=20)title=`${title} (${hints[id]})`;
      drawCardButton(FLASHCARD_BUTTON_RECTS[id],title,hint,selected(id));
    });
  }
'''
s=s[:start]+new+s[end:]
# open action / controls
start=s.index('  function openFlashcardsMenu() {')
end=s.index('  function openDeviceMenu() {',start)
s=s[:start]+'''  function openFlashcardsMenu() {
    polish.flashcardStars=readFlashcardStars();
    polish.flashcardShuffled=false;
    rebuildFlashcardDeck(false,false);
    polish.flashcardSelection=1;polish.flashcardHoverKey="";
    game.state="rrFlashcards";clearHeldInput();tone(480,.04,.009,10);
  }
''' +s[end:]
start=s.index('  function activateFlashcardButton(index = polish.flashcardSelection) {')
end=s.index('  function setCanvasMobileMode(',start)
s=s[:start]+'''  function activateFlashcardButton(index = polish.flashcardSelection) {
    const deck=flashcardEntries(),count=deck.length;
    const action=FLASHCARD_BUTTON_ORDER[index]||FLASHCARD_BUTTON_RECTS.flip;
    const id=action.id;
    if(id==="back"){
      game.state="rrProfileMenu";tone(330,.04,.009,-30);return;
    }
    if(id==="shuffle"){
      polish.flashcardShuffled=true;rebuildFlashcardDeck(polish.flashcardOnlyStarred,true);
    }else if(id==="starred"){
      rebuildFlashcardDeck(!polish.flashcardOnlyStarred,false);
    }else if(id==="star"){
      if(polish.flashcardComplete||!count)return;
      const entry=deck[polish.flashcardIndex]?.entry,key=flashcardKey(entry);
      if(!entry)return;
      const marked=new Set(polish.flashcardStars);
      if(marked.has(key))marked.delete(key);else marked.add(key);
      polish.flashcardStars=[...marked];
      try{localStorage.setItem(FLASHCARD_STARS_KEY,JSON.stringify(polish.flashcardStars));}catch(_){}
      if(polish.flashcardOnlyStarred&&!marked.has(key)){
        const oldIndex=polish.flashcardIndex;
        rebuildFlashcardDeck(true,false);
        polish.flashcardIndex=Math.min(oldIndex,Math.max(0,polish.flashcardOrder.length-1));
      }
    }else if(polish.flashcardComplete){
      if(id==="previous")rebuildFlashcardDeck(polish.flashcardOnlyStarred,polish.flashcardShuffled);
      else if(id==="flip")rebuildFlashcardDeck(true,false);
      else if(id==="next")rebuildFlashcardDeck(false,false);
    }else if(id==="flip"){
      if(!count)return;
      const now=performance.now();
      // Capture current face before starting a fresh 280ms pinch-and-expand flip.
      if(polish.flashcardFlipAt){polish.flashcardFace=polish.flashcardFlipTo;}
      polish.flashcardFlipFrom=polish.flashcardFace;
      polish.flashcardFlipTo=polish.flashcardFace==="english"?"spanish":"english";
      polish.flashcardFlipAt=now;
    }else if(id==="previous"){
      if(count){polish.flashcardIndex=(polish.flashcardIndex-1+count)%count;resetFlashcardFace();}
    }else if(id==="next"){
      if(count){
        if(polish.flashcardIndex>=count-1)polish.flashcardComplete=true;
        else polish.flashcardIndex++;
        resetFlashcardFace();
      }
    }
    tone(360,.03,.008,6);
  }
''' +s[end:]
# update keyhandler
start=s.index('    if (game.state === "rrFlashcards") {',s.index('window.addEventListener("keydown"'))
end=s.index('    if (game.state === "rrDeviceMenu") {',start)
s=s[:start]+'''    if (game.state === "rrFlashcards") {
      const keys=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","KeyA","KeyD","KeyS","Slash","Space","Enter","NumpadEnter","KeyH","KeyV","KeyR","Escape","Backspace"];
      if(keys.includes(event.code)){
        event.preventDefault();event.stopImmediatePropagation();
        if(event.repeat&&!(["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(event.code)))return;
        if(["Escape","Backspace"].includes(event.code))activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="back"));
        else if(["ArrowLeft","KeyA"].includes(event.code))activateFlashcardButton(0);
        else if(["ArrowRight","KeyD"].includes(event.code))activateFlashcardButton(2);
        else if(["Space","Enter","NumpadEnter"].includes(event.code))activateFlashcardButton(1);
        else if(["KeyS","Slash"].includes(event.code))activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="star"));
        else if(event.code==="KeyH")activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="shuffle"));
        else if(event.code==="KeyV")activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="starred"));
        else if(event.code==="KeyR"&&polish.flashcardComplete)rebuildFlashcardDeck(polish.flashcardOnlyStarred,polish.flashcardShuffled);
        // Up/Down deliberately do nothing; they must not navigate buttons.
      }
      return;
    }
''' +s[end:]
p.write_text(s)
