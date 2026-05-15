-- ══════════════════════════════════════════════════════════════════
-- SOLENN — Setup Supabase
-- Colle ce script dans : Supabase Dashboard > SQL Editor > New query
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Table profils utilisateurs ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profil      jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. Table métriques journalières ──────────────────────────────
CREATE TABLE IF NOT EXISTS user_metrics (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  pas         integer DEFAULT 0,
  sommeil     numeric(4,1) DEFAULT 0,
  eau         integer DEFAULT 0,
  fc          integer DEFAULT 0,
  humeur      integer DEFAULT 0,
  poids       numeric(5,1) DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own metrics"
  ON user_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. Posts de démarrage du forum (seed) ────────────────────────
-- Ces posts apparaissent dès l'ouverture du forum pour qu'il ne soit pas vide.
-- user_id est NULL car ce sont des posts système.

ALTER TABLE forum_posts ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO forum_posts (user_id, author, title, body, category) VALUES
(NULL, 'Équipe Solenn', '👋 Bienvenue dans la communauté Solenn !',
 'Ici on partage nos victoires, nos questions et nos expériences bien-être. Pose tes questions, réponds aux autres, et progressons ensemble. Bienvenue ! 🌿',
 'Général'),

(NULL, 'Marie L.', 'Comment j''ai amélioré mon sommeil en 2 semaines',
 'J''avais du mal à m''endormir depuis des mois. J''ai commencé la cohérence cardiaque 10 min avant de dormir + coupé les écrans 30 min avant. Résultat : je dors 7h30 au lieu de 5h. Vous avez d''autres astuces ?',
 'Bien-être'),

(NULL, 'Thomas R.', 'Mon plan repas anti-fatigue qui a tout changé',
 'Je me sentais épuisé tous les après-midi. Solenn m''a conseillé de remplacer mon sandwich blanc par des protéines + légumes + glucides lents. Ça fait 3 semaines, le coup de barre de 14h a disparu complètement.',
 'Nutrition'),

(NULL, 'Léa M.', 'Question : tisane pour gérer le stress ?',
 'Je cherche une tisane naturelle pour m''aider à décompresser le soir. J''ai essayé la camomille mais l''effet est léger. Est-ce que quelqu''un a testé l''ashwagandha ou la valériane ?',
 'Santé naturelle'),

(NULL, 'Alex D.', '10 000 pas par jour : retour d''expérience après 30 jours',
 'J''ai relevé le défi des 10k pas pendant 30 jours. Bilan : -2,3 kg, bien meilleur moral, et je dors mieux. Le plus dur c''est les premières semaines. Après ça devient une habitude. Lancez-vous !',
 'Motivation'),

(NULL, 'Sophie K.', 'Exercices de respiration qui fonctionnent vraiment',
 'Après avoir essayé plein de techniques, voilà ce qui marche pour moi : la respiration 4-7-8 (inspire 4s, retiens 7s, expire 8s). 3 cycles et mon anxiété descend nettement. À tester !',
 'Bien-être');
