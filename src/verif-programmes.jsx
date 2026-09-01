import React from 'react'
import { createRoot } from 'react-dom/client'
import CatalogueProgrammes from './CatalogueProgrammes'

// Un profil qui declare grossesse et trouble cardiaque, pour voir l'avis de
// sante s'afficher reellement sur la fiche « Remise en mouvement ».
const PROFIL = { sante_flags: { grossesse: true, cardiaque: true } }

createRoot(document.getElementById('app')).render(
  <CatalogueProgrammes
    profil={PROFIL}
    onCommencer={p => console.log('choisi :', p.id)}
  />
)
