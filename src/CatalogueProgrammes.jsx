// ─────────────────────────────────────────────────────────────────────────────
// L'ÉCRAN DE CHOIX D'UN PROGRAMME
//
// Il remplace un bouton. Avant, l'écran vide de l'onglet Programme disait
// « Prêt à commencer ? » et proposait un seul bouton, qui fabriquait 21 jours
// sans qu'on sache ce qu'ils contiendraient ni ce qu'ils viseraient.
//
// Un programme se choisit sur ce qu'il promet. Cet écran montre donc d'abord
// les quatre promesses, puis, pour celle qui retient, ce qu'il faut savoir
// avant de s'engager : le mécanisme, le rythme réel, à qui il s'adresse, à qui
// il ne s'adresse PAS, et ce qu'on peut en attendre.
//
// La partie « ce n'est pas pour toi si » n'est pas de la prudence juridique.
// C'est ce qui rend le reste croyable : un programme qui prétend convenir à
// tout le monde ne convient à personne, et se faire dire non fait gagner plus
// de temps qu'un mauvais départ.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROGRAMMES, avisProgramme } from './programmes'
import { ENCRE, ICONE, ACCENT, AMBRE } from './palette'

const EASE = [0.22, 1, 0.36, 1]

const VERRE = {
  background: 'rgba(255,235,210,0.32)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,220,160,0.40)',
}

/** Le petit bandeau qui dit la durée, présent partout où un programme est nommé. */
function Duree({ jours }) {
  const semaines = Math.round(jours / 7)
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: AMBRE, whiteSpace: 'nowrap',
      background: 'rgba(200,123,82,0.12)', border: '1px solid rgba(200,123,82,0.22)',
      borderRadius: 999, padding: '3px 9px',
    }}>
      {jours} jours, {semaines} semaines
    </span>
  )
}

/** Une puce de liste. Le point est décoratif, il ne porte aucun texte. */
function Puce({ children, ton = 'neutre' }) {
  const couleur = ton === 'sortie' ? 'rgba(148,77,38,0.35)' : ACCENT
  return (
    <li style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 7 }}>
      <span aria-hidden="true" style={{
        width: 5, height: 5, borderRadius: 999, background: couleur,
        marginTop: 7, flexShrink: 0,
      }} />
      <span style={{ fontSize: 13, lineHeight: 1.55, color: ENCRE }}>{children}</span>
    </li>
  )
}

function Titre({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: AMBRE, marginBottom: 9, marginTop: 20,
    }}>
      {children}
    </div>
  )
}

// ─── LA FICHE D'UN PROGRAMME ─────────────────────────────────────────────────

function Fiche({ prog, profil, onCommencer, onRetour, creating, creatingLabel, error }) {
  const avis = avisProgramme(profil, prog)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{ ...VERRE, borderRadius: 22, padding: '20px 18px 18px' }}
    >
      <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 15, flexShrink: 0, fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(200,123,82,0.12)', border: '1px solid rgba(200,123,82,0.20)',
        }}>
          {prog.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontSize: 19, fontWeight: 700, color: ENCRE, margin: 0, lineHeight: 1.25,
            fontFamily: "'Poppins', sans-serif",
          }}>
            {prog.titre}
          </h2>
          <div style={{ marginTop: 7 }}><Duree jours={prog.duree} /></div>
        </div>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: ENCRE, marginTop: 16, marginBottom: 0 }}>
        {prog.accroche}
      </p>

      <Titre>Pourquoi ça marche</Titre>
      <p style={{ fontSize: 13, lineHeight: 1.65, color: ENCRE, margin: 0 }}>{prog.pourquoi}</p>

      <Titre>Le rythme</Titre>
      <p style={{ fontSize: 13, lineHeight: 1.65, color: ENCRE, margin: 0 }}>{prog.rythme}</p>

      <Titre>C'est pour toi si</Titre>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {prog.pourQui.map((t, i) => <Puce key={i}>{t}</Puce>)}
      </ul>

      <Titre>Ce n'est pas le bon moment si</Titre>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {prog.pasPourToi.map((t, i) => <Puce key={i} ton="sortie">{t}</Puce>)}
      </ul>

      <Titre>Ce que tu peux en attendre</Titre>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {prog.resultats.map((t, i) => <Puce key={i}>{t}</Puce>)}
      </ul>
      <p style={{ fontSize: 11.5, lineHeight: 1.55, color: ENCRE, opacity: 0.75, marginTop: 10, marginBottom: 0 }}>
        Ces effets supposent que tu t'y tiennes. Ils varient d'une personne à l'autre,
        et ce programme ne remplace pas un avis médical.
      </p>

      {/* L'avis de santé vient du croisement avec les situations déclarées à
          l'inscription. Il ne bloque pas le bouton : c'est une information,
          pas un verrou, et Solenn n'est pas un dispositif médical. */}
      {avis && (
        <div style={{
          marginTop: 18, borderRadius: 16, padding: '12px 14px',
          background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.20)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', marginBottom: 4 }}>
            À vérifier avant de commencer
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: ENCRE }}>{avis.phrase}</div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 16, borderRadius: 14, padding: '11px 13px',
          background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.20)',
          fontSize: 12.5, lineHeight: 1.5, color: ENCRE,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          onClick={onRetour}
          disabled={creating}
          style={{
            padding: '13px 16px', borderRadius: 15, cursor: creating ? 'not-allowed' : 'pointer',
            background: 'transparent', border: '1px solid rgba(200,123,82,0.30)',
            color: ENCRE, fontSize: 13.5, fontWeight: 600, fontFamily: "'Poppins', sans-serif",
          }}
        >
          Retour
        </button>
        <motion.button
          whileTap={creating ? undefined : { scale: 0.98 }}
          onClick={() => onCommencer(prog)}
          disabled={creating}
          style={{
            flex: 1, padding: '13px 16px', borderRadius: 15,
            cursor: creating ? 'not-allowed' : 'pointer',
            background: 'transparent', border: `1.5px solid ${ICONE}`,
            color: ENCRE, fontSize: 14, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
            opacity: creating ? 0.6 : 1,
          }}
        >
          {creating ? (creatingLabel || 'Solenn construit ton programme…') : 'Commencer ce programme'}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── LA VIGNETTE DANS LA LISTE ───────────────────────────────────────────────

function Vignette({ prog, index, onOuvrir }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: EASE }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onOuvrir(prog)}
      style={{
        ...VERRE, borderRadius: 20, padding: '15px 16px', width: '100%',
        display: 'flex', gap: 13, alignItems: 'center', textAlign: 'left',
        cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0, fontSize: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(200,123,82,0.12)', border: '1px solid rgba(200,123,82,0.20)',
      }}>
        {prog.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Titre et duree sur deux lignes SEPAREES. Sur une seule ligne avec
            retour automatique, la pastille remontait a cote des titres courts
            et passait dessous les titres longs : les quatre vignettes ne
            s'alignaient plus entre elles. */}
        <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, marginBottom: 6 }}>
          {prog.titre}
        </div>
        <div style={{ marginBottom: 6 }}><Duree jours={prog.duree} /></div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: ENCRE }}>{prog.accroche}</div>
      </div>
    </motion.button>
  )
}

// ─── L'ÉCRAN ─────────────────────────────────────────────────────────────────

/**
 * @param {object}   profil      pour croiser les situations de santé déclarées
 * @param {function} onCommencer reçoit le programme choisi, lance la génération
 * @param {boolean}  creating    la génération est en cours
 * @param {string}   error       message d'échec à afficher dans la fiche
 * @param {function} onAnnuler   optionnel, quand l'écran sert à CHANGER de
 *                               programme alors qu'un autre tourne déjà
 */
export default function CatalogueProgrammes({
  profil, onCommencer, creating = false, creatingLabel = null, error = null, onAnnuler = null,
}) {
  const [ouvert, setOuvert] = useState(null)

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <AnimatePresence mode="wait">
        {ouvert ? (
          <Fiche
            key={ouvert.id}
            prog={ouvert}
            profil={profil}
            creating={creating}
            creatingLabel={creatingLabel}
            error={error}
            onCommencer={onCommencer}
            onRetour={() => setOuvert(null)}
          />
        ) : (
          <motion.div
            key="liste"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h2 style={{
              fontSize: 20, fontWeight: 700, color: ENCRE, margin: '0 0 6px',
              lineHeight: 1.3,
            }}>
              Choisis ton programme
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: ENCRE, margin: '0 0 18px' }}>
              Quatre chemins, quatre objectifs. Solenn construira le tien à partir de
              ton profil. Tu pourras en changer quand tu veux.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {PROGRAMMES.map((p, i) => (
                <Vignette key={p.id} prog={p} index={i} onOuvrir={setOuvert} />
              ))}
            </div>

            {onAnnuler && (
              <button
                onClick={onAnnuler}
                style={{
                  width: '100%', marginTop: 16, padding: '12px 16px', borderRadius: 15,
                  background: 'transparent', border: '1px solid rgba(200,123,82,0.30)',
                  color: ENCRE, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Garder mon programme en cours
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
