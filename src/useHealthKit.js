import { Capacitor } from '@capacitor/core'

export const isHealthKitAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

const READ_TYPES = [
  'bodyMass',
  'bodyFatPercentage',
  'stepCount',
  'sleepAnalysis',
  'heartRate',
]

async function hk() {
  const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit')
  return CapacitorHealthkit
}

export async function requestHealthKitPermissions() {
  const plugin = await hk()
  await plugin.requestAuthorization({ all: [], read: READ_TYPES, write: [] })
}

// Retourne { pas, sommeil, fc, poids } pour aujourd'hui
export async function readTodayHealthData() {
  const plugin = await hk()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const now   = new Date()
  const yest  = new Date(today.getTime() - 86400000)

  const [stepsR, sleepR, hrR, weightR] = await Promise.allSettled([
    plugin.queryHKitSampleType({ sampleName:'stepCount',     startDate:today.toISOString(), endDate:now.toISOString(),  limit:0  }),
    plugin.queryHKitSampleType({ sampleName:'sleepAnalysis', startDate:yest.toISOString(),  endDate:now.toISOString(),  limit:0  }),
    plugin.queryHKitSampleType({ sampleName:'heartRate',     startDate:today.toISOString(), endDate:now.toISOString(),  limit:20 }),
    plugin.queryHKitSampleType({ sampleName:'bodyMass',      startDate:today.toISOString(), endDate:now.toISOString(),  limit:1  }),
  ])

  const metrics = {}

  if (stepsR.status === 'fulfilled') {
    const data = stepsR.value.resultData || []
    const total = data.reduce((s, d) => s + parseFloat(d.quantity || 0), 0)
    if (total > 0) metrics.pas = Math.round(total)
  }

  if (sleepR.status === 'fulfilled') {
    const data = sleepR.value.resultData || []
    const ms = data
      .filter(d => d.value === 'ASLEEP' || d.value === 'INBED')
      .reduce((s, d) => s + (new Date(d.endDate) - new Date(d.startDate)), 0)
    if (ms > 0) metrics.sommeil = parseFloat((ms / 3600000).toFixed(1))
  }

  if (hrR.status === 'fulfilled') {
    const data = hrR.value.resultData || []
    if (data.length > 0) {
      const avg = data.reduce((s, d) => s + parseFloat(d.quantity || 0), 0) / data.length
      metrics.fc = Math.round(avg)
    }
  }

  if (weightR.status === 'fulfilled') {
    const data = weightR.value.resultData || []
    if (data.length > 0) {
      metrics.poids = parseFloat(parseFloat(data[data.length - 1].quantity).toFixed(1))
    }
  }

  return metrics
}

// Retourne un tableau [{ date: 'Mon Jan 01 2025', poids: 72.3 }] sur N jours
export async function readWeightHistory(days = 30) {
  const plugin = await hk()
  const end   = new Date()
  const start = new Date(Date.now() - days * 86400000)
  const res   = await plugin.queryHKitSampleType({
    sampleName: 'bodyMass',
    startDate:  start.toISOString(),
    endDate:    end.toISOString(),
    limit:      days,
  })
  return (res.resultData || []).map(r => ({
    date:  new Date(r.startDate).toDateString(),
    poids: parseFloat(parseFloat(r.quantity).toFixed(1)),
  }))
}
