// Faro Finanzas — centro de aprendizaje: filtro por categoría y búsqueda
(function () {
  'use strict';

  const cards = Array.from(document.querySelectorAll('#learn-cards .card:not(.card--feature)'));
  const filters = document.getElementById('learn-filters');
  const search = document.getElementById('learn-search');
  const empty = document.getElementById('learn-empty');
  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let cat = 'todos';

  function apply() {
    const q = normalize(search.value.trim());
    let visible = 0;
    cards.forEach((card) => {
      const text = normalize(`${card.dataset.title} ${card.querySelector('h2').textContent}`);
      const show = (cat === 'todos' || card.dataset.cats.split(' ').includes(cat)) && (!q || text.includes(q));
      card.hidden = !show;
      if (show) visible += 1;
    });
    empty.hidden = visible > 0;
  }

  filters.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    cat = b.dataset.cat;
    filters.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  });
  search.addEventListener('input', apply);
})();
