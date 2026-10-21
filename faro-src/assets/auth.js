// Faro Finanzas — conexión con Supabase (cuentas de usuario).
// La URL y la clave publicable son públicas por diseño: los datos se protegen con las políticas RLS de la base de datos.
// Necesita la librería supabase-js cargada antes (window.supabase).
(function () {
  'use strict';

  const SUPABASE_URL = 'https://fzhuqfrgzkagxzygldpq.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_USszT3eId0-R3ELM5FpP4A_25NutZHu';

  // null si la librería no ha cargado (sin conexión o bloqueada): cada página decide cómo avisar
  window.Faro.supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
})();
