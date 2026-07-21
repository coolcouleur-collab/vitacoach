-- ═══════════════════════════════════════════════════════════════════════════
-- SOLENN — Pré-lancement : quota serveur des messages gratuits + check-in émotionnel
-- À exécuter dans Supabase : Dashboard → SQL Editor → New query → coller → Run
-- (en plus de db/cycle-tables.sql)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. QUOTA — compteur quotidien de messages (source de vérité serveur)
create table if not exists daily_usage (
  user_id uuid not null,
  date    date not null,
  count   int  not null default 0,
  primary key (user_id, date)
);

-- Incrément atomique, appelé par le serveur à chaque message gratuit.
-- security definer : passe outre RLS, mais on révoque l'exécution côté client.
create or replace function increment_daily_usage(p_user uuid, p_date date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v int;
begin
  insert into daily_usage (user_id, date, count) values (p_user, p_date, 1)
  on conflict (user_id, date) do update set count = daily_usage.count + 1
  returning count into v;
  return v;
end $$;

revoke execute on function increment_daily_usage(uuid, date) from public, anon, authenticated;

alter table daily_usage enable row level security;
drop policy if exists "daily_usage_select_own" on daily_usage;
create policy "daily_usage_select_own" on daily_usage for select
  using (auth.uid() = user_id);
-- (aucune policy insert/update : seul le serveur écrit, via service_role ou la RPC)

-- ── 2. CHECK-IN ÉMOTIONNEL — un enregistrement par jour et par utilisateur
create table if not exists checkins (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null,
  date       date not null,
  mood       int  not null check (mood between 1 and 5),
  tags       jsonb default '[]'::jsonb,
  note       text,
  moment     text,                -- 'morning' | 'evening'
  updated_at timestamptz default now(),
  unique (user_id, date)
);

create index if not exists idx_checkins_user on checkins (user_id, date desc);

-- ── 3. PUSH SUBSCRIPTIONS — persistance serveur (survit aux redémarrages Render)
create table if not exists push_subscriptions (
  user_id      uuid primary key,
  subscription jsonb not null,
  meta         jsonb default '{}'::jsonb,
  updated_at   timestamptz default now()
);

-- Serveur uniquement : RLS activé sans policy = aucun accès avec la clé anon
alter table push_subscriptions enable row level security;

alter table checkins enable row level security;
drop policy if exists "checkins_select_own" on checkins;
drop policy if exists "checkins_insert_own" on checkins;
drop policy if exists "checkins_update_own" on checkins;
create policy "checkins_select_own" on checkins for select
  using (auth.uid() = user_id);
create policy "checkins_insert_own" on checkins for insert
  with check (auth.uid() = user_id);
create policy "checkins_update_own" on checkins for update
  using (auth.uid() = user_id);
