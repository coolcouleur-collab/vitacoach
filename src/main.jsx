import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import Lenis from 'lenis'
import App from './App'
import BusinessLanding from './BusinessLanding'
import Confidentialite from './Confidentialite'
import './tokens.css'
// Apres tokens.css : il porte les valeurs des jetons de palette.js, et doit
// pouvoir les redefinir.
import './theme.css'

// ── Filet global ───────────────────────────────────────────────────────────
// Ce qui remplace la page rouge « Erreur React ».
//
// Vite nomme ses fichiers d'apres l'empreinte de leur contenu. Une app restee
// ouverte pendant un deploiement garde l'ancien index.html et reclame des
// fichiers qui n'existent plus. ecran() dans App.jsx rattrape le cas ou l'import
// echoue ; il ne rattrape pas celui ou le module se charge mais casse au rendu.
// C'est ce cas-la qui affichait la pile d'appels en rouge, et il se produit chez
// tout le monde a chaque mise a jour, pas seulement chez nous.
//
// Donc : un rechargement, une seule fois. La page recupere le nouvel index.html
// et les bons noms, et la personne ne voit qu'un clignotement. Le garde-fou de
// soixante secondes evite la boucle si la panne vient d'ailleurs : la deuxieme
// erreur dans la meme minute n'est plus un deploiement, c'est un vrai bug, et
// on affiche alors un ecran qui ressemble a Solenn plutot qu'a un plantage.
const CLE_RECHARGE_RENDU = 'solenn_recharge_rendu'

class RootBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }

  componentDidCatch(error) {
    try {
      const dernier = Number(sessionStorage.getItem(CLE_RECHARGE_RENDU) || 0)
      if (Date.now() - dernier > 60000) {
        sessionStorage.setItem(CLE_RECHARGE_RENDU, String(Date.now()))
        window.location.reload()
        return
      }
    } catch (_) {
      // sessionStorage indisponible : on prefere l'ecran calme au risque de boucle.
    }
    // Deuxieme erreur rapprochee : on garde le detail sous la main pour le
    // rapport de bug, sans le montrer.
    try { console.error('[Solenn] rendu interrompu', error) } catch (_) {}
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 18, padding: '40px 28px', textAlign: 'center',
        background: 'var(--fond, #EDD8CC)',
        color: 'var(--encre, #944D26)',
        fontFamily: 'Poppins, system-ui, sans-serif',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, var(--halo-1, #EDB16D), var(--halo-3, #EDCBB8))',
          boxShadow: '0 8px 30px rgba(var(--rgb-terracotta, 200 123 82), 0.28)',
        }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
          Solenn a besoin de reprendre son souffle
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: 340, opacity: 0.85 }}>
          Un incident a interrompu l'affichage. Rien de ce que tu as enregistre
          n'est perdu.
        </p>
        <button
          onClick={() => { try { sessionStorage.removeItem(CLE_RECHARGE_RENDU) } catch (_) {} window.location.reload() }}
          style={{
            marginTop: 6, padding: '13px 30px', borderRadius: 14, border: 'none',
            background: 'var(--encre, #944D26)', color: 'var(--fond-haut, #FFF6E8)',
            fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          Recharger
        </button>
        <details style={{ marginTop: 10, fontSize: 11, opacity: 0.5, maxWidth: 340 }}>
          <summary style={{ cursor: 'pointer' }}>Detail technique</summary>
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: 8, fontSize: 10 }}>
            {String(this.state.error)}
          </pre>
        </details>
      </div>
    )
  }
}

// Smooth scroll (Lenis), UNIQUEMENT pour la landing publique. Dans l'app
// connectée, html.lenis { height:auto } casse la chaîne height:100% →
// le layout à scroll interne ne fonctionne plus et le bas des pages est
// coupé sur mobile (bug Respiration, 2026-07-24). Lenis avait déjà causé
// le bug de scroll de la sidebar le 21/07.
const hasSession = (() => { try { return !!localStorage.getItem('vitacoach_user') } catch { return false } })()
if (!hasSession) {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
  window.__solennLenis = lenis
  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)
}

// Routing minimal. Tout chemin non reconnu retombe sur App : c'est voulu pour
// une application d'une seule page, mais ca cache les fautes de frappe dans les
// URL. C'est ainsi que le champ « URL de suppression de compte » de Play Console
// pointait vers /privacy, une route inexistante : Google y voyait l'ecran
// d'accueil de l'app au lieu d'une page de suppression. Motif de rejet certain
// (releve le 2026-08-30).
// /privacy et /suppression sont donc acceptes comme synonymes, pour qu'un lien
// deja depose quelque part ne tombe jamais dans le vide.
const chemin     = window.location.pathname
const isBusiness = chemin.startsWith('/business')
const isPrivacy  = chemin.startsWith('/confidentialite') || chemin.startsWith('/privacy')
const isSuppr    = chemin.startsWith('/suppression') || chemin.startsWith('/delete-account')
const isAdmin    = chemin.startsWith('/admin')

const AdminRetention = React.lazy(() => import('./AdminRetention'))
const SuppressionCompte = React.lazy(() => import('./SuppressionCompte'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootBoundary>
      {isAdmin
        ? <React.Suspense fallback={null}><AdminRetention /></React.Suspense>
        : isSuppr ? <React.Suspense fallback={null}><SuppressionCompte /></React.Suspense>
        : isPrivacy ? <Confidentialite /> : isBusiness ? <BusinessLanding /> : <App />}
    </RootBoundary>
  </React.StrictMode>
)
