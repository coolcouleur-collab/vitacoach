// ─────────────────────────────────────────────────────────────────────────────
// LE SCORE DE BIEN-ÊTRE
//
// Il vivait en TROIS copies, dans App.jsx, HomeTab.jsx et SanteTab.jsx. Elles
// étaient encore identiques, à un espace près, mais rien ne le garantissait :
// trois formules qui décident du même chiffre affiché à trois endroits, c'est
// la promesse qu'un jour l'accueil et les progrès ne diront plus la même
// chose. Ce fichier est désormais la seule.
//
// Il n'a ni JSX ni composant, exprès : c'est ce qui permet aux trois écrans de
// l'importer sans casser le rechargement à chaud, la raison pour laquelle les
// copies existaient.
//
// ── Pourquoi le rythme cardiaque n'y est plus ────────────────────────────────
//
// L'ancienne répartition donnait 15 points sur 100 à la fréquence cardiaque.
// Or elle ne se saisit NULLE PART à la main : la feuille de saisie ne propose
// que l'eau, les pas, le sommeil et l'humeur. Elle ne peut venir que d'Apple
// Santé ou de Health Connect.
//
// Conséquence, mesurée : une journée parfaite sans montre connectée, huit
// heures de sommeil, huit verres, douze mille pas et l'humeur au maximum,
// plafonnait à 85 sur 100. La personne cherchait ce qu'elle avait raté, et
// l'app ne lui disait jamais que ces quinze points lui étaient inaccessibles.
// Un découragement permanent, et invisible.
//
// Le score ne mesure donc plus que ce sur quoi la personne peut agir. Le
// cardio reste affiché dans l'anneau, parce qu'il informe, mais il ne juge
// plus.
// ─────────────────────────────────────────────────────────────────────────────

/** Les quatre métriques comptées, et ce que chacune pèse au maximum. */
export const POIDS = { sommeil: 30, pas: 25, eau: 25, humeur: 20 }

/** Les libellés, au singulier possessif, pour les phrases de l'app. */
export const LIBELLES = {
  sommeil: 'ton sommeil',
  eau: 'ton eau',
  pas: 'tes pas',
  humeur: 'ton humeur',
}

export const CLES = ['sommeil', 'eau', 'pas', 'humeur']

/**
 * Le score du jour, sur 100.
 *
 * Les paliers gardent l'esprit de l'ancienne version : quatre niveaux par
 * métrique, et le premier palier récompense le simple fait d'avoir renseigné.
 * Seules les valeurs ont été redistribuées pour que le total atteigne
 * réellement 100 sans montre.
 */
export function scoreJour(m) {
  if (!m) return 0
  let s = 0

  if (m.sommeil >= 7.5)   s += 30
  else if (m.sommeil >= 6) s += 22
  else if (m.sommeil >= 5) s += 12
  else if (m.sommeil > 0)  s += 6

  if (m.pas >= 10000)     s += 25
  else if (m.pas >= 7000) s += 19
  else if (m.pas >= 5000) s += 12
  else if (m.pas >= 2000) s += 6

  if (m.eau >= 8)         s += 25
  else if (m.eau >= 6)    s += 19
  else if (m.eau >= 4)    s += 12
  else if (m.eau > 0)     s += 6

  if (m.humeur === 5)     s += 20
  else if (m.humeur === 4) s += 15
  else if (m.humeur === 3) s += 10
  else if (m.humeur > 0)   s += 5

  return Math.min(s, 100)
}

/** Les métriques réellement renseignées aujourd'hui. */
export function mesuresConnues(m) {
  return CLES.filter(c => (m?.[c] || 0) > 0)
}

/** Celles qui manquent, dans l'ordre où l'app les demande. */
export function mesuresManquantes(m) {
  const connues = mesuresConnues(m)
  return CLES.filter(c => !connues.includes(c))
}

/**
 * Une métrique est-elle dans le vert ?
 *
 * Les seuils sont ceux des VERDICTS affichés sur l'accueil, et non ceux des
 * paliers ci-dessus : la pastille de l'anneau ne doit jamais approuver ce que
 * la phrase juste en dessous reproche.
 *
 * `null` quand la métrique n'est pas renseignée. Il ne faut surtout pas
 * répondre « non atteint » dans ce cas.
 */
export function atteint(cle, v) {
  if (!v) return null
  if (cle === 'eau')     return v >= 8       // verdict : « < 8 » après midi
  if (cle === 'pas')     return v >= 10000   // verdict : « < 10000 »
  if (cle === 'sommeil') return v >= 7       // verdict : « < 7 tire vers le bas »
  if (cle === 'humeur')  return v >= 3       // verdict : « < 3 »
  if (cle === 'fc')      return v >= 50 && v <= 80
  return null
}

export default scoreJour
