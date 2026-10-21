# Faro Finanzas

Web de formación financiera con tutor con IA (Lumen), calculadoras, glosario y guías.

## Carpetas

| Carpeta | Qué contiene |
|---|---|
| `faro-src/` | **Lo que se edita.** Páginas (`pages/`), cabecera y pie comunes (`partials/`), estilos y scripts (`assets/`) y lecciones del curso (`curso/`). |
| `faro/` | La web generada. No la edites a mano: se sobrescribe al regenerar y no se sube a git. |
| `faro-server/` | Servidor local: sirve la web, las lecciones (`lessons.mjs`) y el chat de Lumen (`chat.mjs`). Ver su `README.md`. |
| `api/` | Funciones de Vercel: `/api/chat` y `/api/leccion`. Reutilizan el código de `faro-server/`. |
| `supabase/migrations/` | Cambios en la base de datos de Supabase, en orden. |
| `tools/` | `fake-anthropic.cjs`: API falsa para probar el chat sin clave. |

## Curso

- **Temario:** `faro-src/assets/temario.json`. Módulos, títulos, duración y si están disponibles (`available`). Es público.
- **Lecciones:** `faro-src/curso/<id>.html`, por ejemplo `m1-01.html`. Contienen el texto de la lección y, al final, el test en un comentario `<!--quiz [ ... ] -->` con preguntas así: `{"q": "...", "options": ["...", "..."], "answer": 0, "why": "..."}` (`answer` es la posición de la respuesta correcta, empezando por 0). Los enlaces internos van con ruta absoluta (`/glosario.html#roe`).
- **Acceso:** las lecciones no se publican como páginas. `/api/leccion` las sirve solo a quien tiene sesión iniciada en Supabase. Las páginas `curso/index.html` (Mi curso) y `curso/leccion.html` las muestran.
- **Progreso:** tabla `lesson_progress` de Supabase (mejor nota de cada alumno en cada test), protegida con RLS: cada alumno solo ve y escribe lo suyo.
- **Comprobación:** `npm run build` falla si una lección del temario no existe, si su test no es JSON válido o si tiene un enlace interno roto. Así un error no llega a publicarse.

Para añadir una lección: crea el archivo en `faro-src/curso/`, añádela a su módulo en `temario.json` y ejecuta `npm run build`.

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
| Supabase | Cuentas de usuario (registro, acceso y recuperación de contraseña) y progreso del curso | Proyecto `faro-finanzas` (eu-west-3) |

Vercel ejecuta `npm run build` y publica la carpeta `faro/` (ver `vercel.json`). El chat necesita la variable de entorno `ANTHROPIC_API_KEY` en el proyecto de Vercel; sin ella, la portada usa las respuestas de demostración.

La URL y la clave publicable de Supabase están en `faro-src/assets/auth.js`. Son públicas por diseño; las tablas que crees deben tener políticas RLS. Las claves secretas de Supabase nunca van en `faro-src/`: si el servidor las necesita, configúralas como variables de entorno en Vercel.

## Pendiente antes de publicar

- Opiniones, equipo, email y redes: son contenido de ejemplo.
- Páginas legales: plantillas con huecos en amarillo; revisar con un profesional. Ahora la web guarda cuentas de usuario: la política de privacidad debe mencionarlo.
- Correo de Supabase: el servicio de correo incluido solo envía a los miembros de tu organización de Supabase y con un límite bajo por hora. Configura un SMTP propio (Authentication → Emails) antes de abrir el registro al público.
- Envío de la guía por email: solo interfaz, sin backend.
- Curso: los módulos 1 y 2 tienen lecciones; los módulos 3 a 5 aparecen como «Próximamente».

## Pagos

De momento todo es gratuito y la web no ofrece nada a la venta: cualquier usuario con cuenta ve todos los módulos disponibles. Antes de cobrar hay que:

1. Decidir qué es gratis y qué de pago.
2. Conectar una pasarela de pago y guardar en Supabase qué ha comprado cada alumno.
3. Hacer que `/api/leccion` (`faro-server/lessons.mjs`) compruebe lo que ha comprado el alumno además de su sesión.
4. Volver a poner la página de precios, la sección de precios de la portada y el enlace del menú. La versión anterior, con un plan gratis y otro de 89 €, sigue en el historial: `git show a3ca830:faro-src/pages/precios.html`.
5. Actualizar los términos (apartado «Precio») y la política de privacidad (datos de pago).
