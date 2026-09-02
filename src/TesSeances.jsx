// ─────────────────────────────────────────────────────────────────────────────
// CE QUE TU AS FAIT
//
// Les courses, les marches et les séances étaient enregistrées et n'étaient
// visibles nulle part, en dehors de l'écran de félicitations qui disparaît
// dès qu'on le ferme. Enregistrer une donnée qu'on ne montre jamais, c'est la
// moitié d'une fonctionnalité : la personne qui a couru trois fois cette
// semaine n'avait aucun endroit où le constater.
//
// Ce bloc est cet endroit. Il ne montre que la semaine, volontairement : une
// liste de tout l'historique se consulte une fois puis plus jamais, alors
// qu'un total sur sept jours se regarde encore le mois suivant, parce qu'il
// bouge.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { lireSeances, statsSeances, serieSeances, TYPES_SEANCE } from './seances'
import { ENCRE, ICONE, AMBRE, VERT } from './palette'

const F = "'Poppins', sans-serif"

function Bloc({ valeur, libelle }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 20, fontWeight: 700, color: ENCRE, lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {valeur}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
        color: AMBRE, marginTop: 4,
      }}>
        {libelle}
      </div>
    </div>
  )
}

export default function TesSeances({ profil }) {
  const liste = lireSeances(profil)
  const stats = statsSeances(liste, 7)
  const serie = serieSeances(liste)

  // Rien de fait cette semaine : on n'affiche pas un bloc de zeros. Une page
  // de progres qui commence par « 0 » a quelqu'un qui reprend est exactement
  // ce qu'il ne faut pas lui montrer.
  if (!stats.total.seances) return null

  const km = stats.total.metres >= 1000
    ? `${(stats.total.metres / 1000).toFixed(1).replace('.', ',')} km`
    : stats.total.metres > 0 ? `${stats.total.metres} m` : null

  const detail = Object.entries(stats.parType)
    .filter(([, v]) => v.seances > 0)
    .map(([id, v]) => {
      const t = TYPES_SEANCE[id]
      if (!t) return `${v.seances} ${id}`
      return `${v.seances} ${v.seances > 1 ? t.pluriel : t.nom.toLowerCase()}`
    })

  return (
    <div style={{
      background: 'rgba(255,235,210,0.22)', border: '1px solid rgba(255,220,160,0.28)',
      borderRadius: 18, padding: '16px 16px', marginBottom: 18,
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      fontFamily: F,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ENCRE, flex: 1 }}>
          Ce que tu as fait cette semaine
        </div>
        {serie > 1 && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: VERT, whiteSpace: 'nowrap',
            background: 'rgba(22,101,52,0.10)', border: '1px solid rgba(22,101,52,0.24)',
            borderRadius: 999, padding: '3px 9px',
          }}>
            {serie} jours d'affilée
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Bloc valeur={String(stats.total.seances)} libelle="Activités" />
        <Bloc valeur={`${stats.total.minutes} min`} libelle="De mouvement" />
        {km && <Bloc valeur={km} libelle="Parcourus" />}
      </div>

      {detail.length > 0 && (
        <div style={{
          fontSize: 12, lineHeight: 1.5, color: ENCRE, marginTop: 13, paddingTop: 12,
          borderTop: '1px solid rgba(200,123,82,0.16)',
        }}>
          {detail.join(', ')}.
        </div>
      )}
    </div>
  )
}
