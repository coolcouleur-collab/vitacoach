-- ═══════════════════════════════════════════════════════════════════════════
-- SOLENN — Cycle 2.0 : vrais cycles enregistrés + historique des symptômes
-- À exécuter dans Supabase : Dashboard → SQL Editor → New query → coller → Run
--
-- Crée deux tables (avec RLS activé + policies « propriétaire uniquement ») :
--   cycle_periods  : chaque ligne = une période de règles (début, fin facultative)
--   cycle_symptoms : symptômes cochés, une ligne par jour et par utilisateur
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cycle_periods (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null,
  start_date date not null,
  end_date   date,
  created_at timestamptz default now(),
  unique (user_id, start_date)
);

create table if not exists cycle_symptoms (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null,
  date       date not null,
  symptoms   jsonb default '[]'::jsonb,
  updated_at timestamptz default now(),
  unique (user_id, date)
);

create index if not exists idx_cycle_periods_user  on cycle_periods (user_id, start_date desc);
create index if not exists idx_cycle_symptoms_user on cycle_symptoms (user_id, date desc);

-- ── RLS : chaque utilisateur ne voit et ne modifie que ses propres données
alter table cycle_periods enable row level security;
drop policy if exists "cycle_periods_select_own" on cycle_periods;
drop policy if exists "cycle_periods_insert_own" on cycle_periods;
drop policy if exists "cycle_periods_update_own" on cycle_periods;
drop policy if exists "cycle_periods_delete_own" on cycle_periods;
create policy "cycle_periods_select_own" on cycle_periods for select
  using (auth.uid() = user_id);
create policy "cycle_periods_insert_own" on cycle_periods for insert
  with check (auth.uid() = user_id);
create policy "cycle_periods_update_own" on cycle_periods for update
  using (auth.uid() = user_id);
create policy "cycle_periods_delete_own" on cycle_periods for delete
  using (auth.uid() = user_id);

alter table cycle_symptoms enable row level security;
drop policy if exists "cycle_symptoms_select_own" on cycle_symptoms;
drop policy if exists "cycle_symptoms_insert_own" on cycle_symptoms;
drop policy if exists "cycle_symptoms_update_own" on cycle_symptoms;
drop policy if exists "cycle_symptoms_delete_own" on cycle_symptoms;
create policy "cycle_symptoms_select_own" on cycle_symptoms for select
  using (auth.uid() = user_id);
create policy "cycle_symptoms_insert_own" on cycle_symptoms for insert
  with check (auth.uid() = user_id);
create policy "cycle_symptoms_update_own" on cycle_symptoms for update
  using (auth.uid() = user_id);
create policy "cycle_symptoms_delete_own" on cycle_symptoms for delete
  using (auth.uid() = user_id);
