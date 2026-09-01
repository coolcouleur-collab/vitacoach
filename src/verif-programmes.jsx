import React from 'react'
import { createRoot } from 'react-dom/client'
import CatalogueProgrammes from './CatalogueProgrammes'
import SeanceActive from './SeanceActive'
import CourseActive from './CourseActive'

// Un profil qui declare grossesse et trouble cardiaque, pour voir l'avis de
// sante s'afficher reellement sur la fiche « Remise en mouvement ».
const PROFIL = { sante_flags: { grossesse: true, cardiaque: true } }

// Une seance telle que le generateur en produit vraiment.
const SEANCE = [
  { exo: 'squat',       reps: '3 × 12' },
  { exo: 'pompegenoux', reps: '3 × 8'  },
  { exo: 'gainage',     reps: '3 × 30 s' },
  { exo: 'superman',    reps: '2 × 10' },
]

const quoi = new URLSearchParams(location.search).get('ecran')

createRoot(document.getElementById('app')).render(
  quoi === 'course'
    ? <CourseActive onTermine={r => console.log('course', r)} onFermer={() => console.log('ferme')} />
  : quoi === 'seance'
    ? <SeanceActive
        seance={SEANCE}
        jour={9}
        titre="Haut du corps et gainage"
        onTermine={r => console.log('termine', r)}
        onFermer={() => console.log('ferme')}
      />
    : <CatalogueProgrammes profil={PROFIL} onCommencer={p => console.log('choisi :', p.id)} />
)
