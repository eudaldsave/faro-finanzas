// Faro Finanzas — función de Vercel para el chat de Lumen (POST /api/chat).
// Misma lógica que el servidor local (../faro-server/chat.mjs); Vercel sirve la web estática de faro/.
import { handleChat, sendJson } from '../faro-server/chat.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }).end(); return; }
  try {
    // Vercel ya ha leído e interpretado el cuerpo JSON en req.body (lanza un error si no es válido)
    await handleChat(req, res, async () => req.body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Error interno.' });
    else res.end();
  }
}
