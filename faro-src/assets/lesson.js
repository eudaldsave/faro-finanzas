// Faro Finanzas — página de lección: pide el contenido a /api/leccion (solo con sesión iniciada),
// muestra el test autocorregido y guarda la nota en el progreso del alumno.
(async function () {
  'use strict';

  const { course, escape, reduceMotion } = window.Faro;
  const $ = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id') || '';
  const msg = $('lesson-msg');

  let temario;
  let session;
  try {
    [temario, session] = await Promise.all([course.temario(), course.session()]);
  } catch (err) {
    console.error(err);
    $('lesson-title').textContent = 'No se ha podido cargar la lección';
    msg.textContent = 'Recarga la página para intentarlo de nuevo.';
    return;
  }

  const lessons = course.lessons(temario);
  const index = lessons.findIndex((l) => l.id === id);
  if (index < 0) {
    $('lesson-title').textContent = 'Lección no encontrada';
    msg.innerHTML = 'Esta lección no existe o todavía no está disponible. <a href="index.html">Vuelve a tu curso</a>.';
    return;
  }
  const lesson = lessons[index];
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  let progress = new Map();

  document.title = `${lesson.title} · Faro Finanzas`;
  $('lesson-title').textContent = lesson.title;
  $('lesson-module').textContent = `Módulo ${lesson.module.n}: ${lesson.module.title}`;
  $('lesson-pill').textContent = `Lección ${lesson.n} de ${lesson.module.lessons.length}`;
  $('lesson-meta').textContent = `${lesson.minutes} min · lectura y test`;
  $('toc-title').textContent = `Módulo ${lesson.module.n}`;
  renderToc();
  $('lesson-nav').innerHTML = [
    prev ? `<a class="btn btn--outline" href="leccion.html?id=${prev.id}">← Lección anterior</a>` : '<span></span>',
    next ? `<a class="btn btn--outline" href="leccion.html?id=${next.id}">Siguiente lección →</a>` : '<a class="btn btn--outline" href="index.html">Volver a mi curso</a>',
  ].join('');

  if (!session) {
    $('course-gate').hidden = false;
    return;
  }

  let data;
  try {
    const r = await fetch(`../api/leccion?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (r.status === 401) {
      $('course-gate').hidden = false;
      return;
    }
    if (!r.ok) throw new Error(`api/leccion: ${r.status}`);
    data = await r.json();
  } catch (err) {
    console.error(err);
    msg.textContent = 'No se ha podido cargar la lección. Recarga la página para intentarlo de nuevo.';
    return;
  }

  $('lesson-body').innerHTML = data.html;
  try {
    progress = await course.progress();
    renderToc();
  } catch (err) {
    console.error(err); // la lección se puede seguir; solo faltan las marcas de completada
  }
  renderQuiz(data.quiz);

  function renderToc() {
    $('lesson-toc').innerHTML = lesson.module.lessons.map((l) => `<li${progress.has(l.id) ? ' class="is-done"' : ''}>
        <a href="leccion.html?id=${l.id}"${l.id === id ? ' aria-current="page"' : ''}>${escape(l.title)}</a>
      </li>`).join('');
  }

  function renderQuiz(quiz) {
    const form = $('quiz-form');
    const questions = $('quiz-questions');
    const submit = $('quiz-submit');
    const quizMsg = $('quiz-msg');
    const result = $('quiz-result');

    function intro() {
      const best = progress.get(id);
      $('quiz-intro').textContent = `${quiz.length} preguntas. Elige una respuesta en cada una y pulsa «Comprobar respuestas».${best ? ` Tu mejor nota hasta ahora: ${best.score} de ${best.total}.` : ''}`;
    }

    function draw() {
      intro();
      questions.innerHTML = quiz.map((q, qi) => `<fieldset class="lq">
          <legend>${qi + 1}. ${escape(q.q)}</legend>
          ${q.options.map((o, oi) => `<label class="lq__opt"><input type="radio" name="q${qi}" value="${oi}"><span>${escape(o)}</span></label>`).join('')}
          <p class="lq__why" hidden></p>
        </fieldset>`).join('');
      submit.hidden = false;
      quizMsg.textContent = '';
      result.hidden = true;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const answers = quiz.map((_, qi) => form.elements[`q${qi}`].value);
      const missing = answers.indexOf('');
      if (missing >= 0) {
        quizMsg.textContent = 'Responde todas las preguntas antes de comprobar.';
        form.elements[`q${missing}`][0].focus();
        return;
      }
      quizMsg.textContent = '';

      let score = 0;
      questions.querySelectorAll('.lq').forEach((set, qi) => {
        const chosen = Number(answers[qi]);
        const right = quiz[qi].answer;
        if (chosen === right) score += 1;
        set.querySelectorAll('.lq__opt').forEach((label, oi) => {
          label.querySelector('input').disabled = true;
          if (oi === right) label.classList.add('is-right');
          else if (oi === chosen) label.classList.add('is-wrong');
        });
        const why = set.querySelector('.lq__why');
        why.innerHTML = `<strong>${chosen === right ? 'Correcto.' : 'No es correcto.'}</strong> ${escape(quiz[qi].why)}`;
        why.hidden = false;
      });

      submit.hidden = true;
      result.hidden = false;
      result.innerHTML = `<p class="lesson-quiz__score">Has acertado ${score} de ${quiz.length}</p>
        <p class="lesson-quiz__saved">Guardando tu progreso…</p>
        <div class="lesson-quiz__actions">
          <button type="button" class="btn btn--outline" data-retry>Repetir el test</button>
          ${next ? `<a class="btn btn--gold" href="leccion.html?id=${next.id}">Siguiente lección →</a>` : '<a class="btn btn--gold" href="index.html">Ver mi progreso →</a>'}
        </div>`;
      result.querySelector('[data-retry]').addEventListener('click', () => {
        draw();
        $('lesson-quiz').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
      result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });

      const saved = result.querySelector('.lesson-quiz__saved');
      try {
        const best = await course.saveResult(session, id, score, quiz.length, progress.get(id));
        progress.set(id, best);
        renderToc();
        saved.textContent = score === quiz.length
          ? '¡Perfecto! Lección completada y guardada en tu progreso.'
          : `Lección completada. En tu progreso queda tu mejor nota: ${best.score} de ${best.total}.`;
      } catch (err) {
        console.error(err);
        saved.textContent = 'No se ha podido guardar tu progreso. Comprueba tu conexión y repite el test.';
      }
    });

    draw();
    $('lesson-quiz').hidden = false;
  }
})();
