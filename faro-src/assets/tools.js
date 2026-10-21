// Faro Finanzas — calculadoras. Cada página tiene un <form id="calc" data-calc="..."> y un panel #calc-out.
(function () {
  'use strict';

  const { eur, num, pct } = window.Faro;
  const form = document.getElementById('calc');
  if (!form) return;
  const out = document.getElementById('calc-out');

  /* ---------- Utilidades ---------- */

  // Lee todos los campos con name como números (las casillas como booleanos)
  function values() {
    const v = {};
    form.querySelectorAll('input[name], select[name]').forEach((el) => {
      if (el.type === 'checkbox') v[el.name] = el.checked;
      else v[el.name] = el.value === '' ? NaN : Number(el.value);
    });
    return v;
  }

  // Muestra el valor de cada control deslizante en su <output for="...">
  function syncOutputs() {
    form.querySelectorAll('output[for]').forEach((o) => {
      const el = document.getElementById(o.htmlFor);
      const fmt = el.dataset.fmt;
      const n = Number(el.value);
      o.textContent = fmt === 'eur' ? eur(n) : fmt === 'pct' ? pct(n, 1) : fmt === 'years' ? `${n} años` : num(n);
    });
  }

  function kpis(items) {
    return `<div class="kpis">${items.map(([label, value, main]) => `<div class="kpi${main ? ' kpi--main' : ''}"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
  }

  function invalid(msg) {
    out.innerHTML = `<h2>Resultado</h2><p class="verdict">${msg}</p>`;
  }

  const compact = (n) => {
    const a = Math.abs(n);
    if (a >= 1e6) return `${num(n / 1e6, 1)} M`;
    if (a >= 1e3) return `${num(n / 1e3, 0)} k`;
    return num(n, 0);
  };

  // Gráfico de barras (apiladas si cada valor es un array). labels: etiquetas del eje X.
  function barChart({ labels, series, colors, height = 260 }) {
    const W = 640;
    const H = height;
    const pad = { l: 48, r: 8, t: 10, b: 26 };
    const totals = labels.map((_, i) => series.reduce((s, ser) => s + Math.max(0, ser[i]), 0));
    const max = Math.max(...totals, 1);
    const bw = (W - pad.l - pad.r) / labels.length;
    const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
    let g = '';
    for (let k = 0; k <= 4; k += 1) {
      const v = (max / 4) * k;
      g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.07)"/>`;
      g += `<text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${compact(v)}</text>`;
    }
    const every = Math.ceil(labels.length / 10);
    labels.forEach((lab, i) => {
      let base = 0;
      series.forEach((ser, s) => {
        const v = Math.max(0, ser[i]);
        const top = y(base + v);
        const h = y(base) - top;
        g += `<rect x="${pad.l + i * bw + bw * 0.15}" y="${top}" width="${bw * 0.7}" height="${Math.max(0, h)}" rx="2" fill="${colors[s]}"/>`;
        base += v;
      });
      if (i % every === 0 || i === labels.length - 1) g += `<text x="${pad.l + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${lab}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolución">${g}</svg>`;
  }

  // Gráfico de líneas con banda opcional [low, high]
  function lineChart({ labels, lines, colors, band, target, height = 260 }) {
    const W = 640;
    const H = height;
    const pad = { l: 48, r: 8, t: 10, b: 26 };
    const all = [...lines.flat(), ...(band ? band.flat() : []), ...(target ? [target] : [])];
    const max = Math.max(...all, 1);
    const min = Math.min(0, ...all);
    const x = (i) => pad.l + (W - pad.l - pad.r) * (i / Math.max(1, labels.length - 1));
    const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - (v - min) / (max - min));
    let g = '';
    for (let k = 0; k <= 4; k += 1) {
      const v = min + ((max - min) / 4) * k;
      g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.07)"/>`;
      g += `<text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${compact(v)}</text>`;
    }
    if (band) {
      const [lo, hi] = band;
      const pts = hi.map((v, i) => `${x(i)},${y(v)}`).concat(lo.map((v, i) => `${x(i)},${y(v)}`).reverse()).join(' ');
      g += `<polygon points="${pts}" fill="rgba(201,162,39,.15)"/>`;
    }
    if (target) g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(target)}" y2="${y(target)}" stroke="#22c55e" stroke-dasharray="6 5" stroke-width="2"/>`;
    lines.forEach((line, s) => {
      g += `<polyline fill="none" stroke="${colors[s]}" stroke-width="3" stroke-linejoin="round" points="${line.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>`;
    });
    const every = Math.ceil(labels.length / 10);
    labels.forEach((lab, i) => {
      if (i % every === 0 || i === labels.length - 1) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${lab}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolución">${g}</svg>`;
  }

  const legend = (items) => `<div class="legend">${items.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}</div>`;
  const GOLD = '#c9a227';
  const GOLD_HI = '#e8c04a';
  const SLATE = '#5d6b82';
  const GREEN = '#22c55e';
  const RED = '#ef4444';

  /* ---------- Calculadoras ---------- */

  const calcs = {
    // Interés compuesto con aportaciones mensuales
    'interes-compuesto'(v) {
      const r = v.rate / 100;
      const m = Math.pow(1 + r, 1 / 12) - 1;
      let bal = v.capital;
      let contributed = v.capital;
      const aport = [];
      const gains = [];
      const labels = [];
      for (let year = 1; year <= v.years; year += 1) {
        for (let k = 0; k < 12; k += 1) {
          bal = bal * (1 + m) + v.monthly;
          contributed += v.monthly;
        }
        labels.push(year);
        aport.push(contributed);
        gains.push(bal - contributed);
      }
      const interest = bal - contributed;
      out.innerHTML = `<h2>Tu simulación</h2>${kpis([
        ['Capital final', eur(bal), true],
        ['Total aportado', eur(contributed)],
        ['Intereses generados', eur(interest)],
      ])}${barChart({ labels, series: [aport, gains], colors: [SLATE, GOLD] })}${legend([[SLATE, 'Aportado'], [GOLD, 'Intereses']])}
      <p class="verdict">Los intereses suponen el <strong>${pct(bal > 0 ? (interest / bal) * 100 : 0, 0)}</strong> del capital final. Tu dinero se duplica aproximadamente cada <strong>${v.rate > 0 ? num(Math.log(2) / Math.log(1 + r), 1) : '—'} años</strong>.</p>`;
    },

    // PER y rentabilidad de beneficios
    per(v) {
      if (!(v.price > 0) || !(v.eps !== 0) || Number.isNaN(v.eps)) return invalid('Introduce un precio y un beneficio por acción distintos de cero.');
      const per = v.price / v.eps;
      const yieldE = (v.eps / v.price) * 100;
      const peg = v.growth > 0 ? per / v.growth : NaN;
      let verdict;
      if (per < 0) verdict = 'La empresa tiene <strong>pérdidas</strong>: el PER no es significativo. Mira otras métricas como ventas o flujo de caja.';
      else if (per < 10) verdict = 'PER <strong>bajo</strong>. Puede ser una oportunidad o reflejar que el mercado espera que los beneficios caigan. Comprueba por qué.';
      else if (per <= 20) verdict = 'PER <strong>moderado</strong>, en la zona habitual de muchas empresas maduras. Compáralo con su sector y su propia historia.';
      else verdict = 'PER <strong>alto</strong>. Solo se justifica si los beneficios van a crecer con fuerza durante años. Revisa el crecimiento esperado.';
      out.innerHTML = `<h2>Resultado</h2>${kpis([
        ['PER', num(per, 1), true],
        ['Rentabilidad de beneficios', pct(yieldE, 1)],
        ['PEG (PER / crecimiento)', Number.isNaN(peg) ? '—' : num(peg, 2)],
      ])}<p class="verdict">${verdict}</p>
      <table class="ref-table"><thead><tr><th>PER</th><th>Lectura habitual</th></tr></thead><tbody>
        <tr><td>&lt; 10</td><td>Barato o con problemas a la vista</td></tr>
        <tr><td>10 – 20</td><td>Rango común en empresas maduras</td></tr>
        <tr><td>&gt; 20</td><td>El mercado descuenta crecimiento</td></tr>
      </tbody></table>
      <p class="disclaimer">Rangos orientativos. El PER «normal» cambia mucho entre sectores y épocas.</p>`;
    },

    // Pérdida de poder adquisitivo
    inflacion(v) {
      const r = v.inflation / 100;
      const labels = [];
      const real = [];
      for (let y = 0; y <= v.years; y += 1) {
        labels.push(y);
        real.push(v.amount / Math.pow(1 + r, y));
      }
      const end = real[real.length - 1];
      const needed = v.amount * Math.pow(1 + r, v.years);
      out.innerHTML = `<h2>Resultado</h2>${kpis([
        ['Poder adquisitivo final', eur(end), true],
        ['Pérdida de valor real', `${eur(v.amount - end)} (${pct(v.amount > 0 ? ((v.amount - end) / v.amount) * 100 : 0, 1)})`],
        ['Necesitarás para comprar lo mismo', eur(needed)],
      ])}${lineChart({ labels, lines: [real], colors: [GOLD_HI] })}${legend([[GOLD_HI, 'Valor real de tu dinero (euros de hoy)']])}
      <p class="verdict">Para no perder poder adquisitivo, tu dinero necesita rendir al menos un <strong>${pct(v.inflation, 1)}</strong> anual después de comisiones e impuestos.</p>`;
    },

    // Cartera con supuestos de rentabilidad y volatilidad por clase de activo (ilustrativos)
    'simulador-cartera'(v) {
      const assets = [
        { key: 'stocks', mu: 0.07, sigma: 0.17 },
        { key: 'bonds', mu: 0.03, sigma: 0.06 },
        { key: 'gold', mu: 0.04, sigma: 0.15 },
        { key: 'cash', mu: 0.02, sigma: 0.01 },
      ];
      // Correlaciones supuestas: acciones-bonos 0,1; acciones-oro 0,05; bonos-oro 0,2; liquidez 0
      const corr = [[1, 0.1, 0.05, 0], [0.1, 1, 0.2, 0], [0.05, 0.2, 1, 0], [0, 0, 0, 1]];
      const w = assets.map((a) => (v[a.key] || 0) / 100);
      const sum = w.reduce((s, x) => s + x, 0);
      const sumEl = document.getElementById('alloc-sum');
      sumEl.textContent = `Total: ${num(sum * 100)} %`;
      sumEl.classList.toggle('is-bad', Math.abs(sum - 1) > 0.001);
      if (Math.abs(sum - 1) > 0.001) return invalid('El reparto debe sumar exactamente 100 %. Ajusta los porcentajes.');

      const mu = w.reduce((s, x, i) => s + x * assets[i].mu, 0);
      let variance = 0;
      for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) variance += w[i] * w[j] * assets[i].sigma * assets[j].sigma * corr[i][j];
      const sigma = Math.sqrt(variance);

      // Proyección lognormal: mediana y banda del 10–90 %
      const labels = [];
      const median = [];
      const lo = [];
      const hi = [];
      const z = 1.2816;
      const g = Math.log(1 + mu) - (sigma * sigma) / 2;
      for (let t = 0; t <= v.years; t += 1) {
        labels.push(t);
        median.push(v.amount * Math.exp(g * t));
        lo.push(v.amount * Math.exp(g * t - z * sigma * Math.sqrt(t)));
        hi.push(v.amount * Math.exp(g * t + z * sigma * Math.sqrt(t)));
      }
      const badYear = Math.max(-0.99, mu - 2 * sigma);
      out.innerHTML = `<h2>Resultado estimado</h2>${kpis([
        ['Rentabilidad esperada', pct(mu * 100, 1), true],
        ['Volatilidad anual', pct(sigma * 100, 1)],
        ['Un año malo (1 de cada 40)', pct(badYear * 100, 0)],
      ])}${lineChart({ labels, lines: [median], colors: [GOLD_HI], band: [lo, hi] })}${legend([[GOLD_HI, 'Escenario central'], ['rgba(201,162,39,.35)', 'Rango probable (80 %)']])}
      <p class="verdict">En ${v.years} años, el escenario central es de unos <strong>${eur(median[median.length - 1])}</strong>, con un rango probable entre <strong>${eur(lo[lo.length - 1])}</strong> y <strong>${eur(hi[hi.length - 1])}</strong>.</p>
      <p class="disclaimer">Simulación con supuestos ilustrativos de rentabilidad, volatilidad y correlación por clase de activo; no son datos históricos ni garantizan resultados futuros.</p>`;
    },

    // Descuento de flujos de caja a 5 años más valor terminal
    dcf(v) {
      const r = v.wacc / 100;
      const gTerm = v.terminal / 100;
      if (!(r > gTerm)) return invalid('La tasa de descuento (WACC) debe ser mayor que el crecimiento a perpetuidad.');
      if (!(v.shares > 0)) return invalid('Introduce un número de acciones mayor que cero.');
      const g = v.growth / 100;
      let fcf = v.fcf;
      let pvSum = 0;
      const labels = [];
      const pvs = [];
      for (let t = 1; t <= 5; t += 1) {
        fcf *= 1 + g;
        const pv = fcf / Math.pow(1 + r, t);
        pvSum += pv;
        labels.push(`Año ${t}`);
        pvs.push(pv);
      }
      const tv = (fcf * (1 + gTerm)) / (r - gTerm);
      const pvTv = tv / Math.pow(1 + r, 5);
      labels.push('Terminal');
      pvs.push(pvTv);
      const ev = pvSum + pvTv;
      const equity = ev - v.debt;
      const perShare = equity / v.shares;
      const margin = v.price > 0 ? (perShare - v.price) / perShare : NaN;
      let verdict = '';
      if (v.price > 0) {
        verdict = margin > 0.25
          ? `Con estos supuestos, la acción cotiza con un <strong>margen de seguridad del ${pct(margin * 100, 0)}</strong>.`
          : margin > 0
            ? `La acción cotiza <strong>algo por debajo</strong> del valor estimado (${pct(margin * 100, 0)}), un margen pequeño para errores en los supuestos.`
            : `Con estos supuestos, la acción cotiza un <strong>${pct(-margin * 100, 0)} por encima</strong> del valor estimado.`;
      }
      out.innerHTML = `<h2>Valor estimado</h2>${kpis([
        ['Valor por acción', eur(perShare, 2), true],
        ['Valor de la empresa', `${num(ev, 0)} M€`],
        ['Peso del valor terminal', pct((pvTv / ev) * 100, 0)],
      ])}${barChart({ labels, series: [pvs], colors: [GOLD] })}${legend([[GOLD, 'Valor actual de cada flujo (M€)']])}
      ${verdict ? `<p class="verdict">${verdict}</p>` : ''}
      <p class="disclaimer">El resultado depende mucho de la tasa de descuento y del crecimiento. Prueba varios escenarios antes de sacar conclusiones.</p>`;
    },

    // Independencia financiera con regla de retirada
    fire(v) {
      const annualExp = v.expenses * 12;
      if (!(v.withdrawal > 0)) return invalid('La tasa de retirada debe ser mayor que cero.');
      const target = annualExp / (v.withdrawal / 100);
      const saving = v.income - v.expenses;
      const savingRate = v.income > 0 ? saving / v.income : 0;
      const m = Math.pow(1 + v.rate / 100, 1 / 12) - 1;
      let bal = v.savings;
      let months = 0;
      const labels = [0];
      const path = [bal];
      while (bal < target && months < 70 * 12) {
        bal = bal * (1 + m) + saving;
        months += 1;
        if (months % 12 === 0) { labels.push(months / 12); path.push(bal); }
      }
      const reached = bal >= target;
      if (reached && months % 12 !== 0) { labels.push(Math.ceil(months / 12)); path.push(bal); }
      const yearsTxt = reached ? `${num(months / 12, 1)} años` : 'Más de 70 años';
      out.innerHTML = `<h2>Tu número FIRE</h2>${kpis([
        ['Patrimonio objetivo', eur(target), true],
        ['Tasa de ahorro', pct(savingRate * 100, 0)],
        ['Tiempo estimado', yearsTxt],
      ])}${lineChart({ labels, lines: [path], colors: [GOLD_HI], target })}${legend([[GOLD_HI, 'Patrimonio proyectado'], [GREEN, 'Objetivo']])}
      <p class="verdict">${saving <= 0
        ? 'Ahora mismo gastas todo lo que ingresas. Sin ahorro mensual el objetivo no se alcanza: el primer paso es abrir ese margen.'
        : `Ahorrando <strong>${eur(saving)}</strong> al mes con una rentabilidad real del ${pct(v.rate, 1)}, ${reached ? `alcanzarías el objetivo en unos <strong>${yearsTxt}</strong>.` : 'el objetivo queda muy lejos. Aumentar la tasa de ahorro es la palanca más potente.'}`}</p>
      <p class="disclaimer">Usa una rentabilidad real (descontada la inflación). La tasa de retirada del 4 % es una referencia histórica, no una garantía.</p>`;
    },

    // Cartera de dividendos con o sin reinversión
    dividendos(v) {
      const y = v.yield / 100;
      const dg = v.dgrowth / 100;
      const pg = v.pgrowth / 100;
      let capital = v.initial;
      let currentYield = y;
      let totalCashed = 0;
      let lastIncome = 0;
      const labels = [];
      const income = [];
      for (let t = 1; t <= v.years; t += 1) {
        capital += v.monthly * 12;
        const div = capital * currentYield;
        lastIncome = div;
        capital *= 1 + pg;
        if (v.drip) capital += div; else totalCashed += div;
        // El dividendo por acción crece dg mientras el precio crece pg
        currentYield = currentYield * (1 + dg) / (1 + pg);
        labels.push(t);
        income.push(div);
      }
      out.innerHTML = `<h2>Resultado</h2>${kpis([
        ['Dividendos del último año', eur(lastIncome), true],
        ['Al mes, aprox.', eur(lastIncome / 12)],
        [v.drip ? 'Capital final (reinvirtiendo)' : 'Dividendos cobrados en total', v.drip ? eur(capital) : eur(totalCashed)],
      ])}${barChart({ labels, series: [income], colors: [GOLD] })}${legend([[GOLD, 'Dividendos brutos de cada año']])}
      <p class="verdict">${v.drip ? 'Reinvirtiendo, cada dividendo compra más acciones que a su vez pagan dividendos: el efecto bola de nieve.' : 'Cobrando los dividendos obtienes renta desde el primer año, pero el capital crece más despacio.'}</p>
      <p class="disclaimer">Importes brutos, antes de impuestos y comisiones. Los dividendos pueden recortarse.</p>`;
    },
  };

  const run = () => {
    syncOutputs();
    const fn = calcs[form.dataset.calc];
    if (fn) fn(values());
  };

  form.addEventListener('input', run);
  form.addEventListener('submit', (e) => { e.preventDefault(); run(); out.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  run();
})();
