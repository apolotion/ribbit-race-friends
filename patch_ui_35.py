from pathlib import Path
import base64
P=Path('/mnt/data/rr-polish35-work/client/game/130-polish-ui-replay-language.js')
s=P.read_text()
# Medal art sprite, embedded for game bundle and single-file compatibility
src=Path('/mnt/data/rr-polish35-work/public/icons/leaderboard-medal.png')
data=base64.b64encode(src.read_bytes()).decode()
start=s.index('  function drawMiniMedalButton(rect, active = false) {')
end=s.index('\n  const LEADERBOARD_METRICS',start)
medal=f'''  // Compact pixel-perfect laurel medal selected for the achievements/leaderboard button.
  // Embedded so the same sprite also renders in the standalone HTML build.
  const leaderboardMedalSprite = new Image();
  leaderboardMedalSprite.src = "data:image/png;base64,{data}";
  function drawMiniMedalButton(rect, active = false) {{
    const skin = getSelectedSkin();
    ctx.fillStyle = "rgba(25,43,52,.20)";
    ctx.fillRect(rect.x+2, rect.y+2, rect.w, rect.h);
    ctx.fillStyle = active ? skin.dark : COLORS.ink;
    ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle = active ? mixHexColors(skin.belly, "#ffffff", .16) : "#f7fdff";
    ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    if (leaderboardMedalSprite.complete && leaderboardMedalSprite.naturalWidth) {{
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(leaderboardMedalSprite, rect.x+1, rect.y+1, rect.w-2, rect.h-2);
    }} else {{
      const cx = rect.x+rect.w/2,cy=rect.y+rect.h/2;
      ctx.fillStyle="#cf8700";ctx.fillRect(cx-7,cy-7,14,14);
      ctx.fillStyle="#ffd91d";ctx.fillRect(cx-5,cy-6,10,11);
      ctx.fillStyle="#996000";ctx.fillRect(cx-4,cy-2,2,5);ctx.fillRect(cx+2,cy-2,2,5);
      ctx.fillStyle="#b42f49";ctx.fillRect(cx-5,cy+7,4,4);ctx.fillRect(cx+1,cy+7,4,4);
    }}
    if (active) {{
      ctx.fillStyle=skin.light;
      ctx.fillRect(rect.x+4,rect.y+3,rect.w-8,1);
    }}
  }}
'''
s=s[:start]+medal+s[end:]
# dropdown cleanup and level icons
s=s.replace('''    const headerH = 8;
    ctx.fillStyle = open ? mixHexColors(getSelectedSkin().mid, "#ffffff", .22) : "#dce5e8";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, headerH);
    ctx.fillStyle = open ? getSelectedSkin().light : "#ffffff";
    ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 1);
    drawBitmapText(label, rect.x + 8, rect.y + 3, .34, "left", "#59666b");
    const textScale = Math.min(.54, (rect.w - 28) / Math.max(1, measureBitmapText(value, 1)));
    drawBitmapText(value, rect.x + 8, rect.y + 12, textScale, "left", "#26363d");
''','''    const headerH = 5; // reduced to roughly two thirds of the old 8px header
    ctx.fillStyle = open ? "#b3d6db" : "#dce5e8";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, headerH);
    drawBitmapText(label, rect.x + 8, rect.y + 2, .31, "left", "#59666b");
    const isLevel = key === "level" && polish.leaderboardLevel !== "any";
    if (isLevel) drawLevelUnlockIcon(polish.leaderboardLevel, rect.x + 7, rect.y + 10, getSelectedSkin(), .47);
    const textScale = Math.min(.54, (rect.w - 33) / Math.max(1, measureBitmapText(value, 1)));
    drawBitmapText(value, rect.x + (isLevel ? 22 : 8), rect.y + 12, textScale, "left", "#26363d");
''')
s=s.replace('''        drawBitmapText(entry === "any" ? "ANY LEVEL" : entry.toUpperCase(), rect.x + 7, rect.y + 5, .43, "left", "#26363d");
''','''        if (entry !== "any") drawLevelUnlockIcon(entry, rect.x+7, rect.y+3, skin, .44);
        drawBitmapText(entry === "any" ? "ANY LEVEL" : entry.toUpperCase(), rect.x + (entry === "any" ? 7 : 25), rect.y + 6, .43, "left", "#26363d");
''')
# profile group hover offset no edge overlap
s=s.replace('''    ...row, x:90, y:82 + index * 28, w:300, h:24
''','''    ...row, x:91, y:82 + index * 28, w:299, h:24
''')
P.write_text(s)
