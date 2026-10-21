// Faro Finanzas — Mi curso: módulos, estado de cada lección y botón para seguir donde lo dejaste.
(async function () {
  'use strict';

  const { course, escape } = window.Faro;
  const list = document.getElementById('course-modules');
  const msg = document.getElementById('course-msg');

  let temario;
  let session;
  try {
    [temario, session] = await Promise.all([course.temario(), course.session()]);
  } catch (err) {
    console.error(err);
    msg.textContent = 'No se ha podido cargar el curso. Recarga la página para intentarlo de nuevo.';
    return;
  }

  let progress = new Map();
  if (!session) {
    document.getElementById('course-gate').hidden = false;
  } else {
    try {
      progress = await course.progress();
    } catch (err) {
      console.error(err);
      msg.textContent = 'No se ha podido cargar tu progreso. Recarga la página para intentarlo de nuevo.';
    }
    showSummary();
  }

  list.innerHTML = temario.modules.map((m) => (m.available ? moduleHtml(m) : lockedHtml(m))).join('');

  // Saludo, barra de progreso y botón «Continuar» con la primera lección pendiente
  function showSummary() {
    const lessons = course.lessons(temario);
    const done = lessons.filter((l) => progress.has(l.id)).length;
    const next = lessons.find((l) => !progress.has(l.id));
    const bar = document.getElementById('course-progress');
    const cont = document.getElementById('course-continue');

    document.getElementById('course-title').innerHTML = `Hola, <span class="gold">${escape(course.displayName(session))}</span>`;
    let lead = `Has completado ${done} de ${lessons.length} lecciones del módulo 1.`;
    if (done === 0) lead = 'Empieza por la primera lección del módulo 1. Cada una dura entre 10 y 15 minutos y termina con un test.';
    if (!next) lead = `Has completado las ${lessons.length} lecciones del módulo 1. ¡Enhorabuena!`;
    document.getElementById('course-lead').textContent = lead;

    bar.hidden = false;
    bar.setAttribute('aria-valuemax', String(lessons.length));
    bar.setAttribute('aria-valuenow', String(done));
    document.getElementById('course-bar').style.width = `${(done / lessons.length) * 100}%`;

    cont.hidden = false;
    cont.href = `leccion.html?id=${(next || lessons[0]).id}`;
    if (next && done > 0) cont.textContent = `Continuar: lección ${next.n} →`;
    if (!next) cont.textContent = 'Repasar desde el principio →';
  }

  function moduleHtml(m) {
    const doneHere = m.lessons.filter((l) => progress.has(l.id)).length;
    const rows = m.lessons.map((l, i) => {
      const p = progress.get(l.id);
      return `<li><a class="lesson-row${p ? ' is-done' : ''}" href="leccion.html?id=${l.id}">
          <span class="lesson-row__n" aria-hidden="true">${p ? '✓' : i + 1}</span>
          <span>${escape(l.title)}<small>Lección ${i + 1} · ${l.minutes} min</small></span>
          <span class="lesson-row__state">${p ? `Test: ${p.score} de ${p.total}` : 'Pendiente'}</span>
        </a></li>`;
    }).join('');
    return `<section class="course-module">
        <header class="course-module__head">
          <span class="module__n">${m.n}</span>
          <div><h2>${escape(m.title)}</h2><small>${m.lessons.length} lecciones · nivel ${m.level} · ${session ? `${doneHere} completadas` : 'gratis'}</small></div>
        </header>
        <p class="course-module__summary">${escape(m.summary)}</p>
        <ol class="lessons">${rows}</ol>
      </section>`;
  }

  function lockedHtml(m) {
    return `<section class="course-module is-locked">
        <header class="course-module__head">
          <span class="module__n">${m.n}</span>
          <div><h2>${escape(m.title)}</h2><small>${m.lessonCount} lecciones · nivel ${m.level}</small></div>
          <span class="course-module__badge">Próximamente</span>
        </header>
        <ul>${m.topics.map((t) => `<li>${escape(t)}</li>`).join('')}</ul>
      </section>`;
  }
})();
