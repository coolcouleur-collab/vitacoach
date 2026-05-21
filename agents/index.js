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
import { runMonitoring }    from './monitoring.js'
import { runNotifications } from './notifications.js'
import { runTendances }     from './tendances.js'
import { runRoutineAuto, getRoutineCache, regenererPourUser, routineCache } from './routine-auto.js'
import { runDesignAudit, DESIGN_TOKENS } from './design-advisor.js'

// ─── État des agents (pour le dashboard /api/agents-status) ──────────────────
const agentsStatus = {
  monitoring:    { dernierRun: null, derniersResultats: null, actif: false },
  notifications: { dernierRun: null, derniersResultats: null, actif: false },
  tendances:     { dernierRun: null, derniersResultats: null, actif: false },
  routineAuto:   { dernierRun: null, derniersResultats: null, actif: false },
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

  console.log('✅ [Agents] 4 agents actifs : Monitoring · Notifications · Tendances · RoutineAuto')
  console.log('   📅 Monitoring  : toutes les 2h (8h→22h)')
  console.log('   📅 Notifs      : 07:00 · 12:30 · 19:30')
  console.log('   📅 Tendances   : dimanche 18:00')
  console.log('   📅 RoutineAuto : 05:30 quotidien')
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
    default:
      throw new Error(`Agent inconnu: ${agentName}`)
  }
}

// ─── Re-exports utilitaires ───────────────────────────────────────────────────
export { getRoutineCache, regenererPourUser, routineCache, runDesignAudit, DESIGN_TOKENS }
