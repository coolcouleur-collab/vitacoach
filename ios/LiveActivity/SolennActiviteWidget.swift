import SwiftUI
import WidgetKit
import ActivityKit

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉCRAN VERROUILLÉ ET L'ÎLOT DYNAMIQUE
//
// Ce fichier appartient UNIQUEMENT à l'extension, jamais à l'application.
//
// Trois présentations, exigées par le système, et il faut les fournir toutes
// les trois même si l'appareil n'en montrera qu'une :
//
//   · l'écran verrouillé, la grande, celle que Jean a décrite
//   · l'îlot dynamique déplié, quand on appuie longuement dessus
//   · l'îlot dynamique replié, la pastille minuscule à côté de la caméra
//
// Les couleurs sont écrites en dur ici, et c'est voulu : une extension ne
// partage ni le CSS ni les jetons de l'application. Ce sont les valeurs de
// palette.js, recopiées, et elles doivent le rester.
//   crème  #FFF6E8    encre #944D26    icône #AF5B2D    ambre #8A5206
// ─────────────────────────────────────────────────────────────────────────────

private let creme = Color(red: 1.0,   green: 0.965, blue: 0.910)
private let encre = Color(red: 0.580, green: 0.302, blue: 0.149)
private let ambre = Color(red: 0.541, green: 0.322, blue: 0.024)

struct SolennActiviteWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SolennActiviteAttributes.self) { contexte in

            // ── L'écran verrouillé ──────────────────────────────────────────
            VStack(alignment: .leading, spacing: 10) {
                Text(contexte.attributes.titre.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .kerning(1.0)
                    .foregroundColor(ambre)

                HStack(alignment: .firstTextBaseline, spacing: 18) {
                    Duree(debut: contexte.state.debut, figee: contexte.state.dureeFigee)
                    if !contexte.state.distance.isEmpty {
                        Chiffre(valeur: contexte.state.distance, libelle: "Distance")
                    }
                    if let allure = contexte.state.allure {
                        Chiffre(valeur: allure, libelle: "Allure / km")
                    }
                    Spacer(minLength: 0)
                }
            }
            .padding(16)
            .activityBackgroundTint(creme)
            .activitySystemActionForegroundColor(encre)

        } dynamicIsland: { contexte in
            DynamicIsland {
                // ── L'îlot déplié ───────────────────────────────────────────
                DynamicIslandExpandedRegion(.leading) {
                    Duree(debut: contexte.state.debut, figee: contexte.state.dureeFigee)
                        .padding(.leading, 6)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if !contexte.state.distance.isEmpty {
                        Chiffre(valeur: contexte.state.distance, libelle: "Distance")
                            .padding(.trailing, 6)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let allure = contexte.state.allure {
                        Text("Allure \(allure) / km")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(ambre)
                    }
                }
            } compactLeading: {
                Image(systemName: "figure.run").foregroundColor(encre)
            } compactTrailing: {
                // La pastille est minuscule : le temps seul, et rien d'autre.
                if let debut = contexte.state.debut {
                    Text(timerInterval: debut...Date.distantFuture, countsDown: false)
                        .font(.system(size: 13, weight: .semibold))
                        .monospacedDigit()
                        .foregroundColor(encre)
                        .frame(maxWidth: 52)
                } else {
                    Text(contexte.state.dureeFigee)
                        .font(.system(size: 13, weight: .semibold))
                        .monospacedDigit()
                        .foregroundColor(encre)
                }
            } minimal: {
                Image(systemName: "figure.run").foregroundColor(encre)
            }
        }
    }
}

/// Un chiffre et sa légende, le même motif que dans CourseActive.jsx.
private struct Chiffre: View {
    let valeur: String
    let libelle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(valeur)
                .font(.system(size: 26, weight: .bold))
                // Sans chiffres à largeur fixe, tout le bloc sautille à chaque
                // seconde, parce que le 1 est plus étroit que le 8.
                .monospacedDigit()
                .foregroundColor(encre)
            Legende(libelle)
        }
    }
}

/// Le temps, compté par le système et non par nous.
///
/// `Text(timerInterval:)` s'actualise tout seul sur l'écran verrouillé, sans
/// que l'application soit réveillée. C'est ce qui empêche le compteur de se
/// figer pendant que le téléphone dort, et c'est pour ça que le `ContentState`
/// transporte un instant de départ plutôt qu'un texte.
///
/// À la pause, il n'y a plus d'instant de départ : un compteur système ne sait
/// pas s'interrompre, alors on affiche le temps figé que l'application a
/// calculé.
private struct Duree: View {
    let debut: Date?
    let figee: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let debut {
                Text(timerInterval: debut...Date.distantFuture, countsDown: false)
                    .font(.system(size: 26, weight: .bold))
                    .monospacedDigit()
                    .foregroundColor(encre)
                    // Sans largeur fixe, la vue se redimensionne au passage de
                    // 9:59 a 10:00 et fait sauter tout ce qui est a cote.
                    .frame(maxWidth: 92, alignment: .leading)
            } else {
                Text(figee)
                    .font(.system(size: 26, weight: .bold))
                    .monospacedDigit()
                    .foregroundColor(encre)
                    .frame(maxWidth: 92, alignment: .leading)
            }
            Legende(debut == nil ? "En pause" : "Durée")
        }
    }
}

private struct Legende: View {
    let texte: String
    init(_ texte: String) { self.texte = texte }

    var body: some View {
        Text(texte.uppercased())
            .font(.system(size: 9, weight: .semibold))
            .kerning(0.8)
            .foregroundColor(ambre)
    }
}

@main
struct SolennActiviteBundle: WidgetBundle {
    var body: some Widget {
        SolennActiviteWidget()
    }
}
