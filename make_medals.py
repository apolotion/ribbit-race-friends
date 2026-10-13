from PIL import Image
from pathlib import Path
import base64
root=Path('/mnt/data/rr-polish35-work')
out=root/'public/icons/medal-options';out.mkdir(parents=True,exist_ok=True)
base=Path('/mnt/data')
files=[('smile','pixel_art_golden_achievement_medal.png'),('laurel','image(20261013-052351).png'),('frog','pixel_frog_gold_medal.png'),('star','pixel_gold_star_medal_with_red_ribbons.png'),('crown','pixel_art_gold_crown_medal.png'),('trophy','pixel_art_gold_medal_with_red_ribbons.png'),('check','pixel_gold_medal_with_checkmark.png'),('lightning','pixel_gold_lightning_medal.png'),('spiral','pixel_art_gold_medal_badge.png'),('gem','pixel_art_gold_medal_badge.png')]
# last asset alternate chosen from original which is actually gem/spiral depending last-generation overwrites
files[-1]=('gem','pixel_art_gold_medal_icon.png')
for key,fn in files:
 im=Image.open(base/fn).convert('RGBA')
 pix=im.load();w,h=im.size
 coords=[]
 for y in range(h):
  for x in range(w):
   r,g,b,a=pix[x,y]
   if a>10 and max(r,g,b)>45:coords.append((x,y))
 if not coords:continue
 minx,miny,maxx,maxy=min(x for x,y in coords),min(y for x,y in coords),max(x for x,y in coords),max(y for x,y in coords)
 box=im.crop((minx,miny,maxx+1,maxy+1))
 # prune black background (images have black background) and preserve colored contours; black outline stays brown
 data=box.load()
 for y in range(box.height):
  for x in range(box.width):
   r,g,b,a=data[x,y]
   if max(r,g,b)<38:data[x,y]=(0,0,0,0)
 bw,bh=box.size
 tw=min(20,round(bw*22/bh));th=min(22,round(bh*20/bw))
 if tw<20 and th<22: th=min(22,round(bh*20/bw));tw=round(bw*th/bh)
 tw=max(1,tw);th=max(1,th)
 sprite=box.resize((tw,th),Image.Resampling.NEAREST)
 canvas=Image.new('RGBA',(28,28),(0,0,0,0));canvas.alpha_composite(sprite,((28-tw)//2,(28-th)//2))
 canvas.save(out/f'{key}.png')
 print(key,fn,(tw,th))
# copy laurel to icon root for direct reference
import shutil
shutil.copyfile(out/'laurel.png',root/'public/icons/leaderboard-medal.png')
print('done')
