import Foundation
import Capacitor
import CoreLocation

// ─────────────────────────────────────────────────────────────────────────────
// LA POSITION QUI CONTINUE ÉCRAN VERROUILLÉ, CÔTÉ IPHONE
//
// Ce fichier appartient à l'APPLICATION. À copier dans ios/App/App/.
//
// Pourquoi il existe alors que @capacitor/geolocation est déjà installé :
//
// Le plugin officiel fait très bien son travail au premier plan, et rien du
// tout dès que l'écran se verrouille. Ce n'est pas un oubli de sa part, c'est
// qu'iOS demande une déclaration explicite pour continuer à localiser une
// application en arrière plan, et que ce plugin, généraliste, ne la fait pas :
// il servirait alors à afficher une carte, à remplir une adresse, et il
// consommerait la batterie de tout le monde pour le besoin de quelques uns.
//
// Trois réglages, et il faut les trois. Il en manque un, iOS coupe les relevés
// au verrouillage, en silence, sans erreur :
//
//   · `allowsBackgroundLocationUpdates`, la déclaration explicite
//   · `pausesLocationUpdatesAutomatically` à FAUX. Par défaut iOS met en pause
//     tout seul quand il croit que vous êtes arrêté, et il ne reprend pas
//     forcément : une pause à un feu rouge peut coûter la fin de la course.
//   · `activityType = .fitness`, qui dit au système le genre de mouvement
//     attendu, et sans quoi son filtrage jette des relevés de coureur.
//
// L'autorisation demandée est « toujours », et c'est la contrepartie honnête :
// iOS montrera une bannière bleue pendant la course, et reposera la question à
// l'utilisateur quelques jours plus tard. C'est voulu, et c'est bien.
// ─────────────────────────────────────────────────────────────────────────────

@objc(PositionCourse)
public class PositionCourse: CAPPlugin, CLLocationManagerDelegate {

    private let manager = CLLocationManager()
    private var demandeAutorisation: CAPPluginCall?
    private var enMarche = false

    public override func load() {
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.activityType = .fitness
        // Le filtre de distance est laissé à zéro : c'est useCourse.js qui
        // filtre, avec la vitesse et la précision, et il le fait mieux qu'un
        // seuil aveugle appliqué avant qu'on ait vu la donnée.
        manager.distanceFilter = kCLDistanceFilterNone
        manager.pausesLocationUpdatesAutomatically = false
    }

    @objc func demanderAutorisation(_ call: CAPPluginCall) {
        let etat = manager.authorizationStatus
        switch etat {
        case .authorizedAlways:
            call.resolve(["accorde": true, "arrierePlan": true])
        case .authorizedWhenInUse:
            // On a le premier plan, on demande la suite. iOS ne montrera la
            // fenêtre qu'une fois : refusée, elle ne revient plus.
            demandeAutorisation = call
            bridge?.saveCall(call)
            manager.requestAlwaysAuthorization()
        case .notDetermined:
            demandeAutorisation = call
            bridge?.saveCall(call)
            manager.requestWhenInUseAuthorization()
        default:
            call.resolve(["accorde": false, "arrierePlan": false])
        }
    }

    @objc func demarrer(_ call: CAPPluginCall) {
        let etat = manager.authorizationStatus
        guard etat == .authorizedAlways || etat == .authorizedWhenInUse else {
            call.resolve(["demarre": false])
            return
        }

        // Seul « toujours » autorise l'arrière plan, et poser ce drapeau sans
        // l'autorisation fait lever une exception qui ferme l'application.
        if etat == .authorizedAlways {
            manager.allowsBackgroundLocationUpdates = true
        }

        manager.startUpdatingLocation()
        enMarche = true
        call.resolve([
            "demarre": true,
            "arrierePlan": etat == .authorizedAlways,
        ])
    }

    @objc func arreter(_ call: CAPPluginCall) {
        if enMarche {
            manager.stopUpdatingLocation()
            // Remis à faux en sortant : laissé à vrai, iOS garde le droit de
            // réveiller l'application et la batterie s'en ressent, longtemps
            // après que la course est finie.
            manager.allowsBackgroundLocationUpdates = false
            enMarche = false
        }
        call.resolve()
    }

    // ── Les relevés ──────────────────────────────────────────────────────────

    public func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        for p in locations {
            notifyListeners("position", data: [
                "lat": p.coordinate.latitude,
                "lon": p.coordinate.longitude,
                // horizontalAccuracy négative signifie « invalide », et le
                // JavaScript s'attend à une précision en mètres : on la
                // transmet telle quelle, il sait déjà écarter l'absurde.
                "precision": p.horizontalAccuracy,
                // speed vaut -1 quand elle est inconnue, ce qui est exactement
                // ce que le filtre attend pour dire « je ne sais pas ».
                "vitesse": p.speed,
                "t": p.timestamp.timeIntervalSince1970 * 1000.0,
            ])
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        notifyListeners("erreurPosition", data: ["message": error.localizedDescription])
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard let call = demandeAutorisation else { return }
        let etat = manager.authorizationStatus
        if etat == .notDetermined { return }   // la fenêtre est encore ouverte

        call.resolve([
            "accorde": etat == .authorizedAlways || etat == .authorizedWhenInUse,
            "arrierePlan": etat == .authorizedAlways,
        ])
        bridge?.releaseCall(call)
        demandeAutorisation = nil
    }
}
