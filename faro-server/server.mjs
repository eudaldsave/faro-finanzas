// Faro Finanzas — servidor local: sirve la web estática, las lecciones del curso y el chat de Lumen con la API de Claude.
// En Vercel no se usa: la web se sirve como estática y la API corre en ../api/ (chat.mjs y leccion.mjs).
//
//   ANTHROPIC_API_KEY=...  node server.mjs
//
// Variables de entorno opcionales:
//   PORT              Puerto (por defecto 5173)
//   FARO_SITE_DIR     Carpeta de la web generada (por defecto ../faro)
//   FARO_CHAT_LIMIT   Preguntas por IP y hora (por defecto 20)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODEL, chatEnabled, handleChat, sendJson } from './chat.mjs';
import { handleLesson } from './lessons.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, process.env.FARO_SITE_DIR || '../faro');
const PORT = Number(process.env.PORT || 5173);
const MAX_BODY_BYTES = 128 * 1024;

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('bad_json')); }
    });
    req.on('error', reject);
  });
}

/* ---------- Archivos estáticos ---------- */

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json',
};

function serveStatic(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  let file = path.join(SITE, urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath);
  if (file !== SITE && !file.startsWith(SITE + path.sep)) { res.writeHead(403).end(); return; }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err2, data) => {
      if (err2) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

http.createServer((req, res) => {
  if (req.url.split('?')[0] === '/api/chat') {
    if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }).end(); return; }
    handleChat(req, res, () => readJson(req)).catch((err) => {
      console.error(err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Error interno.' });
      else res.end();
    });
    return;
  }
  if (req.url.split('?')[0] === '/api/leccion') {
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
    handleLesson(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Error interno.' });
    });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Faro Finanzas en http://localhost:${PORT} (chat de Lumen: ${chatEnabled() ? `${MODEL}; las credenciales se comprueban en la primera pregunta` : 'modo demo, sin credenciales'})`);
});
