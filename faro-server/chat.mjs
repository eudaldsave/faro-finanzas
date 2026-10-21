// Faro Finanzas — chat de Lumen con la API de Claude (POST /api/chat, respuesta en streaming).
// Lo usan el servidor local (server.mjs) y la función de Vercel (../api/chat.mjs).
//
// Variables de entorno:
//   ANTHROPIC_API_KEY  Clave de la API de Anthropic (sin ella, el chat responde 503 y la web usa la demo)
//   FARO_CHAT_LIMIT    Preguntas por IP y hora (por defecto 20)
import Anthropic from '@anthropic-ai/sdk';

const LIMIT_PER_HOUR = Number(process.env.FARO_CHAT_LIMIT || 20);

export const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 20;           // mensajes de historial que aceptamos
const MAX_USER_CHARS = 1000;
const MAX_ASSISTANT_CHARS = 8000;

const SYSTEM_PROMPT = `Eres Lumen, el tutor de educación financiera de Faro Finanzas. Respondes siempre en español de España, con un tono cercano, claro y paciente.

Tu trabajo es enseñar: explicar conceptos de inversión, finanzas personales, contabilidad de empresas, valoración, riesgo, carteras y economía, con ejemplos numéricos sencillos cuando ayuden. Usa empresas y cifras inventadas en los ejemplos.

Límites:
- No das asesoramiento financiero personalizado. Si alguien pregunta qué comprar, cuánto invertir o si debe vender algo concreto, explícale qué criterios mirar para decidirlo por su cuenta y recuerda, en una frase, que esto es formación y no una recomendación.
- No tienes acceso a cotizaciones ni noticias en tiempo real. Si te piden datos actuales, dilo y explica cómo interpretarlos cuando los consulte.
- Si la pregunta no tiene que ver con dinero, finanzas o economía, dilo con amabilidad y propón un tema relacionado.
- Si no estás seguro de un dato concreto, como una norma fiscal de un país, dilo y recomienda comprobarlo en una fuente oficial.

Formato:
- Respuestas breves: normalmente entre 60 y 180 palabras. Empieza directamente por la respuesta.
- Puedes usar **negritas**, listas con guiones y fórmulas en una línea. No uses títulos ni tablas.
- Cuando encaje, enlaza un recurso gratuito del sitio con un enlace Markdown y estas rutas exactas:
  [Glosario](/glosario.html) · [Guía de interés compuesto](/aprende/interes-compuesto.html) · [Guía ETF o fondo indexado](/aprende/etf-vs-fondo.html) · [Guía de riesgo y volatilidad](/aprende/riesgo-y-volatilidad.html) · [Calculadora de interés compuesto](/herramientas/interes-compuesto.html) · [Calculadora PER](/herramientas/per.html) · [Calculadora de inflación](/herramientas/inflacion.html) · [Simulador de cartera](/herramientas/simulador-cartera.html) · [Calculadora DCF](/herramientas/dcf.html) · [Calculadora FIRE](/herramientas/fire.html) · [Calculadora de dividendos](/herramientas/dividendos.html) · [Dónde invertir](/donde-invertir.html) · [Test de nivel](/index.html#test)
  Un término concreto del glosario se enlaza así: /glosario.html#per (identificadores disponibles: accion, alpha, apalancamiento, beta, bono, capitalizacion, dca, dcf, diversificacion, dividendo, ebitda, etf, ev-ebitda, fcf, inflacion, interes-compuesto, margen-neto, per, pb, politica-monetaria, roe, sharpe, tir, tipos-interes, var, volatilidad).

Es un chat en tiempo real: empieza tu respuesta visible enseguida.`;

/* ---------- Cliente de Anthropic ---------- */

// El SDK resuelve las credenciales (ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN o un perfil de `ant auth login`)
// al hacer la primera petición. Si no encuentra ninguna, el chat se desactiva y responde 503: la web usa
// entonces sus respuestas de demostración.
let client = null;
try {
  client = new Anthropic();
} catch (err) {
  console.warn(`Chat de Lumen desactivado: ${err.message}`);
}

export const chatEnabled = () => client !== null;

/* ---------- Límite de peticiones por IP ---------- */

// En memoria: en Vercel cada instancia lleva su propia cuenta, así que el límite es aproximado.
const hits = new Map(); // ip -> marcas de tiempo de la última hora
function allow(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  if (recent.length >= LIMIT_PER_HOUR) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) if (times.every((t) => now - t >= 3600_000)) hits.delete(ip);
}, 600_000).unref();

/* ---------- Validación del historial ---------- */

// Devuelve el historial como MessageParam[] o un mensaje de error.
function parseHistory(body) {
  const msgs = body && body.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) return { error: 'Falta el mensaje.' };
  if (msgs.length > MAX_TURNS) return { error: 'La conversación es demasiado larga. Empieza una nueva.' };
  const out = [];
  for (let i = 0; i < msgs.length; i += 1) {
    const m = msgs[i];
    const role = i % 2 === 0 ? 'user' : 'assistant';
    if (!m || m.role !== role || typeof m.content !== 'string') return { error: 'Formato de conversación no válido.' };
    const text = m.content.trim();
    const max = role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS;
    if (!text || text.length > max) return { error: role === 'user' ? `Escribe una pregunta de hasta ${MAX_USER_CHARS} caracteres.` : 'Formato de conversación no válido.' };
    out.push({ role, content: text });
  }
  if (out[out.length - 1].role !== 'user') return { error: 'El último mensaje debe ser tuyo.' };
  return { messages: out };
}

export function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

// Mensaje para el usuario según el tipo de error del SDK (de más concreto a más general)
function errorMessage(err) {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    console.error('Error de credenciales de Anthropic:', err.status, err.message);
    return 'El chat no está bien configurado. Inténtalo más tarde.';
  }
  if (err instanceof Anthropic.RateLimitError) return 'Lumen está recibiendo muchas preguntas ahora mismo. Inténtalo en unos segundos.';
  if (err instanceof Anthropic.BadRequestError) {
    console.error('Petición rechazada por la API:', err.message);
    return 'No he podido procesar esa pregunta. Prueba a formularla de otra manera.';
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`Error de la API (${err.status}):`, err.message);
    return 'Lumen no está disponible en este momento. Inténtalo de nuevo en un rato.';
  }
  console.error('Error inesperado en el chat:', err);
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

/* ---------- POST /api/chat (respuesta en streaming, Server-Sent Events) ---------- */

// readBody: función asíncrona que devuelve el cuerpo JSON ya interpretado (cada entorno lo lee a su manera).
export async function handleChat(req, res, readBody) {
  if (!client) return sendJson(res, 503, { error: 'chat_not_configured' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'local';
  if (!allow(ip)) return sendJson(res, 429, { error: `Has llegado al límite de ${LIMIT_PER_HOUR} preguntas por hora. Vuelve a intentarlo más tarde.` });

  let body;
  try { body = await readBody(); } catch { return sendJson(res, 400, { error: 'Petición no válida.' }); }
  const parsed = parseHistory(body);
  if (parsed.error) return sendJson(res, 400, { error: parsed.error });

  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4096, // respuestas de chat breves; acota el coste por pregunta
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // si un filtro de seguridad rechaza la petición, otro modelo la responde
    output_config: { effort: 'low' }, // chat educativo: prioriza la rapidez de respuesta
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: parsed.messages,
  });

  // Si el usuario cierra la página, cortamos también la petición a la API
  res.on('close', () => { if (!res.writableEnded) stream.abort(); });

  // Esperamos al primer evento antes de abrir el streaming hacia el navegador, para poder
  // responder con un código HTTP normal si la petición falla antes de empezar.
  const events = stream[Symbol.asyncIterator]();
  let next;
  try {
    next = await events.next();
  } catch (err) {
    if (res.destroyed) return;
    // Un AnthropicError que no es APIError ocurre antes de llegar a la red: falta configuración
    // (normalmente, credenciales). Desactivamos el chat para no repetir el intento en cada pregunta.
    if (err instanceof Anthropic.AnthropicError && !(err instanceof Anthropic.APIError)) {
      console.warn(`Chat de Lumen desactivado: ${err.message}`);
      client = null;
      return sendJson(res, 503, { error: 'chat_not_configured' });
    }
    return sendJson(res, err instanceof Anthropic.RateLimitError ? 429 : 502, { error: errorMessage(err) });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    for (; !next.done; next = await events.next()) {
      const event = next.value;
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        send('delta', { text: event.delta.text });
      }
    }
    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') {
      send('delta', { text: '\n\nNo puedo ayudarte con esa pregunta. Prueba con otro tema de finanzas o inversión.' });
    } else if (message.stop_reason === 'max_tokens') {
      send('delta', { text: '…\n\n(Respuesta recortada. Pídeme que continúe si la quieres completa.)' });
    }
    send('done', { stop_reason: message.stop_reason });
  } catch (err) {
    if (stream.aborted || res.destroyed) return;
    send('error', { message: errorMessage(err) });
  }
  res.end();
}
