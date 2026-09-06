import { Capacitor } from '@capacitor/core'

export const isHealthKitAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

// UNIQUEMENT ce qui est reellement interroge. `bodyFatPercentage` figurait ici
// sans qu'aucune requete ne le lise : verifie le 2026-09-04, zero appel a
// queryHKitSampleType avec ce type. Demander l'acces a la masse grasse de
// quelqu'un sans jamais s'en servir est un motif de rejet, article 5.1.1.
// `bodyMass` reste : il est lu par readTodayHealthData et readWeightHistory,
// c'est l'historique de poids affiche dans Connexions sante.
//
// ATTENTION, deux vocabulaires dans le greffon @perfood/capacitor-healthkit :
// requestAuthorization attend les noms de sa fonction getTypes ('weight',
// 'steps', 'activity', 'heartRate'), et queryHKitSampleType ceux de
// getSampleType ('weight', 'stepCount', 'sleepAnalysis', 'heartRate'). Cette
// liste portait les noms de requete : seule la frequence cardiaque etait
// demandee, et la fenetre d'autorisation ne montrait qu'elle. Constate sur
// iPhone le 6 septembre 2026, verifie dans le Swift du greffon.
const READ_TYPES = [
  'weight',      // bodyMass
  'steps',       // stepCount
  'activity',    // sleepAnalysis et seances
  'heartRate',
]

// NE JAMAIS rendre le greffon directement depuis une fonction async, ni
// l'`await` : c'est un Proxy de Capacitor qui repond a TOUTE propriete,
// `then` compris. `await` le prend alors pour une promesse et appelle son
// `then`, qui n'aboutit jamais. Sur iPhone, le bouton Apple Sante restait
// muet a jamais, sans erreur (constate a la trace, 6 septembre 2026). D'ou
// l'enveloppe dans un objet ordinaire.
async function hk() {
  const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit')
  return { plugin: CapacitorHealthkit }
}

export async function requestHealthKitPermissions() {
  const { plugin } = await hk()
  await plugin.requestAuthorization({ all: [], read: READ_TYPES, write: [] })
}

// Retourne { pas, sommeil, fc, poids } pour aujourd'hui
export async function readTodayHealthData() {
  const { plugin } = await hk()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const now   = new Date()
  const yest  = new Date(today.getTime() - 86400000)

  const [stepsR, sleepR, hrR, weightR] = await Promise.allSettled([
    plugin.queryHKitSampleType({ sampleName:'stepCount',     startDate:today.toISOString(), endDate:now.toISOString(),  limit:0  }),
    plugin.queryHKitSampleType({ sampleName:'sleepAnalysis', startDate:yest.toISOString(),  endDate:now.toISOString(),  limit:0  }),
    plugin.queryHKitSampleType({ sampleName:'heartRate',     startDate:today.toISOString(), endDate:now.toISOString(),  limit:20 }),
    plugin.queryHKitSampleType({ sampleName:'weight',        startDate:today.toISOString(), endDate:now.toISOString(),  limit:1  }),
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
  const { plugin } = await hk()
  const end   = new Date()
  const start = new Date(Date.now() - days * 86400000)
  const res   = await plugin.queryHKitSampleType({
    sampleName: 'weight',
    startDate:  start.toISOString(),
    endDate:    end.toISOString(),
    limit:      days,
  })
  return (res.resultData || []).map(r => ({
    date:  new Date(r.startDate).toDateString(),
    poids: parseFloat(parseFloat(r.quantity).toFixed(1)),
  }))
}

/**
 * La frequence cardiaque SUR UNE FENETRE precise, pour le bilan d'une course.
 *
 * Un telephone n'a pas de capteur cardiaque : ces relevés viennent d'une montre
 * ou d'un bracelet, deja synchronises dans Sante par leur propre application.
 * On ne les mesure pas, on les relit apres coup — d'ou le fait que ce soit
 * possible pour le BILAN et pas en direct pendant l'effort.
 *
 * Rend null quand il n'y a rien a dire : pas d'iPhone, pas d'autorisation, ou
 * aucun relevé sur le creneau. Un ecran de fin de course n'a pas a afficher
 * « -- » a la place d'un chiffre qu'il n'aura jamais.
 *
 * `limit: 0` demande tout ce qui existe sur la fenetre : une course d'une heure
 * avec une montre qui releve chaque seconde en produit des milliers, mais on
 * n'en garde que trois nombres.
 */
export async function readHeartRateWindow(debut, fin) {
  if (!isHealthKitAvailable()) return null
  try {
    const { plugin } = await hk()
    const res = await plugin.queryHKitSampleType({
      sampleName: 'heartRate',
      startDate: new Date(debut).toISOString(),
      endDate: new Date(fin).toISOString(),
      limit: 0,
    })
    const data = res?.resultData || []
    const bpm = data
      .map(d => parseFloat(d.quantity))
      // Un relevé aberrant fausse la moyenne autant que le maximum. En dessous
      // de 30 ou au-dessus de 230, ce n'est plus un coeur humain a l'effort.
      .filter(v => Number.isFinite(v) && v >= 30 && v <= 230)
    if (!bpm.length) return null
    return {
      moyenne: Math.round(bpm.reduce((s, v) => s + v, 0) / bpm.length),
      max: Math.round(Math.max(...bpm)),
      releves: bpm.length,
    }
  } catch (_) {
    return null
  }
}
