// Local-only preview: no deployment, build, or user-data changes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.webmanifest':'application/manifest+json' };
function serve(directory, port) {
  http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    let file = path.resolve(directory, '.' + pathname);
    if (!file.startsWith(directory + path.sep) && file !== directory) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(port, '127.0.0.1', () => console.log(`Local preview http://127.0.0.1:${port}/ (${directory})`));
}
if (!process.argv.includes('--evidence-only')) serve(path.join(root, 'pace-planner'), Number(process.env.PORT || process.env.PACE_TEST_PORT || 5175));
if (process.argv.includes('--evidence') || process.argv.includes('--evidence-only')) serve(path.join(root, 'test-artifacts'), Number(process.env.PACE_EVIDENCE_PORT || 5176));
