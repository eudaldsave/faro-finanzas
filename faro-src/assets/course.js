// Faro Finanzas — curso: temario, sesión del alumno y progreso guardado en Supabase (tabla lesson_progress).
// Lo usan Mi curso (my-course.js) y la página de lección (lesson.js). Necesita auth.js.
(function () {
  'use strict';

  const sb = window.Faro.supabase;
  const temarioUrl = new URL('temario.json', document.currentScript.src);
  let temarioPromise = null;

  window.Faro.course = {
    // Temario público: módulos y lecciones (faro-src/assets/temario.json)
    temario() {
      if (!temarioPromise) {
        temarioPromise = fetch(temarioUrl).then((r) => {
          if (!r.ok) throw new Error(`temario.json: ${r.status}`);
          return r.json();
        });
      }
      return temarioPromise;
    },

    // Lecciones de los módulos disponibles, en orden, con su módulo y su número dentro de él
    lessons(temario) {
      return temario.modules.filter((m) => m.available)
        .flatMap((m) => m.lessons.map((l, i) => ({ ...l, module: m, n: i + 1 })));
    },

    async session() {
      if (!sb) return null;
      const { data } = await sb.auth.getSession();
      return data.session;
    },

    displayName(session) {
      return (session.user.user_metadata || {}).name || session.user.email;
    },

    // Map lesson_id -> { score, total } con las lecciones completadas por el alumno
    async progress() {
      const { data, error } = await sb.from('lesson_progress').select('lesson_id, score, total');
      if (error) throw error;
      return new Map(data.map((row) => [row.lesson_id, row]));
    },

    // Guarda la nota de un test y devuelve la mejor entre esta y la anterior
    async saveResult(session, lessonId, score, total, previous) {
      const best = previous && previous.score / previous.total > score / total ? previous : { score, total };
      const { error } = await sb.from('lesson_progress').upsert({
        user_id: session.user.id,
        lesson_id: lessonId,
        score: best.score,
        total: best.total,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
      return { score: best.score, total: best.total };
    },
  };
})();
