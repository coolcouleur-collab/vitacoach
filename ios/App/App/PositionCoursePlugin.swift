import Foundation
import Capacitor
import CoreLocation

// ─────────────────────────────────────────────────────────────────────────────
// LA POSITION PENDANT UNE COURSE, SUR IPHONE
//
// Le pendant iOS de ce que fait CourseService.kt sur Android. Le JavaScript
// (src/useCourse.js) l'appelle sous le nom « PositionCourse » et attend :
//
//   demanderAutorisation()  → { accorde: bool }
//   demarrer()              → { demarre: bool, arrierePlan: bool }
//   arreter()
//   evenement « position »  → { lat, lon, t (ms), precision (m), vitesse (m/s) }
//
// Ce fichier n'existait pas : le JavaScript etait ecrit, le Swift jamais.
// Sur iPhone, chaque course tombait dans le catch et affichait « La position
// n'est pas disponible sur cet appareil » (constate le 6 septembre 2026).
//
// Ecran verrouille : iOS continue de livrer la position a une app qui l'a
// demandee au premier plan, a condition que « location » figure dans
// UIBackgroundModes et que allowsBackgroundLocationUpdates soit vrai. Il n'y
// a donc pas besoin de l'autorisation « toujours » pour une sortie lancee a
// la main ; l'autorisation « pendant l'utilisation » suffit. Le bandeau bleu
// du systeme signale a l'utilisateur que la position est lue.
//
// Ce greffon ne calcule rien : la distance se fait cote JavaScript, dans
// evaluerPoint, le seul endroit ou elle doit vivre.
// ─────────────────────────────────────────────────────────────────────────────

@objc(PositionCoursePlugin)
public class PositionCoursePlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "PositionCoursePlugin"
    public let jsName = "PositionCourse"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "demanderAutorisation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "demarrer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "arreter", returnType: CAPPluginReturnPromise),
    ]

    private var gestionnaire: CLLocationManager?
    private var appelAutorisation: CAPPluginCall?
    private var enCours = false

    /// « location » est-il declare dans UIBackgroundModes ? Activer
    /// allowsBackgroundLocationUpdates sans cette declaration fait planter
    /// l'application, d'ou le controle.
    private var arrierePlanDeclare: Bool {
        let modes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
        return modes?.contains("location") ?? false
    }

    private func gestionnaireOuCree() -> CLLocationManager {
        if let g = gestionnaire { return g }
        let g = CLLocationManager()
        g.delegate = self
        g.desiredAccuracy = kCLLocationAccuracyBest
        // Aucun filtre de distance : le JavaScript decide lui-meme quels
        // points comptent, avec un seuil qui suit la precision annoncee.
        g.distanceFilter = kCLDistanceFilterNone
        g.activityType = .fitness
        // iOS met en pause la position quand il croit l'utilisateur immobile,
        // et ne la reprend pas tout seul : une pause a un feu rouge
        // arreterait la mesure pour le reste de la sortie.
        g.pausesLocationUpdatesAutomatically = false
        gestionnaire = g
        return g
    }

    private func statut(_ g: CLLocationManager) -> CLAuthorizationStatus {
        g.authorizationStatus   // iOS 14 et plus, le projet vise iOS 15
    }

    private func accorde(_ s: CLAuthorizationStatus) -> Bool {
        s == .authorizedAlways || s == .authorizedWhenInUse
    }

    // MARK: - Methodes exposees au JavaScript

    @objc func demanderAutorisation(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let g = self.gestionnaireOuCree()
            let s = self.statut(g)
            if s == .notDetermined {
                // La reponse arrive par le delegue, une fois la fenetre fermee.
                self.appelAutorisation = call
                g.requestWhenInUseAuthorization()
            } else {
                call.resolve(["accorde": self.accorde(s)])
            }
        }
    }

    @objc func demarrer(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let g = self.gestionnaireOuCree()
            guard self.accorde(self.statut(g)) else {
                call.resolve(["demarre": false, "arrierePlan": false])
                return
            }
            let fond = self.arrierePlanDeclare
            if fond {
                g.allowsBackgroundLocationUpdates = true
                g.showsBackgroundLocationIndicator = true
            }
            self.enCours = true
            g.startUpdatingLocation()
            call.resolve(["demarre": true, "arrierePlan": fond])
        }
    }

    @objc func arreter(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.enCours = false
            self.gestionnaire?.stopUpdatingLocation()
            self.gestionnaire?.allowsBackgroundLocationUpdates = false
            call.resolve()
        }
    }

    // MARK: - CLLocationManagerDelegate

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        repondreAutorisation(manager.authorizationStatus)
    }

    private func repondreAutorisation(_ s: CLAuthorizationStatus) {
        // Appele aussi a la creation du gestionnaire, avec « non determine » :
        // ce n'est pas encore une reponse.
        guard s != .notDetermined, let call = appelAutorisation else { return }
        appelAutorisation = nil
        call.resolve(["accorde": accorde(s)])
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard enCours else { return }
        for l in locations {
            notifyListeners("position", data: [
                "lat": l.coordinate.latitude,
                "lon": l.coordinate.longitude,
                "t": l.timestamp.timeIntervalSince1970 * 1000,
                "precision": l.horizontalAccuracy,
                // Negative quand iOS ne sait pas : le JavaScript l'ignore alors.
                "vitesse": l.speed,
            ])
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Une perte de signal passagere n'est pas une erreur a montrer : le
        // JavaScript n'affiche que le refus, et la position revient d'elle-meme.
        CAPLog.print("PositionCourse: \(error.localizedDescription)")
    }
}
