const http = require('http'), fs = require('fs'), path = require('path');
http.createServer((req, res) => { const f = path.join(__dirname, 'index.html'); res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(fs.readFileSync(f)); }).listen(8765, () => console.log('listening 8765'));
