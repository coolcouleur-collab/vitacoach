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

// « Brique solaire », choisie par Jean le 1er septembre 2026. 5,65:1, chroma 117.
//
// Elle remplace #7B421C, qui donnait 5,80:1 pour un chroma de seulement 95 :
// une teinte choisie pour sa lisibilité, mais qui tirait vers la terre cuite.
// Sur une app qui s'appelle « ton soleil au quotidien », la contradiction se
// sentait sans se nommer. Quinze centièmes de contraste échangés contre
// vingt-deux points de couleur, et il reste de la marge au-dessus du seuil
// de 4,5 pour les écrans à venir.
// ─────────────────────────────────────────────────────────────────────────────
// DEPUIS LE 2 SEPTEMBRE, CES JETONS SONT DES VARIABLES CSS
//
// Les valeurs elles-memes vivent dans theme.css, en deux jeux : le jour, qui
// reprend a l'identique les couleurs ci-dessus, et la nuit.
//
// Pourquoi ce detour plutot que six constantes : l'app compte 2 082 couleurs
// ecrites en dur. En passant par des variables, les 833 usages de ces six
// jetons, repartis dans 30 fichiers, suivent le theme sans qu'aucun composant
// ne soit touche.
//
// Ce qui a ete verifie avant de le faire, parce qu'une variable CSS ne se
// comporte pas comme une chaine de caracteres :
//   · aucun jeton n'est concatene ni manipule (`${ENCRE}b0` n'existe pas)
//   · aucun n'est passe a un canvas, qui ne resout pas les variables
//   · les attributs SVG `stroke=` et `fill=` les resolvent bien, teste dans
//     le navigateur, y compris avec le basculement de theme
//
// Les commentaires de ratio ci-dessus restent vrais pour le jour. Les mesures
// de nuit sont dans theme.css, a cote des valeurs qu'elles justifient.
// ─────────────────────────────────────────────────────────────────────────────

export const ENCRE       = 'var(--encre)'
// 3,86:1. Ne passe PAS le seuil du texte courant : réservée aux icônes et aux
// textes d'au moins 24px. Elle s'appelait ENCRE_DOUCE, et ce nom d'encre
// invitait à l'employer comme une encre : trouvée trois fois sur du texte de
// 10 à 12px le 1er septembre 2026. Le nom dit maintenant sa contrainte.
//
// S'il te faut une seconde encre pour du petit texte, la plus claire qui passe
// encore le seuil est #8C4E22, à 4,74:1. Mesuré : au-delà, #935426 tombe à
// 4,32 et échoue. L'écart avec ENCRE étant trop faible pour créer une
// hiérarchie visible, la hiérarchie passe par la graisse, pas par la teinte.
// Réchauffée dans la même proportion que l'encre : une icône restée grise à
// côté d'un texte devenu chaud se voit immédiatement. Elle y gagne sur les
// deux tableaux, chroma 141 contre 105 et contraste 4,07 contre 3,86.
export const ICONE       = 'var(--icone)'
export const ACCENT      = 'var(--accent)'   // 2,39:1 — fonds, bordures, traits. JAMAIS du texte
export const AMBRE       = 'var(--ambre)'   // 4,65:1 — accent chaud lisible
export const VERT        = 'var(--vert)'   // 5,19:1 — état positif
export const ROUGE       = 'var(--rouge)'   // 4,71:1 — erreur, suppression

// Couleurs d'IDENTITÉ, hors échelle et volontairement épargnées : les teintes
// propres à chaque métrique (Eau, Sommeil, Humeur) et les cinq couleurs
// d'humeur du check-in. Elles portent du sens, pas de la hiérarchie.
export const IDENTITE = {
  eau: '#38bdf8', sommeil: '#818cf8', humeur: '#fbbf24',
}
