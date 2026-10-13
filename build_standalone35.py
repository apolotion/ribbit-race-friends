from pathlib import Path
import re,json,base64
ROOT=Path('/mnt/data/rr-polish35-work')
PUB=ROOT/'public'
DEST=Path('/mnt/data/Ribbit_Race_Friends_Polish_35_1.7.23.html')
html=(PUB/'index.html').read_text(encoding='utf-8')
vocabulary=json.loads((ROOT/'src/vocabulary.json').read_text())
assets={}
for p in (PUB/'tutorial').glob('*.png'):
    assets['/'+str(p.relative_to(PUB))]='data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
for p in (PUB/'icons').glob('*.png'):
    assets['/'+str(p.relative_to(PUB))]='data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode('ascii')

# Turn relative asset paths into self-contained data URIs.
for name,data in assets.items():
    if name.startswith('/icons/'):
        html=html.replace(f'href="{name}"', f'href="{data}"')

css_count=[0]
def css_inline(m):
    name=m.group(1).split('?')[0].lstrip('/')
    src=PUB/name
    if not src.is_file(): raise FileNotFoundError(src)
    css_count[0]+=1
    body=src.read_text(encoding='utf-8')
    for path,data in assets.items():
        body=body.replace(f'url({path})',f'url("{data}")')
    return '<style data-source="'+name+'">\n'+body.replace('</style','<\\/style')+'\n</style>'
html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="(/styles/[^"#]+)"[^>]*>',css_inline,html,flags=re.I)
html=re.sub(r'<link[^>]+rel="manifest"[^>]*>', '', html)

# The single-file version supports standalone local play, tutorial and CPU.
# Direct account creation, matchmaking, server leaderboard and cloud replays
# cannot be faked without the real deployed Friends server.
api_bootstrap={
    'ok':True,'friendsVersion':1,'build':'2026.10.12-friends-polish-35',
    'autosaveSeconds':60,'classPeriods':['FRIENDS'],
    'vocabulary':vocabulary,'vocabularySource':'offline-bundled',
    'message':'OFFLINE PLAY: use PLAY WITHOUT SAVING.'
}
api_shim='''\n// Single-file offline edition. Live Friends APIs only exist on the deployed server.\nwindow.__RIBBIT_STANDALONE__ = true;\nwindow.RibbitFriendsApi.call = async function(method, payload = {}) {\n  if (method === 'apiBootstrap') return __BOOTSTRAP__;\n  if (method === 'apiGetVocabulary') return {ok:true,vocabulary:__VOCAB__,vocabularySource:'offline-bundled'};\n  return {ok:false,code:'OFFLINE',message:'This downloaded HTML is for offline play. Cloud and online features need the deployed Friends site.'};\n};\n'''.replace('__BOOTSTRAP__',json.dumps(api_bootstrap,ensure_ascii=False)).replace('__VOCAB__',json.dumps(vocabulary,ensure_ascii=False))

# A few APIs (e.g. remote replay and diagnostic widgets) use fetch directly.
# Block relative remote endpoints in file:// without network requests.
offline_fetch='''\nwindow.__RIBBIT_STANDALONE__ = true;\n// Some browsers deny persistent storage to locally opened files.
// Provide an in-memory guest fallback instead of preventing the game from booting.
const __ribbitMemoryStorage = () => {
  const values = new Map();
  return { get length(){return values.size;}, key:index=>[...values.keys()][index] ?? null,
    getItem:key=>values.get(String(key)) ?? null,
    setItem:(key,value)=>values.set(String(key),String(value)),
    removeItem:key=>values.delete(String(key)), clear:()=>values.clear() };
};
for (const kind of ['localStorage','sessionStorage']) {
  try {
    const storage = window[kind];
    const probe = '__ribbit_local_storage_probe__';
    storage.setItem(probe,'ok');storage.removeItem(probe);
  } catch (_) {
    try { Object.defineProperty(window,kind,{configurable:true,value:__ribbitMemoryStorage()}); } catch (_) {}
  }
}
const __ribbitOriginalFetch = window.fetch.bind(window);\nwindow.fetch = function(input, init) {\n  const url = typeof input === 'string' ? input : (input?.url || '');\n  if (typeof url === 'string' && /^\\/api\\//.test(url)) {\n    return Promise.resolve(new Response(JSON.stringify({ok:false,code:'OFFLINE',message:'Friends cloud and replay endpoints require the hosted version.'}),\n       {status:503,headers:{'content-type':'application/json'}}));\n  }\n  return __ribbitOriginalFetch(input, init);\n};\n'''
html=html.replace('<body class="ribbit-auth-locked rr-tutorial-pending">','<body class="ribbit-auth-locked rr-tutorial-pending">\n<script>'+offline_fetch+'</script>')

script_count=[0]
def script_inline(m):
    name=m.group(1).split('?')[0].lstrip('/')
    path=PUB/name
    if not path.is_file(): raise FileNotFoundError(path)
    body=path.read_text(encoding='utf-8')
    if name=='scripts/game.bundle.js':
        for source,data in assets.items():
            if source.startswith('/tutorial/'):
                body=body.replace('"'+source+'"',json.dumps(data))
    if name=='scripts/friends-api-client.js':
        body+='\n'+api_shim
    script_count[0]+=1
    # Inline scripts preserve original order, including formerly defer scripts.
    return '<script data-source="'+name+'">\n'+body.replace('</script','<\\/script')+'\n</script>'
html=re.sub(r'<script[^>]*src="(/scripts/[^"#]+)"[^>]*>\s*</script>',script_inline,html,flags=re.I)

# Keep only the guest action in the cloud sign-in gate and explicitly label it.
html=html.replace('FRIENDS EDITION · CLOUD SAVE','FRIENDS EDITION · OFFLINE PLAY')
html=html.replace('id="cloud-login-button"','id="cloud-login-button" hidden')
html=html.replace('id="cloud-show-create"','id="cloud-show-create" hidden')
html=html.replace('<p class="cloud-help">No school email or Google account needed. Sign in with your username and 4-digit PIN.', '<p class="cloud-help">Offline edition: no account or PIN required. Cloud saves, online matches, live leaderboards, and remote replays are unavailable. ')
html=html.replace('>PLAY WITHOUT SAVING</button>','>PLAY OFFLINE</button>')
html=html.replace('<label class="cloud-field">USERNAME', '<label class="cloud-field" hidden>USERNAME')
html=html.replace('<label class="cloud-field">4-DIGIT PIN', '<label class="cloud-field" hidden>4-DIGIT PIN')
html=html.replace('href="/help.html"','href="#offline-info"')
# Remove any live installation affordance. No assets fetched after opening file.
html=html.replace('<!-- Ribbit Race Friends Edition. Separate Cloudflare deployment; no school data or Google services. -->','<!-- Complete single-file offline edition. Game scripts, CSS, vocab, portrait assets embedded. -->')
# Keep tab explanation of disconnected features, without cluttering the game.
html=html.replace('</body>','<div id="offline-info" hidden>Standalone offline build · Cloud/online features need the deployed Friends site.</div>\n</body>')
DEST.write_text(html,encoding='utf-8')
print('created',DEST, 'bytes',DEST.stat().st_size,'css',css_count[0],'js',script_count[0],'portraits',len([k for k in assets if k.startswith('/tutorial/')]))
# Assert no external script/styles or main-game portrait paths remain.
for pattern in ['<script src=', 'rel="stylesheet"', '"/tutorial/ember-', 'src="/scripts/']:
 print(pattern,'count',html.count(pattern))
