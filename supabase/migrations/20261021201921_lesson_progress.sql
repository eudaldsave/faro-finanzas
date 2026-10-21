-- Progreso del curso: una fila por alumno y lección con la mejor nota del test.
create table public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^m[0-9]+-[0-9]{2}$'),
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0 and score <= total),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

comment on table public.lesson_progress is 'Lecciones completadas por cada alumno (mejor nota del test). Los ids de lección están en faro-src/assets/temario.json.';

alter table public.lesson_progress enable row level security;

-- Cada alumno solo ve y escribe sus propias filas
create policy "Leer el propio progreso" on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Guardar el propio progreso" on public.lesson_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Actualizar el propio progreso" on public.lesson_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.lesson_progress from anon;
grant select, insert, update on public.lesson_progress to authenticated;
