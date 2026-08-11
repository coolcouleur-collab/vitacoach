-- ─────────────────────────────────────────────────────────────────────────────
-- RETOURS SUR LES RÉPONSES DE SOLENN — À exécuter dans Supabase SQL Editor
-- Le pouce levé du chat n'était qu'un état local : perdu au rechargement,
-- jamais envoyé nulle part. Cette table le conserve pour savoir quelles
-- réponses aident vraiment.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_feedback (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL,
  question   text,           -- le message de l'utilisateur juste avant
  reponse    text NOT NULL,  -- la réponse de Solenn notée
  vote       smallint NOT NULL DEFAULT 1,  -- 1 = utile
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_user ON chat_feedback(user_id, created_at DESC);

-- Contenu de conversation : chacun ne voit et n'écrit que ses propres lignes,
-- contrairement aux tables plus anciennes en USING (true).
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_feedback_owner" ON chat_feedback;
CREATE POLICY "chat_feedback_owner" ON chat_feedback
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
