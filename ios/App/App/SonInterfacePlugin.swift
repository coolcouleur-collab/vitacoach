import Foundation
import Capacitor
import AVFoundation

// ─────────────────────────────────────────────────────────────────────────────
// LES SONS D'INTERFACE, JOUES PAR iOS ET NON PAR LA WEBVIEW
//
// src/sfx.js synthetise les sons en Web Audio. Sur iPhone, WebKit classe cet
// audio comme de la musique (categorie « playback ») : le petit son au
// toucher continuait de jouer telephone en mode silencieux, ce qu'Apple
// n'attend pas d'un son d'interface (constat de Jean, 6 septembre 2026).
//
// Les memes sons, rendus une fois pour toutes avec la meme synthese, vivent
// dans le dossier Sons/ et sont joues ici en categorie « ambient », celle qui
// respecte le mode silencieux et se mele a ce qui joue deja. sfx.js appelle
// ce greffon quand l'app tourne en natif sur iOS, et garde Web Audio partout
// ailleurs.
// ─────────────────────────────────────────────────────────────────────────────

@objc(SonInterfacePlugin)
public class SonInterfacePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SonInterfacePlugin"
    public let jsName = "SonInterface"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "jouer", returnType: CAPPluginReturnPromise),
    ]

    private var lecteurs: [String: AVAudioPlayer] = [:]
    private let noms: Set<String> = ["tap", "success", "hover", "back", "transition"]

    private func lecteur(_ nom: String) -> AVAudioPlayer? {
        if let l = lecteurs[nom] { return l }
        guard let url = Bundle.main.url(forResource: nom, withExtension: "wav", subdirectory: "Sons")
            ?? Bundle.main.url(forResource: nom, withExtension: "wav") else { return nil }
        guard let l = try? AVAudioPlayer(contentsOf: url) else { return nil }
        l.prepareToPlay()
        lecteurs[nom] = l
        return l
    }

    @objc func jouer(_ call: CAPPluginCall) {
        let nom = call.getString("nom") ?? "tap"
        let cle = nom == "click" ? "tap" : nom
        guard noms.contains(cle) else { call.resolve(); return }
        DispatchQueue.main.async {
            let session = AVAudioSession.sharedInstance()
            // Ambient : se tait en mode silencieux, ne coupe pas la musique
            // d'une autre app. On ne touche pas a la session pendant qu'un
            // autre son joue, pour ne pas l'interrompre.
            if session.category != .ambient && !session.isOtherAudioPlaying {
                try? session.setCategory(.ambient, options: [.mixWithOthers])
            }
            try? session.setActive(true, options: [])
            if let l = self.lecteur(cle) {
                l.currentTime = 0
                l.play()
            }
            call.resolve()
        }
    }
}
