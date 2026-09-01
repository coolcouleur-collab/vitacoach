import Foundation
import ActivityKit

// ─────────────────────────────────────────────────────────────────────────────
// CE QUE LA COURSE MONTRE SUR L'ÉCRAN VERROUILLÉ
//
// Ce fichier doit appartenir AUX DEUX cibles : l'application et l'extension.
// C'est le contrat entre les deux, et si une seule des deux le compile, elles
// ne parlent pas de la même chose et l'activité ne démarre jamais.
//
// La séparation entre `ContentState` et le reste n'est pas cosmétique :
// seul le `ContentState` peut changer pendant la vie de l'activité. Ce qui est
// posé en dehors est figé au démarrage.
// ─────────────────────────────────────────────────────────────────────────────

struct SolennActiviteAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// Le temps écoulé, déjà formaté par le JavaScript.
        /// Formaté côté app et non ici, pour que l'écran verrouillé et l'écran
        /// de l'app affichent exactement la même chose, au caractère près.
        var duree: String
        /// La distance, déjà formatée. Vide tant que le GPS cherche.
        var distance: String
        /// L'allure, déjà formatée, ou nil tant qu'elle n'a pas de sens.
        var allure: String?
    }

    /// Figé au démarrage : le nom de ce qu'on est en train de faire.
    var titre: String
}
