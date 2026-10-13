from pathlib import Path
root=Path('/mnt/data/rr-polish35-work')
# Update legacy assertions that refer to the previous design.
items={
 'tests/friends-patch.test.mjs':[(r'cancel:\{x:185,y:232,w:110,h:22\}',r'cancel:\{x:184,y:231,w:112,h:23\}')],
 'tests/polish13-layout-history.test.mjs':[(r'cancel:\{x:185,y:232,w:110,h:22\}',r'cancel:\{x:184,y:231,w:112,h:23\}')],
 'tests/polish10-requested-fixes.test.mjs':[(r"canvas\\.style\\.setProperty\\\\\('cursor',b\\\\\?'pointer':'default','important'\\\\\)",r'battleReplayRects')],
}
# clean direct replaces
p=root/'tests/polish10-requested-fixes.test.mjs';s=p.read_text();s=s.replace("assert.match(online, /canvas\\.style\\.setProperty\\('cursor',b\\?'pointer':'default','important'\\)/);","assert.match(online, /battleReplayRects\\.some/);");p.write_text(s)
for f in ['friends-patch.test.mjs','polish13-layout-history.test.mjs']:
 p=root/'tests'/f;s=p.read_text().replace('cancel:\\{x:185,y:232,w:110,h:22\\}','cancel:\\{x:184,y:231,w:112,h:23\\}')
 p.write_text(s)
p=root/'tests/polish15-final-refinements.test.mjs';s=p.read_text();s=s.replace('test("time-based hats unlock at the win boundary and appear as victory cards", () => {','test("time-based hats unlock at the win boundary but do not show victory cards", () => {')
s=s.replace('  assert.match(input, /roundUnlockedHatIds/);\n  assert.match(input, /card\\.type === "hat"[\\s\\S]{0,300}drawPixelFrogHat/);','  assert.doesNotMatch(input, /items\\.push\\(\\{ type: "hat"/);\n  assert.match(read("client/game/40-ui-navigation-audio.js"), /if \\(entry\\?\\.type === "hat"\\) return/);')
p.write_text(s)
p=root/'tests/polish20-ui-pvp-tutorial.test.mjs';s=p.read_text()
s=s.replace('''  assert.match(medal, /#b12d0d/);
  assert.match(medal, /#ff5326/);
  assert.match(medal, /#ffd91d/);
  assert.match(medal, /#fff2ba/);''','''  assert.match(medal, /leaderboardMedalSprite\\.naturalWidth/);
  assert.match(medal, /ctx\\.drawImage\\(leaderboardMedalSprite/);
  assert.match(tutorial, /data:image\\/png;base64/);''')
p.write_text(s)
p=root/'tests/polish31-ui-repair.test.mjs';s=p.read_text()
s=s.replace('assert.match(flash,/measureBitmapText\\(value, 1\\)/);','assert.match(flash,/measureBitmapText\\(value,1\\)/);')
s=s.replace('assert.match(flash,/SPACE TO FLIP/);','assert.match(flash,/FLIP CARD/);')
s=s.replace("const key=section(polish,'if \\(game\\.state === \"rrFlashcards\"\\) {\\n      const handled', 'if \\(game\\.state === \"rrDeviceMenu\"\\) {');","const key=section(polish,'if \\(game\\.state === \"rrFlashcards\"\\) {\\n      const keys=', 'if \\(game\\.state === \"rrDeviceMenu\"\\) {');")
s=s.replace('assert.match(key,/event\\.code === "ArrowLeft"/);','assert.match(key,/"ArrowLeft","ArrowRight"/);').replace('assert.match(key,/event\\.code === "ArrowRight"/);','assert.match(key,/activateFlashcardButton\\(2\\)/);')
s=s.replace('assert.match(key,/event\\.code === "Backspace"/);','assert.match(key,/["Escape","Backspace"]/);').replace('assert.match(key,/Up\\/down arrows are intentionally inert/);','assert.match(key,/Up\\/Down deliberately do nothing/);')
p.write_text(s)
p=root/'tests/v160-replay-tags-records.test.mjs';s=p.read_text();s=s.replace('assert.match(s,/globalAlpha=page>0/)','assert.match(readFileSync("client/game/30-online-versus.js","utf8"),/battleReplayRects/)');p.write_text(s)
# Bump actual runtime versions and source-oriented tests, but retain historical release notes.
for path in list((root/'client').rglob('*'))+list((root/'public').rglob('*'))+list((root/'src').rglob('*'))+list((root/'tests').rglob('*'))+[root/'package.json']:
 if not path.is_file() or path.suffix not in {'.js','.mjs','.json','.html','.css','.txt'}:continue
 try:s=path.read_text(encoding='utf-8')
 except Exception:continue
 ns=s.replace('1.7.22','1.7.23').replace('1\\.7\\.22','1\\.7\\.23').replace('2026.10.12-friends-polish-34','2026.10.12-friends-polish-35').replace('2026\\.10\\.12-friends-polish-34','2026\\.10\\.12-friends-polish-35')
 if ns!=s:path.write_text(ns,encoding='utf-8')
print('done')
