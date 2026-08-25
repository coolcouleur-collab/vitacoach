-- ─────────────────────────────────────────────────────────────────────────────
-- JETONS DE NOTIFICATION NATIFS (iOS / Android) — à exécuter dans Supabase
--
-- Les notifications web (VAPID) ne fonctionnent pas dans une app installée
-- depuis l'App Store : iOS ne les autorise que dans un site ajouté à l'écran
-- d'accueil. Une vraie app publiée doit passer par APNs, relayé par Firebase.
--
-- La table `push_subscriptions` existante garde les abonnements WEB.
-- Celle-ci garde les jetons NATIFS, qui ont une forme complètement différente :
-- une simple chaîne, pas un objet avec endpoint et clés.
--
-- Un même compte peut avoir plusieurs appareils, d'où la clé sur (user_id,
-- token) et non sur user_id seul.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens (user_id);

-- ── Sécurité : chacun ses propres jetons ────────────────────────────────────
-- Le serveur utilise la clé de service et ignore ces règles ; elles ne
-- concernent que l'accès direct depuis l'app.
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_owner" ON push_tokens;
CREATE POLICY "push_tokens_owner" ON push_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Vérification ────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'push_tokens';
