-- ─────────────────────────────────────────────────────────────────────────────
-- NOUVELLES TABLES SOLENN — À exécuter dans Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rapports hebdomadaires générés par l'agent Rapport Hebdo
CREATE TABLE IF NOT EXISTS rapports_hebdo (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  semaine     date NOT NULL,  -- date du lundi de la semaine
  rapport     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, semaine)
);

-- 2. Challenges 21 jours
CREATE TABLE IF NOT EXISTS challenges (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  duree       int NOT NULL DEFAULT 21,
  challenge   jsonb NOT NULL DEFAULT '{}',  -- contenu généré par IA
  progression boolean[] DEFAULT '{}',       -- [true/false] par jour
  date_debut  date NOT NULL,
  actif       boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_rapports_hebdo_user ON rapports_hebdo(user_id, semaine DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_user_actif ON challenges(user_id, actif);

-- RLS (Row Level Security) — désactiver si tu utilises la clé service
ALTER TABLE rapports_hebdo ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges     ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour la clé anon (adapter si tu passes en service key)
CREATE POLICY "rapports_hebdo_all" ON rapports_hebdo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "challenges_all"     ON challenges     FOR ALL USING (true) WITH CHECK (true);

-- Note : memoire_longue, nutrition_insights et moments_importants
-- sont stockés directement dans profils.profil (JSONB) — pas de nouvelle table nécessaire.
