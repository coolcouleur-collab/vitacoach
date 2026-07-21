-- ═══════════════════════════════════════════════════════════════════════════
-- SOLENN — Policies RLS (Row Level Security)
-- À exécuter dans Supabase : Dashboard → SQL Editor → New query → coller → Run
--
-- ⚠️ IMPORTANT : ajouter D'ABORD la variable SUPABASE_SERVICE_ROLE_KEY sur
-- Render et Vercel (voir SECURITE.md), PUIS exécuter ce script. Sinon le
-- serveur (qui utilise encore la clé anon) sera bloqué par ces règles.
--
-- Principe : la clé service_role (serveur) contourne RLS. La clé anon
-- (embarquée dans l'app) n'a plus accès qu'à ce que ces policies autorisent.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tables SERVEUR UNIQUEMENT : RLS activé, aucune policy = accès client bloqué
alter table if exists integrations_sante      enable row level security;
alter table if exists rapports_hebdo          enable row level security;
alter table if exists challenges              enable row level security;
alter table if exists metriques_integrations  enable row level security;
alter table if exists demo_requests           enable row level security;

-- ── PROFILS : l'app lit/écrit le profil de l'utilisateur connecté uniquement
alter table if exists profils enable row level security;
drop policy if exists "profils_select_own" on profils;
drop policy if exists "profils_insert_own" on profils;
drop policy if exists "profils_update_own" on profils;
create policy "profils_select_own" on profils for select
  using (auth.uid()::text = user_id::text);
create policy "profils_insert_own" on profils for insert
  with check (auth.uid()::text = user_id::text);
create policy "profils_update_own" on profils for update
  using (auth.uid()::text = user_id::text);

-- ── USER_METRICS : métriques du jour, propres à l'utilisateur
alter table if exists user_metrics enable row level security;
drop policy if exists "metrics_select_own" on user_metrics;
drop policy if exists "metrics_insert_own" on user_metrics;
drop policy if exists "metrics_update_own" on user_metrics;
create policy "metrics_select_own" on user_metrics for select
  using (auth.uid()::text = user_id::text);
create policy "metrics_insert_own" on user_metrics for insert
  with check (auth.uid()::text = user_id::text);
create policy "metrics_update_own" on user_metrics for update
  using (auth.uid()::text = user_id::text);

-- ── SOLENN_CHATS : l'historique n'est lisible que par son propriétaire
alter table if exists solenn_chats enable row level security;
drop policy if exists "chats_select_own" on solenn_chats;
create policy "chats_select_own" on solenn_chats for select
  using (auth.uid()::text = user_id::text);
-- (écriture : serveur uniquement, via service_role)

-- ── FORUM : lecture publique, écriture authentifiée et propriétaire
alter table if exists forum_posts enable row level security;
drop policy if exists "posts_select_all"  on forum_posts;
drop policy if exists "posts_insert_own"  on forum_posts;
drop policy if exists "posts_update_own"  on forum_posts;
drop policy if exists "posts_delete_own"  on forum_posts;
create policy "posts_select_all" on forum_posts for select using (true);
create policy "posts_insert_own" on forum_posts for insert
  with check (auth.uid()::text = user_id::text);
create policy "posts_update_own" on forum_posts for update
  using (auth.uid()::text = user_id::text);
create policy "posts_delete_own" on forum_posts for delete
  using (auth.uid()::text = user_id::text);

alter table if exists forum_replies enable row level security;
drop policy if exists "replies_select_all" on forum_replies;
drop policy if exists "replies_insert_own" on forum_replies;
drop policy if exists "replies_update_own" on forum_replies;
drop policy if exists "replies_delete_own" on forum_replies;
create policy "replies_select_all" on forum_replies for select using (true);
create policy "replies_insert_own" on forum_replies for insert
  with check (auth.uid()::text = user_id::text);
create policy "replies_update_own" on forum_replies for update
  using (auth.uid()::text = user_id::text);
create policy "replies_delete_own" on forum_replies for delete
  using (auth.uid()::text = user_id::text);

alter table if exists forum_likes enable row level security;
drop policy if exists "likes_select_all" on forum_likes;
drop policy if exists "likes_insert_own" on forum_likes;
drop policy if exists "likes_delete_own" on forum_likes;
create policy "likes_select_all" on forum_likes for select using (true);
create policy "likes_insert_own" on forum_likes for insert
  with check (auth.uid()::text = user_id::text);
create policy "likes_delete_own" on forum_likes for delete
  using (auth.uid()::text = user_id::text);

alter table if exists forum_reply_votes enable row level security;
drop policy if exists "votes_select_all" on forum_reply_votes;
drop policy if exists "votes_insert_own" on forum_reply_votes;
drop policy if exists "votes_update_own" on forum_reply_votes;
drop policy if exists "votes_delete_own" on forum_reply_votes;
create policy "votes_select_all" on forum_reply_votes for select using (true);
create policy "votes_insert_own" on forum_reply_votes for insert
  with check (auth.uid()::text = user_id::text);
create policy "votes_update_own" on forum_reply_votes for update
  using (auth.uid()::text = user_id::text);
create policy "votes_delete_own" on forum_reply_votes for delete
  using (auth.uid()::text = user_id::text);

alter table if exists forum_mentions enable row level security;
drop policy if exists "mentions_select_own" on forum_mentions;
drop policy if exists "mentions_insert_auth" on forum_mentions;
drop policy if exists "mentions_update_own" on forum_mentions;
create policy "mentions_select_own" on forum_mentions for select
  using (auth.uid()::text = mentioned_user_id::text);
create policy "mentions_insert_auth" on forum_mentions for insert
  with check (auth.uid()::text = mentioned_by::text);
create policy "mentions_update_own" on forum_mentions for update
  using (auth.uid()::text = mentioned_user_id::text);

alter table if exists forum_reports enable row level security;
drop policy if exists "reports_insert_auth" on forum_reports;
create policy "reports_insert_auth" on forum_reports for insert
  with check (auth.uid()::text = reporter_id::text);
-- (pas de select : les signalements ne sont lisibles que côté serveur)

-- ── WAITLIST : n'importe qui peut s'inscrire (Landing), personne ne peut lire
alter table if exists waitlist enable row level security;
drop policy if exists "waitlist_insert_any" on waitlist;
create policy "waitlist_insert_any" on waitlist for insert with check (true);
