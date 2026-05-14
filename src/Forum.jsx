import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import './tokens.css'

// ─── Moderation ───────────────────────────────────────────────────────────────
const BANNED_WORDS = [
  'tuer','meurtre','assassin','bombe','arme','couteau','pistolet',
  'viol','violer','tabasser','frapper','menacer','massacre',
  'connard','connasse','enculé','enculer','fdp','fils de pute','pute','salope',
  'bâtard','batard','crétin','débile','idiot','imbécile','con','conne',
  'abruti','attardé','nique','niquer','merde','putain',
  'sexe','porn','pornographie','xxx','ejacul','masturbation','branlette',
  'fellation','cunnilingus','sodomie','cougar','milf','escort','prostituée',
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

const CATEGORIES = ['Général', 'Nutrition', 'Bien-être', 'Santé naturelle', 'Sport', 'Motivation', 'Question']

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32,
      background: 'linear-gradient(135deg, #C87B52, #9E5C35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: '#fff', flexShrink: 0,
      boxShadow: '0 2px 8px rgba(200,123,82,0.28)',
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputBase = {
  width: '100%', boxSizing: 'border-box',
  padding: '1rem 1.4rem', borderRadius: '1.4rem',
  border: '1.5px solid rgba(200,123,82,0.22)',
  background: 'rgba(255,246,238,0.70)',
  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  outline: 'none',
  fontFamily: 'var(--font)', fontSize: 'max(1.4rem,14px)',
  color: '#3a1a08', lineHeight: 1.6,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
}

// ─── Reply form ───────────────────────────────────────────────────────────────
function ReplyForm({ onSubmit }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_CHARS) { setError(`Maximum ${MAX_CHARS} caractères.`); return }
    const check = checkContent(trimmed)
    if (!check.ok) { setError('Message contient un mot interdit.'); return }
    setLoading(true)
    await onSubmit(trimmed)
    setText('')
    setError('')
    setLoading(false)
  }

  return (
    <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(200,123,82,0.13)' }}>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setError('') }}
        placeholder="Écris ta réponse..."
        maxLength={MAX_CHARS + 1}
        rows={3}
        style={{ ...inputBase, resize: 'vertical', border: `1.5px solid ${error ? '#e05555' : 'rgba(200,123,82,0.22)'}` }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.6rem' }}>
        <span style={{ fontSize: 'max(1.1rem,11px)', color: text.length > MAX_CHARS ? '#e05555' : 'rgba(155,100,70,0.50)' }}>
          {text.length}/{MAX_CHARS}
        </span>
        <button onClick={submit} disabled={!text.trim() || loading} style={{
          background: text.trim() ? 'linear-gradient(135deg, #C87B52, #9E5C35)' : 'rgba(200,123,82,0.08)',
          color: text.trim() ? '#fff' : 'rgba(155,100,70,0.40)',
          border: text.trim() ? 'none' : '1px solid rgba(200,123,82,0.16)',
          borderRadius: '2rem', padding: '.6rem 1.8rem',
          fontSize: 'max(1.2rem,12px)', fontWeight: 700,
          cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'var(--font)',
          boxShadow: text.trim() ? '0 4px 12px rgba(200,123,82,0.28)' : 'none',
          transition: 'all .18s ease',
        }}>
          {loading ? '...' : 'Répondre'}
        </button>
      </div>
      {error && <div style={{ fontSize: 'max(1.1rem,11px)', color: '#e05555', marginTop: '.4rem' }}>{error}</div>}
    </div>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, onReply, onLike, userId }) {
  const [open, setOpen] = useState(false)
  const liked = post.liked_by?.some(l => l.user_id === userId)
  const likesCount = post.liked_by?.length || 0

  return (
    <div style={{
      background: 'rgba(255,248,242,0.72)',
      borderRadius: 20,
      padding: '1.8rem 1.8rem',
      border: '1.5px solid rgba(200,123,82,0.16)',
      boxShadow: '0 4px 20px rgba(200,123,82,0.07), inset 0 1px 0 rgba(255,255,255,0.82)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
        <Avatar name={post.author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 'max(1.3rem,13px)', color: '#3a1a08' }}>{post.author}</span>
            <span style={{
              fontSize: 'max(1rem,10px)', fontWeight: 700, color: '#C87B52',
              background: 'rgba(200,123,82,0.10)', padding: '.2rem .75rem',
              borderRadius: 20, border: '1px solid rgba(200,123,82,0.20)',
            }}>
              {post.category}
            </span>
            <span style={{ fontSize: 'max(1rem,10px)', color: 'rgba(155,100,70,0.50)' }}>
              {timeAgo(post.created_at)}
            </span>
          </div>
          <h3 style={{ fontSize: 'max(1.4rem,14px)', fontWeight: 800, color: '#2a0e00', marginTop: '.3rem', lineHeight: 1.3 }}>
            {post.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <p style={{ fontSize: 'max(1.3rem,13px)', color: '#5a3520', lineHeight: 1.75, marginBottom: '1.2rem' }}>
        {post.body}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center' }}>
        <button onClick={() => onLike(post.id)} style={{
          display: 'flex', alignItems: 'center', gap: '.45rem',
          background: liked ? 'rgba(200,123,82,0.13)' : 'transparent',
          border: `1px solid ${liked ? 'rgba(200,123,82,0.28)' : 'rgba(200,123,82,0.14)'}`,
          borderRadius: 20, padding: '.45rem 1rem',
          cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .18s ease',
        }}>
          <span style={{ fontSize: '1.2rem', color: liked ? '#C87B52' : 'rgba(155,100,70,0.40)' }}>♥</span>
          <span style={{ fontSize: 'max(1.2rem,12px)', fontWeight: 600, color: liked ? '#C87B52' : 'rgba(155,100,70,0.50)' }}>
            {likesCount}
          </span>
        </button>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: '.45rem',
          background: open ? 'rgba(200,123,82,0.10)' : 'transparent',
          border: `1px solid ${open ? 'rgba(200,123,82,0.22)' : 'rgba(200,123,82,0.14)'}`,
          borderRadius: 20, padding: '.45rem 1rem',
          cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .18s ease',
        }}>
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <span style={{ fontSize: 'max(1.2rem,12px)', fontWeight: 600, color: 'rgba(155,100,70,0.60)' }}>
            {post.replies?.length || 0} réponse{post.replies?.length !== 1 ? 's' : ''}
          </span>
        </button>
      </div>

      {/* Replies */}
      {open && (
        <div style={{ marginTop: '1.4rem' }}>
          {post.replies?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem', marginBottom: '1.2rem' }}>
              {post.replies.map((r, i) => (
                <div key={r.id || i} style={{
                  display: 'flex', gap: '.9rem', padding: '1rem 1.2rem',
                  background: 'rgba(255,246,238,0.55)',
                  borderRadius: 14,
                  border: '1px solid rgba(200,123,82,0.13)',
                }}>
                  <Avatar name={r.author} size={26} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: 'max(1.2rem,12px)', color: '#3a1a08' }}>{r.author}</span>
                      <span style={{ fontSize: 'max(1rem,10px)', color: 'rgba(155,100,70,0.45)' }}>{timeAgo(r.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 'max(1.2rem,12px)', color: '#5a3520', lineHeight: 1.65 }}>{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ReplyForm onSubmit={body => onReply(post.id, body)} />
        </div>
      )}
    </div>
  )
}

// ─── New post form ────────────────────────────────────────────────────────────
function NewPostForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Général')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!title.trim()) { setError('Ajoute un titre.'); return }
    if (title.length > MAX_TITLE) { setError(`Titre trop long.`); return }
    if (!body.trim()) { setError('Écris ton message.'); return }
    if (body.length > MAX_CHARS) { setError(`Message trop long.`); return }
    if (!checkContent(title).ok) { setError('Le titre contient un mot interdit.'); return }
    if (!checkContent(body).ok) { setError('Le message contient un mot interdit.'); return }
    setLoading(true)
    await onSubmit({ title: title.trim(), body: body.trim(), category })
    setTitle(''); setBody(''); setError('')
    setLoading(false)
  }

  return (
    <div style={{
      background: 'rgba(255,248,242,0.88)',
      borderRadius: 22, padding: '2.2rem 2rem',
      border: '1.5px solid rgba(200,123,82,0.22)',
      boxShadow: '0 8px 36px rgba(200,123,82,0.13), inset 0 1px 0 rgba(255,255,255,0.88)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      marginBottom: '2rem',
    }}>
      <div style={{ fontSize: 'max(1.5rem,15px)', fontWeight: 800, color: '#2a0e00', marginBottom: '1.6rem', display: 'flex', alignItems: 'center', gap: '.7rem' }}>
        <span style={{ color: '#C87B52', fontSize: '1.2rem' }}>✦</span> Nouvelle discussion
      </div>

      <input
        value={title}
        onChange={e => { setTitle(e.target.value); setError('') }}
        placeholder="Titre de ta discussion..."
        maxLength={MAX_TITLE + 1}
        style={{
          ...inputBase, marginBottom: '1rem',
          fontSize: 'max(1.4rem,14px)', fontWeight: 700,
          border: `1.5px solid ${error && !title.trim() ? '#e05555' : 'rgba(200,123,82,0.22)'}`,
        }}
      />

      {/* Category chips */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: '.4rem 1.1rem', borderRadius: 20,
            fontSize: 'max(1.1rem,11px)', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)',
            background: category === c ? 'linear-gradient(135deg, #C87B52, #9E5C35)' : 'rgba(200,123,82,0.08)',
            color: category === c ? '#fff' : '#9b6b50',
            border: category === c ? 'none' : '1px solid rgba(200,123,82,0.18)',
            boxShadow: category === c ? '0 3px 10px rgba(200,123,82,0.28)' : 'none',
            transition: 'all .18s ease',
          }}>
            {c}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={e => { setBody(e.target.value); setError('') }}
        placeholder="Décris ta question ou partage ton expérience..."
        maxLength={MAX_CHARS + 1}
        rows={4}
        style={{ ...inputBase, resize: 'vertical', marginBottom: '.6rem', border: `1.5px solid ${error && !body.trim() ? '#e05555' : 'rgba(200,123,82,0.22)'}` }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 'max(1.1rem,11px)', color: body.length > MAX_CHARS ? '#e05555' : 'rgba(155,100,70,0.45)' }}>
          {body.length}/{MAX_CHARS}
        </span>
      </div>

      {error && (
        <div style={{
          background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.22)',
          color: '#c0392b', borderRadius: 12, padding: '.65rem 1.2rem',
          fontSize: 'max(1.1rem,11px)', marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          background: 'rgba(200,123,82,0.08)', color: 'rgba(155,100,70,0.75)',
          border: '1px solid rgba(200,123,82,0.18)', borderRadius: 20,
          padding: '.7rem 1.8rem', fontSize: 'max(1.2rem,12px)', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font)',
        }}>
          Annuler
        </button>
        <button onClick={submit} disabled={loading} style={{
          background: 'linear-gradient(135deg, #C87B52, #9E5C35)',
          color: '#fff', border: 'none', borderRadius: 20,
          padding: '.7rem 2.2rem', fontSize: 'max(1.2rem,12px)', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'var(--font)',
          boxShadow: '0 4px 14px rgba(200,123,82,0.35)',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Publication...' : 'Publier →'}
        </button>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'rgba(255,248,242,0.60)', borderRadius: 20,
          padding: '1.8rem', border: '1.5px solid rgba(200,123,82,0.10)',
          animation: 'pulse 1.5s ease infinite',
        }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(200,123,82,0.12)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, background: 'rgba(200,123,82,0.10)', borderRadius: 6, width: '40%', marginBottom: 8 }} />
              <div style={{ height: 16, background: 'rgba(200,123,82,0.10)', borderRadius: 6, width: '75%' }} />
            </div>
          </div>
          <div style={{ height: 12, background: 'rgba(200,123,82,0.08)', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 12, background: 'rgba(200,123,82,0.08)', borderRadius: 6, width: '80%' }} />
        </div>
      ))}
    </div>
  )
}

// ─── FORUM ────────────────────────────────────────────────────────────────────
export default function Forum({ onBack, user }) {
  const [posts, setPosts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [filter, setFilter]       = useState('Tous')
  const [search, setSearch]       = useState('')
  const [showRules, setShowRules] = useState(false)
  const [error, setError]         = useState(null)

  const authorName = user?.email?.split('@')[0] || 'Anonyme'
  const userId     = user?.id

  // ── Fetch posts ──────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setError(null)
    const { data, error: err } = await supabase
      .from('forum_posts')
      .select(`
        *,
        replies:forum_replies ( id, author, body, created_at ),
        liked_by:forum_likes ( user_id )
      `)
      .order('created_at', { ascending: false })

    if (err) { setError("Impossible de charger le forum."); setLoading(false); return }
    setPosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts()

    // Temps réel — refetch à chaque changement
    const channel = supabase
      .channel('forum-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' },   fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_replies' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_likes' },   fetchPosts)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchPosts])

  // ── Add post ─────────────────────────────────────────────────────────────────
  async function addPost({ title, body, category }) {
    const { data, err } = await supabase
      .from('forum_posts')
      .insert({ user_id: userId, author: authorName, title, body, category })
      .select()

    if (!err && data?.[0]) {
      setPosts(prev => [{ ...data[0], replies: [], liked_by: [] }, ...prev])
    }
    setShowForm(false)
  }

  // ── Add reply ─────────────────────────────────────────────────────────────────
  async function addReply(postId, body) {
    const { data, error: err } = await supabase
      .from('forum_replies')
      .insert({ post_id: postId, user_id: userId, author: authorName, body })
      .select()

    if (!err && data?.[0]) {
      setPosts(prev => prev.map(p => p.id !== postId ? p : {
        ...p, replies: [...(p.replies || []), data[0]],
      }))
    }
  }

  // ── Toggle like ───────────────────────────────────────────────────────────────
  async function toggleLike(postId) {
    if (!userId) return
    const post  = posts.find(p => p.id === postId)
    if (!post) return
    const liked = post.liked_by?.some(l => l.user_id === userId)

    // Optimistic update
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      liked_by: liked
        ? p.liked_by.filter(l => l.user_id !== userId)
        : [...(p.liked_by || []), { user_id: userId }],
    }))

    if (liked) {
      await supabase.from('forum_likes').delete().match({ post_id: postId, user_id: userId })
    } else {
      await supabase.from('forum_likes').insert({ post_id: postId, user_id: userId })
    }
  }

  const categories = ['Tous', ...CATEGORIES]
  const filtered = posts
    .filter(p => filter === 'Tous' || p.category === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ fontFamily: 'var(--font)', padding: '0 16px 120px' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(1.4rem)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.55} }
        .forum-in { animation: fadeUp .3s ease both; }
        .forum-search::placeholder { color: rgba(155,100,70,0.42) !important; }
      `}</style>

      {/* ── Top action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.4rem', paddingTop: '4px' }}>
        <div style={{ flex: 1, fontSize: 'max(1.1rem,11px)', color: 'rgba(155,100,70,0.55)', fontWeight: 500 }}>
          Communauté · entraide · bienveillance
        </div>
        <button onClick={() => setShowRules(r => !r)} style={{
          background: showRules ? 'rgba(200,123,82,0.12)' : 'rgba(200,123,82,0.07)',
          border: '1px solid rgba(200,123,82,0.20)', borderRadius: 20,
          padding: '.45rem 1rem', fontSize: 'max(1.1rem,11px)', fontWeight: 600,
          color: '#9b6b50', cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap',
        }}>
          📜 Règles
        </button>
        <button onClick={() => setShowForm(true)} style={{
          background: 'linear-gradient(135deg, #C87B52, #9E5C35)',
          color: '#fff', border: 'none', borderRadius: 20,
          padding: '.5rem 1.2rem', fontSize: 'max(1.2rem,12px)', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font)',
          boxShadow: '0 3px 12px rgba(200,123,82,0.32)', whiteSpace: 'nowrap',
        }}>
          + Nouveau
        </button>
      </div>

      {/* Search */}
      <input
        className="forum-search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une discussion..."
        style={{ ...inputBase, marginBottom: '1.2rem' }}
      />

      {/* Rules panel */}
      {showRules && (
        <div className="forum-in" style={{
          background: 'rgba(255,248,242,0.80)', borderRadius: 18,
          padding: '1.6rem 1.8rem',
          border: '1.5px solid rgba(200,123,82,0.17)', marginBottom: '1.4rem',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 5px 24px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.82)',
        }}>
          <div style={{ fontSize: 'max(1.3rem,13px)', fontWeight: 800, color: '#C87B52', marginBottom: '1rem' }}>
            📜 Règlement du forum
          </div>
          {[
            ['Respect mutuel', "Sois bienveillant(e). Pas d'insultes ni propos haineux."],
            ['Zéro violence', 'Aucun contenu violent, menaçant ou incitant à la haine.'],
            ['Contenu adapté', 'Forum axé santé & bien-être. Pas de contenu explicite.'],
            ['Sources fiables', 'Mentionne tes sources si tu partages des infos médicales.'],
            ['Limites', `Max ${MAX_CHARS} caractères / message, ${MAX_TITLE} pour le titre.`],
            ['Pas de spam', 'Ne publie pas le même message plusieurs fois.'],
          ].map(([t, d]) => (
            <div key={t} style={{ display: 'flex', gap: '.9rem', padding: '.65rem 0', borderTop: '1px solid rgba(200,123,82,0.11)' }}>
              <span style={{ color: '#C87B52', fontSize: '1.2rem', flexShrink: 0 }}>✦</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'max(1.2rem,12px)', color: '#3a1a08', marginBottom: '.15rem' }}>{t}</div>
                <div style={{ fontSize: 'max(1.1rem,11px)', color: 'rgba(90,53,32,0.70)', lineHeight: 1.6 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New post form */}
      {showForm && (
        <div className="forum-in">
          <NewPostForm onSubmit={addPost} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '.42rem 1.1rem', borderRadius: 20,
            fontSize: 'max(1.1rem,11px)', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font)',
            background: filter === c ? 'linear-gradient(135deg, #C87B52, #9E5C35)' : 'rgba(200,123,82,0.07)',
            color: filter === c ? '#fff' : '#9b6b50',
            border: filter === c ? 'none' : '1px solid rgba(200,123,82,0.17)',
            boxShadow: filter === c ? '0 3px 10px rgba(200,123,82,0.26)' : 'none',
            transition: 'all .18s ease',
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.20)',
          color: '#c0392b', borderRadius: 16, padding: '1.2rem 1.6rem',
          fontSize: 'max(1.3rem,13px)', marginBottom: '1.4rem', textAlign: 'center',
        }}>
          ⚠️ {error}
          <button onClick={fetchPosts} style={{
            marginLeft: '1rem', background: 'none', border: 'none',
            color: '#C87B52', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
          }}>Réessayer</button>
        </div>
      )}

      {/* Posts */}
      {loading ? <Skeleton /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '1rem', color: '#C87B52', opacity: 0.55 }}>✦</div>
          <div style={{ fontSize: 'max(1.5rem,15px)', fontWeight: 800, color: '#3a1a08', marginBottom: '.5rem' }}>
            {search ? 'Aucun résultat' : "Aucune discussion pour l'instant"}
          </div>
          <div style={{ fontSize: 'max(1.3rem,13px)', color: 'rgba(155,100,70,0.55)', lineHeight: 1.75 }}>
            {search ? "Essaie d'autres mots-clés." : 'Sois le premier à lancer une discussion !'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {filtered.map((post, i) => (
            <div key={post.id} style={{ animation: `fadeUp ${0.18 + i * 0.04}s ease both` }}>
              <PostCard post={post} onReply={addReply} onLike={toggleLike} userId={userId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
