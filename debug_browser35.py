import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
HTML=Path('/mnt/data/Ribbit_Race_Friends_Polish_35_1.7.23.html').read_text()
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':1280,'height':800})
  page.on('pageerror',lambda e:print('PAGE ERR',e));page.on('console',lambda e:print('CONSOLE',e.text[:250]) if e.type in ['error','warning'] else None)
  await page.set_content(HTML,wait_until='domcontentloaded');await page.wait_for_timeout(1000)
  print('bridge BEFORE',await page.evaluate('''() => ({gameType:typeof game,gameTag:game?.tagName,bridge:window.RibbitRaceRuntimeBridge?.snapshot?.(),api:typeof window.RibbitRaceOpenProfileMenu})'''))
  await page.locator('#cloud-play-guest').click();await page.wait_for_timeout(500)
  print('bridge AFTER',await page.evaluate('''() => ({bridge:window.RibbitRaceRuntimeBridge?.snapshot?.(),canvas:document.getElementById('game')?.getBoundingClientRect().toJSON()})'''))
  await page.evaluate('window.RibbitRaceTutorialEngine?.exit?.()');await page.wait_for_timeout(150)
  await page.evaluate('window.RibbitRaceOpenProfileMenu()');await page.wait_for_timeout(250)
  print('profile',await page.evaluate('window.RibbitRaceRuntimeBridge?.snapshot?.()'))
  at=await page.evaluate('''() => {const r=document.getElementById('game').getBoundingClientRect();return [r.left+r.width*(230/480),r.top+r.height*(120/270)];}''')
  await page.mouse.click(*at);await page.wait_for_timeout(250)
  print('after click',await page.evaluate('window.RibbitRaceRuntimeBridge?.snapshot?.()'))
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.wait_for_timeout(300)
  print('after down enter',await page.evaluate('window.RibbitRaceRuntimeBridge?.snapshot?.()'))
  await page.screenshot(path='/mnt/data/rr35-flash-debug.png')
  await b.close()
asyncio.run(main())
