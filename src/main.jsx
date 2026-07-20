import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import Lenis from 'lenis'
import App from './App'
import BusinessLanding from './BusinessLanding'
import './tokens.css'

// ── Error boundary global — affiche l'erreur au lieu de page blanche
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

// Smooth scroll global (Lenis)
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Routing minimal — /business → BusinessLanding, tout le reste → App
const isBusiness = window.location.pathname.startsWith('/business')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootBoundary>
      {isBusiness ? <BusinessLanding /> : <App />}
    </RootBoundary>
  </React.StrictMode>
)
