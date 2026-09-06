/**
 * Hook useCapacitor — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Gère toutes les interactions natives Capacitor :
 *   - Détection de l'environnement (native vs web)
 *   - Push notifications natives (iOS/Android)
 *   - Apple Health / Google Fit via CapacitorHealthkit
 *   - Status bar + haptics
 *
 * Usage :
 *   const { isNative, requestHealth, syncHealthData } = useCapacitor()
 */

import { useEffect, useState, useCallback } from 'react'
import { authHeaders } from '../supabase'

// ─── Détection environnement ──────────────────────────────────────────────────
export function isNativeApp() {
  return !!(window?.Capacitor?.isNativePlatform?.())
}

export function getPlatform() {
  return window?.Capacitor?.getPlatform?.() || 'web'
}

/**
 * Enregistre CET appareil pour les notifications natives (APNs / FCM).
 *
 * Exportee au niveau module, et pas seulement dans le hook : l'interrupteur des
 * reglages en a besoin, et le hook n'etait importe nulle part. Resultat, dans
 * l'app installee l'interrupteur affichait un message et ne faisait rien
 * (constate par Jean le 2026-08-14).
 *
 * Retourne true si la permission est accordee. L'envoi du jeton au serveur se
 * fait ensuite, quand le systeme le fournit.
 */
export async function demanderPushNatif(userId) {
  if (!isNativeApp()) return false
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return false

    // Un echec d'enregistrement doit se VOIR. Sans cet ecouteur, un mauvais
    // certificat APNs ou un identifiant d'app qui ne correspond pas echoue en
    // silence et l'app croit les rappels actifs.
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push natif] enregistrement refuse :', JSON.stringify(err))
    })

    PushNotifications.addListener('registration', async (token) => {
      try {
        const rep = await fetch('/api/push-native-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
          body: JSON.stringify({ userId, token: token.value, platform: getPlatform() }),
        })
        if (!rep.ok) console.error('[Push natif] serveur a refuse le jeton :', rep.status)
      } catch (e) {
        console.error('[Push natif] jeton non transmis :', e.message)
      }
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = action.notification?.data?.url
      if (url) window.location.href = url
    })

    await PushNotifications.register()
    return true
  } catch (e) {
    console.error('[Push natif] activation impossible :', e.message)
    return false
  }
}

// ─── Types de données Health demandés ────────────────────────────────────────
// UNIQUEMENT ce que Solenn lit vraiment. syncHealthData ne renvoie que trois
// mesures : les pas, la frequence cardiaque et le sommeil. L'app demandait
// pourtant huit types, en ajoutant distance, calories, poids, taille et
// activite, jamais lus.
//
// Ce n'est pas un detail cosmetique : Google cible explicitement le
// « data overreach » dans sa politique Health Connect, et Apple l'interdit
// aussi, article 5.1.1. Demander l'acces au poids et a la taille de quelqu'un
// sans jamais s'en servir est un motif de rejet, et une promesse qu'on ne
// tient pas envers l'utilisateur (releve le 2026-08-25).
//
// AJOUTER UN TYPE ICI SUPPOSE DE LE LIRE dans syncHealthData, et de mettre a
// jour la declaration Health Connect dans Play Console.
const HEALTH_READ_TYPES = [
  'steps',
  'heart_rate',
  'sleep_analysis',
]

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useCapacitor() {
  const [isNative,      setIsNative]      = useState(false)
  const [platform,      setPlatform]      = useState('web')
  const [healthGranted, setHealthGranted] = useState(false)
  const [notifsGranted, setNotifsGranted] = useState(false)

  useEffect(() => {
    const native = isNativeApp()
    setIsNative(native)
    setPlatform(getPlatform())

    if (native) {
      initStatusBar()
    }
  }, [])

  // ─── Status Bar ────────────────────────────────────────────────────────────
  async function initStatusBar() {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#FFF8F4' })
    } catch (_) {}
  }

  // ─── Haptics ───────────────────────────────────────────────────────────────
  const haptic = useCallback(async (type = 'light') => {
    if (!isNative) return
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      const style = type === 'heavy' ? ImpactStyle.Heavy
                  : type === 'medium' ? ImpactStyle.Medium
                  : ImpactStyle.Light
      await Haptics.impact({ style })
    } catch (_) {}
  }, [isNative])

  // ─── Push Notifications Natives ────────────────────────────────────────────
  const requestPushPermission = useCallback(async (userId) => {
    if (!isNative) return false
    const ok = await demanderPushNatif(userId)
    if (ok) setNotifsGranted(true)
    return ok
  }, [isNative])

  // ─── Apple Health / Google Fit ─────────────────────────────────────────────
  const requestHealthPermission = useCallback(async () => {
    if (!isNative || getPlatform() !== 'ios') return false
    try {
      // Une seule liste de types, dans useHealthKit.js : la copie qui vivait
      // ici portait des noms Health Connect que HealthKit ne connait pas.
      const { requestHealthKitPermissions } = await import('../useHealthKit')
      await requestHealthKitPermissions()
      setHealthGranted(true)
      return true
    } catch (e) {
      console.warn('[Capacitor] HealthKit:', e.message)
      return false
    }
  }, [isNative])

  const syncHealthData = useCallback(async () => {
    if (!isNative || getPlatform() !== 'ios' || !healthGranted) return null
    try {
      const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit')
      const maintenant = new Date()
      const hier       = new Date(maintenant - 24 * 60 * 60 * 1000)
      const options    = { startDate: hier.toISOString(), endDate: maintenant.toISOString(), limit: 0 }

      const [steps, heart, sleep] = await Promise.allSettled([
        CapacitorHealthkit.queryHKitSampleType({ ...options, sampleName: 'stepCount' }),
        CapacitorHealthkit.queryHKitSampleType({ ...options, sampleName: 'heartRate' }),
        CapacitorHealthkit.queryHKitSampleType({ ...options, sampleName: 'sleepAnalysis' }),
      ])

      // Calculer les totaux
      const totalPas = steps.status === 'fulfilled'
        ? (steps.value?.output || []).reduce((acc, s) => acc + (s.value || 0), 0)
        : null

      const fcMoy = heart.status === 'fulfilled'
        ? (() => {
            const vals = (heart.value?.output || []).map(s => s.value).filter(Boolean)
            return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
          })()
        : null

      // Sommeil : durée en heures des phases endormies
      const sommeilH = sleep.status === 'fulfilled'
        ? (() => {
            const phases = (sleep.value?.output || []).filter(s => s.value === 'ASLEEP' || s.value === 0)
            const totalMs = phases.reduce((acc, s) => {
              const dur = new Date(s.endDate) - new Date(s.startDate)
              return acc + (isNaN(dur) ? 0 : dur)
            }, 0)
            return totalMs > 0 ? parseFloat((totalMs / 3600000).toFixed(1)) : null
          })()
        : null

      return { pas: totalPas, fc: fcMoy, sommeil: sommeilH }
    } catch (e) {
      console.warn('[Capacitor] Sync health:', e.message)
      return null
    }
  }, [isNative, healthGranted])

  return {
    isNative,
    platform,
    healthGranted,
    notifsGranted,
    haptic,
    requestPushPermission,
    requestHealthPermission,
    syncHealthData,
  }
}
