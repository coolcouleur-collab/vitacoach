/**
 * ORCHESTRATEUR DES SOUS-AGENTS SOLENN
 * ─────────────────────────────────────────────────────────────────────────────
 * Démarre et planifie les 4 agents autonomes :
 *
 *   🔍 Monitoring Santé      — toutes les 2h (8h→22h)
 *   🔔 Notifications Matin   — 07:00 chaque jour
 *   🔔 Notifications Midi    — 12:30 chaque jour
 *   🔔 Notifications Soir    — 19:30 chaque jour
 *   📊 Analyse Tendances     — dimanche 18:00
 *   🌅 Routine Auto          — 05:30 chaque jour
 *
 * Usage depuis server.js :
 *   import { startAgents, getAgentsStatus } from './agents/index.js'
 *   startAgents(pushSubscriptions)
 */

import cron from 'node-cron'
import { runMonitoring }          from './monitoring.js'
import { runNotifications }       from './notifications.js'
import { runTendances }           from './tendances.js'
import { runRoutineAuto, getRoutineCache, regenererPourUser, routineCache } from './routine-auto.js'
import { runDesignAudit, DESIGN_TOKENS } from './design-advisor.js'
import { runMemoireLongue }       from './memoire.js'
import { runRapportHebdo, genererRapportUser } from './rapport-hebdo.js'
import { runChallengeCheck, creerChallenge }   from './challenge.js'
import { runMeteoRoutine, genererContexteMeteo } from './meteo-routine.js'
import { runNutritionnel, genererConseilsNutrition } from './nutritionnel.js'
import { runMomentsCheck, extraireMoments, sauvegarderMoments } from './moments.js'
import { runSyncSante } from './sync-sante.js'
import { runMorningBrief } from './morning-brief.js'
import { runInsights } from './insights.js'

// ─── État des agents (pour le dashboard /api/agents-status) ──────────────────
const agentsStatus = {
  monitoring:    { dernierRun: null, derniersResultats: null, actif: false },
  notifications: { dernierRun: null, derniersResultats: null, actif: false },
  tendances:     { dernierRun: null, derniersResultats: null, actif: false },
  routineAuto:   { dernierRun: null, derniersResultats: null, actif: false },
  memoire:       { dernierRun: null, derniersResultats: null, actif: false },
  rapportHebdo:  { dernierRun: null, derniersResultats: null, actif: false },
  challenge:     { dernierRun: null, derniersResultats: null, actif: false },
  meteo:         { dernierRun: null, derniersResultats: null, actif: false },
  nutritionnel:  { dernierRun: null, derniersResultats: null, actif: false },
  moments:       { dernierRun: null, derniersResultats: null, actif: false },
  syncSante:     { dernierRun: null, derniersResultats: null, actif: false },
  morningBrief:  { dernierRun: null, derniersResultats: null, actif: false },
  insights:      { dernierRun: null, derniersResultats: null, actif: false },
}

function logRun(agent, resultats) {
  agentsStatus[agent].dernierRun     = new Date().toISOString()
  agentsStatus[agent].derniersResultats = resultats
  agentsStatus[agent].actif          = true
}

// ─── Démarrage des agents ─────────────────────────────────────────────────────
export function startAgents(pushSubscriptions) {
  console.log('🤖 [Agents] Démarrage des sous-agents Solenn...')

  // ── Agent 1 : Monitoring Santé — toutes les 2h (heure paire, 8h→22h) ──────
  cron.schedule('0 8,10,12,14,16,18,20,22 * * *', async () => {
    console.log('[Agents] Monitoring Santé → déclenchement')
    try {
      const res = await runMonitoring(pushSubscriptions)
      logRun('monitoring', res)
    } catch (e) {
      console.error('[Agents] Monitoring erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 2a : Notifications Matin — 07:00 ──────────────────────────────
  cron.schedule('0 7 * * *', async () => {
    console.log('[Agents] Notifications Matin → déclenchement')
    try {
      const res = await runNotifications(pushSubscriptions, 'matin')
      logRun('notifications', { ...res, moment: 'matin' })
    } catch (e) {
      console.error('[Agents] Notifications matin erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 2b : Notifications Midi — 12:30 ────────────────────────────────
  cron.schedule('30 12 * * *', async () => {
    console.log('[Agents] Notifications Midi → déclenchement')
    try {
      const res = await runNotifications(pushSubscriptions, 'midi')
      logRun('notifications', { ...res, moment: 'midi' })
    } catch (e) {
      console.error('[Agents] Notifications midi erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 2c : Notifications Soir — 19:30 ────────────────────────────────
  cron.schedule('30 19 * * *', async () => {
    console.log('[Agents] Notifications Soir → déclenchement')
    try {
      const res = await runNotifications(pushSubscriptions, 'soir')
      logRun('notifications', { ...res, moment: 'soir' })
    } catch (e) {
      console.error('[Agents] Notifications soir erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 3 : Analyse Tendances — dimanche 18:00 ─────────────────────────
  cron.schedule('0 18 * * 0', async () => {
    console.log('[Agents] Analyse Tendances → déclenchement')
    try {
      const res = await runTendances(pushSubscriptions)
      logRun('tendances', res)
    } catch (e) {
      console.error('[Agents] Tendances erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 4 : Routine Auto — 05:30 chaque jour ───────────────────────────
  cron.schedule('30 5 * * *', async () => {
    console.log('[Agents] Routine Auto → déclenchement')
    try {
      const res = await runRoutineAuto(pushSubscriptions)
      logRun('routineAuto', res)
    } catch (e) {
      console.error('[Agents] RoutineAuto erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 5 : Mémoire Longue — dimanche 06:00 ────────────────────────────
  cron.schedule('0 6 * * 0', async () => {
    console.log('[Agents] Mémoire Longue → déclenchement')
    try {
      const res = await runMemoireLongue()
      logRun('memoire', res)
    } catch (e) {
      console.error('[Agents] Mémoire erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 6 : Rapport Hebdo — dimanche 19:00 ─────────────────────────────
  cron.schedule('0 19 * * 0', async () => {
    console.log('[Agents] Rapport Hebdo → déclenchement')
    try {
      const res = await runRapportHebdo(pushSubscriptions)
      logRun('rapportHebdo', res)
    } catch (e) {
      console.error('[Agents] RapportHebdo erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 7 : Challenge Check — quotidien 08:30 ───────────────────────────
  cron.schedule('30 8 * * *', async () => {
    console.log('[Agents] Challenge Check → déclenchement')
    try {
      const res = await runChallengeCheck(pushSubscriptions)
      logRun('challenge', res)
    } catch (e) {
      console.error('[Agents] Challenge erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 8 : Météo-Routine — quotidien 05:15 (avant routine-auto) ────────
  cron.schedule('15 5 * * *', async () => {
    console.log('[Agents] Météo-Routine → déclenchement')
    try {
      const res = await runMeteoRoutine()
      logRun('meteo', res)
    } catch (e) {
      console.error('[Agents] Météo erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 9 : Nutritionnel — vendredi 17:00 ───────────────────────────────
  cron.schedule('0 17 * * 5', async () => {
    console.log('[Agents] Nutritionnel → déclenchement')
    try {
      const res = await runNutritionnel(pushSubscriptions)
      logRun('nutritionnel', res)
    } catch (e) {
      console.error('[Agents] Nutritionnel erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 10 : Moments — quotidien 06:15 ─────────────────────────────────
  cron.schedule('15 6 * * *', async () => {
    console.log('[Agents] Moments & Anniversaires → déclenchement')
    try {
      const res = await runMomentsCheck(pushSubscriptions)
      logRun('moments', res)
    } catch (e) {
      console.error('[Agents] Moments erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  console.log('✅ [Agents] 10 agents actifs')
  console.log('   📅 Monitoring    : toutes les 2h (8h→22h)')
  console.log('   📅 Notifs        : 07:00 · 12:30 · 19:30')
  console.log('   📅 Tendances     : dimanche 18:00')
  console.log('   📅 RoutineAuto   : 05:30 quotidien')
  console.log('   🧠 Mémoire       : dimanche 06:00')
  console.log('   📊 RapportHebdo  : dimanche 19:00')
  console.log('   🏆 Challenge     : quotidien 08:30')
  console.log('   🌤️  Météo         : quotidien 05:15')
  console.log('   🥗 Nutritionnel  : vendredi 17:00')
  console.log('   📅 Moments       : quotidien 06:15')
  console.log('   🔄 SyncSanté     : toutes les 3h (9·12·15·18·21)')

  // ── Agent 11 : Sync Santé — toutes les 3h ────────────────────────────────
  cron.schedule('0 9,12,15,18,21 * * *', async () => {
    console.log('[Agents] Sync Santé → déclenchement')
    try {
      const res = await runSyncSante()
      logRun('syncSante', res)
    } catch (e) {
      console.error('[Agents] SyncSanté erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })

  // ── Agent 12 : Morning Brief — quotidien 06:45 (message matinal en base,
  //    affiché dans le chat à l'ouverture — le push seul ne suffit pas) ───────
  cron.schedule('45 6 * * *', async () => {
    console.log('[Agents] Morning Brief → déclenchement')
    try {
      const res = await runMorningBrief()
      logRun('morningBrief', res)
    } catch (e) {
      console.error('[Agents] MorningBrief erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })
  console.log('   🌅 MorningBrief  : quotidien 06:45')

  // ── Agent 13 : Insights longitudinaux — dimanche 07:00 (patterns détectés
  //    sur 60 jours de user_metrics, formulés par Solenn → user_insights) ─────
  cron.schedule('0 7 * * 0', async () => {
    console.log('[Agents] Insights → déclenchement')
    try {
      const res = await runInsights()
      logRun('insights', res)
    } catch (e) {
      console.error('[Agents] Insights erreur:', e.message)
    }
  }, { timezone: 'Europe/Paris' })
  console.log('   🔎 Insights      : dimanche 07:00')
}

// ─── API : status de tous les agents ─────────────────────────────────────────
export function getAgentsStatus() {
  return agentsStatus
}

// ─── API : déclencher un agent manuellement ───────────────────────────────────
export async function triggerAgent(agentName, pushSubscriptions, options = {}) {
  switch (agentName) {
    case 'monitoring':
      return runMonitoring(pushSubscriptions)
    case 'notifications':
      return runNotifications(pushSubscriptions, options.moment || 'matin')
    case 'tendances':
      return runTendances(pushSubscriptions)
    case 'routine-auto':
      return runRoutineAuto(pushSubscriptions)
    case 'design':
      return runDesignAudit()
    case 'memoire':
      return runMemoireLongue()
    case 'rapport-hebdo':
      return runRapportHebdo(pushSubscriptions)
    case 'challenge':
      return runChallengeCheck(pushSubscriptions)
    case 'meteo':
      return runMeteoRoutine(options)
    case 'nutritionnel':
      return runNutritionnel(pushSubscriptions)
    case 'moments':
      return runMomentsCheck(pushSubscriptions)
    case 'sync-sante':
      return runSyncSante()
    case 'morning-brief':
      return runMorningBrief()
    case 'insights':
      return runInsights()
    default:
      throw new Error(`Agent inconnu: ${agentName}`)
  }
}

// ─── Re-exports utilitaires ───────────────────────────────────────────────────
export {
  getRoutineCache, regenererPourUser, routineCache,
  runDesignAudit, DESIGN_TOKENS,
  genererRapportUser, creerChallenge,
  genererContexteMeteo, genererConseilsNutrition,
  extraireMoments, sauvegarderMoments,
}
