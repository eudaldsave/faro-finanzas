// Faro Finanzas — comportamiento común a todas las páginas
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* sin almacenamiento */ } },
  };

  // Utilidades compartidas con los scripts de cada página
  window.Faro = {
    reduceMotion,
    store,
    eur(n, decimals = 0) {
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);
    },
    num(n, decimals = 0) {
      return new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);
    },
    pct(n, decimals = 1) {
      return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n)} %`;
    },
    escape(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
  };

  /* Barra superior */
  const topbar = document.getElementById('topbar');
  if (topbar) {
    if (store.get('faro-topbar') === 'closed') topbar.hidden = true;
    topbar.querySelector('.topbar__close').addEventListener('click', () => {
      topbar.hidden = true;
      store.set('faro-topbar', 'closed');
    });
  }

  /* Menú móvil */
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  document.querySelectorAll('.nav__menu a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  /* Enlace activo según la sección del sitio */
  const section = document.body.dataset.section;
  if (section) {
    const link = document.querySelector(`.nav__menu [data-nav="${section}"]`);
    if (link) link.setAttribute('aria-current', 'page');
  }

  /* Aparición al hacer scroll y barras animadas */
  const revealables = document.querySelectorAll('.reveal, .bar');
  const show = (el) => el.classList.add(el.classList.contains('bar') ? 'is-filled' : 'is-in');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach(show);
  }

  /* Aviso de cookies */
  const cookies = document.getElementById('cookies');
  if (cookies) {
    if (!store.get('faro-consent')) cookies.hidden = false;
    cookies.querySelectorAll('[data-consent]').forEach((b) => b.addEventListener('click', () => {
      store.set('faro-consent', b.dataset.consent);
      cookies.hidden = true;
    }));
  }
})();
