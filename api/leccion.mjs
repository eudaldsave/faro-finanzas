// Faro Finanzas — función de Vercel para las lecciones del curso (GET /api/leccion?id=m1-01).
// Misma lógica que el servidor local (../faro-server/lessons.mjs).
import { handleLesson } from '../faro-server/lessons.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
  try {
    await handleLesson(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: 'Error interno.' }));
    }
  }
}
