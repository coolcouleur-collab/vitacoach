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

// ─── Détection environnement ──────────────────────────────────────────────────
export function isNativeApp() {
  return !!(window?.Capacitor?.isNativePlatform?.())
}

export function getPlatform() {
  return window?.Capacitor?.getPlatform?.() || 'web'
}

// ─── Types de données Health demandés ────────────────────────────────────────
const HEALTH_READ_TYPES = [
  'steps',
  'distance',
  'calories',
  'heart_rate',
  'sleep_analysis',
  'weight',
  'height',
  'activity',
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
  const requestPushPermission = useCallback(async () => {
    if (!isNative) return false
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      const perm = await PushNotifications.requestPermissions()
      if (perm.receive !== 'granted') return false

      await PushNotifications.register()

      // Token FCM/APNs → envoyer au serveur
      PushNotifications.addListener('registration', async (token) => {
        console.log('[Capacitor] Push token:', token.value)
        try {
          await fetch('/api/push-native-subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.value, platform: getPlatform() }),
          })
        } catch (_) {}
      })

      // Notif reçue en foreground
      PushNotifications.addListener('pushNotificationReceived', (notif) => {
        console.log('[Capacitor] Notif reçue:', notif)
      })

      // Tap sur une notif
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const url = action.notification?.data?.url
        if (url) window.location.href = url
      })

      setNotifsGranted(true)
      return true
    } catch (e) {
      console.warn('[Capacitor] Push notifications:', e.message)
      return false
    }
  }, [isNative])

  // ─── Apple Health / Google Fit ─────────────────────────────────────────────
  const requestHealthPermission = useCallback(async () => {
    if (!isNative || getPlatform() !== 'ios') return false
    try {
      const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit')
      await CapacitorHealthkit.requestAuthorization({
        all: HEALTH_READ_TYPES,
        read: HEALTH_READ_TYPES,
        write: [],
      })
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
