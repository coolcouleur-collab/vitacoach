-- ══════════════════════════════════════════════════════════════════
-- SOLENN — Roadmap « indispensable » (2026-07-24)
-- À coller dans : Supabase Dashboard > SQL Editor > New query
-- 1. repas          : analyses des photos de repas (nutrition intuitive)
-- 2. user_insights  : patterns longitudinaux détectés par l'agent insights
-- 3. morning_messages.adaptations : la journée auto-adaptée du matin
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Repas analysés par photo ────────────────────────────────────
CREATE TABLE IF NOT EXISTS repas (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  moment      text,                  -- petit-dej / dejeuner / diner / snack
  -- "analyse" entre guillemets : ANALYSE est un mot réservé PostgreSQL (alias d'ANALYZE)
  "analyse"   jsonb NOT NULL,        -- {plats[], calories, proteines, glucides, lipides, qualite, conseil}
  resume      text,                  -- phrase de Solenn affichée dans le chat
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_repas_user ON repas (user_id, date DESC);

ALTER TABLE repas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "repas_own" ON repas;
CREATE POLICY "repas_own" ON repas FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 2. Insights longitudinaux ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_insights (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,         -- tendance / jour_faible / correlation / record
  insight     text NOT NULL,         -- phrase formulée par Solenn
  data        jsonb,                 -- chiffres bruts derrière l'insight
  computed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insights_user ON user_insights (user_id, computed_at DESC);

ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insights_read_own" ON user_insights;
-- Lecture par l'utilisateur ; écriture réservée au service_role (agent serveur)
CREATE POLICY "insights_read_own" ON user_insights FOR SELECT
  USING (auth.uid() = user_id);

-- ── 3. Adaptations du jour dans le brief matinal ───────────────────
ALTER TABLE morning_messages ADD COLUMN IF NOT EXISTS adaptations jsonb DEFAULT '[]'::jsonb;
