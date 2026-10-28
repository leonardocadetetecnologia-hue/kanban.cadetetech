import http from 'node:http';
import { readFile } from 'node:fs/promises';
const file = new URL('../index.html', import.meta.url);
const host = '127.0.0.1';
const port = 4173;
const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  if (!['/', '/index.html'].includes(request.url?.split('?')[0])) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const page = await readFile(file);
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : page);
  } catch {
    response.writeHead(500).end('Preview unavailable');
  }
});
server.listen(port, host, () => console.log(`Preview: http://${host}:${port}`));
