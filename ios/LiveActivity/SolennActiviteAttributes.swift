import Foundation
import ActivityKit

// ─────────────────────────────────────────────────────────────────────────────
// CE QUE LA COURSE MONTRE SUR L'ÉCRAN VERROUILLÉ
//
// Ce fichier doit appartenir AUX DEUX cibles : l'application et l'extension.
// C'est le contrat entre les deux, et si une seule des deux le compile, elles
// ne parlent pas de la même chose et l'activité ne démarre jamais.
//
// Noter ce qui n'est PAS ici : le temps écoulé sous forme de texte.
//
// C'est délibéré, et c'est le même raisonnement que du côté Android. Une
// application suspendue ne peut pas rafraîchir sa Live Activity une fois par
// seconde : iOS ne la réveille pas pour ça, et le compteur se figerait sur
// l'écran verrouillé, c'est à dire exactement là où il doit vivre.
//
// On envoie donc un INSTANT DE DÉPART, et le système compte à partir de lui,
// tout seul, sans réveiller l'application. À la pause, on bascule sur un texte
// figé, parce qu'un compteur système ne sait pas s'interrompre ; à la reprise,
// on renvoie un nouvel instant de départ, maintenant moins le temps déjà
// écoulé.
//
// La séparation entre `ContentState` et le reste n'est pas cosmétique non
// plus : seul le `ContentState` peut changer pendant la vie de l'activité.
// ─────────────────────────────────────────────────────────────────────────────

struct SolennActiviteAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// L'instant d'où le système compte. Nil quand la course est en pause.
        var debut: Date?
        /// Le temps figé, affiché pendant la pause, déjà formaté par l'app.
        var dureeFigee: String
        /// La distance, déjà formatée. Vide tant que le GPS cherche.
        var distance: String
        /// L'allure, déjà formatée, ou nil tant qu'elle n'a pas de sens.
        var allure: String?
    }

    /// Figé au démarrage : le nom de ce qu'on est en train de faire.
    var titre: String
}
