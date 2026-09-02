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

// ── Error boundary global, affiche l'erreur au lieu de page blanche
class RootBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14, background: '#fff1f0', minHeight: '100vh' }}>
          <h2 style={{ color: '#c00', marginBottom: 16 }}>Erreur React</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#900' }}>{String(this.state.error)}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#555', marginTop: 12, fontSize: 12 }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
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
