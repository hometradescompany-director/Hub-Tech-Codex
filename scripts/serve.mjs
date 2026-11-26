import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};
const surfaces = /^\/(styles\.css|cosmic\.css|cosmic\.html|v1\.css|v1\.html|index\.html|council\.html|council\.css|releases\.html|releases\.css|docs\/decisions\/council-v0\.md|src\/[a-z0-9-]+\.mjs|data\/[a-z0-9-]+\.json)$/;
const commonsPub = new Set([
  '/builds/commons-pub/index.html',
  '/builds/commons-pub/styles.css',
  '/builds/commons-pub/app.js',
  '/builds/commons-pub/renderer-2d.js',
  '/builds/commons-pub/simulator.js',
  '/builds/commons-pub/fixtures.js',
]);
const seqMaps = new Set([
  '/builds/seq-maps/index.html',
  '/builds/seq-maps/corridor-demo.mjs',
  '/builds/seq-maps/variable-speed-proof.mjs',
  '/builds/seq-maps/m1-variable-speed.synthetic.json',
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const path = pathname === '/' ? '/index.html' : pathname;
    const isCommonsPub = commonsPub.has(path);
    const isSeqMaps = seqMaps.has(path);
    if (!surfaces.test(path) && !isCommonsPub && !isSeqMaps) {
      res.writeHead(404);
      return res.end('Not found');
    }

    let connectSources = "'self' https://api.github.com";
    if (isCommonsPub) connectSources = "'none'";
    if (isSeqMaps) connectSources = "'self'";
    const file = resolve(root, path.slice(1));
    const content = await readFile(file);
    res.writeHead(200, {
      'content-type': types[extname(file)],
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'content-security-policy': `default-src 'self'; connect-src ${connectSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`,
    });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => {
  console.log('Hub Tech Codex: http://127.0.0.1:' + server.address().port);
});
