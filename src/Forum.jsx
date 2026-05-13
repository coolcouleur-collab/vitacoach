import React, { useState, useEffect, useRef } from 'react'
import './tokens.css'

// ─── Moderation ───────────────────────────────────────────────────────────────
const BANNED_WORDS = [
  // Violence
  'tuer','tuer','meurtre','assassin','bombe','arme','couteau','pistolet',
  'viol','violer','tabasser','frapper','menacer','massacre',
  // Insultes courantes
  'connard','connasse','enculé','enculer','fdp','fils de pute','pute','salope',
  'bâtard','batard','crétin','débile','idiot','imbécile','con','conne',
  'abruti','attardé','nique','niquer','merde','putain',
  // Contenu sexuel explicite
  'sexe','porn','pornographie','xxx','ejacul','masturbation','branlette',
  'fellation','cunnilingus','sodomie','cougar','milf','escort','prostituée',
  // Haine / discrimination
  'nigger','negro','juif de merde','arabe de merde','sale noir','sale arabe',
  'sale blanc','pédé','tapette','gouine','nazi','faggot',
]

const MAX_CHARS = 600
const MAX_TITLE = 120

function checkContent(text) {
  const lower = text.toLowerCase()
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) return { ok: false, word }
  }
  return { ok: true }
}

// ─── Fake persistent storage (localStorage) ──────────────────────────────────
function loadPosts() {
  try { return JSON.parse(localStorage.getItem('solenn_forum') || '[]') } catch { return [] }
}
function savePosts(posts) {
  localStorage.setItem('solenn_forum', JSON.stringify(posts))
}

const CATEGORIES = ['Général', 'Nutrition', 'Bien-être', 'Santé naturelle', 'Sport', 'Motivation', 'Question']

// ─── Time ago ─────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Reply form ───────────────────────────────────────────────────────────────
function ReplyForm({ onSubmit, authorName }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_CHARS) { setError(`Maximum ${MAX_CHARS} caractères.`); return }
    const check = checkContent(trimmed)
    if (!check.ok) { setError(`Ce message contient un mot interdit. Merci de respecter le règlement.`); return }
    onSubmit(trimmed)
    setText('')
    setError('')
  }

  return (
    <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-soft)' }}>
      <div style={{ position: 'relative' }}>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError('') }}
          placeholder="Écris ta réponse..."
          maxLength={MAX_CHARS + 1}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '1.2rem 1.4rem', borderRadius: '1.6rem',
            border: `1.5px solid ${error ? 'var(--accent-red)' : 'var(--border)'}`,
            background: '#fafafa', resize: 'vertical', outline: 'none',
            fontFamily: 'var(--font)', fontSize: 'var(--p3)', color: 'var(--text-body)', lineHeight: 1.6,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.6rem' }}>
          <span style={{ fontSize: 'max(1.1rem,11px)', color: text.length > MAX_CHARS ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {text.length}/{MAX_CHARS}
          </span>
          <button
            onClick={submit}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'rgba(0,0,0,.07)',
              color: text.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 'var(--br)',
              padding: '.7rem 2rem', fontSize: 'var(--p3)', fontWeight: 700,
              cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'var(--font)',
              boxShadow: text.trim() ? '0 4px 14px rgba(139,92,246,.3)' : 'none',
              transition: 'all .2s var(--ease)',
            }}
          >
            Répondre
          </button>
        </div>
        {error && <div style={{ fontSize: 'max(1.2rem,12px)', color: 'var(--accent-red)', marginTop: '.4rem' }}>{error}</div>}
      </div>
    </div>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, onReply, onLike, authorName }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--br)',
      padding: '2.4rem 2.8rem',
      border: '1.5px solid var(--border-soft)',
      boxShadow: '0 4px 24px rgba(0,0,0,.04)',
      transition: 'box-shadow var(--t-micro) var(--ease)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start', marginBottom: '1.6rem' }}>
        <Avatar name={post.author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--p3)', color: 'var(--text-strong)' }}>{post.author}</span>
            <span style={{
              fontSize: 'max(1rem,10px)', fontWeight: 700, color: 'var(--accent-green)',
              background: '#0F42230F', padding: '.2rem .8rem', borderRadius: 'var(--br)',
              border: '1px solid #0F422320',
            }}>
              {post.category}
            </span>
            <span style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</span>
          </div>
          <h3 style={{ fontSize: 'max(1.5rem,15px)', fontWeight: 800, color: 'var(--text-strong)', marginTop: '.4rem', lineHeight: 1.3 }}>
            {post.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <p style={{ fontSize: 'var(--p3)', color: 'var(--text-body)', lineHeight: 1.75, marginBottom: '1.6rem' }}>
        {post.body}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
        <button onClick={() => onLike(post.id)} style={btnStyle}>
          <span style={{ fontSize: '1.4rem' }}>♥</span>
          <span style={{ fontSize: 'var(--p3)', fontWeight: 600, color: post.likedBy?.includes(authorName) ? 'var(--accent)' : 'var(--text-muted)' }}>
            {post.likes || 0}
          </span>
        </button>
        <button onClick={() => setOpen(o => !o)} style={btnStyle}>
          <span style={{ fontSize: '1.4rem' }}>💬</span>
          <span style={{ fontSize: 'var(--p3)', fontWeight: 600, color: 'var(--text-muted)' }}>
            {post.replies?.length || 0} réponse{post.replies?.length !== 1 ? 's' : ''}
          </span>
        </button>
      </div>

      {/* Replies */}
      {open && (
        <div style={{ marginTop: '1.6rem' }}>
          {post.replies?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.6rem' }}>
              {post.replies.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '1rem', padding: '1.2rem 1.6rem',
                  background: 'rgba(0,0,0,.025)', borderRadius: '2rem',
                  border: '1px solid var(--border-soft)',
                }}>
                  <Avatar name={r.author} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginBottom: '.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: 'max(1.2rem,12px)', color: 'var(--text-strong)' }}>{r.author}</span>
                      <span style={{ fontSize: 'max(1rem,10px)', color: 'var(--text-muted)' }}>{timeAgo(r.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 'var(--p3)', color: 'var(--text-body)', lineHeight: 1.65 }}>{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ReplyForm onSubmit={body => onReply(post.id, body)} authorName={authorName} />
        </div>
      )}
    </div>
  )
}

const btnStyle = {
  display: 'flex', alignItems: 'center', gap: '.5rem',
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font)', padding: '.4rem .8rem',
  borderRadius: '2rem', transition: 'background var(--t-micro) var(--ease)',
}

// ─── New post form ────────────────────────────────────────────────────────────
function NewPostForm({ onSubmit, onCancel, authorName }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Général')
  const [error, setError] = useState('')

  function submit() {
    if (!title.trim()) { setError('Ajoute un titre.'); return }
    if (title.length > MAX_TITLE) { setError(`Titre trop long (max ${MAX_TITLE} caractères).`); return }
    if (!body.trim()) { setError('Écris ton message.'); return }
    if (body.length > MAX_CHARS) { setError(`Message trop long (max ${MAX_CHARS} caractères).`); return }
    const checkT = checkContent(title)
    if (!checkT.ok) { setError('Le titre contient un mot interdit.'); return }
    const checkB = checkContent(body)
    if (!checkB.ok) { setError('Le message contient un mot interdit.'); return }
    onSubmit({ title: title.trim(), body: body.trim(), category })
    setTitle(''); setBody(''); setError('')
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--br)', padding: '2.8rem',
      border: '2px solid rgba(139,92,246,.25)',
      boxShadow: '0 1.6rem 4.8rem rgba(139,92,246,.12)',
      marginBottom: '3.2rem',
    }}>
      <div style={{ fontSize: 'max(1.7rem,17px)', fontWeight: 900, color: 'var(--text-strong)', marginBottom: '2rem' }}>
        Nouvelle discussion
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={e => { setTitle(e.target.value); setError('') }}
        placeholder="Titre de ta discussion..."
        maxLength={MAX_TITLE + 1}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '1.2rem 1.6rem', borderRadius: '2rem',
          border: `1.5px solid ${error && !title.trim() ? 'var(--accent-red)' : 'var(--border)'}`,
          background: '#fafafa', outline: 'none', marginBottom: '1.2rem',
          fontFamily: 'var(--font)', fontSize: 'max(1.5rem,15px)', fontWeight: 700, color: 'var(--text-strong)',
        }}
      />

      {/* Category */}
      <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: '.5rem 1.4rem', borderRadius: 'var(--br)', border: 'none',
            fontSize: 'max(1.1rem,11px)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
            background: category === c ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : '#f0e8e0',
            color: category === c ? '#fff' : 'var(--text-muted)',
            boxShadow: category === c ? '0 4px 12px rgba(139,92,246,.3)' : 'none',
            transition: 'all .2s var(--ease)',
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Body */}
      <textarea
        value={body}
        onChange={e => { setBody(e.target.value); setError('') }}
        placeholder="Décris ta question ou partage ton expérience..."
        maxLength={MAX_CHARS + 1}
        rows={5}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '1.4rem 1.6rem', borderRadius: '2rem',
          border: `1.5px solid ${error && !body.trim() ? 'var(--accent-red)' : 'var(--border)'}`,
          background: '#fafafa', resize: 'vertical', outline: 'none',
          fontFamily: 'var(--font)', fontSize: 'var(--p3)', color: 'var(--text-body)', lineHeight: 1.6,
          marginBottom: '.8rem',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <span style={{ fontSize: 'max(1.1rem,11px)', color: body.length > MAX_CHARS ? 'var(--accent-red)' : 'var(--text-muted)' }}>
          {body.length}/{MAX_CHARS} caractères
        </span>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '1.2rem', padding: '.8rem 1.4rem', fontSize: 'var(--p3)', marginBottom: '1.2rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          background: 'rgba(0,0,0,.05)', color: 'var(--text-muted)', border: 'none',
          borderRadius: 'var(--br)', padding: '.9rem 2.4rem', fontSize: 'var(--p3)', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font)',
        }}>
          Annuler
        </button>
        <button onClick={submit} style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: '#fff', border: 'none',
          borderRadius: 'var(--br)', padding: '.9rem 2.8rem', fontSize: 'var(--p3)', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'var(--font)',
          boxShadow: '0 .8rem 2.4rem rgba(139,92,246,.35)',
        }}>
          Publier →
        </button>
      </div>
    </div>
  )
}

// ─── FORUM ────────────────────────────────────────────────────────────────────
export default function Forum({ onBack, user }) {
  const [posts, setPosts] = useState(() => loadPosts())
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('Tous')
  const [search, setSearch] = useState('')
  const [showRules, setShowRules] = useState(false)

  const authorName = user?.email?.split('@')[0] || 'Anonyme'

  useEffect(() => { savePosts(posts) }, [posts])

  function addPost({ title, body, category }) {
    const post = {
      id: Date.now().toString(),
      author: authorName,
      title, body, category,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: [],
    }
    setPosts(prev => [post, ...prev])
    setShowForm(false)
  }

  function addReply(postId, body) {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      return {
        ...p,
        replies: [...(p.replies || []), {
          author: authorName,
          body,
          createdAt: new Date().toISOString(),
        }],
      }
    }))
  }

  function toggleLike(postId) {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const liked = p.likedBy?.includes(authorName)
      return {
        ...p,
        likes: liked ? p.likes - 1 : (p.likes || 0) + 1,
        likedBy: liked ? p.likedBy.filter(u => u !== authorName) : [...(p.likedBy || []), authorName],
      }
    }))
  }

  const categories = ['Tous', ...CATEGORIES]
  const filtered = posts
    .filter(p => filter === 'Tous' || p.category === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(2rem)} to{opacity:1;transform:translateY(0)} }
        .forum-in { animation: fadeUp .4s var(--ease) both; }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--glass-white)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '1.4rem var(--padgrid)',
        display: 'flex', alignItems: 'center', gap: '1.6rem',
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(0,0,0,.05)', border: 'none', borderRadius: '50%',
          width: '3.6rem', height: '3.6rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '1.6rem', flexShrink: 0,
        }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'max(1.7rem,17px)', fontWeight: 900, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>
            Forum Solenn
          </div>
          <div style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--text-muted)' }}>Communauté · entraide · bienveillance</div>
        </div>
        <button onClick={() => setShowRules(r => !r)} style={{
          background: showRules ? '#0F42230F' : 'transparent',
          border: '1px solid #0F422320', borderRadius: 'var(--br)',
          padding: '.6rem 1.4rem', fontSize: 'max(1.2rem,12px)', fontWeight: 600,
          color: 'var(--accent-green)', cursor: 'pointer', fontFamily: 'var(--font)',
          whiteSpace: 'nowrap',
        }}>
          📜 Règlement
        </button>
        <button onClick={() => setShowForm(true)} style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: '#fff', border: 'none', borderRadius: 'var(--br)',
          padding: '.8rem 2rem', fontSize: 'max(1.3rem,13px)', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font)',
          boxShadow: '0 4px 16px rgba(139,92,246,.35)', whiteSpace: 'nowrap',
        }}>
          + Nouvelle discussion
        </button>
      </nav>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '4rem var(--padgrid)' }}>

        {/* Rules panel */}
        {showRules && (
          <div className="forum-in" style={{
            background: '#fff', borderRadius: 'var(--br)', padding: '2.4rem 2.8rem',
            border: '1.5px solid #0F422330', marginBottom: '2.4rem',
            boxShadow: '0 8px 32px rgba(15,66,35,.08)',
          }}>
            <div style={{ fontSize: 'max(1.5rem,15px)', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '1.4rem' }}>
              📜 Règlement du forum
            </div>
            {[
              ['Respect mutuel', 'Sois bienveillant(e). Pas d\'insultes, attaques personnelles ou propos haineux.'],
              ['Zéro violence', 'Aucun contenu violent, menaçant ou qui incite à la haine.'],
              ['Contenu adapté', 'Ce forum est axé santé & bien-être. Pas de contenu sexuel explicite.'],
              ['Sources fiables', 'Si tu partages des informations médicales, mentionne ta source.'],
              ['Limite de caractères', `Maximum ${MAX_CHARS} caractères par message, ${MAX_TITLE} pour le titre.`],
              ['Pas de spam', 'Ne publie pas le même message plusieurs fois.'],
            ].map(([t, d]) => (
              <div key={t} style={{ display: 'flex', gap: '1.2rem', padding: '.8rem 0', borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>✦</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--p3)', color: 'var(--text-strong)', marginBottom: '.2rem' }}>{t}</div>
                  <div style={{ fontSize: 'var(--p3)', color: 'var(--text-muted)', lineHeight: 1.65 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New post form */}
        {showForm && (
          <div className="forum-in">
            <NewPostForm onSubmit={addPost} onCancel={() => setShowForm(false)} authorName={authorName} />
          </div>
        )}

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '2.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{
              flex: '1 1 20rem', padding: '1rem 1.6rem', borderRadius: 'var(--br)',
              border: '1.5px solid var(--border)', background: '#fff', outline: 'none',
              fontFamily: 'var(--font)', fontSize: 'var(--p3)', color: 'var(--text-body)',
            }}
          />
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: '.6rem 1.4rem', borderRadius: 'var(--br)', border: 'none',
                fontSize: 'max(1.2rem,12px)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                background: filter === c ? 'var(--text-strong)' : '#fff',
                color: filter === c ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${filter === c ? 'transparent' : 'var(--border-soft)'}`,
                transition: 'all .18s var(--ease)',
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6.4rem 2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.6rem' }}>💬</div>
            <div style={{ fontSize: 'max(1.7rem,17px)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: '.8rem' }}>
              {search ? 'Aucun résultat' : 'Aucune discussion pour l\'instant'}
            </div>
            <div style={{ fontSize: 'var(--p3)', lineHeight: 1.75 }}>
              {search ? 'Essaie d\'autres mots-clés.' : 'Sois le premier à lancer une discussion !'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {filtered.map((post, i) => (
              <div key={post.id} style={{ animation: `fadeUp ${0.25 + i * 0.05}s var(--ease) both` }}>
                <PostCard
                  post={post}
                  onReply={addReply}
                  onLike={toggleLike}
                  authorName={authorName}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
