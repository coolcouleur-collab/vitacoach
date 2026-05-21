-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE INTÉGRATIONS SANTÉ — À exécuter dans Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Stocke les tokens OAuth de chaque intégration par utilisateur
CREATE TABLE IF NOT EXISTS integrations_sante (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL,
  provider       text NOT NULL,  -- 'withings' | 'oura' | 'garmin' | 'dexcom'
  access_token   text,
  refresh_token  text,
  expires_at     timestamptz,
  scope          text,
  metadata       jsonb DEFAULT '{}',  -- infos propres au provider
  connected_at   timestamptz DEFAULT now(),
  last_sync_at   timestamptz,
  last_error     text,
  actif          boolean DEFAULT true,
  UNIQUE(user_id, provider)
);

-- Données normalisées : toutes les sources dans un format unifié
-- (complète user_metrics qui est déjà rempli manuellement)
CREATE TABLE IF NOT EXISTS metriques_integrations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  provider    text NOT NULL,
  date        date NOT NULL,
  type        text NOT NULL,   -- 'steps' | 'sleep' | 'weight' | 'heart_rate' | 'blood_pressure' | 'glucose' | 'hrv' | 'spo2' | 'calories'
  valeur      numeric,
  valeur2     numeric,         -- ex: diastolique pour tension, end_time pour sommeil
  unite       text,            -- 'kg' | 'h' | 'bpm' | 'mmHg' | 'mg/dL' | 'steps'
  source_id   text,            -- ID dans le système du provider (pour déduplication)
  raw         jsonb,           -- données brutes du provider
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, type, date, source_id)
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_integrations_user    ON integrations_sante(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_metriques_int_user   ON metriques_integrations(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_metriques_int_type   ON metriques_integrations(user_id, type, date DESC);

-- RLS
ALTER TABLE integrations_sante      ENABLE ROW LEVEL SECURITY;
ALTER TABLE metriques_integrations  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_all"   ON integrations_sante     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "metriques_int_all"  ON metriques_integrations FOR ALL USING (true) WITH CHECK (true);
