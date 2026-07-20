/**
 * AGENT SYNC SANTÉ — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronise toutes les intégrations santé connectées (Withings, Oura, Garmin)
 * Normalise les données dans metriques_integrations puis fusionne dans user_metrics
 * pour que Solenn dispose d'une vision unifiée de chaque utilisateur.
 *
 * Fréquence : toutes les 3h (09:00 · 12:00 · 15:00 · 18:00 · 21:00)
 * Trigger   : POST /api/agents-trigger { agent: 'sync-sante' }
 *           : POST /api/sync-now { userId, provider }
 *
 * Providers supportés :
 *   withings — poids, tension, fréquence cardiaque, sommeil, température
 *   oura     — sommeil (stades), HRV, SpO2, activité, readiness score
 *   garmin   — pas, calories, stress, sommeil, fréquence cardiaque
 */

import crypto from 'crypto'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

let _supabase = null
function getSupabase() {
  if (!_supabase) _supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
  return _supabase
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today()     { return new Date().toISOString().split('T')[0] }
function yesterday() { return new Date(Date.now() - 86400000).toISOString().split('T')[0] }
function unixNow()   { return Math.floor(Date.now() / 1000) }
function unix7d()    { return Math.floor((Date.now() - 7 * 86400000) / 1000) }

async function upsertMetrique(supabase, userId, provider, type, date, valeur, valeur2, unite, sourceId, raw) {
  await supabase.from('metriques_integrations').upsert({
    user_id: userId, provider, date, type,
    valeur, valeur2, unite,
    source_id: String(sourceId || `${type}_${date}`),
    raw,
  }, { onConflict: 'user_id,provider,type,date,source_id', ignoreDuplicates: false })
}

// ─── WITHINGS ─────────────────────────────────────────────────────────────────
// Docs : https://developer.withings.com/api-reference/
// OAuth 2.0 — scope: user.metrics,user.sleepevents,user.activity

export async function syncWithings(userId, integration) {
  const supabase = getSupabase()
  const token    = integration.access_token
  if (!token) return { error: 'no token' }

  const headers  = { Authorization: `Bearer ${token}` }
  const results  = []

  try {
    // ── Mesures corporelles (poids, IMC, tension, FC au repos, température) ──
    const { data: measures } = await axios.post(
      'https://wbsapi.withings.net/measure',
      new URLSearchParams({
        action: 'getmeas',
        meastypes: '1,4,5,6,8,9,10,11,54,71,73,76,77,88,91',
        category: 1,
        startdate: unix7d(),
        enddate:   unixNow(),
      }),
      { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const TYPE_MAP = {
      1:  { type: 'weight',       unite: 'kg',  div: 1000 },
      4:  { type: 'height',       unite: 'm',   div: 1000 },
      5:  { type: 'fat_free',     unite: 'kg',  div: 1000 },
      6:  { type: 'fat_ratio',    unite: '%',   div: 1000 },
      8:  { type: 'fat_mass',     unite: 'kg',  div: 1000 },
      9:  { type: 'blood_press_d',unite: 'mmHg',div: 1 },
      10: { type: 'blood_press_s',unite: 'mmHg',div: 1 },
      11: { type: 'heart_rate',   unite: 'bpm', div: 1 },
      54: { type: 'spo2',         unite: '%',   div: 1000 },
      71: { type: 'body_temp',    unite: '°C',  div: 1000 },
      73: { type: 'skin_temp',    unite: '°C',  div: 1000 },
      76: { type: 'muscle_mass',  unite: 'kg',  div: 1000 },
      77: { type: 'hydration',    unite: 'kg',  div: 1000 },
      88: { type: 'bone_mass',    unite: 'kg',  div: 1000 },
      91: { type: 'pulse_wave',   unite: 'm/s', div: 1000 },
    }

    for (const group of (measures?.body?.measuregrps || [])) {
      const date = new Date(group.date * 1000).toISOString().split('T')[0]
      for (const m of group.measures) {
        const mapping = TYPE_MAP[m.type]
        if (!mapping) continue
        const valeur = (m.value * Math.pow(10, m.unit)) / mapping.div
        await upsertMetrique(supabase, userId, 'withings', mapping.type, date, valeur, null, mapping.unite, group.grpid, m)
        results.push(`${mapping.type}: ${valeur}${mapping.unite}`)
      }
    }

    // ── Sommeil ──────────────────────────────────────────────────────────────
    const { data: sleep } = await axios.post(
      'https://wbsapi.withings.net/v2/sleep',
      new URLSearchParams({
        action:    'getsummary',
        startdateymd: yesterday(),
        enddateymd:   today(),
        data_fields: 'breathing_disturbances_intensity,deepsleepduration,durationtosleep,durationtowakeup,hr_average,hr_max,hr_min,lightsleepduration,nb_rem_episodes,out_of_bed_count,remsleepduration,rr_average,sleep_score,snoring,snoringepisodecount,total_sleep_time,wakeupcount,wakeupduration',
      }),
      { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    for (const s of (sleep?.body?.series || [])) {
      const date = s.date
      const totalH = s.data?.total_sleep_time ? s.data.total_sleep_time / 3600 : null
      if (totalH) await upsertMetrique(supabase, userId, 'withings', 'sleep', date, totalH, null, 'h', `sleep_${date}`, s.data)
      if (s.data?.sleep_score) await upsertMetrique(supabase, userId, 'withings', 'sleep_score', date, s.data.sleep_score, null, '/100', `sleepscore_${date}`, null)
      if (s.data?.hr_average) await upsertMetrique(supabase, userId, 'withings', 'heart_rate_sleep', date, s.data.hr_average, null, 'bpm', `hrsleep_${date}`, null)
    }

    // ── Activité ─────────────────────────────────────────────────────────────
    const { data: activity } = await axios.post(
      'https://wbsapi.withings.net/v2/measure',
      new URLSearchParams({
        action:        'getactivity',
        startdateymd:  yesterday(),
        enddateymd:    today(),
        data_fields:   'steps,distance,calories,active_calories,elevation,soft,moderate,intense',
      }),
      { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    for (const a of (activity?.body?.activities || [])) {
      if (a.steps) await upsertMetrique(supabase, userId, 'withings', 'steps', a.date, a.steps, null, 'steps', `steps_${a.date}`, null)
      if (a.calories) await upsertMetrique(supabase, userId, 'withings', 'calories', a.date, a.calories, null, 'kcal', `cal_${a.date}`, null)
    }

    console.log(`[SyncWithings] ✅ ${results.length} métriques synchronisées`)
    return { synced: results.length }

  } catch (e) {
    console.error('[SyncWithings] Erreur:', e.response?.data || e.message)
    // Si token expiré → refresh
    if (e.response?.status === 401) return { error: 'token_expired', needsRefresh: true }
    return { error: e.message }
  }
}

// ─── WITHINGS OAuth Refresh ───────────────────────────────────────────────────
export async function refreshWithingsToken(userId, integration) {
  const supabase = getSupabase()
  try {
    const { data } = await axios.post('https://wbsapi.withings.net/v2/oauth2', new URLSearchParams({
      action:        'requesttoken',
      client_id:     process.env.WITHINGS_CLIENT_ID,
      client_secret: process.env.WITHINGS_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: integration.refresh_token,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

    if (data?.body?.access_token) {
      await supabase.from('integrations_sante').update({
        access_token:  data.body.access_token,
        refresh_token: data.body.refresh_token,
        expires_at:    new Date(Date.now() + data.body.expires_in * 1000).toISOString(),
      }).eq('user_id', userId).eq('provider', 'withings')
      return data.body.access_token
    }
  } catch (e) {
    console.error('[RefreshWithings]', e.message)
  }
  return null
}

// ─── OURA RING ────────────────────────────────────────────────────────────────
// Docs : https://cloud.ouraring.com/docs/
// Auth : Personal Access Token (pas d'OAuth nécessaire)

export async function syncOura(userId, integration) {
  const supabase = getSupabase()
  const token    = integration.access_token
  if (!token) return { error: 'no token' }

  const headers  = { Authorization: `Bearer ${token}` }
  const dateDebut = yesterday()
  const dateFin   = today()
  let synced = 0

  try {
    // ── Sommeil ──────────────────────────────────────────────────────────────
    const { data: sleep } = await axios.get('https://api.ouraring.com/v2/usercollection/daily_sleep', {
      headers, params: { start_date: dateDebut, end_date: dateFin }
    })

    for (const s of (sleep?.data || [])) {
      if (s.contributors?.total_sleep) {
        const h = s.contributors.total_sleep ? s.score / 10 : null // score /100
        await upsertMetrique(supabase, userId, 'oura', 'sleep_score', s.day, s.score, null, '/100', `oura_sleep_${s.day}`, s)
        synced++
      }
    }

    // ── Readiness ─────────────────────────────────────────────────────────────
    const { data: readiness } = await axios.get('https://api.ouraring.com/v2/usercollection/daily_readiness', {
      headers, params: { start_date: dateDebut, end_date: dateFin }
    })

    for (const r of (readiness?.data || [])) {
      await upsertMetrique(supabase, userId, 'oura', 'readiness', r.day, r.score, null, '/100', `oura_ready_${r.day}`, r)
      synced++
    }

    // ── Activité ─────────────────────────────────────────────────────────────
    const { data: activity } = await axios.get('https://api.ouraring.com/v2/usercollection/daily_activity', {
      headers, params: { start_date: dateDebut, end_date: dateFin }
    })

    for (const a of (activity?.data || [])) {
      if (a.steps) {
        await upsertMetrique(supabase, userId, 'oura', 'steps', a.day, a.steps, null, 'steps', `oura_steps_${a.day}`, null)
        synced++
      }
      if (a.active_calories) {
        await upsertMetrique(supabase, userId, 'oura', 'calories', a.day, a.active_calories, null, 'kcal', `oura_cal_${a.day}`, null)
        synced++
      }
    }

    // ── HRV (variabilité cardiaque) ───────────────────────────────────────────
    const { data: hrv } = await axios.get('https://api.ouraring.com/v2/usercollection/heartrate', {
      headers, params: { start_datetime: `${dateDebut}T00:00:00`, end_datetime: `${dateFin}T23:59:59` }
    })

    const hrvVals = (hrv?.data || []).map(h => h.bpm).filter(Boolean)
    if (hrvVals.length) {
      const moyHR = Math.round(hrvVals.reduce((a, b) => a + b, 0) / hrvVals.length)
      await upsertMetrique(supabase, userId, 'oura', 'heart_rate', dateDebut, moyHR, null, 'bpm', `oura_hr_${dateDebut}`, null)
      synced++
    }

    console.log(`[SyncOura] ✅ ${synced} métriques synchronisées`)
    return { synced }

  } catch (e) {
    console.error('[SyncOura]', e.response?.data || e.message)
    if (e.response?.status === 401) return { error: 'token_invalid' }
    return { error: e.message }
  }
}

// ─── GARMIN ───────────────────────────────────────────────────────────────────
// Docs : https://developer.garmin.com/gc-developer-program/
// OAuth 1.0a — token stocké : access_token = oauth_token, refresh_token = oauth_token_secret

function garminAuthHeader(method, url, oauthToken, oauthTokenSecret, extraParams = {}) {
  const params = {
    oauth_consumer_key:     process.env.GARMIN_CONSUMER_KEY,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            oauthToken,
    oauth_version:          '1.0',
    ...extraParams,
  }
  const base = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(
      Object.keys(params).sort()
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&')
    ),
  ].join('&')
  const sigKey = `${encodeURIComponent(process.env.GARMIN_CONSUMER_SECRET)}&${encodeURIComponent(oauthTokenSecret)}`
  params.oauth_signature = crypto.createHmac('sha1', sigKey).update(base).digest('base64')

  return 'OAuth ' + Object.keys(params).sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`)
    .join(', ')
}

export async function syncGarmin(userId, integration) {
  const supabase  = getSupabase()
  const oToken    = integration.access_token
  const oSecret   = integration.refresh_token
  if (!oToken || !oSecret) return { error: 'no token' }

  const endSec   = Math.floor(Date.now() / 1000)
  const startSec = endSec - 7 * 86400
  const base     = 'https://apis.garmin.com/wellness-api/rest'
  let synced     = 0

  try {
    // ── Activité journalière (pas, calories, distance) ────────────────────────
    const actUrl = `${base}/dailies?uploadStartTimeInSeconds=${startSec}&uploadEndTimeInSeconds=${endSec}`
    const { data: actData } = await axios.get(actUrl, {
      headers: { Authorization: garminAuthHeader('GET', actUrl, oToken, oSecret) }
    })
    for (const d of (actData || [])) {
      const date = new Date(d.startTimeInSeconds * 1000).toISOString().split('T')[0]
      if (d.steps)           { await upsertMetrique(supabase, userId, 'garmin', 'steps',    date, d.steps,           null, 'steps', `g_steps_${date}`,   null); synced++ }
      if (d.activeKilocalories) { await upsertMetrique(supabase, userId, 'garmin', 'calories', date, d.activeKilocalories, null, 'kcal',  `g_cal_${date}`,     null); synced++ }
      if (d.averageHeartRateInBeatsPerMinute) {
        await upsertMetrique(supabase, userId, 'garmin', 'heart_rate', date, d.averageHeartRateInBeatsPerMinute, null, 'bpm', `g_hr_${date}`, null)
        synced++
      }
    }

    // ── Sommeil ───────────────────────────────────────────────────────────────
    const sleepUrl = `${base}/sleeps?uploadStartTimeInSeconds=${startSec}&uploadEndTimeInSeconds=${endSec}`
    const { data: sleepData } = await axios.get(sleepUrl, {
      headers: { Authorization: garminAuthHeader('GET', sleepUrl, oToken, oSecret) }
    })
    for (const s of (sleepData || [])) {
      const date = new Date(s.startTimeInSeconds * 1000).toISOString().split('T')[0]
      if (s.durationInSeconds) {
        const h = +(s.durationInSeconds / 3600).toFixed(1)
        await upsertMetrique(supabase, userId, 'garmin', 'sleep', date, h, null, 'h', `g_sleep_${date}`, null)
        synced++
      }
    }

    // ── Stress ────────────────────────────────────────────────────────────────
    const stressUrl = `${base}/stressDetails?uploadStartTimeInSeconds=${startSec}&uploadEndTimeInSeconds=${endSec}`
    const { data: stressData } = await axios.get(stressUrl, {
      headers: { Authorization: garminAuthHeader('GET', stressUrl, oToken, oSecret) }
    })
    for (const s of (stressData || [])) {
      const date = new Date(s.startTimeInSeconds * 1000).toISOString().split('T')[0]
      if (s.averageStressLevel != null && s.averageStressLevel >= 0) {
        await upsertMetrique(supabase, userId, 'garmin', 'stress', date, s.averageStressLevel, null, '/100', `g_stress_${date}`, null)
        synced++
      }
    }

    console.log(`[SyncGarmin] ✅ ${synced} métriques synchronisées`)
    return { synced }

  } catch (e) {
    console.error('[SyncGarmin]', e.response?.data || e.message)
    if (e.response?.status === 401) return { error: 'token_invalid' }
    return { error: e.message }
  }
}

// ─── Fusion vers user_metrics ─────────────────────────────────────────────────
// Prend les données de metriques_integrations et les fusionne dans user_metrics
// user_metrics est la table principale utilisée par tous les agents
async function fusionnerDansUserMetrics(userId, date) {
  const supabase = getSupabase()

  // Récupérer toutes les métriques du jour pour cet user
  const { data: rows } = await supabase
    .from('metriques_integrations')
    .select('type, valeur, provider')
    .eq('user_id', userId)
    .eq('date', date)

  if (!rows?.length) return

  // Priorité : oura > withings > garmin (oura = meilleure qualité)
  const PRIORITY = { oura: 3, withings: 2, garmin: 1 }
  const best = {}

  for (const row of rows) {
    const score = PRIORITY[row.provider] || 0
    if (!best[row.type] || score > best[row.type].score) {
      best[row.type] = { valeur: row.valeur, score }
    }
  }

  // Mapper vers les colonnes de user_metrics
  const update = {}
  if (best.steps)       update.pas      = best.steps.valeur
  if (best.sleep)       update.sommeil  = best.sleep.valeur
  if (best.sleep_score) update.score    = best.sleep_score.valeur  // utilisé comme proxy score
  if (best.heart_rate)  update.fc       = best.heart_rate.valeur
  if (best.weight)      update.poids    = best.weight.valeur
  if (best.spo2)        update.spo2     = best.spo2.valeur
  if (best.readiness)   update.readiness = best.readiness.valeur

  if (!Object.keys(update).length) return

  await supabase.from('user_metrics').upsert({
    user_id: userId,
    date,
    ...update,
    source_auto: true,
  }, { onConflict: 'user_id,date', ignoreDuplicates: false })
}

// ─── Runner principal ─────────────────────────────────────────────────────────
export async function runSyncSante() {
  console.log('[SyncSante] 🔄 Synchronisation des intégrations santé...')
  const supabase = getSupabase()

  const { data: integrations } = await supabase
    .from('integrations_sante')
    .select('*')
    .eq('actif', true)

  if (!integrations?.length) {
    console.log('[SyncSante] Aucune intégration connectée')
    return { synced: 0 }
  }

  let totalSynced = 0
  const usersSynced = new Set()

  for (const integ of integrations) {
    try {
      let result

      switch (integ.provider) {
        case 'withings':
          // Vérifier expiration token
          if (integ.expires_at && new Date(integ.expires_at) < new Date()) {
            const newToken = await refreshWithingsToken(integ.user_id, integ)
            if (newToken) integ.access_token = newToken
          }
          result = await syncWithings(integ.user_id, integ)
          break

        case 'oura':
          result = await syncOura(integ.user_id, integ)
          break

        case 'garmin':
          result = await syncGarmin(integ.user_id, integ)
          break

        default:
          continue
      }

      if (result?.error) {
        await supabase.from('integrations_sante')
          .update({ last_error: result.error })
          .eq('id', integ.id)
        continue
      }

      // Mettre à jour last_sync_at
      await supabase.from('integrations_sante')
        .update({ last_sync_at: new Date().toISOString(), last_error: null })
        .eq('id', integ.id)

      totalSynced += result?.synced || 0
      usersSynced.add(integ.user_id)

    } catch (e) {
      console.error(`[SyncSante] ${integ.provider}/${integ.user_id.slice(0,8)}:`, e.message)
    }
  }

  // Fusionner toutes les données synchro d'aujourd'hui dans user_metrics
  for (const userId of usersSynced) {
    await fusionnerDansUserMetrics(userId, today())
    await fusionnerDansUserMetrics(userId, yesterday())
  }

  console.log(`[SyncSante] ✅ ${totalSynced} métriques · ${usersSynced.size} users`)
  return { totalSynced, users: usersSynced.size }
}
