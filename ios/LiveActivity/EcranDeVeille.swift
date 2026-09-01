import Foundation
import Capacitor
import ActivityKit

// ─────────────────────────────────────────────────────────────────────────────
// LE PONT VERS LA LIVE ACTIVITY
//
// Ce fichier appartient à l'APPLICATION, pas à l'extension. Il expose au
// JavaScript les mêmes trois méthodes que le pont Android, avec les mêmes noms
// et les mêmes réponses : `disponible`, `demarrer`, `mettreAJour`, `arreter`.
// C'est ce qui permet à ecranVeille.js de ne pas savoir sur quelle plateforme
// il tourne.
//
// À copier dans ios/App/App/ au moment d'ajouter la cible dans Xcode. Il vit
// ici pour l'instant parce qu'il forme un tout avec les deux autres fichiers,
// et parce qu'aucun d'eux n'a encore été compilé.
//
// Deux choses que le système impose et qui ne se devinent pas :
//
//   · les Live Activities peuvent être DÉSACTIVÉES par l'utilisateur dans les
//     réglages, à tout moment. `areActivitiesEnabled` doit donc être relu à
//     chaque démarrage, jamais retenu.
//   · une activité s'arrête toute seule au bout de huit heures, et le système
//     la retire de l'écran verrouillé au bout de douze. Personne ne court
//     douze heures, mais une activité oubliée après un abandon, si.
// ─────────────────────────────────────────────────────────────────────────────

@objc(EcranDeVeille)
public class EcranDeVeille: CAPPlugin {

    private var activite: Any?

    @objc func disponible(_ call: CAPPluginCall) {
        if #available(iOS 16.1, *) {
            call.resolve(["disponible": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["disponible": false])
        }
    }

    @objc func demarrer(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *),
              ActivityAuthorizationInfo().areActivitiesEnabled else {
            // On resout au lieu de rejeter : la course doit pouvoir se
            // derouler entierement sans ecran de veille.
            call.resolve(["demarre": false])
            return
        }

        let titre = call.getString("titre") ?? "Course en cours"
        let etat = SolennActiviteAttributes.ContentState(
            duree: call.getString("texte") ?? "00:00",
            distance: "",
            allure: nil
        )

        do {
            let a = try Activity<SolennActiviteAttributes>.request(
                attributes: SolennActiviteAttributes(titre: titre),
                content: .init(state: etat, staleDate: nil),
                pushType: nil
            )
            self.activite = a
            call.resolve(["demarre": true])
        } catch {
            call.resolve(["demarre": false])
        }
    }

    @objc func mettreAJour(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *),
              let a = self.activite as? Activity<SolennActiviteAttributes> else {
            call.resolve()
            return
        }

        let etat = SolennActiviteAttributes.ContentState(
            duree: call.getString("titre") ?? "",
            distance: call.getString("texte") ?? "",
            allure: call.getString("allure")
        )

        Task {
            await a.update(.init(state: etat, staleDate: nil))
            call.resolve()
        }
    }

    @objc func arreter(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *),
              let a = self.activite as? Activity<SolennActiviteAttributes> else {
            call.resolve()
            return
        }
        Task {
            // `.immediate` et non `.default` : sans ca, l'activite reste
            // affichee sur l'ecran verrouille jusqu'a quatre heures apres la
            // fin de la course, ce qui donne l'impression qu'elle tourne
            // encore et vide la confiance dans le compteur.
            await a.end(nil, dismissalPolicy: .immediate)
            self.activite = nil
            call.resolve()
        }
    }
}
