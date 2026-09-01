// ─────────────────────────────────────────────────────────────────────────────
// LA palette de Solenn. Un rôle, une valeur, un seul endroit.
//
// Pourquoi ce fichier existe : au 1er septembre 2026 l'app comptait sept bruns
// différents pour le même rôle de texte (123/66/28, 156/91/51, 178/102/62,
// 156/93/8, 150/85/50, 160/100/60, 200/123/82) et deux verts pour « positif ».
// Rien ne choquait à l'œil, mais chaque correction de lisibilité en oubliait
// une partie, et un nouvel écran repartait toujours d'une nuance inventée.
//
// Les ratios sont mesurés sur le fond de l'app, #EDD8CC. Seuils WCAG : 4,5
// pour du texte courant, 3,0 pour une icône ou un texte d'au moins 24px.
// ─────────────────────────────────────────────────────────────────────────────

export const ENCRE       = '#7B421C'   // 5,80:1 — tout le texte courant
// 3,86:1. Ne passe PAS le seuil du texte courant : réservée aux icônes et aux
// textes d'au moins 24px. Elle s'appelait ENCRE_DOUCE, et ce nom d'encre
// invitait à l'employer comme une encre : trouvée trois fois sur du texte de
// 10 à 12px le 1er septembre 2026. Le nom dit maintenant sa contrainte.
//
// S'il te faut une seconde encre pour du petit texte, la plus claire qui passe
// encore le seuil est #8C4E22, à 4,74:1. Mesuré : au-delà, #935426 tombe à
// 4,32 et échoue. L'écart avec ENCRE étant trop faible pour créer une
// hiérarchie visible, la hiérarchie passe par la graisse, pas par la teinte.
export const ICONE = '#9C5B33'
export const ACCENT      = '#C87B52'   // 2,39:1 — fonds, bordures, traits. JAMAIS du texte
export const AMBRE       = '#8A5206'   // 4,65:1 — accent chaud lisible
export const VERT        = '#166534'   // 5,19:1 — état positif
export const ROUGE       = '#B91C1C'   // 4,71:1 — erreur, suppression

// Couleurs d'IDENTITÉ, hors échelle et volontairement épargnées : les teintes
// propres à chaque métrique (Eau, Sommeil, Humeur) et les cinq couleurs
// d'humeur du check-in. Elles portent du sens, pas de la hiérarchie.
export const IDENTITE = {
  eau: '#38bdf8', sommeil: '#818cf8', humeur: '#fbbf24',
}
