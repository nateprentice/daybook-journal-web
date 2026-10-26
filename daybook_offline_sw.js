/* Only reviewed static application files are cached. No Google responses or journal data. */
const BUILD = {"version":"personal-pilot-20261026","files":["assets/AssetManifest.bin","assets/AssetManifest.bin.json","assets/FontManifest.json","assets/NOTICES","assets/assets/branding/journal-mark.png","assets/assets/fonts/DaybookSans-Bold.ttf","assets/assets/fonts/DaybookSans-Italic.ttf","assets/assets/fonts/DaybookSans-Regular.ttf","assets/assets/fonts/LICENSE.txt","assets/fonts/MaterialIcons-Regular.otf","assets/fonts/fallback/Roboto-Regular.ttf","assets/shaders/ink_sparkle.frag","assets/shaders/stretch_effect.frag","canvaskit/canvaskit.js","canvaskit/canvaskit.wasm","canvaskit/chromium/canvaskit.js","canvaskit/chromium/canvaskit.wasm","canvaskit/webparagraph/canvaskit.js","canvaskit/webparagraph/canvaskit.wasm","canvaskit/wimp.js","canvaskit/wimp.wasm","favicon.png","flutter.js","flutter_bootstrap.js","google_auth.js","icons/Icon-192.png","icons/Icon-512.png","icons/Icon-maskable-192.png","icons/Icon-maskable-512.png","index.html","main.dart.js","manifest.json","offline.js","transcription_worker.js","vault_bridge.js","voice_notes.js"]};
const PREFIX = 'daybook-journal-offline-';
const CACHE = PREFIX + BUILD.version;
const READY = new URL('__daybook_offline_ready__', self.registration.scope).href;
let preparing;
async function readyCache() {
  const names = [CACHE, ...(await caches.keys()).filter(n => n.startsWith(PREFIX) && n !== CACHE).reverse()];
  for (const name of names) {
    const cache = await caches.open(name);
    if (await cache.match(READY)) return cache;
  }
  return null;
}
async function prepare() {
  if(!BUILD.files.length)throw new Error('Offline files are not built.');
  const cache = await caches.open(CACHE);
  if (await cache.match(READY)) return {ready:true, count:BUILD.files.length, version:BUILD.version};
  let index = 0;
  const workers = Array.from({length:Math.min(4, BUILD.files.length)}, async () => {
    while (index < BUILD.files.length) {
      const file = BUILD.files[index++];
      const url = new URL(file, self.registration.scope).href;
      const response = await fetch(url, {cache:'reload', credentials:'same-origin'});
      if (!response.ok || response.type === 'opaque') throw new Error('An offline file could not be downloaded.');
      await cache.put(url, response);
    }
  });
  await Promise.all(workers);
  // Commit readiness only after every required file is confirmed present.
  for (const file of BUILD.files) if (!await cache.match(new URL(file,self.registration.scope).href)) throw new Error('Offline verification failed.');
  await cache.put(READY, new Response(JSON.stringify({version:BUILD.version, count:BUILD.files.length})));
  const old = (await caches.keys()).filter(n => n.startsWith(PREFIX) && n !== CACHE);
  for (const name of old.slice(0,-1)) await caches.delete(name);
  return {ready:true, count:BUILD.files.length, version:BUILD.version};
}
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  const reply = value => event.ports?.[0]?.postMessage(value);
  const action = event.data?.action;
  if (action === 'prepare') {
    preparing ||= prepare().finally(() => {preparing=undefined;});
    event.waitUntil(preparing.then(reply).catch(() => reply({ready:false,error:'Offline files are incomplete. Reconnect and prepare them again. Your journal is kept.'})));
  } else if (action === 'status') {
    event.waitUntil((async()=>{const cache=await readyCache();reply({ready:!!cache, current:!!(await (await caches.open(CACHE)).match(READY)), version:BUILD.version});})());
  }
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url), scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async()=>{
      const cache = await readyCache();
      return await cache?.match(new URL('index.html',scope).href) || new Response('Daybook is not ready to open offline. Reconnect once and use Settings > Offline readiness.', {status:503,headers:{'Content-Type':'text/plain'}});
    }));
    return;
  }
  const relative = url.pathname.slice(scope.pathname.length);
  if (!BUILD.files.includes(relative)) return;
  event.respondWith((async()=>{
    const cache = await readyCache();
    const cached = await cache?.match(new URL(relative,scope).href);
    return cached || fetch(request);
  })());
});
