# Faro Finanzas

Web de formación financiera con tutor con IA (Lumen), calculadoras, glosario y guías.

## Carpetas

| Carpeta | Qué contiene |
|---|---|
| `faro-src/` | **Lo que se edita.** Páginas (`pages/`), cabecera y pie comunes (`partials/`), estilos y scripts (`assets/`). |
| `faro/` | La web generada. No la edites a mano: se sobrescribe al regenerar y no se sube a git. |
| `faro-server/` | Servidor local que sirve la web y conecta el chat de Lumen con la API de Claude (`chat.mjs`). Ver su `README.md`. |
| `api/` | Función de Vercel para el chat (`/api/chat`); reutiliza `faro-server/chat.mjs`. |
| `tools/` | `fake-anthropic.cjs`: API falsa para probar el chat sin clave. |

## Comandos

La primera vez, instala las dependencias:

```bash
npm install
```

Regenerar la web después de editar `faro-src/`:

```bash
npm run build
```

Comprobar que todos los enlaces internos funcionan:

```bash
npm run check
```

Generar la web y arrancar el servidor local:

```bash
npm start
```

Abre http://localhost:5173. Sin `ANTHROPIC_API_KEY`, el chat funciona en modo demostración.

## Publicación

| Servicio | Para qué | Dónde |
|---|---|---|
| GitHub | Código fuente | `eudaldsave/faro-finanzas` |
| Vercel | Web y chat. Cada `git push` a `main` publica en producción; las demás ramas generan una vista previa. | Proyecto `faro-finanzas`: https://faro-finanzas-pi.vercel.app |
| Supabase | Cuentas de usuario (registro, acceso y recuperación de contraseña) | Proyecto `faro-finanzas` (eu-west-3) |

Vercel ejecuta `npm run build` y publica la carpeta `faro/` (ver `vercel.json`). El chat necesita la variable de entorno `ANTHROPIC_API_KEY` en el proyecto de Vercel; sin ella, la portada usa las respuestas de demostración.

La URL y la clave publicable de Supabase están en `faro-src/assets/auth.js`. Son públicas por diseño; las tablas que crees deben tener políticas RLS. Las claves secretas de Supabase nunca van en `faro-src/`: si el servidor las necesita, configúralas como variables de entorno en Vercel.

## Pendiente antes de publicar

- Precios, garantía, opiniones, equipo, email y redes: son contenido de ejemplo.
- Páginas legales: plantillas con huecos en amarillo; revisar con un profesional. Ahora la web guarda cuentas de usuario: la política de privacidad debe mencionarlo.
- Correo de Supabase: el servicio de correo incluido solo envía a los miembros de tu organización de Supabase y con un límite bajo por hora. Configura un SMTP propio (Authentication → Emails) antes de abrir el registro al público.
- Envío de la guía por email y pagos: solo interfaz, sin backend.
