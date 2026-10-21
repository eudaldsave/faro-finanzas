// Faro Finanzas — portada: chat de demostración y test de nivel
(function () {
  'use strict';

  const { reduceMotion, store, escape } = window.Faro;

  /* Chat: una conversación de ejemplo por módulo (empresas y cifras ficticias) */
  const lessons = [
    {
      q: '¿Cómo sé si una empresa gana dinero de verdad con lo que vende?',
      a: `<span class="tag">TEORÍA</span>
          <p>Mira el <span class="hl">margen operativo</span>: qué parte de cada euro vendido queda después de pagar los costes del negocio.</p>
          <p>Ejemplo con <span class="hl">Textil Norte</span> (ficticia): ventas de <span class="hl">8.000 M€</span> y beneficio operativo de <span class="hl">1.200 M€</span>.</p>
          <span class="formula">Margen operativo = 1.200 / 8.000 = 15 %</span>
          <p>Compáralo siempre con empresas de su mismo sector, no con el mercado entero.</p>`,
    },
    {
      q: 'Una acción tiene un PER de 30. ¿Es cara?',
      a: `<span class="tag">TEORÍA</span>
          <p>El <span class="hl">PER</span> indica cuántos años de beneficios actuales pagas al comprar la acción.</p>
          <span class="formula">PER = Precio / Beneficio por acción</span>
          <p>Un PER de 30 puede ser razonable si los beneficios crecen al <span class="hl">20 % anual</span>, y caro si están estancados. Por eso se mira junto al crecimiento esperado.</p>`,
    },
    {
      q: 'Si mi cartera cae un 50 %, ¿cuánto necesito para recuperarla?',
      a: `<span class="tag">TEORÍA</span>
          <p>Las caídas y las subidas no son simétricas.</p>
          <span class="formula">Subida necesaria = 1 / (1 − caída) − 1 = 100 %</span>
          <p>Una caída del <span class="hl">50 %</span> exige duplicar lo que queda. Por eso limitar las pérdidas grandes importa más que buscar la máxima rentabilidad.</p>`,
    },
    {
      q: 'Tengo 30 años. ¿Cómo reparto entre acciones y renta fija?',
      a: `<span class="tag">TEORÍA</span>
          <p>La proporción depende de tu <span class="hl">horizonte</span> y de cuánta caída toleras sin vender.</p>
          <p>Un punto de partida habitual para horizontes largos es <span class="hl">80 % acciones / 20 % renta fija</span>, revisado una vez al año.</p>
          <p>En el módulo 4 lo simulas con tus propios números. Esto es formación, no una recomendación personal.</p>`,
    },
    {
      q: '¿Por qué bajan los bonos cuando suben los tipos de interés?',
      a: `<span class="tag">TEORÍA</span>
          <p>Un bono que ya tienes paga un cupón fijo. Si los bonos nuevos pagan más, el tuyo vale menos.</p>
          <p>Ejemplo: bono a 10 años al <span class="hl">2 %</span>; los nuevos pagan el <span class="hl">4 %</span>.</p>
          <span class="formula">Caída aproximada ≈ duración × subida de tipos ≈ 9 × 2 % ≈ 18 %</span>`,
    },
  ];

  // Respuestas de la demo para preguntas escritas. Sin servidor: se elige por palabras clave.
  const answers = [
    { keys: ['etf', 'indexado', 'indice', 'índice'], a: `<p>Un <span class="hl">ETF</span> es un fondo que cotiza en bolsa como una acción y normalmente replica un índice. Con una sola compra tienes cientos de empresas.</p><p>Lo importante: comisión anual (TER), qué índice sigue y si reparte o acumula dividendos.</p>` },
    { keys: ['per', 'caro', 'barata', 'barato'], a: `<p>El <span class="hl">PER</span> es precio entre beneficio por acción. Un PER de 15 significa que pagas 15 años de beneficios actuales.</p><span class="formula">PER = Precio / BPA</span><p>Compáralo con su historia y su sector, nunca de forma aislada.</p>` },
    { keys: ['interes compuesto', 'interés compuesto', 'compuesto'], a: `<p>El <span class="hl">interés compuesto</span> es ganar rentabilidad sobre la rentabilidad ya obtenida.</p><span class="formula">Capital final = Capital × (1 + r)^años</span><p>10.000 € al 6 % durante 30 años se convierten en unos 57.400 €. Pruébalo en la <a href="herramientas/interes-compuesto.html">calculadora</a>.</p>` },
    { keys: ['inflacion', 'inflación', 'ipc'], a: `<p>La <span class="hl">inflación</span> reduce lo que puedes comprar con el mismo dinero. Con un 3 % anual, 1.000 € de hoy compran lo que 744 € dentro de 10 años.</p><p>Por eso el dinero parado pierde valor real.</p>` },
    { keys: ['diversific', 'cartera', 'reparto'], a: `<p><span class="hl">Diversificar</span> es repartir el dinero entre activos que no se mueven igual. Reduce el riesgo de que un solo error hunda tu cartera.</p><p>Diversificar no es tener muchos productos, sino tener productos <span class="hl">diferentes</span>.</p>` },
    { keys: ['dividendo'], a: `<p>Un <span class="hl">dividendo</span> es la parte del beneficio que la empresa reparte a sus accionistas.</p><span class="formula">Rentabilidad por dividendo = Dividendo anual / Precio</span><p>Una rentabilidad muy alta puede ser una señal de alerta, no una ganga.</p>` },
    { keys: ['dcf', 'descuento de flujos', 'valor intrinseco', 'valor intrínseco'], a: `<p>El <span class="hl">DCF</span> estima el valor de una empresa sumando el dinero que generará en el futuro, traído a valor de hoy con una tasa de descuento.</p><p>Es tan bueno como sus supuestos: cambia un punto el crecimiento y el resultado cambia mucho.</p>` },
    { keys: ['empezar', 'principiante', 'cero', 'primer'], a: `<p>Para empezar: <span class="hl">fondo de emergencia</span> primero, luego entender qué compras y por último invertir de forma periódica y diversificada.</p><p>El <a href="#test">test de nivel</a> te dice por qué módulo empezar.</p>` },
    { keys: ['bono', 'renta fija'], a: `<p>Un <span class="hl">bono</span> es un préstamo que haces a un Estado o empresa a cambio de intereses. Si los tipos suben, los bonos que ya existen bajan de precio.</p>` },
  ];
  const fallback = `<p>En esta demo solo respondo a algunos temas: ETF, PER, interés compuesto, inflación, diversificación, dividendos, DCF, bonos o por dónde empezar.</p><p>Con tu cuenta, Lumen responde a cualquier duda del temario.</p>`;

  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const chatBody = document.getElementById('chat-body');
  const tabs = Array.from(document.querySelectorAll('.chat__tabs button'));
  let current = 0;
  let timers = [];
  let autoplay = !reduceMotion;

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function addUser(text) {
    const user = document.createElement('div');
    user.className = 'msg msg--user';
    user.textContent = text;
    chatBody.appendChild(user);
  }

  function addBot(html, delay) {
    const answer = document.createElement('div');
    answer.className = 'msg msg--bot';
    answer.innerHTML = html;
    if (reduceMotion || !delay) {
      chatBody.appendChild(answer);
      chatBody.scrollTop = chatBody.scrollHeight;
      return;
    }
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.setAttribute('aria-label', 'Lumen está escribiendo');
    typing.innerHTML = '<i></i><i></i><i></i>';
    timers.push(setTimeout(() => { chatBody.appendChild(typing); chatBody.scrollTop = chatBody.scrollHeight; }, 400));
    timers.push(setTimeout(() => { typing.remove(); chatBody.appendChild(answer); chatBody.scrollTop = chatBody.scrollHeight; }, delay));
  }

  function showLesson(i) {
    clearTimers();
    current = i;
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    chatBody.innerHTML = '';
    addUser(lessons[i].q);
    addBot(lessons[i].a, 1700);
    if (autoplay) timers.push(setTimeout(() => showLesson((current + 1) % lessons.length), 9000));
  }

  tabs.forEach((tab, i) => tab.addEventListener('click', () => { autoplay = false; showLesson(i); }));
  document.querySelector('.chat__tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = (current + (e.key === 'ArrowRight' ? 1 : lessons.length - 1)) % lessons.length;
    autoplay = false;
    showLesson(next);
    tabs[next].focus();
  });

  /* Chat real con Lumen: POST api/chat (servidor en faro-server/) con respuesta en streaming.
     Si no hay servidor o no está configurado, se usan las respuestas de demostración de arriba. */
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-text');
  const sendBtn = form.querySelector('button');
  const history = []; // [{role, content}] alternando usuario y Lumen
  const MAX_HISTORY = 18;
  let live = true; // pasa a false si el servidor del chat no está disponible
  let typedStarted = false;
  let busy = false;

  // Markdown mínimo: negritas, listas con guiones, párrafos y enlaces internos del sitio.
  function renderMarkdown(src) {
    const inline = (s) => escape(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Solo rutas internas (/algo), nunca //dominio ni otros esquemas
      .replace(/\[([^\]]+)\]\((\/(?!\/)[^\s)]*)\)/g, (m, t, href) => `<a href="${href}">${t}</a>`);
    const blocks = src.replace(/\r/g, '').split(/\n{2,}/);
    return blocks.map((block) => {
      const lines = block.split('\n').filter((l) => l.trim());
      if (lines.length && lines.every((l) => /^\s*[-•]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return lines.length ? `<p>${lines.map(inline).join('<br>')}</p>` : '';
    }).join('');
  }

  function cannedAnswer(text) {
    const q = normalize(text);
    const hit = answers.find((x) => x.keys.some((k) => q.includes(normalize(k))));
    addBot(`<span class="tag">LUMEN</span>${hit ? hit.a : fallback}`, 1200);
  }

  function setBusy(on) {
    busy = on;
    input.disabled = on;
    sendBtn.disabled = on;
    if (!on) input.focus();
  }

  async function askLumen(text) {
    history.push({ role: 'user', content: text });
    while (history.length > MAX_HISTORY) history.splice(0, 2);

    const bubble = document.createElement('div');
    bubble.className = 'msg msg--bot';
    bubble.innerHTML = '<span class="tag">LUMEN</span><div class="msg__text"></div>';
    const body = bubble.querySelector('.msg__text');
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.setAttribute('aria-label', 'Lumen está escribiendo');
    typing.innerHTML = '<i></i><i></i><i></i>';
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;

    let res;
    try {
      res = await fetch('api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
    } catch (err) {
      res = null;
    }

    // Sin servidor (web estática) o sin credenciales: modo demostración
    if (!res || [404, 405, 501, 503].includes(res.status)) {
      typing.remove();
      history.pop();
      live = false;
      cannedAnswer(text);
      return;
    }
    if (!res.ok || !(res.headers.get('Content-Type') || '').includes('text/event-stream')) {
      typing.remove();
      history.pop();
      const data = await res.json().catch(() => ({}));
      body.innerHTML = `<p>${escape(data.error || 'No he podido responder ahora mismo. Inténtalo de nuevo.')}</p>`;
      chatBody.appendChild(bubble);
      return;
    }

    let answer = '';
    let failed = false;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = (frame.match(/^event: (.*)$/m) || [])[1];
        const dataLine = (frame.match(/^data: (.*)$/m) || [])[1];
        if (!event || !dataLine) continue;
        const data = JSON.parse(dataLine);
        if (event === 'delta') {
          if (!bubble.isConnected) { typing.remove(); chatBody.appendChild(bubble); }
          answer += data.text;
          body.innerHTML = renderMarkdown(answer);
        } else if (event === 'error') {
          failed = true;
          typing.remove();
          if (!bubble.isConnected) chatBody.appendChild(bubble);
          body.innerHTML = renderMarkdown(answer) + `<p class="msg__error">${escape(data.message)}</p>`;
        }
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }
    typing.remove();
    if (!bubble.isConnected) {
      chatBody.appendChild(bubble);
      body.innerHTML = '<p>No he recibido respuesta. Inténtalo de nuevo.</p>';
      failed = true;
    }
    if (failed || !answer.trim()) history.pop();
    else history.push({ role: 'assistant', content: answer });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    autoplay = false;
    clearTimers();
    // La primera pregunta escrita empieza una conversación nueva, sin la demo de las pestañas
    if (!typedStarted) {
      chatBody.innerHTML = '';
      tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
      typedStarted = true;
    }
    input.value = '';
    addUser(text);
    if (!live) {
      while (chatBody.children.length > 6) chatBody.firstElementChild.remove();
      cannedAnswer(text);
      return;
    }
    setBusy(true);
    try {
      await askLumen(text);
    } finally {
      setBusy(false);
    }
  });
  // Escribir detiene la rotación automática de pestañas
  input.addEventListener('focus', () => { autoplay = false; clearTimers(); });

  showLesson(0);

  /* Test de nivel */
  const questions = [
    {
      q: '¿Qué mide el margen neto de una empresa?',
      opts: ['Sus deudas frente a su capital', 'La parte de las ventas que acaba siendo beneficio', 'Cuánto ha subido la acción este año'],
      right: 1,
    },
    {
      q: 'Si una inversión cae un 20 %, ¿cuánto debe subir para volver al punto de partida?',
      opts: ['20 %', '25 %', '40 %'],
      right: 1,
    },
    {
      q: '¿Qué suele ocurrir con el precio de los bonos ya emitidos si suben los tipos de interés?',
      opts: ['Sube', 'No cambia', 'Baja'],
      right: 2,
    },
  ];
  const levels = [
    { name: 'Inicial', text: 'Te recomendamos empezar por el módulo 1: Contabilidad para inversores.', module: 1 },
    { name: 'Básico', text: 'Tienes una base. Repasa el módulo 1 y pasa al 2: Cuánto vale una empresa.', module: 2 },
    { name: 'Intermedio', text: 'Buen nivel. Puedes empezar por el módulo 3: Riesgo y volatilidad.', module: 3 },
    { name: 'Avanzado', text: 'Dominas lo esencial. Ve directo al módulo 4: Diseña tu cartera.', module: 4 },
  ];

  const stage = document.getElementById('quiz-stage');
  const bar = document.getElementById('quiz-bar');
  let qi = 0;
  let score = 0;

  function renderQuestion() {
    const item = questions[qi];
    bar.style.width = `${(qi / questions.length) * 100}%`;
    stage.innerHTML = '';

    const count = document.createElement('span');
    count.className = 'quiz__count';
    count.textContent = `Pregunta ${qi + 1} de ${questions.length}`;
    const title = document.createElement('p');
    title.className = 'quiz__q';
    title.textContent = item.q;
    const opts = document.createElement('div');
    opts.className = 'quiz__opts';

    item.opts.forEach((label, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz__opt';
      b.textContent = label;
      b.addEventListener('click', () => {
        const buttons = opts.querySelectorAll('button');
        buttons.forEach((x) => { x.disabled = true; });
        buttons[item.right].classList.add('is-right');
        if (k === item.right) score += 1; else b.classList.add('is-wrong');
        setTimeout(() => { qi += 1; qi < questions.length ? renderQuestion() : renderResult(); }, 900);
      });
      opts.appendChild(b);
    });

    stage.append(count, title, opts);
  }

  function renderResult() {
    bar.style.width = '100%';
    const level = levels[score];
    stage.innerHTML = `
      <div class="quiz__result">
        <span class="quiz__count">Has acertado ${score} de ${questions.length}</span>
        <p class="quiz__level">Nivel ${level.name}</p>
        <p>${level.text}</p>
        <a class="btn btn--gold" href="#modulos" data-open-module="${level.module}">Ver el módulo ${level.module}</a>
        <button type="button" class="btn btn--ghost" id="quiz-retry">Repetir</button>
      </div>`;
    stage.querySelector('[data-open-module]').addEventListener('click', (e) => {
      const n = Number(e.currentTarget.dataset.openModule);
      document.querySelectorAll('.module').forEach((m, k) => { m.open = k === n - 1; });
    });
    stage.querySelector('#quiz-retry').addEventListener('click', () => { qi = 0; score = 0; renderQuestion(); });
    store.set('faro-level', level.name);
  }

  renderQuestion();
})();
