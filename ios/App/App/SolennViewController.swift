import UIKit
import Capacitor

// Le controleur de la WebView, pour enregistrer les greffons ecrits dans ce
// projet et non installes par npm. Capacitor n'enregistre tout seul que les
// greffons listes dans capacitor.config.json, que `cap sync` regenere : un
// greffon maison doit etre declare ici. Main.storyboard pointe sur cette
// classe a la place de CAPBridgeViewController.
class SolennViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(PositionCoursePlugin())
        bridge?.registerPluginInstance(SonInterfacePlugin())
    }
}
