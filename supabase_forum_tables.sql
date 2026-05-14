-- ─── Forum Solenn — tables + RLS ─────────────────────────────────────────────
-- Colle ce SQL dans Supabase > SQL Editor > New query > Run

-- 1. Posts
create table if not exists forum_posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  author     text not null,
  title      text not null,
  body       text not null,
  category   text default 'Général',
  created_at timestamptz default now()
);

-- 2. Replies
create table if not exists forum_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references forum_posts(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  author     text not null,
  body       text not null,
  created_at timestamptz default now()
);

-- 3. Likes (un like par user par post)
create table if not exists forum_likes (
  post_id uuid references forum_posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  primary key (post_id, user_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table forum_posts   enable row level security;
alter table forum_replies enable row level security;
alter table forum_likes   enable row level security;

-- Lecture : tout utilisateur connecté
create policy "read posts"   on forum_posts   for select using (auth.role() = 'authenticated');
create policy "read replies" on forum_replies for select using (auth.role() = 'authenticated');
create policy "read likes"   on forum_likes   for select using (auth.role() = 'authenticated');

-- Écriture : seulement ses propres entrées
create policy "insert posts"   on forum_posts   for insert with check (auth.uid() = user_id);
create policy "insert replies" on forum_replies for insert with check (auth.uid() = user_id);
create policy "insert likes"   on forum_likes   for insert with check (auth.uid() = user_id);

-- Supprimer son propre like
create policy "delete likes" on forum_likes for delete using (auth.uid() = user_id);

-- ─── Realtime (pour les mises à jour instantanées) ────────────────────────────
alter publication supabase_realtime add table forum_posts;
alter publication supabase_realtime add table forum_replies;
alter publication supabase_realtime add table forum_likes;
