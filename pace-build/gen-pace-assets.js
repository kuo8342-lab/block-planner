/* icons + manifest + service worker for 步調 Pace */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const out = process.argv[2];
// a green tile with three blocks stepping down-right, like a staircase of time blocks
const BG = [47, 122, 91], FG = [255, 253, 248], SOFT = [168, 214, 190];
const shapes = [[0.20, 0.22, 0.46, 0.16, FG], [0.34, 0.42, 0.46, 0.16, SOFT], [0.48, 0.62, 0.32, 0.16, FG]];
fs.writeFileSync(path.join(out, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="rgb(${BG})"/>${shapes.map(([x, y, w, h, c]) => `<rect x="${x * 100}" y="${y * 100}" width="${w * 100}" height="${h * 100}" rx="4" fill="rgb(${c})"/>`).join('')}</svg>`);
function png(size, maskable) {
  const px = Buffer.alloc(size * size * 4);
  const inRound = (x, y, x0, y0, w, h, r) => { if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) return false; const cx = Math.min(Math.max(x, x0 + r), x0 + w - r), cy = Math.min(Math.max(y, y0 + r), y0 + h - r); return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let c = null, a = 255;
    if (maskable || inRound(x + .5, y + .5, 0, 0, size, size, size * .22)) c = BG; else a = 0;
    for (const [sx, sy, w, h, col] of shapes) if (inRound(x + .5, y + .5, sx * size, sy * size, w * size, h * size, size * .04)) c = col;
    const i = (y * size + x) * 4; if (c) { px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; } px[i + 3] = c ? a : 0;
  }
  const raw = Buffer.alloc((size * 4 + 1) * size); for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([l, td, cr]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync(path.join(out, 'icon-192.png'), png(192, false));
fs.writeFileSync(path.join(out, 'icon-512.png'), png(512, false));
fs.writeFileSync(path.join(out, 'icon-maskable-512.png'), png(512, true));
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({
  name: '步調 Pace', short_name: '步調', description: '用時間方塊排一週的讀書計畫', lang: 'zh-TW',
  start_url: './', scope: './', display: 'standalone', background_color: '#f4f1ea', theme_color: '#2f7a5b',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }, { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  shortcuts: [{ name: '便利貼', url: './#widget' }]
}, null, 2));
// network first, cached copy when offline, so updates show up right away
fs.writeFileSync(path.join(out, 'sw.js'), `const CACHE = 'pace-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-192.png']))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
`);
console.log('assets ok');
// Android app (TWA): the site must vouch for the APK's signing key, and it hosts the APK for download
const links = path.join(__dirname, 'assetlinks.json');
if (fs.existsSync(links)) { fs.mkdirSync(path.join(out, '.well-known'), { recursive: true }); fs.copyFileSync(links, path.join(out, '.well-known', 'assetlinks.json')); console.log('assetlinks ok'); }
const apk = process.argv[3];
if (apk && fs.existsSync(apk)) { fs.copyFileSync(apk, path.join(out, 'pace.apk')); console.log('apk ok'); }
