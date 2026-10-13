import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
html=Path('/mnt/data/Ribbit_Race_Friends_Polish_35_1.7.23.html').read_text()
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1280,'height':800},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  await page.wait_for_timeout(1100)
  await page.locator('#cloud-play-guest').click()
  await page.wait_for_timeout(250)
  await page.evaluate('window.RibbitRaceTutorialEngine?.exit?.()')
  await page.wait_for_timeout(150)
  async def state():return await page.evaluate('window.RibbitRaceRuntimeBridge.snapshot().state')
  async def click_virtual(x,y):
   pt=await page.evaluate('''([x,y])=>{let r=document.getElementById('game').getBoundingClientRect();return [r.left+x*r.width/480,r.top+y*r.height/270]}''',[x,y]);await page.mouse.click(*pt)
  print('start',await state(), 'cloud',await page.evaluate('typeof window.RibbitCloud'))
  # Account screen click and flashcards click
  await click_virtual(57,221);await page.wait_for_timeout(180);print('profile click',await state())
  await click_virtual(220,121);await page.wait_for_timeout(150);print('flash screen',await state())
  await page.keyboard.press('Space');await page.wait_for_timeout(350)
  await page.screenshot(path='/mnt/data/rr35-flash-final.png')
  await page.keyboard.press('s');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Backspace');await page.wait_for_timeout(100)
  print('flash return',await state())
  await page.keyboard.press('Backspace');await page.wait_for_timeout(90);print('main',await state())
  print('cloud before mock',await page.evaluate('''() => ({name:typeof RibbitCloud, get:typeof window.RibbitCloud?.getLeaderboardData})'''))
  await page.evaluate('''() => {const s={ok:true, entries:[{uid:'test-user-1',username:'nick',name:'NICK',skinId:'azure',classPeriod:'friends',totalFlies:23,totalJumps:64,pvpMatchWins:4,stats:{distanceJumpedPx:37.3*480,perfectJumps:1,maxFliesOneJump:2,longestAirTime:1.5,totalWins:4,wallBounces:21,wrongFlies:26},records:{park:{time:11.4,jumps:6,date:'2026-10-11'}},replayAvailable:{park:{time:true,jumps:true}},lastUpdated:'2026-10-11'}]};if(typeof RibbitCloud!=='undefined')RibbitCloud.getLeaderboardData=async()=>s;}''')
  await click_virtual(390,220);await page.wait_for_timeout(130);print('achievements',await state())
  await click_virtual(429,242);await page.wait_for_timeout(700);print('leaderboard',await state())
  await page.screenshot(path='/mnt/data/rr35-leaderboard.png')
  await click_virtual(126,138);await page.wait_for_timeout(150);print('player stats state',await state())
  await page.screenshot(path='/mnt/data/rr35-stats-modal.png')
  await click_virtual(442,27);await page.wait_for_timeout(120)
  print('closed stats',await state())
  print('errors',json.dumps(errors[:10]),'count',len(errors))
  await browser.close()
asyncio.run(main())
