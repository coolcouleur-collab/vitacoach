// ─────────────────────────────────────────────────────────────────────────────
// LE CROISEMENT
//
// Les 36 fiches de Soins portent déjà des contre-indications, écrites avec
// précision. Jusqu'ici elles étaient imprimées sur la fiche, et c'était à
// l'utilisatrice de se diagnostiquer elle-même : lire « prudence sous
// anticoagulant », se souvenir qu'elle en prend un, et faire le lien. La
// plupart ne le feront pas.
//
// Ce module fait le lien à sa place. Il ne remplace pas un professionnel et ne
// prétend pas le faire : il signale, il explique pourquoi, et il renvoie vers
// un pharmacien.
//
// Principe : chaque situation connaît les MOTS qui la désignent dans les
// contre-indications écrites par Jean. On cherche ces mots dans le texte de la
// fiche. Pas d'interprétation, pas de modèle : une correspondance littérale,
// vérifiable, et qui échoue du bon côté (elle signale trop plutôt que pas assez).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chaque entrée : la clé stockée dans le profil, ce qu'on dit à l'écran, et les
 * mots qui la trahissent dans une contre-indication.
 * Les mots sont comparés sans accents ni casse.
 */
export const SITUATIONS = [
  { cle: 'grossesse',   libelle: 'ta grossesse',
    mots: ['grossesse', 'enceinte'] },
  { cle: 'allaitement', libelle: 'ton allaitement',
    mots: ['allaitement', 'allaite'] },
  { cle: 'anticoagulant', libelle: 'ton traitement anticoagulant',
    mots: ['anticoagulant', 'coagulation'] },
  { cle: 'tension',     libelle: 'ton traitement pour la tension',
    mots: ['antihypertenseur', 'hypertension', 'hypotension', 'tension arterielle'] },
  { cle: 'thyroide',    libelle: 'ta thyroïde',
    mots: ['thyroid'] },
  { cle: 'hormonal',    libelle: 'ton traitement hormonal',
    mots: ['hormonal', 'hormono'] },
  { cle: 'bipolaire',   libelle: 'ton trouble bipolaire',
    mots: ['bipolaire'] },
  { cle: 'epilepsie',   libelle: 'ton épilepsie',
    mots: ['epilepsie', 'epileptique'] },
  { cle: 'biliaires',   libelle: 'tes calculs biliaires',
    mots: ['calculs biliaires', 'voies biliaires', 'obstruction biliaire'] },
  { cle: 'ulcere',      libelle: 'ton ulcère',
    mots: ['ulcere'] },
  { cle: 'cardiaque',   libelle: 'ton trouble cardiaque',
    mots: ['trouble cardiaque', 'insuffisance cardiaque', 'cardiaque'] },
  { cle: 'renal',       libelle: 'ton insuffisance rénale',
    mots: ['renale', 'renal'] },
  { cle: 'immuno',      libelle: 'ton traitement immunosuppresseur',
    mots: ['immunosuppresseur', 'immunosuppresseurs'] },
  { cle: 'diabete',     libelle: 'ton diabète',
    mots: ['diabete'] },
  { cle: 'chirurgie',   libelle: 'ton opération prévue',
    mots: ['chirurgie', 'operation'] },
  { cle: 'sedatifs',    libelle: 'ton traitement sédatif',
    mots: ['sedatif', 'anxiolytique', 'somnifere'] },
]

/** Enlève accents et casse, pour comparer du texte écrit à la main. */
function nu(t) {
  return (t || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Croise UNE fiche avec le profil.
 *
 * @param {object} profil  le profil, dont `sante` porte les situations cochées
 * @param {object} fiche   une fiche de Soins, dont `contre` porte le texte
 * @returns {{ concerne: boolean, raisons: string[], cles: string[] }}
 */
export function croiser(profil, fiche) {
  const texte = nu(fiche?.contre)
  if (!texte) return { concerne: false, raisons: [], cles: [] }

  const declare = profil?.sante || {}
  const raisons = []
  const cles = []

  for (const s of SITUATIONS) {
    if (!declare[s.cle]) continue
    if (s.mots.some(m => texte.includes(nu(m)))) {
      raisons.push(s.libelle)
      cles.push(s.cle)
    }
  }
  return { concerne: raisons.length > 0, raisons, cles }
}

/**
 * La phrase affichée sur une fiche concernée.
 * Volontairement sobre : elle signale, elle n'interdit pas, et elle renvoie
 * toujours vers un professionnel. Solenn n'est pas un dispositif médical.
 */
export function phraseAlerte(raisons) {
  if (!raisons.length) return null
  const liste = raisons.length === 1
    ? raisons[0]
    : raisons.slice(0, -1).join(', ') + ' et ' + raisons[raisons.length - 1]
  return `À éviter dans ta situation : tu as indiqué ${liste}. Demande l'avis de ton pharmacien avant d'essayer.`
}

/** Combien de fiches sont concernées, pour un compteur d'écran. */
export function compter(profil, fiches) {
  return (fiches || []).filter(f => croiser(profil, f).concerne).length
}
