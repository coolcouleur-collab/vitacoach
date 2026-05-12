import React from 'react'
import ReactDOM from 'react-dom/client'
import Lenis from 'lenis'
import App from './App'
import './tokens.css'

// Smooth scroll global (Lenis)
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
