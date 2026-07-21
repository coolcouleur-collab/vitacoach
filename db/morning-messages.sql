-- ══════════════════════════════════════════════════════════════════
-- SOLENN — Tables morning_messages + push_tokens
-- À coller dans : Supabase Dashboard > SQL Editor > New query
-- (nouvelles tables requises par l'agent morning-brief et la route
--  /api/push-native-subscribe — session du 2026-07-21)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Messages matinaux proactifs (agent morning-brief, 06:45) ────
CREATE TABLE IF NOT EXISTS morning_messages (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  message     text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE morning_messages ENABLE ROW LEVEL SECURITY;

-- Lecture par l'utilisateur lui-même uniquement ; écriture réservée au
-- service_role (l'agent serveur), donc aucune policy INSERT/UPDATE client.
CREATE POLICY "Users read own morning messages"
  ON morning_messages FOR SELECT
  USING (auth.uid() = user_id);

-- ── 2. Tokens push natifs iOS/Android (FCM/APNs, envoi à brancher) ─
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text DEFAULT 'unknown',
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
