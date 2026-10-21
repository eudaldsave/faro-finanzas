// Faro Finanzas — guía descargable: valida el formulario y muestra la guía.
// No envía datos a ningún servidor: conecta aquí tu servicio de email antes de publicar.
(function () {
  'use strict';

  const { store, escape } = window.Faro;
  const form = document.getElementById('gate-form');
  const msg = document.getElementById('gate-msg');
  const guide = document.getElementById('guide');
  const title = document.getElementById('guide-title');

  function unlock(name) {
    guide.hidden = false;
    if (name) title.innerHTML = `Aquí la tienes, ${escape(name)}`;
    guide.focus();
    guide.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const consent = document.getElementById('gate-consent').checked;
    form.querySelectorAll('input').forEach((i) => i.removeAttribute('aria-invalid'));

    if (!name) { msg.textContent = 'Escribe tu nombre.'; form.elements.name.setAttribute('aria-invalid', 'true'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Revisa el correo electrónico.'; form.elements.email.setAttribute('aria-invalid', 'true'); return; }
    if (!consent) { msg.textContent = 'Necesitamos tu consentimiento para enviarte la guía.'; return; }

    msg.textContent = '';
    // Aquí iría la llamada a tu proveedor de email (por ejemplo, fetch a su API).
    store.set('faro-guide', 'unlocked');
    unlock(name);
  });

  document.getElementById('guide-print').addEventListener('click', () => window.print());

  // Si ya la desbloqueó antes en este navegador, mostrarla directamente
  if (store.get('faro-guide') === 'unlocked') guide.hidden = false;
})();
