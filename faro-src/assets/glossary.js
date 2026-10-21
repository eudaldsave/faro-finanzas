// Faro Finanzas — glosario: datos, búsqueda, filtros e índice alfabético
(function () {
  'use strict';

  const { escape } = window.Faro;

  const CATS = { basico: 'Básico', valoracion: 'Valoración', ratios: 'Ratios', riesgo: 'Riesgo', carteras: 'Carteras', macro: 'Macro' };

  // Definiciones propias de Faro Finanzas. `more` enlaza a una guía o calculadora relacionada.
  const TERMS = [
    { id: 'accion', name: 'Acción', abbr: 'Parte de una empresa', cats: ['basico'], def: 'Una pequeña parte de la propiedad de una empresa. Como accionista participas en sus beneficios (dividendos) y en la evolución de su valor.', ex: 'Si una empresa tiene 1 millón de acciones y compras 100, eres dueño del 0,01 % del negocio.' },
    { id: 'alpha', name: 'Alpha (α)', abbr: 'Rentabilidad extra', cats: ['carteras', 'riesgo'], def: 'La rentabilidad que obtiene una inversión por encima de la que le correspondería por el riesgo de mercado que asume. Un alpha positivo indica que el gestor ha aportado valor.', formula: 'α = Rentabilidad real − Rentabilidad esperada según su beta', ex: 'Un fondo gana un 9 % cuando, por su riesgo, se esperaba un 7 %: su alpha es +2 %.' },
    { id: 'apalancamiento', name: 'Apalancamiento', abbr: 'Invertir con deuda', cats: ['riesgo', 'basico'], def: 'Usar dinero prestado para invertir más de lo que tienes. Multiplica las ganancias y también las pérdidas.', ex: 'Con 1.000 € propios y 1.000 € prestados, una caída del 25 % se lleva la mitad de tu dinero.' },
    { id: 'beta', name: 'Beta (β)', abbr: 'Sensibilidad al mercado', cats: ['riesgo', 'ratios'], def: 'Mide cuánto se mueve una acción respecto al mercado. Beta 1 se mueve igual; mayor que 1, más; menor que 1, menos.', ex: 'Con beta 1,5, si el índice cae un 10 %, la acción tiende a caer alrededor de un 15 %.', more: 'aprende/riesgo-y-volatilidad.html' },
    { id: 'bono', name: 'Bono', abbr: 'Renta fija', cats: ['basico', 'macro'], def: 'Un préstamo que haces a un Estado o empresa. A cambio recibes intereses periódicos (cupón) y la devolución del capital al vencimiento.', ex: 'Un bono de 1.000 € al 3 % paga 30 € al año hasta su vencimiento.' },
    { id: 'capitalizacion', name: 'Capitalización bursátil', abbr: 'Market cap', cats: ['valoracion', 'basico'], def: 'Lo que vale en bolsa una empresa en un momento dado: precio de la acción por número de acciones.', formula: 'Capitalización = Precio × Número de acciones', ex: '200 millones de acciones a 25 € dan una capitalización de 5.000 M€.' },
    { id: 'dca', name: 'Aportaciones periódicas', abbr: 'DCA', cats: ['carteras', 'basico'], def: 'Invertir la misma cantidad cada cierto tiempo, sin intentar adivinar el mejor momento. Suaviza el precio medio de compra.', ex: '200 € cada mes compran más participaciones cuando el precio baja y menos cuando sube.' },
    { id: 'dcf', name: 'Descuento de flujos de caja', abbr: 'DCF', cats: ['valoracion'], def: 'Método que estima el valor de una empresa sumando el dinero que generará en el futuro, traído a valor de hoy con una tasa de descuento.', formula: 'Valor = Σ FCFₜ / (1 + r)ᵗ + Valor terminal / (1 + r)ⁿ', ex: 'Si prevés que generará 100 M€ al año y descuentas al 9 %, cada año futuro vale menos hoy.', more: 'herramientas/dcf.html' },
    { id: 'diversificacion', name: 'Diversificación', abbr: 'No todo en el mismo sitio', cats: ['carteras', 'riesgo'], def: 'Repartir el dinero entre activos que no se mueven igual para que un solo error no hunda la cartera.', ex: 'Una cartera con 2.000 empresas de 40 países depende mucho menos de cada una que una con 3 empresas.', more: 'herramientas/simulador-cartera.html' },
    { id: 'dividendo', name: 'Dividendo', abbr: 'Reparto de beneficios', cats: ['basico', 'ratios'], def: 'La parte del beneficio que la empresa entrega a sus accionistas. La rentabilidad por dividendo lo compara con el precio de la acción.', formula: 'Rentabilidad por dividendo = Dividendo anual / Precio', ex: 'Una acción a 40 € que paga 1,60 € al año rinde un 4 %.', more: 'herramientas/dividendos.html' },
    { id: 'ebitda', name: 'EBITDA', abbr: 'Beneficio operativo bruto', cats: ['valoracion', 'ratios'], def: 'El beneficio antes de intereses, impuestos, amortizaciones y depreciaciones. Aproxima lo que genera el negocio en sí, sin efectos financieros ni contables.', formula: 'EBITDA = Beneficio operativo + Amortizaciones', ex: 'Útil para comparar empresas con distinta deuda, pero ignora la inversión necesaria para mantener el negocio.' },
    { id: 'etf', name: 'ETF', abbr: 'Fondo cotizado', cats: ['carteras', 'basico'], def: 'Un fondo que cotiza en bolsa como una acción y normalmente replica un índice. Con una sola compra tienes cientos o miles de empresas.', ex: 'Un ETF del índice mundial con comisión del 0,2 % cuesta 2 € al año por cada 1.000 € invertidos.', more: 'aprende/etf-vs-fondo.html' },
    { id: 'ev-ebitda', name: 'EV/EBITDA', abbr: 'Múltiplo empresarial', cats: ['valoracion', 'ratios'], def: 'Compara el valor total de la empresa (incluida su deuda neta) con su EBITDA. Permite comparar empresas con distinta estructura de deuda.', formula: 'EV/EBITDA = (Capitalización + Deuda neta) / EBITDA', ex: 'EV de 12.000 M€ y EBITDA de 1.500 M€: múltiplo de 8 veces.' },
    { id: 'fcf', name: 'Flujo de caja libre', abbr: 'FCF', cats: ['valoracion', 'ratios'], def: 'El dinero que le queda a la empresa después de pagar su operativa y sus inversiones. Es lo que podría repartir sin endeudarse.', formula: 'FCF = Flujo de caja operativo − Inversiones (CAPEX)', ex: 'Genera 900 M€ con su actividad e invierte 300 M€: FCF de 600 M€.' },
    { id: 'inflacion', name: 'Inflación', abbr: 'Subida general de precios', cats: ['macro', 'basico'], def: 'El aumento sostenido de los precios. Reduce lo que puedes comprar con el mismo dinero.', formula: 'Poder adquisitivo futuro = Importe / (1 + inflación)ᵃñᵒˢ', ex: 'Con un 3 % anual, 10.000 € de hoy compran lo que 7.441 € dentro de 10 años.', more: 'herramientas/inflacion.html' },
    { id: 'interes-compuesto', name: 'Interés compuesto', abbr: 'Rentabilidad sobre rentabilidad', cats: ['basico'], def: 'Ganar rendimiento no solo sobre lo que aportas, sino también sobre lo que ya has ganado. Su efecto crece con el tiempo.', formula: 'Capital final = Capital × (1 + r)ⁿ', ex: '10.000 € al 6 % durante 30 años se convierten en unos 57.400 €.', more: 'aprende/interes-compuesto.html' },
    { id: 'margen-neto', name: 'Margen neto', abbr: 'Beneficio sobre ventas', cats: ['ratios'], def: 'Qué porcentaje de las ventas acaba siendo beneficio final, después de todos los gastos e impuestos.', formula: 'Margen neto = Beneficio neto / Ventas', ex: 'Ventas de 8.000 M€ y beneficio neto de 960 M€: margen del 12 %.' },
    { id: 'per', name: 'PER', abbr: 'Precio / Beneficio', cats: ['valoracion', 'ratios'], def: 'Cuántas veces pagas el beneficio anual de una empresa al comprar sus acciones. Hay que leerlo junto al crecimiento esperado y el sector.', formula: 'PER = Precio / Beneficio por acción', ex: 'Acción a 45 € con beneficio por acción de 3 €: PER de 15.', more: 'herramientas/per.html' },
    { id: 'pb', name: 'Precio / Valor contable', abbr: 'P/B', cats: ['valoracion', 'ratios'], def: 'Compara el precio en bolsa con el patrimonio neto contable. Muy usado en bancos y aseguradoras.', formula: 'P/B = Capitalización / Patrimonio neto', ex: 'Un banco con patrimonio de 10.000 M€ que cotiza por 8.000 M€ tiene un P/B de 0,8.' },
    { id: 'politica-monetaria', name: 'Política monetaria', abbr: 'Bancos centrales', cats: ['macro'], def: 'Las decisiones de un banco central sobre tipos de interés y cantidad de dinero para controlar la inflación y apoyar la economía.', ex: 'Subir tipos encarece el crédito, enfría el consumo y suele presionar a la baja a bolsas y bonos.' },
    { id: 'roe', name: 'Rentabilidad sobre fondos propios', abbr: 'ROE', cats: ['ratios'], def: 'Cuánto beneficio genera la empresa por cada euro que han puesto sus accionistas.', formula: 'ROE = Beneficio neto / Patrimonio neto', ex: 'Beneficio de 300 M€ con patrimonio de 2.000 M€: ROE del 15 %.' },
    { id: 'sharpe', name: 'Ratio de Sharpe', abbr: 'Rentabilidad por riesgo', cats: ['riesgo', 'carteras'], def: 'Mide cuánta rentabilidad extra obtienes por cada unidad de volatilidad que soportas. Cuanto más alto, mejor compensado está el riesgo.', formula: 'Sharpe = (Rentabilidad − Tipo sin riesgo) / Volatilidad', ex: 'Rentabilidad del 8 %, tipo sin riesgo del 2 % y volatilidad del 12 %: Sharpe de 0,5.' },
    { id: 'tir', name: 'Tasa interna de retorno', abbr: 'TIR', cats: ['valoracion'], def: 'La rentabilidad anual que iguala el valor de lo que inviertes con el de lo que recibes. Sirve para comparar proyectos con flujos en distintas fechas.', ex: 'Pagar 1.000 € hoy y recibir 1.210 € en dos años equivale a una TIR del 10 % anual.' },
    { id: 'tipos-interes', name: 'Tipos de interés', abbr: 'Precio del dinero', cats: ['macro'], def: 'Lo que cuesta pedir dinero prestado y lo que se cobra por prestarlo. Influyen en hipotecas, ahorro, bonos y valoración de empresas.', ex: 'Si los tipos suben del 2 % al 4 %, los bonos que ya existen pierden valor.' },
    { id: 'var', name: 'Valor en riesgo', abbr: 'VaR', cats: ['riesgo'], def: 'Estimación de la pérdida máxima que podría sufrir una cartera en un periodo con un nivel de confianza dado. No dice cuánto se puede perder en el peor caso.', ex: 'VaR diario del 2 % al 95 %: 19 de cada 20 días no deberías perder más de un 2 %.' },
    { id: 'volatilidad', name: 'Volatilidad', abbr: 'Cuánto oscila el precio', cats: ['riesgo'], def: 'Mide cuánto varían los rendimientos alrededor de su media. Más volatilidad implica caminos más accidentados, aunque no necesariamente más pérdidas a largo plazo.', formula: 'Volatilidad = desviación típica de los rendimientos', ex: 'Las acciones suelen tener una volatilidad anual del 15–20 %; los bonos a corto plazo, mucho menos.', more: 'aprende/riesgo-y-volatilidad.html' },
  ];

  const list = document.getElementById('terms');
  const search = document.getElementById('term-search');
  const filters = document.getElementById('term-filters');
  const count = document.getElementById('term-count');
  const empty = document.getElementById('term-empty');
  const az = document.getElementById('az');
  const root = document.querySelector('link[rel="icon"]').getAttribute('href').replace('assets/logo.svg', '');

  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  TERMS.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));

  list.innerHTML = TERMS.map((t) => `
    <article class="term" id="${t.id}" data-cats="${t.cats.join(' ')}" data-text="${escape(normalize([t.name, t.abbr, t.def].join(' ')))}">
      <div class="term__head"><h2>${escape(t.name)}</h2><span class="term__abbr">${escape(t.abbr)}</span></div>
      <p>${escape(t.def)}</p>
      ${t.formula ? `<code class="formula-box">${escape(t.formula)}</code>` : ''}
      ${t.ex ? `<p class="example">${escape(t.ex)}</p>` : ''}
      <div class="tags">${t.cats.map((c) => `<span>${CATS[c]}</span>`).join('')}</div>
      ${t.more ? `<a class="term__more" href="${root}${t.more}">Profundizar →</a>` : ''}
    </article>`).join('');

  const cards = Array.from(list.children);
  let cat = 'todos';

  function apply() {
    const q = normalize(search.value.trim());
    let visible = 0;
    const letters = new Set();
    cards.forEach((card) => {
      const show = (cat === 'todos' || card.dataset.cats.split(' ').includes(cat)) && (!q || card.dataset.text.includes(q));
      card.hidden = !show;
      if (show) {
        visible += 1;
        letters.add(normalize(card.querySelector('h2').textContent)[0].toUpperCase());
      }
    });
    count.textContent = `${visible} ${visible === 1 ? 'término' : 'términos'}`;
    empty.hidden = visible > 0;
    az.querySelectorAll('a').forEach((a) => a.classList.toggle('is-empty', !letters.has(a.textContent)));
  }

  // Índice alfabético: cada letra salta al primer término visible que empieza por ella
  az.innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `<a href="#" data-letter="${l}">${l}</a>`).join('');
  az.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    const target = cards.find((c) => !c.hidden && normalize(c.querySelector('h2').textContent)[0].toUpperCase() === a.dataset.letter);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  filters.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    cat = b.dataset.cat;
    filters.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  });
  search.addEventListener('input', apply);

  apply();

  // Si se llega con #termino, desplazarse a él una vez renderizado
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
})();
