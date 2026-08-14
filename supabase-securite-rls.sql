-- ─────────────────────────────────────────────────────────────────────────────
-- FERMER LES TABLES LISIBLES PAR N'IMPORTE QUI — À exécuter dans Supabase
--
-- Constat du 2026-08-12 : avec la seule clé publique de l'app, celle qui est
-- forcément visible dans le code envoyé aux navigateurs, on pouvait lire
-- l'intégralité de trois tables sans être connecté :
--   • rapports_hebdo   → bilans de santé hebdomadaires. Donnée de santé,
--                        catégorie particulière au sens de l'article 9 du RGPD.
--   • challenges       → programmes personnalisés, liés à un user_id.
--   • forum_posts      → publications, avec leur auteur.
--
-- Cause : ces tables ont été créées avec des règles permissives
-- « USING (true) », dans supabase-nouvelles-tables.sql et
-- supabase_forum_tables.sql. Les tables plus récentes (profils, user_metrics,
-- checkins, solenn_chats, cycle_*, user_insights, push_subscriptions) sont
-- correctement restreintes à leur propriétaire.
--
-- Le serveur utilise la clé de service, qui ignore ces règles : les agents,
-- la génération de programmes et les rapports continuent de fonctionner.
-- Seule la lecture directe depuis un navigateur est fermée.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Bilans hebdomadaires : chacun les siens ──────────────────────────────
DROP POLICY IF EXISTS "rapports_hebdo_all"   ON rapports_hebdo;
DROP POLICY IF EXISTS "rapports_hebdo_owner" ON rapports_hebdo;
CREATE POLICY "rapports_hebdo_owner" ON rapports_hebdo
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 2. Programmes : chacun le sien ──────────────────────────────────────────
DROP POLICY IF EXISTS "challenges_all"   ON challenges;
DROP POLICY IF EXISTS "challenges_owner" ON challenges;
CREATE POLICY "challenges_owner" ON challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. Forum : lecture réservée aux membres connectés, écriture à l'auteur ──
-- Un forum est fait pour être lu par les autres, la lecture reste donc large.
-- Mais elle passe de « tout le monde, même sans compte » à « membres
-- connectés », et personne ne peut plus publier ni modifier au nom d'autrui.
DROP POLICY IF EXISTS "forum_posts_all"    ON forum_posts;
DROP POLICY IF EXISTS "forum_posts_read"   ON forum_posts;
DROP POLICY IF EXISTS "forum_posts_write"  ON forum_posts;
CREATE POLICY "forum_posts_read"  ON forum_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_posts_write" ON forum_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_posts_own"   ON forum_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_posts_del"   ON forum_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 4. Les tables du forum qui suivent la même logique ──────────────────────
DROP POLICY IF EXISTS "forum_replies_all"   ON forum_replies;
CREATE POLICY "forum_replies_read"  ON forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_replies_write" ON forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_replies_own"   ON forum_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_replies_del"   ON forum_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5. CORRECTIF DU 2026-08-12 (voir en bas du fichier) : le forum est reste
--        ouvert apres le premier passage, une regle permissive survivait sous un
--        autre nom que ceux devines ici.
-- ── 6. Verification. Chaque ligne doit afficher rowsecurity = true ──────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rapports_hebdo', 'challenges', 'forum_posts', 'forum_replies');
-- Supprime TOUTES les règles existantes sur les tables du forum, quel que
-- soit leur nom, puis repose les bonnes. Le premier script ne supprimait que
-- les noms devinés : une ancienne règle permissive portant un autre nom
-- survivait et continuait d'autoriser la lecture sans compte.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('forum_posts', 'forum_replies')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE forum_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_posts_read"  ON forum_posts  FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_posts_write" ON forum_posts  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_posts_own"   ON forum_posts  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_posts_del"   ON forum_posts  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "forum_replies_read"  ON forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_replies_write" ON forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_replies_own"   ON forum_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_replies_del"   ON forum_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CE QUI A RÉELLEMENT MARCHÉ — 2026-08-12
--
-- Les deux tentatives ci-dessus ont échoué sur le forum, pour une raison que
-- seule l'inspection du tableau de bord a révélée : forum_posts et
-- forum_replies portaient HUIT règles chacune, empilées par des scripts
-- successifs, et la permissive s'appelait « posts_select_all » et
-- « replies_select_all » — aucun des noms que j'avais devinés.
--
-- Leçon : les règles RLS s'ADDITIONNENT. Il suffit qu'une seule autorise pour
-- que tout passe. Créer des règles restrictives ne sert à rien tant qu'une
-- permissive survit, et on ne peut pas supprimer par nom ce qu'on n'a pas lu.
-- Toujours lister les règles existantes AVANT d'en écrire :
--   SELECT tablename, policyname, roles::text, cmd FROM pg_policies
--   WHERE schemaname='public' ORDER BY tablename;
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "posts_select_all"   ON forum_posts;
DROP POLICY IF EXISTS "read posts"         ON forum_posts;
DROP POLICY IF EXISTS "insert posts"       ON forum_posts;
DROP POLICY IF EXISTS "posts_insert_own"   ON forum_posts;
DROP POLICY IF EXISTS "posts_update_own"   ON forum_posts;
DROP POLICY IF EXISTS "posts_delete_own"   ON forum_posts;

DROP POLICY IF EXISTS "replies_select_all" ON forum_replies;
DROP POLICY IF EXISTS "read replies"       ON forum_replies;
DROP POLICY IF EXISTS "insert replies"     ON forum_replies;
DROP POLICY IF EXISTS "replies_insert_own" ON forum_replies;
DROP POLICY IF EXISTS "replies_update_own" ON forum_replies;
DROP POLICY IF EXISTS "replies_delete_own" ON forum_replies;

DROP POLICY IF EXISTS "likes_select_all"   ON forum_likes;
DROP POLICY IF EXISTS "read likes"         ON forum_likes;
