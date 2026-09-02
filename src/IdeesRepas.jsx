// ─────────────────────────────────────────────────────────────────────────────
// LES IDÉES DE REPAS
//
// L'app savait commenter une photo de repas et proposer les repas du jour dans
// la routine. Elle ne répondait pas à la question qu'on se pose devant un
// frigo ouvert : « je fais quoi, moi, ce soir ? »
//
// Ce qui rend une idée utile ici n'est pas la recette. Des recettes, il y en a
// partout et gratuitement. C'est le POURQUOI : « celle-là parce que tes nuits
// sont courtes en ce moment et qu'elle est légère le soir ». C'est la seule
// chose que Solenn peut apporter, donc c'est ce qui est mis en avant, avant
// même les ingrédients.
//
// Les préférences alimentaires sont demandées ICI et non à l'inscription. Deux
// raisons : l'inscription fait déjà douze étapes, et surtout on les demande au
// moment où elles servent, ce qui est le seul moment où on comprend pourquoi
// on les donne.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ENCRE, ICONE, ACCENT, AMBRE } from './palette'
import { authHeaders } from './supabase'

const API = import.meta.env.VITE_API_URL || ''
const EASE = [0.22, 1, 0.36, 1]

const VERRE = {
  background: 'rgba(var(--rgb-verre), 0.32)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
}

/** Les mêmes clés que agents/recettes.js, et il faut qu'elles le restent. */
const REGIMES = [
  { id: 'aucun',       nom: 'Aucun' },
  { id: 'vegetarien',  nom: 'Végétarien' },
  { id: 'vegetalien',  nom: 'Végétalien' },
  { id: 'sansPorc',    nom: 'Sans porc' },
  { id: 'sansGluten',  nom: 'Sans gluten' },
  { id: 'sansLactose', nom: 'Sans lactose' },
]

const MOMENTS = [
  { id: 'petit-dejeuner', nom: 'Petit déjeuner' },
  { id: 'dejeuner',       nom: 'Déjeuner' },
  { id: 'diner',          nom: 'Dîner' },
]

/**
 * « 1er septembre » et non « 1 septembre ».
 * toLocaleDateString ne connait pas cette particularite du francais, et
 * l'oublier fait tout de suite traduction automatique.
 */
function formaterDate(iso) {
  const d = new Date(iso)
  const jour = d.getDate()
  const mois = d.toLocaleDateString('fr-FR', { month: 'long' })
  return `${jour === 1 ? '1er' : jour} ${mois}`
}

/** Le moment qu'on propose par défaut, d'après l'heure qu'il est. */
function momentProbable() {
  const h = new Date().getHours()
  if (h < 10) return 'petit-dejeuner'
  if (h < 15) return 'dejeuner'
  return 'diner'
}

// ─── UNE IDÉE ────────────────────────────────────────────────────────────────

function Recette({ r, index }) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: EASE }}
      style={{ ...VERRE, borderRadius: 18, padding: '14px 15px' }}
    >
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0, fontSize: 19,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(var(--rgb-terracotta), 0.12)', border: '1px solid rgba(var(--rgb-terracotta), 0.20)',
        }}>
          {r.emoji || '🍽️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: ENCRE, lineHeight: 1.3 }}>
            {r.titre}
          </div>
          {r.minutes > 0 && (
            <div style={{ fontSize: 11.5, color: AMBRE, fontWeight: 600, marginTop: 3 }}>
              {r.minutes} minutes
            </div>
          )}
        </div>
      </div>

      {/* Le pourquoi passe AVANT les ingredients. C'est lui qui decide si on
          fait ce plat ou non ; la liste des courses vient apres. */}
      <div style={{ fontSize: 13, lineHeight: 1.6, color: ENCRE, marginTop: 11 }}>
        {r.pourquoi}
      </div>

      <button
        onClick={() => setOuvert(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 0',
          fontSize: 12.5, fontWeight: 600, color: ENCRE, fontFamily: "'Poppins',sans-serif",
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}
      >
        {ouvert ? 'Masquer la recette' : 'Voir la recette'}
      </button>

      {ouvert && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: AMBRE, marginBottom: 7,
          }}>
            Il te faut
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {(r.ingredients || []).map((i, k) => (
              <li key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                <span aria-hidden="true" style={{
                  width: 4, height: 4, borderRadius: 999, background: ACCENT,
                  marginTop: 7, flexShrink: 0,
                }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: ENCRE }}>{i}</span>
              </li>
            ))}
          </ul>

          {(r.etapes || []).length > 0 && (
            <>
              <div style={{
                fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: AMBRE, margin: '14px 0 7px',
              }}>
                Comment faire
              </div>
              <ol style={{ margin: 0, paddingLeft: 17 }}>
                {r.etapes.map((e, k) => (
                  <li key={k} style={{ fontSize: 12.5, lineHeight: 1.55, color: ENCRE, marginBottom: 6 }}>
                    {e}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── LES PRÉFÉRENCES ─────────────────────────────────────────────────────────

function Preferences({ prefs, onEnregistrer, onFermer }) {
  const [regime, setRegime] = useState(prefs?.regime || 'aucun')
  const [evictions, setEvictions] = useState(prefs?.evictions || '')

  return (
    <div style={{ ...VERRE, borderRadius: 18, padding: '16px 15px', marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: ENCRE, marginBottom: 4 }}>
        Ce que tu ne manges pas
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: ENCRE, marginBottom: 14 }}>
        Solenn en tiendra compte à chaque idée. Tu peux revenir le changer
        quand tu veux.
      </div>

      <div style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: AMBRE, marginBottom: 8,
      }}>
        Régime
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {REGIMES.map(r => {
          const actif = r.id === regime
          return (
            <button
              key={r.id}
              onClick={() => setRegime(r.id)}
              style={{
                padding: '9px 13px', borderRadius: 999, cursor: 'pointer',
                background: actif ? 'rgba(var(--rgb-terracotta), 0.16)' : 'transparent',
                border: actif ? `1.5px solid ${ICONE}` : '1px solid rgba(var(--rgb-terracotta), 0.28)',
                color: ENCRE, fontSize: 12.5, fontWeight: actif ? 700 : 500,
                fontFamily: "'Poppins',sans-serif",
              }}
            >
              {r.nom}
            </button>
          )
        })}
      </div>

      <div style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: AMBRE, marginBottom: 8,
      }}>
        Allergies, et ce que tu n'aimes pas
      </div>
      <input
        value={evictions}
        onChange={e => setEvictions(e.target.value)}
        placeholder="arachides, coriandre, champignons"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 13,
          background: 'rgba(var(--rgb-surface-blanche), 0.35)', border: '1px solid rgba(var(--rgb-terracotta), 0.28)',
          color: ENCRE, fontSize: 13, fontFamily: "'Poppins',sans-serif", outline: 'none',
        }}
      />
      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: ENCRE, opacity: 0.8, marginTop: 7 }}>
        Sépare par des virgules. Une allergie ici est traitée comme une
        interdiction : Solenn refuse une idée plutôt que de la servir approximative.
      </div>

      <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
        <button
          onClick={onFermer}
          style={{
            padding: '12px 15px', borderRadius: 14, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(var(--rgb-terracotta), 0.30)',
            color: ENCRE, fontSize: 13, fontWeight: 600, fontFamily: "'Poppins',sans-serif",
          }}
        >
          Annuler
        </button>
        <button
          onClick={() => onEnregistrer({ regime, evictions })}
          style={{
            flex: 1, padding: '12px 15px', borderRadius: 14, cursor: 'pointer',
            background: 'transparent', border: `1.5px solid ${ICONE}`,
            color: ENCRE, fontSize: 13.5, fontWeight: 700, fontFamily: "'Poppins',sans-serif",
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  )
}

// ─── L'ÉCRAN ─────────────────────────────────────────────────────────────────

/**
 * @param {string}   userId
 * @param {object}   profil
 * @param {function} onProfilMaj  pour que le parent garde le profil à jour
 */
export default function IdeesRepas({ userId, profil, onProfilMaj }) {
  const [recettes, setRecettes] = useState(null)
  const [dateCache, setDateCache] = useState(null)
  const [duJour, setDuJour] = useState(false)
  const [moment, setMoment] = useState(momentProbable())
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [reglages, setReglages] = useState(false)

  const prefs = profil?.preferences_alimentaires || null

  // Le cache d'abord, sans rien generer : ouvrir l'onglet ne doit pas couter
  // un appel au modele ni vingt secondes d'attente pour des idees que
  // personne n'a demandees.
  useEffect(() => {
    if (!userId) return
    let vivant = true
    ;(async () => {
      try {
        const r = await fetch(`${API}/api/recettes?userId=${userId}`, {
          headers: await authHeaders(),
        })
        const d = await r.json()
        if (!vivant) return
        setRecettes(d.recettes || null)
        setDateCache(d.date || null)
        setDuJour(!!d.dujour)
      } catch {}
    })()
    return () => { vivant = false }
  }, [userId])   // eslint-disable-line react-hooks/exhaustive-deps

  const generer = useCallback(async () => {
    setChargement(true)
    setErreur(null)
    try {
      const r = await fetch(`${API}/api/recettes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId, moment }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || "Les idées n'ont pas abouti.")
      setRecettes(d.recettes || [])
      setDuJour(true)
      setDateCache(new Date().toISOString().split('T')[0])
    } catch (e) {
      setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }, [userId, moment])

  async function enregistrerPrefs(p) {
    setReglages(false)
    try {
      const m = await import('./supabase')
      const local = JSON.parse(localStorage.getItem('vitacoach_profil') || '{}')
      const maj = { ...local, ...profil, preferences_alimentaires: p }
      localStorage.setItem('vitacoach_profil', JSON.stringify(maj))
      await m.supabase.from('profils').upsert(
        { user_id: userId, profil: maj }, { onConflict: 'user_id' },
      )
      onProfilMaj?.(maj)
    } catch {}
  }

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif", marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, flex: 1 }}>
          Des idées de repas
        </div>
        <button
          onClick={() => setReglages(r => !r)}
          // Un lien souligne dans un bandeau de titre se lit comme une note
          // de bas de page. Or ce reglage conditionne TOUTES les propositions
          // qui suivent : ce qu'on exclut change chaque recette proposee. Il
          // prend donc la forme des autres commandes de la page.
          style={{
            background: 'rgba(var(--rgb-verre), 0.32)',
            border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
            borderRadius: 999, cursor: 'pointer', padding: '6px 12px',
            fontSize: 12, fontWeight: 600, color: ENCRE, fontFamily: "'Poppins',sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          {prefs ? 'Modifier mes exclusions' : 'Ce que je ne mange pas'}
        </button>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: ENCRE, marginBottom: 13 }}>
        Trois propositions construites pour toi, et qui te disent pourquoi elles
        te vont.
      </div>

      {reglages && (
        <Preferences
          prefs={prefs}
          onEnregistrer={enregistrerPrefs}
          onFermer={() => setReglages(false)}
        />
      )}

      <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
        {MOMENTS.map(m => {
          const actif = m.id === moment
          return (
            <button
              key={m.id}
              onClick={() => setMoment(m.id)}
              style={{
                flex: 1, padding: '9px 4px', borderRadius: 12, cursor: 'pointer',
                background: actif ? 'rgba(var(--rgb-terracotta), 0.16)' : 'transparent',
                border: actif ? `1.5px solid ${ICONE}` : '1px solid rgba(var(--rgb-terracotta), 0.26)',
                color: ENCRE, fontSize: 12, fontWeight: actif ? 700 : 500,
                fontFamily: "'Poppins',sans-serif",
              }}
            >
              {m.nom}
            </button>
          )
        })}
      </div>

      {erreur && (
        <div style={{
          borderRadius: 14, padding: '11px 13px', marginBottom: 12,
          background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.20)',
          fontSize: 12.5, lineHeight: 1.5, color: ENCRE,
        }}>
          {erreur}
        </div>
      )}

      {recettes?.length > 0 && (
        <>
          {/* Une idee d'hier vaut mieux qu'un ecran vide, mais il faut le
              dire : laisser croire que c'est d'aujourd'hui serait un petit
              mensonge, et ils s'accumulent. */}
          {!duJour && dateCache && (
            <div style={{ fontSize: 11.5, color: ENCRE, opacity: 0.75, marginBottom: 9 }}>
              Ces idées datent du {formaterDate(dateCache)}.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {recettes.map((r, i) => <Recette key={i} r={r} index={i} />)}
          </div>
        </>
      )}

      <motion.button
        whileTap={chargement ? undefined : { scale: 0.98 }}
        onClick={generer}
        disabled={chargement}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 16,
          cursor: chargement ? 'not-allowed' : 'pointer', opacity: chargement ? 0.65 : 1,
          background: 'transparent', border: `1.5px solid ${ICONE}`,
          color: ENCRE, fontSize: 13.5, fontWeight: 700, fontFamily: "'Poppins',sans-serif",
        }}
      >
        {chargement
          ? 'Solenn cherche des idées pour toi…'
          : recettes?.length ? "D'autres idées" : 'Trouve-moi des idées'}
      </motion.button>
    </div>
  )
}
