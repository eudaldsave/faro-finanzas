# Servidor de Faro Finanzas

Servidor local: sirve la web generada en `../faro` y conecta el chat de Lumen con la API de Claude (`POST /api/chat`, respuesta en streaming). La clave de la API solo vive en el servidor; nunca llega al navegador.

La lógica del chat está en `chat.mjs` y la de las lecciones del curso (`GET /api/leccion?id=m1-01`, solo con sesión de Supabase) en `lessons.mjs`. Las comparten este servidor y las funciones de Vercel (`../api/chat.mjs` y `../api/leccion.mjs`).

## Arrancar

Desde la raíz del proyecto (las dependencias están en el `package.json` de la raíz):

```bash
npm install
```

Configura la clave de la API de Anthropic en la terminal donde vayas a arrancar el servidor (PowerShell):

```powershell
$env:ANTHROPIC_API_KEY = "tu-clave"
```

```bash
npm start
```

`npm start` regenera la web y arranca el servidor. Abre http://localhost:5173 y escribe en el chat de la portada.

Sin credenciales el servidor también arranca: `/api/chat` responde 503 y la portada usa las respuestas de demostración.

## Configuración

| Variable | Por defecto | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Clave de la API de Anthropic. También sirve `ANTHROPIC_AUTH_TOKEN` o un perfil de `ant auth login`. |
| `PORT` | `5173` | Puerto del servidor. |
| `FARO_SITE_DIR` | `../faro` | Carpeta de la web generada con `npm run build`. |
| `FARO_CHAT_LIMIT` | `20` | Preguntas por IP y hora. |

## Cómo llama a Claude

- Modelo `claude-opus-5-5`, con `effort: "low"` para que las respuestas de chat lleguen rápido, y `max_tokens: 4096`.
- Fallbacks del lado del servidor activadas (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`): si un filtro de seguridad rechaza una pregunta legítima, la API la reintenta con otro modelo en la misma llamada.
- Prompt de sistema de Lumen en `chat.mjs` (`SYSTEM_PROMPT`): tutor educativo, sin asesoramiento personalizado, respuestas breves y enlaces a los recursos del sitio.
- Historial de hasta 20 mensajes, validado en el servidor (máximo 1.000 caracteres por pregunta).

## Probar sin clave real

`../tools/fake-anthropic.cjs` imita la API de mensajes en local (comandos desde la raíz del proyecto):

```bash
node tools/fake-anthropic.cjs 5199
```

```powershell
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:5199"; $env:ANTHROPIC_API_KEY = "prueba-local"; npm start
```

Un mensaje que contenga `REFUSE` simula un rechazo y uno con `RATE`, un límite de peticiones.

## Publicar

En Vercel este servidor no se usa: Vercel sirve `../faro` como web estática y el chat corre en `../api/chat.mjs`. Configura `ANTHROPIC_API_KEY` como variable de entorno del proyecto de Vercel, nunca en el código.

El límite de preguntas por IP se guarda en memoria: en Vercel cada instancia lleva su propia cuenta, así que es aproximado.
