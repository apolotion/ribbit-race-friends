import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
HTML=Path('/mnt/data/Ribbit_Race_Friends_Polish_35_1.7.23.html').read_text()
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1280,'height':800},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.on('console',lambda msg:errors.append('console:'+msg.text) if msg.type=='error' else None)
  await page.set_content(HTML, wait_until='domcontentloaded', timeout=60000)
  await page.wait_for_timeout(1200)
  print('initial',await page.evaluate('({state:typeof game!=="undefined"?game.state:"no-game",gate:!!document.getElementById("cloud-gate"),button:!!document.querySelector("#cloud-play-guest")})'))
  btn=page.locator('#cloud-play-guest')
  if await btn.count():await btn.click(timeout=10000)
  await page.wait_for_timeout(1500)
  print('after auth',await page.evaluate('({state:game.state,gameMode:game.mode})'))
  await page.evaluate('window.RibbitRaceTutorialEngine?.exit?.()');await page.wait_for_timeout(150)
  await page.evaluate('window.RibbitRaceOpenProfileMenu()')
  await page.wait_for_timeout(200)
  print('profile',await page.evaluate('game.state'))
  await page.screenshot(path='/mnt/data/rr35-profile.png')
  # click profile flash cards row at logical 200,120 -> canvas
  async def at(x,y):
   return await page.evaluate('''([x,y])=>{const c=document.getElementById('game'),r=c.getBoundingClientRect();return [r.left+(x/480)*r.width,r.top+(y/270)*r.height]}''',[x,y])
  x,y=await at(220,120);await page.mouse.click(x,y);await page.wait_for_timeout(200)
  print('flash state',await page.evaluate('game.state'))
  await page.screenshot(path='/mnt/data/rr35-flash-front.png')
  await page.keyboard.press('Space');await page.wait_for_timeout(400)
  await page.screenshot(path='/mnt/data/rr35-flash-back.png')
  # test star then next back to English
  await page.keyboard.press('s');await page.keyboard.press('ArrowRight');await page.wait_for_timeout(120)
  await page.keyboard.press('ArrowLeft');await page.wait_for_timeout(120)
  await page.screenshot(path='/mnt/data/rr35-flash-return.png')
  print('post flash',await page.evaluate('game.state'))
  await page.keyboard.press('h');await page.wait_for_timeout(100)
  await page.keyboard.press('v');await page.wait_for_timeout(100)
  await page.keyboard.press('Backspace');await page.wait_for_timeout(150)
  print('after backspace',await page.evaluate('game.state'))
  print('errors',errors[:12],len(errors))
  await browser.close()
asyncio.run(main())
