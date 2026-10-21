// Faro Finanzas — lecciones del curso (GET /api/leccion?id=m1-01), solo para alumnos con sesión de Supabase.
// Lo usan el servidor local (server.mjs) y la función de Vercel (../api/leccion.mjs).
//
// El temario está en faro-src/assets/temario.json y cada lección en faro-src/curso/<id>.html:
// HTML del contenido seguido de un comentario <!--quiz [ ... ] --> con las preguntas del test en JSON.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMARIO = path.join(root, 'faro-src', 'assets', 'temario.json');
const LESSONS_DIR = path.join(root, 'faro-src', 'curso');
const QUIZ = /<!--quiz([\s\S]*?)-->/;

// Mismos valores públicos que faro-src/assets/auth.js
const SUPABASE_URL = 'https://fzhuqfrgzkagxzygldpq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_USszT3eId0-R3ELM5FpP4A_25NutZHu';

let temario = null;
async function loadTemario() {
  if (!temario) temario = JSON.parse(await fs.readFile(TEMARIO, 'utf8'));
  return temario;
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

// Devuelve el usuario si el token de sesión es válido, null si no lo es; lanza un error si Supabase no responde.
async function userFromToken(token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
  if (r.status === 401 || r.status === 403) return null;
  if (!r.ok) throw new Error(`Supabase Auth respondió ${r.status}`);
  return r.json();
}

export async function handleLesson(req, res) {
  const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
  const { modules } = await loadTemario();
  // Solo se sirven ids del temario, así que el id nunca sale de LESSONS_DIR
  const mod = modules.find((m) => (m.lessons || []).some((l) => l.id === id));
  if (!mod) return sendJson(res, 404, { error: 'not_found' });
  if (!mod.available) return sendJson(res, 403, { error: 'locked' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return sendJson(res, 401, { error: 'login_required' });
  let user;
  try {
    user = await userFromToken(token);
  } catch (err) {
    console.error('No se ha podido comprobar la sesión:', err.message);
    return sendJson(res, 502, { error: 'auth_unavailable' });
  }
  if (!user) return sendJson(res, 401, { error: 'login_required' });

  const src = await fs.readFile(path.join(LESSONS_DIR, `${id}.html`), 'utf8');
  const quiz = src.match(QUIZ);
  sendJson(res, 200, { html: src.replace(QUIZ, '').trim(), quiz: quiz ? JSON.parse(quiz[1]) : [] });
}
