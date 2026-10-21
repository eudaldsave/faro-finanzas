// Faro Finanzas — acceso: pestañas, validación, fortaleza de contraseña y cuentas con Supabase Auth.
// Modos: login, registro y nueva (elegir contraseña al volver del enlace de recuperación).
(function () {
  'use strict';

  const { escape, supabase: sb } = window.Faro;
  const forms = document.getElementById('auth-forms');
  const form = document.getElementById('auth-form');
  const tabs = document.querySelector('.auth__tabs');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const msg = document.getElementById('auth-msg');
  const ok = document.getElementById('auth-ok');
  const submit = document.getElementById('auth-submit');
  const alt = document.getElementById('auth-alt');
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const pw = document.getElementById('auth-password');
  const pwLabel = document.querySelector('label[for="auth-password"]');
  const meter = document.getElementById('pw-meter');
  const sessionBox = document.getElementById('auth-session');
  const sessionMsg = document.getElementById('auth-session-msg');
  // Los enlaces de confirmación y recuperación de los correos vuelven a esta página
  const returnUrl = location.origin + location.pathname;
  const NO_CONNECTION = 'No se ha podido conectar con el sistema de cuentas. Recarga la página e inténtalo de nuevo.';
  let mode = 'login';
  let recovering = false; // llegó desde el enlace de «¿Has olvidado la contraseña?»

  const TEXTS = {
    login: { submit: 'Entrar →', title: 'Vuelve a donde lo dejaste', sub: 'Tu progreso, tus informes y Lumen te esperan.' },
    registro: { submit: 'Crear cuenta gratis →', title: 'Empieza a aprender hoy', sub: 'Crea tu cuenta gratis y haz el test de nivel en 2 minutos.' },
    nueva: { submit: 'Guardar contraseña →', title: 'Elige una contraseña nueva', sub: 'Escríbela dos veces para confirmarla.' },
  };

  function setMode(next) {
    mode = next;
    const reg = mode === 'registro';
    tabs.hidden = mode === 'nueva';
    tabLogin.setAttribute('aria-selected', String(!reg));
    tabRegister.setAttribute('aria-selected', String(reg));
    form.querySelectorAll('[data-modes]').forEach((el) => { el.hidden = !el.dataset.modes.split(' ').includes(mode); });
    pw.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    pwLabel.textContent = mode === 'nueva' ? 'Nueva contraseña' : 'Contraseña';
    submit.textContent = TEXTS[mode].submit;
    title.textContent = TEXTS[mode].title;
    sub.textContent = TEXTS[mode].sub;
    alt.innerHTML = { login: '¿Aún no tienes cuenta? <a href="#" data-mode="registro">Crea una gratis</a>', registro: '¿Ya tienes cuenta? <a href="#" data-mode="login">Inicia sesión</a>', nueva: '' }[mode];
    msg.textContent = '';
    ok.hidden = true;
    const url = new URL(location.href);
    if (reg) url.searchParams.set('tab', 'registro'); else url.searchParams.delete('tab');
    history.replaceState(null, '', url);
  }

  // Muestra el formulario o, con sesión iniciada, el aviso de sesión y el botón de salir
  function showSession(session, note = '') {
    const signedIn = Boolean(session) && !recovering;
    forms.hidden = signedIn;
    sessionBox.hidden = !signedIn;
    if (!signedIn) return;
    const { name } = session.user.user_metadata || {};
    sessionMsg.innerHTML = `${note}Has iniciado sesión como <strong>${escape(name || session.user.email)}</strong>.`;
  }

  function fail(text, field) {
    msg.textContent = text;
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }

  function success(html) {
    ok.hidden = false;
    ok.className = 'form-ok';
    ok.innerHTML = html;
  }

  function clearMessages() {
    msg.textContent = '';
    ok.hidden = true;
    form.querySelectorAll('input').forEach((i) => i.removeAttribute('aria-invalid'));
  }

  // Mensaje para el usuario según el código de error de Supabase Auth
  function authError(error) {
    const messages = {
      invalid_credentials: 'El correo o la contraseña no son correctos.',
      email_not_confirmed: 'Confirma tu correo antes de entrar: abre el enlace que te enviamos al registrarte.',
      user_already_exists: 'Ya existe una cuenta con ese correo. Inicia sesión.',
      email_exists: 'Ya existe una cuenta con ese correo. Inicia sesión.',
      weak_password: 'Esa contraseña es demasiado fácil de adivinar. Elige otra.',
      same_password: 'La contraseña nueva debe ser distinta de la anterior.',
      over_email_send_rate_limit: 'Hemos enviado demasiados correos. Espera unos minutos y vuelve a probar.',
      over_request_rate_limit: 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
    };
    if (messages[error.code]) return messages[error.code];
    console.error('Error de Supabase Auth:', error);
    return 'No se ha podido completar. Inténtalo de nuevo en un momento.';
  }

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  tabLogin.addEventListener('click', () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('registro'));
  alt.addEventListener('click', (e) => {
    const a = e.target.closest('[data-mode]');
    if (!a) return;
    e.preventDefault();
    setMode(a.dataset.mode);
  });

  // Mostrar u ocultar contraseña
  document.querySelectorAll('.pw-toggle').forEach((b) => b.addEventListener('click', () => {
    const input = document.getElementById(b.getAttribute('aria-controls'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.textContent = show ? 'Ocultar' : 'Mostrar';
    b.setAttribute('aria-pressed', String(show));
  }));

  // Medidor de fortaleza: longitud y variedad de caracteres
  pw.addEventListener('input', () => {
    const v = pw.value;
    let score = 0;
    if (v.length >= 8) score += 1;
    if (v.length >= 12) score += 1;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 1;
    if (/\d/.test(v)) score += 1;
    if (/[^A-Za-z0-9]/.test(v)) score += 1;
    const colors = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#22c55e', '#22c55e'];
    meter.style.width = `${(score / 5) * 100}%`;
    meter.style.background = colors[score];
  });

  document.getElementById('forgot').addEventListener('click', async (e) => {
    e.preventDefault();
    clearMessages();
    const email = form.elements.email;
    const address = email.value.trim();
    if (!validEmail(address)) return fail('Escribe tu correo electrónico y vuelve a pulsar «¿Has olvidado la contraseña?».', email);
    if (!sb) return fail(NO_CONNECTION);
    const { error } = await sb.auth.resetPasswordForEmail(address, { redirectTo: returnUrl });
    if (error) return fail(authError(error));
    success(`Si existe una cuenta con <strong>${escape(address)}</strong>, te llegará un correo con un enlace para elegir una contraseña nueva.`);
  });

  document.getElementById('auth-logout').addEventListener('click', async (e) => {
    e.preventDefault();
    if (sb) await sb.auth.signOut();
    setMode('login');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const email = form.elements.email;
    const address = email.value.trim();
    if (mode !== 'nueva' && !validEmail(address)) return fail('Revisa el correo electrónico.', email);
    if (pw.value.length < 8) return fail('La contraseña debe tener al menos 8 caracteres.', pw);

    const name = form.elements.name.value.trim();
    if (mode === 'registro' && !name) return fail('Escribe tu nombre.', form.elements.name);
    if (mode !== 'login' && form.elements.confirm.value !== pw.value) return fail('Las contraseñas no coinciden.', form.elements.confirm);
    if (mode === 'registro' && !document.getElementById('auth-terms').checked) return fail('Debes aceptar los términos y la política de privacidad.');

    if (!sb) return fail(NO_CONNECTION);
    submit.disabled = true;
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email: address, password: pw.value });
        if (error) return fail(authError(error), error.code === 'invalid_credentials' ? pw : undefined);
        // onAuthStateChange muestra la sesión
      } else if (mode === 'registro') {
        const { data, error } = await sb.auth.signUp({
          email: address,
          password: pw.value,
          options: { data: { name }, emailRedirectTo: returnUrl },
        });
        if (error) return fail(authError(error));
        // Sin sesión: el proyecto pide confirmar el correo antes de entrar
        if (!data.session) success(`Te hemos enviado un correo a <strong>${escape(address)}</strong>. Abre el enlace para activar tu cuenta.`);
      } else {
        const { data, error } = await sb.auth.updateUser({ password: pw.value });
        if (error) return fail(authError(error), pw);
        recovering = false;
        setMode('login');
        showSession({ user: data.user }, 'Contraseña actualizada. ');
      }
      pw.value = '';
      form.elements.confirm.value = '';
    } finally {
      submit.disabled = false;
    }
  });

  setMode(new URLSearchParams(location.search).get('tab') === 'registro' ? 'registro' : 'login');

  // Enlace de un correo caducado o ya usado: Supabase vuelve con #error_code=...
  const linkError = new URLSearchParams(location.hash.slice(1)).get('error_code');
  if (linkError) {
    fail(linkError === 'otp_expired' ? 'El enlace del correo ha caducado o ya se ha usado. Pide uno nuevo.' : 'No se ha podido abrir el enlace del correo. Pide uno nuevo.');
    history.replaceState(null, '', location.pathname + location.search);
  }

  if (sb) {
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovering = true;
        setMode('nueva');
      }
      showSession(session);
    });
  }
})();
