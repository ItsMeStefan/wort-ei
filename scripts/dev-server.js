import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = 16006;
const host = process.env.HOST || '127.0.0.1';
const files = new Map([
  ['/index.html','text/html; charset=utf-8'],
  ['/css/style.css','text/css; charset=utf-8'],
  ['/js/app.js','text/javascript; charset=utf-8'],
  ['/js/game.js','text/javascript; charset=utf-8'],
  ['/js/extras.js','text/javascript; charset=utf-8'],
  ['/js/audio.js','text/javascript; charset=utf-8'],
  ['/categories.json','application/json; charset=utf-8'],
  ['/assets/icon.svg','image/svg+xml'],
  ['/manifest.webmanifest','application/manifest+json'],
  ['/sw.js','text/javascript; charset=utf-8']
]);

createServer(async (request, response) => {
  if (!['GET','HEAD'].includes(request.method)) {
    response.writeHead(405, {'Allow':'GET, HEAD'}).end();
    return;
  }
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = pathname === '/' ? '/index.html' : pathname;
  if (!files.has(file)) {
    response.writeHead(404).end('Nicht gefunden');
    return;
  }
  try {
    const body = await readFile(resolve(root, `.${file}`));
    response.writeHead(200, {'Content-Type':files.get(file),'Cache-Control':'no-store'});
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end('Nicht gefunden');
  }
}).listen(port, host, () => {
  process.stdout.write(`Wort-Ei lokal: http://${host}:${port}\n`);
});
