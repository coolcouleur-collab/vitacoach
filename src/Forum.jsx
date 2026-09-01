import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from './supabase'
import { BellIcon, ChatIcon } from './Icons'
import './tokens.css'
import { AMBRE, ENCRE, ICONE, ROUGE } from './palette'

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
  // Match sur mots entiers uniquement, "conseil" ne doit pas matcher "con",
  // "violon" ne doit pas matcher "viol". Frontières = tout sauf lettres/chiffres.
  const lower = text.toLowerCase()
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`(^|[^a-z0-9àâäéèêëîïôöùûüç])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9àâäéèêëîïôöùûüç])`, 'i')
    if (re.test(lower)) return { ok: false, word }
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
      background: 'rgba(255,235,210,0.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: AMBRE, flexShrink: 0,
      boxShadow: '0 2px 8px rgba(200,123,82,0.32)',
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Render @mentions en surbrillance ─────────────────────────────────────────
function renderWithMentions(text) {
  if (!text) return text
  return text.split(/(@[\w\-À-ÿ]+)/g).map((part, i) =>
    part.startsWith('@')
      ? <span key={i} style={{ color:ENCRE, fontWeight:700 }}>{part}</span>
      : part
  )
}

// ─── Textarea avec autocomplete @mention ──────────────────────────────────────
function MentionTextarea({ value, onChange, authors = [], style, placeholder, rows, className }) {
  const [query, setQuery] = useState(null)
  const taRef = useRef(null)

  function handleChange(e) {
    onChange(e)
    const cursor = e.target.selectionStart
    const before = e.target.value.slice(0, cursor)
    const match  = before.match(/@([\w\-À-ÿ]*)$/)
    setQuery(match ? match[1] : null)
  }

  function pick(name) {
    const cursor = taRef.current.selectionStart
    const before = value.slice(0, cursor).replace(/@([\w\-À-ÿ]*)$/, `@${name} `)
    const after  = value.slice(cursor)
    onChange({ target: { value: before + after } })
    setQuery(null)
    setTimeout(() => taRef.current?.focus(), 0)
  }

  const suggestions = query !== null
    ? authors.filter(a => a.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
    : []

  return (
    <div style={{ position:'relative' }}>
      <textarea
        ref={taRef} value={value} onChange={handleChange} placeholder={placeholder}
        rows={rows} className={className} style={style}
        onBlur={() => setTimeout(() => setQuery(null), 160)}
      />
      {suggestions.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:300, marginTop:4,
          background:'rgba(255,248,242,0.97)', backdropFilter:'blur(20px)',
          border:'1px solid rgba(200,123,82,0.22)', borderRadius:12,
          boxShadow:'0 4px 18px rgba(200,123,82,0.13)', overflow:'hidden',
        }}>
          {suggestions.map(name => (
            <button key={name} onMouseDown={e => { e.preventDefault(); pick(name) }} style={{
              display:'block', width:'100%', textAlign:'left',
              padding:'8px 14px', background:'none', border:'none',
              cursor:'pointer', fontFamily:'var(--font)',
              fontSize:'max(1.2rem,12px)', color:ENCRE,
              borderBottom:'1px solid rgba(200,123,82,0.08)',
            }}>
              <span style={{ color:ENCRE, fontWeight:700 }}>@</span>{name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputBase = {
  width: '100%', boxSizing: 'border-box',
  padding: '1rem 1.4rem', borderRadius: '1.4rem',
  border: '1.5px solid rgba(200,123,82,0.22)',
  background: 'rgba(255,246,238,0.96)',
  outline: 'none',
  fontFamily: 'var(--font)', fontSize: 'max(1.4rem,16px)',
  color: ENCRE, lineHeight: 1.6,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
}

// ─── Reply form ───────────────────────────────────────────────────────────────
function ReplyForm({ onSubmit, authors = [], initialText = '', onCancel }) {
  const [text, setText] = useState(initialText)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const taRef = useRef(null)

  useEffect(() => {
    setText(initialText)
    if (initialText) setTimeout(() => {
      const ta = taRef.current?.querySelector?.('textarea') ?? taRef.current
      ta?.focus()
      const len = initialText.length
      ta?.setSelectionRange(len, len)
    }, 60)
  }, [initialText])

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
    <div ref={taRef} style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(200,123,82,0.13)' }}>
      <MentionTextarea
        className="forum-reply-ta"
        value={text}
        onChange={e => { setText(e.target.value); setError('') }}
        placeholder="Écris ta réponse… (@ pour mentionner)"
        rows={3}
        authors={authors}
        style={{ ...inputBase, resize:'vertical', border:`1.5px solid ${error ? '#ef4444' : 'rgba(200,123,82,0.22)'}` }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.6rem' }}>
        <span style={{ fontSize: 'max(1.1rem,11px)', color: text.length > MAX_CHARS ? '#ef4444' : 'rgba(155,100,70,0.50)' }}>
          {text.length}/{MAX_CHARS}
        </span>
        <button onClick={submit} disabled={!text.trim() || loading} style={{
          background: text.trim() ? 'rgba(255,255,255,0.25)' : 'rgba(200,123,82,0.06)',
          color: text.trim() ? 'rgba(200,123,82,0.80)' : 'rgba(200,123,82,0.30)',
          border: text.trim() ? '1px solid rgba(200,123,82,0.25)' : '1px solid rgba(200,123,82,0.12)',
          borderRadius: '2rem', padding: '.6rem 1.8rem',
          fontSize: 'max(1.2rem,12px)', fontWeight: 700,
          cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'var(--font)',
          boxShadow: text.trim() ? '0 4px 12px rgba(200,123,82,0.28)' : 'none',
          transition: 'all .18s ease',
        }}>
          {loading ? '...' : 'Répondre'}
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{
            background:'none', border:'none', cursor:'pointer', padding:'.6rem .8rem',
            fontSize:'max(1.1rem,11px)', color:ENCRE, fontFamily:'var(--font)',
          }}>Annuler</button>
        )}
      </div>
      {error && <div style={{ fontSize: 'max(1.1rem,11px)', color: ROUGE, marginTop: '.4rem' }}>{error}</div>}
    </div>
  )
}

// ─── Post card (liste) ────────────────────────────────────────────────────────
function PostCard({ post, onLike, onOpen, userId }) {
  const liked = post.liked_by?.some(l => l.user_id === userId)
  const likesCount = post.liked_by?.length || 0
  const repliesCount = post.replies?.length || 0

  return (
    <div onClick={() => onOpen(post)} style={{
      background: 'rgba(255,248,242,0.96)',
      borderRadius: 20, padding: '1.4rem 1.6rem',
      border: '1px solid rgba(200,123,82,0.16)',
      boxShadow: '0 2px 14px rgba(200,123,82,0.06), inset 0 1px 0 rgba(255,255,255,0.70)',
      cursor: 'pointer', transition: 'all .18s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '.8rem', alignItems: 'flex-start', marginBottom: '.8rem' }}>
        <Avatar name={post.author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.3rem' }}>
            <span style={{ fontWeight: 600, fontSize: 'max(1.2rem,12px)', color: ENCRE }}>{post.author}</span>
            <span style={{
              fontSize: 'max(1rem,10px)', fontWeight: 500, color: ENCRE,
              background: 'rgba(200,123,82,0.08)', padding: '.15rem .65rem',
              borderRadius: 20, border: '1px solid rgba(200,123,82,0.18)',
            }}>{post.category}</span>
            <span style={{ fontSize: 'max(1rem,10px)', color: ENCRE }}>{timeAgo(post.created_at)}</span>
          </div>
          <h3 style={{ fontSize: 'max(1.4rem,14px)', fontWeight: 400, color: ENCRE, lineHeight: 1.35, fontFamily:'var(--font)', margin:0 }}>
            {post.title}
          </h3>
        </div>
      </div>
      {/* Preview body */}
      <p style={{ fontSize: 'max(1.2rem,12px)', color: ENCRE, lineHeight: 1.65, marginBottom: '1rem',
        overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {post.body}
      </p>
      {/* Actions */}
      <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center' }}>
        <button onClick={e => { e.stopPropagation(); onLike(post.id) }} style={{
          display: 'flex', alignItems: 'center', gap: '.4rem',
          background: liked ? 'rgba(200,123,82,0.12)' : 'transparent',
          border: `1px solid ${liked ? 'rgba(200,123,82,0.28)' : 'rgba(200,123,82,0.14)'}`,
          borderRadius: 20, padding: '.35rem .85rem',
          cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .18s ease',
        }}>
          <span style={{ fontSize: '1.1rem', color: liked ? 'rgba(200,123,82,0.80)' : 'rgba(200,123,82,0.35)' }}>♥</span>
          <span style={{ fontSize: 'max(1.1rem,11px)', fontWeight: 500, color: liked ? 'rgba(200,123,82,0.80)' : 'rgba(200,123,82,0.45)' }}>{likesCount}</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'.4rem', color:ENCRE, fontSize:'max(1.1rem,11px)' }}>
          <ChatIcon size={16} color={ICONE} />
          <span>{repliesCount} réponse{repliesCount !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ marginLeft:'auto', fontSize:'max(1.1rem,11px)', color:ENCRE }}>Lire →</div>
      </div>
    </div>
  )
}

// ─── Reply item (avec edit/delete/signaler) ───────────────────────────────────
function ReplyItem({ r, postId, onEdit, onDelete, onVote, userId }) {
  const [editing, setEditing]   = useState(false)
  const [editText, setEditText] = useState(r.body)
  const [loading, setLoading]   = useState(false)
  const [reported, setReported] = useState(false)
  const isOwner    = userId && r.user_id === userId
  const upvotes    = r.votes?.filter(v => v.vote ===  1).length || 0
  const downvotes  = r.votes?.filter(v => v.vote === -1).length || 0
  const score      = Math.max(0, upvotes - downvotes)
  const userVote   = r.votes?.find(v => v.user_id === userId)?.vote || 0

  async function save() {
    if (!editText.trim() || editText === r.body) { setEditing(false); return }
    const check = checkContent(editText)
    if (!check.ok) return
    setLoading(true)
    await onEdit(postId, r.id, editText.trim())
    setLoading(false)
    setEditing(false)
  }

  async function signaler() {
    if (reported) return
    setReported(true)
    try {
      await supabase.from('forum_reports').insert({
        reply_id: r.id, post_id: postId, reporter_id: userId, reason: 'user_report',
      })
    } catch { /* silently fail si la table n'existe pas encore */ }
  }

  return (
    <div style={{
      display:'flex', gap:'.8rem', padding:'1rem 1.2rem',
      background:'rgba(255,246,238,0.50)', borderRadius:16,
      border:'1px solid rgba(200,123,82,0.12)',
    }}>
      <Avatar name={r.author} size={28} />
      <div style={{ flex:1, minWidth:0 }}>
        {/* Header ligne */}
        <div style={{ display:'flex', gap:'.5rem', alignItems:'center', marginBottom:'.25rem', flexWrap:'wrap' }}>
          <span style={{ fontWeight:600, fontSize:'max(1.2rem,12px)', color:ENCRE }}>{r.author}</span>
          <span style={{ fontSize:'max(1rem,10px)', color:ENCRE }}>{timeAgo(r.created_at)}</span>
          {r.edited_at && (
            <span style={{ fontSize:'max(0.9rem,9px)', color:ENCRE, fontStyle:'italic' }}>· modifié</span>
          )}
          {/* Actions owner */}
          {isOwner && !editing && (
            <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
              <button onClick={() => setEditing(true)} style={{
                background:'none', border:'none', cursor:'pointer', padding:'2px 6px',
                fontSize:'max(1rem,10px)', color:ENCRE, fontFamily:'var(--font)',
              }}>Modifier</button>
              <button onClick={() => onDelete(postId, r.id)} style={{
                background:'none', border:'none', cursor:'pointer', padding:'2px 6px',
                fontSize:'max(1rem,10px)', color: ROUGE, fontFamily:'var(--font)',
              }}>Supprimer</button>
            </div>
          )}
        </div>

        {/* Corps */}
        {editing ? (
          <div>
            <textarea
              className="forum-reply-ta"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              style={{ ...inputBase, resize:'vertical', fontSize:'max(1.2rem,16px)', marginBottom:'.5rem' }}
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={save} disabled={loading} style={{
                background:'rgba(200,123,82,0.15)', border:'1px solid rgba(200,123,82,0.28)',
                borderRadius:20, padding:'.3rem .9rem', fontSize:'max(1.1rem,11px)',
                color:ENCRE, cursor:'pointer', fontFamily:'var(--font)',
              }}>{loading ? '...' : 'Sauvegarder'}</button>
              <button onClick={() => { setEditing(false); setEditText(r.body) }} style={{
                background:'none', border:'none', cursor:'pointer', padding:'.3rem .9rem',
                fontSize:'max(1.1rem,11px)', color:ENCRE, fontFamily:'var(--font)',
              }}>Annuler</button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize:'max(1.2rem,12px)', color:ENCRE, lineHeight:1.65, margin:'0 0 .6rem' }}>{r.body}</p>
            {/* Actions footer */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Vote widget */}
              <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                <button onClick={() => onVote?.(postId, r.id, 1)} style={{
                  background: userVote === 1 ? 'rgba(200,123,82,0.14)' : 'none',
                  border: 'none', cursor: userId ? 'pointer' : 'default',
                  borderRadius:7, padding:'2px 7px',
                  fontSize:11, fontWeight:700,
                  color: userVote === 1 ? 'rgba(200,123,82,0.90)' : 'rgba(200,123,82,0.32)',
                  fontFamily:'var(--font)', lineHeight:1, transition:'all .15s',
                }}>▲</button>
                <span style={{
                  fontSize:'max(1rem,10px)', fontWeight:700, minWidth:14, textAlign:'center',
                  color: userVote === 1 ? 'rgba(200,123,82,0.85)' : userVote === -1 ? 'rgba(150,100,70,0.40)' : 'rgba(200,123,82,0.52)',
                }}>{score}</span>
                <button onClick={() => onVote?.(postId, r.id, -1)} style={{
                  background: userVote === -1 ? 'rgba(120,80,50,0.10)' : 'none',
                  border: 'none', cursor: userId ? 'pointer' : 'default',
                  borderRadius:7, padding:'2px 7px',
                  fontSize:11, fontWeight:700,
                  color: userVote === -1 ? 'rgba(150,80,50,0.75)' : 'rgba(200,123,82,0.22)',
                  fontFamily:'var(--font)', lineHeight:1, transition:'all .15s',
                }}>▼</button>
              </div>
              {/* Signaler, masqué pour le propriétaire */}
              {!isOwner && (
                <button onClick={signaler} disabled={reported} style={{
                  background:'none', border:'none', cursor: reported ? 'default' : 'pointer',
                  padding:0, fontSize:'max(0.95rem,9.5px)',
                  color: reported ? 'rgba(200,123,82,0.60)' : 'rgba(239,68,68,0.75)',
                  fontFamily:'var(--font)', transition:'color .15s',
                }}>
                  {reported ? '✓ Signalé' : 'Signaler'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Post detail ──────────────────────────────────────────────────────────────
// ─── Commentaire avec réponse inline ─────────────────────────────────────────
const CHILD_VISIBLE = 2   // réponses visibles avant "Afficher plus"

function InlineReplyItem({ r, postId, onEdit, onDelete, onVote, onReply, userId, authors, isChild = false }) {
  const [open, setOpen] = useState(false)
  const formRef         = useRef(null)

  async function handleReply(body) {
    await onReply(postId, body, r.id)
    setOpen(false)
  }

  function toggle() {
    setOpen(v => !v)
    if (!open) setTimeout(() => formRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80)
  }

  return (
    <div style={isChild ? { transform:'scale(0.95)', transformOrigin:'left top', opacity:0.92 } : {}}>
      <ReplyItem r={r} postId={postId} onEdit={onEdit} onDelete={onDelete} onVote={onVote} userId={userId} />
      <button onClick={toggle} style={{
        background:'none', border:'none', cursor:'pointer',
        padding:'2px 0 6px 46px', display:'block',
        fontSize: isChild ? 'max(0.9rem,9px)' : 'max(1rem,10px)',
        fontFamily:'var(--font)',
        color: open ? 'rgba(200,123,82,0.75)' : 'rgba(200,123,82,0.42)',
        transition:'color .15s',
      }}>
        {open ? '✕ Annuler' : '↩ Répondre'}
      </button>
      {open && (
        <div ref={formRef} style={{ paddingLeft:46, animation:'fadeUp .2s ease both' }}>
          <ReplyForm
            onSubmit={handleReply}
            authors={authors}
            initialText={`@${r.author} `}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Groupe de réponses enfants avec "Afficher plus" ─────────────────────────
function ChildReplies({ replies, postId, onEdit, onDelete, onVote, onReply, userId, authors }) {
  const [expanded, setExpanded] = useState(false)
  const visible  = expanded ? replies : replies.slice(0, CHILD_VISIBLE)
  const hidden   = replies.length - CHILD_VISIBLE

  return (
    <div style={{ marginLeft:20, marginTop:4, paddingLeft:12, borderLeft:'2px solid rgba(200,123,82,0.15)', display:'flex', flexDirection:'column', gap:4 }}>
      {visible.map((child, j) => (
        <InlineReplyItem
          key={child.id || j}
          r={child} postId={postId}
          onEdit={onEdit} onDelete={onDelete} onVote={onVote}
          onReply={onReply} userId={userId} authors={authors}
          isChild
        />
      ))}
      {!expanded && hidden > 0 && (
        <button onClick={() => setExpanded(true)} style={{
          background:'none', border:'none', cursor:'pointer', padding:'4px 0',
          fontSize:'max(1rem,10px)', fontFamily:'var(--font)',
          color:ENCRE, fontWeight:600, textAlign:'left',
        }}>
          ↓ Afficher {hidden} réponse{hidden > 1 ? 's' : ''} de plus
        </button>
      )}
      {expanded && replies.length > CHILD_VISIBLE && (
        <button onClick={() => setExpanded(false)} style={{
          background:'none', border:'none', cursor:'pointer', padding:'4px 0',
          fontSize:'max(1rem,10px)', fontFamily:'var(--font)',
          color:ENCRE, textAlign:'left',
        }}>
          ↑ Réduire
        </button>
      )}
    </div>
  )
}

function replyScore(r) {
  const up   = r.votes?.filter(v => v.vote ===  1).length || 0
  const down = r.votes?.filter(v => v.vote === -1).length || 0
  return Math.max(0, up - down)
}

function PostDetail({ post, onReply, onLike, onEditReply, onDeleteReply, onBack, userId, onVote, authors = [] }) {
  const liked = post.liked_by?.some(l => l.user_id === userId)
  const likesCount = post.liked_by?.length || 0
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [scrolled, setScrolled]           = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 260) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleReply(body) {
    await onReply(post.id, body)
    setShowReplyForm(false)
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
        color:ENCRE, cursor:'pointer', fontFamily:'var(--font)',
        fontSize:'max(1.1rem,11px)', fontWeight:400, marginBottom:'1rem', padding:0,
      }}>
        ← Retour
      </button>

      {/* Post */}
      <div style={{
        background:'rgba(255,248,242,0.70)', borderRadius:20, padding:'1.6rem',
        border:'1px solid rgba(200,123,82,0.18)',
        boxShadow:'0 4px 20px rgba(200,123,82,0.07), inset 0 1px 0 rgba(255,255,255,0.80)',
        marginBottom:'1.4rem',
      }}>
        <div style={{ display:'flex', gap:'.8rem', alignItems:'flex-start', marginBottom:'1rem' }}>
          <Avatar name={post.author} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flexWrap:'wrap', marginBottom:'.3rem' }}>
              <span style={{ fontWeight:600, fontSize:'max(1.2rem,12px)', color:ENCRE }}>{post.author}</span>
              <span style={{
                fontSize:'max(1rem,10px)', color:ENCRE,
                background:'rgba(200,123,82,0.08)', padding:'.15rem .65rem',
                borderRadius:20, border:'1px solid rgba(200,123,82,0.18)',
              }}>{post.category}</span>
              <span style={{ fontSize:'max(1rem,10px)', color:ENCRE }}>{timeAgo(post.created_at)}</span>
            </div>
            <h2 style={{ fontSize:'max(1.6rem,16px)', fontWeight:400, color:ENCRE, lineHeight:1.35,
              fontFamily:'var(--font)', margin:0 }}>
              {post.title}
            </h2>
          </div>
        </div>
        <p style={{ fontSize:'max(1.3rem,13px)', color:ENCRE, lineHeight:1.75, marginBottom:'1.2rem' }}>
          {post.body}
        </p>
        {/* Actions : like + commenter */}
        <div style={{ display:'flex', gap:'.7rem', alignItems:'center' }}>
          <button onClick={() => onLike(post.id)} style={{
            display:'flex', alignItems:'center', gap:'.4rem',
            background: liked ? 'rgba(200,123,82,0.12)' : 'transparent',
            border:`1px solid ${liked ? 'rgba(200,123,82,0.28)' : 'rgba(200,123,82,0.14)'}`,
            borderRadius:20, padding:'.35rem .85rem',
            cursor:'pointer', fontFamily:'var(--font)', transition:'all .18s ease',
          }}>
            <span style={{ fontSize:'1.1rem', color: liked ? 'rgba(200,123,82,0.80)' : 'rgba(200,123,82,0.35)' }}>♥</span>
            <span style={{ fontSize:'max(1.1rem,11px)', fontWeight:500, color: liked ? 'rgba(200,123,82,0.80)' : 'rgba(200,123,82,0.45)' }}>{likesCount}</span>
          </button>
          <button onClick={() => setShowReplyForm(v => !v)} style={{
            display:'flex', alignItems:'center', gap:'.4rem',
            background: showReplyForm ? 'rgba(200,123,82,0.12)' : 'transparent',
            border:`1px solid ${showReplyForm ? 'rgba(200,123,82,0.28)' : 'rgba(200,123,82,0.14)'}`,
            borderRadius:20, padding:'.35rem .85rem',
            cursor:'pointer', fontFamily:'var(--font)', transition:'all .18s ease',
          }}>
            <ChatIcon size={16} color={showReplyForm ? 'rgba(200,123,82,0.80)' : 'rgba(200,123,82,0.35)'} />
            <span style={{ fontSize:'max(1.1rem,11px)', fontWeight:500, color: showReplyForm ? 'rgba(200,123,82,0.80)' : 'rgba(200,123,82,0.45)' }}>Commenter</span>
          </button>
        </div>
      </div>

      {/* Reply form, visible seulement après clic sur Commenter */}
      {showReplyForm && (
        <div style={{ marginBottom:'1.4rem', animation:'fadeUp .22s ease both' }}>
          <ReplyForm
            onSubmit={handleReply}
            authors={authors}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Replies */}
      <div>
        <div style={{ fontSize:'max(1.3rem,13px)', fontWeight:500, color:ENCRE, marginBottom:'.8rem' }}>
          {post.replies?.length || 0} commentaire{post.replies?.length !== 1 ? 's' : ''}
        </div>
        {post.replies?.length > 0 && (() => {
          const all   = post.replies || []
          const roots = all.filter(r => !r.parent_reply_id)
            .sort((a, b) => replyScore(b) - replyScore(a) || new Date(a.created_at) - new Date(b.created_at))

          // Collecte récursive de tous les descendants d'un commentaire racine
          function getDescendants(rootId) {
            const result = []
            const queue  = [rootId]
            while (queue.length) {
              const cur = queue.shift()
              const kids = all.filter(r => r.parent_reply_id === cur)
              kids.forEach(k => { result.push(k); queue.push(k.id) })
            }
            return result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          }

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:'.8rem' }}>
              {roots.map((r, i) => (
                <div key={r.id || i}>
                  <InlineReplyItem
                    r={r} postId={post.id}
                    onEdit={onEditReply} onDelete={onDeleteReply} onVote={onVote}
                    onReply={onReply} userId={userId} authors={authors}
                  />
                  {/* Réponses enfants */}
                  {getDescendants(r.id).length > 0 && (
                    <ChildReplies
                      replies={getDescendants(r.id)}
                      postId={post.id}
                      onEdit={onEditReply} onDelete={onDeleteReply} onVote={onVote}
                      onReply={onReply} userId={userId} authors={authors}
                    />
                  )}
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* ── Back to top ── */}
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Retour en haut"
          style={{
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 106px)', right: 18,
            background: 'rgba(255,248,242,0.82)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(200,123,82,0.22)',
            borderRadius: 100,
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: ENCRE,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(200,123,82,0.14), inset 0 1px 0 rgba(255,255,255,0.80)',
            zIndex: 200,
            animation: 'fadeUp .22s ease both',
            transition: 'opacity .2s ease',
          }}
        >
          ↑
        </button>
      )}
    </div>
  )
}

// ─── New post form ────────────────────────────────────────────────────────────
function NewPostForm({ onSubmit, onCancel, authors = [] }) {
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
      background: 'rgba(255,248,242,0.98)',
      borderRadius: 20, padding: '2.2rem 2rem',
      border: '1.5px solid rgba(200,123,82,0.22)',
      boxShadow: '0 8px 36px rgba(200,123,82,0.13), inset 0 1px 0 rgba(255,255,255,0.88)',
      marginBottom: '2rem',
    }}>
      <div style={{ fontSize: 'max(1.5rem,15px)', fontWeight: 700, color: ENCRE, marginBottom: '1.6rem', display: 'flex', alignItems: 'center', gap: '.7rem', fontFamily:'var(--font)' }}>
        <span style={{ color: ENCRE, fontSize: '1.2rem' }}>✦</span> Nouvelle discussion
      </div>

      <input
        value={title}
        onChange={e => { setTitle(e.target.value); setError('') }}
        placeholder="Titre de ta discussion..."
        maxLength={MAX_TITLE + 1}
        style={{
          ...inputBase, marginBottom: '1rem',
          fontSize: 'max(1.4rem,16px)', fontWeight: 700,
          border: `1.5px solid ${error && !title.trim() ? '#ef4444' : 'rgba(200,123,82,0.22)'}`,
        }}
      />

      {/* Category chips */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: '.4rem 1.1rem', borderRadius: 20,
            fontSize: 'max(1.1rem,11px)', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)',
            background: category === c ? 'linear-gradient(135deg, rgba(200,123,82,0.70), rgba(190,112,30,0.80))' : 'rgba(200,123,82,0.08)',
            color: category === c ? 'rgba(255,245,225,0.92)' : 'rgba(200,123,82,0.55)',
            border: category === c ? 'none' : '1px solid rgba(200,123,82,0.18)',
            boxShadow: category === c ? '0 3px 10px rgba(200,123,82,0.28)' : 'none',
            transition: 'all .18s ease',
          }}>
            {c}
          </button>
        ))}
      </div>

      <MentionTextarea
        value={body}
        onChange={e => { setBody(e.target.value); setError('') }}
        placeholder="Décris ta question… (@ pour mentionner)"
        rows={4}
        authors={authors}
        style={{ ...inputBase, resize:'vertical', marginBottom:'.6rem', border:`1.5px solid ${error && !body.trim() ? '#ef4444' : 'rgba(200,123,82,0.22)'}` }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 'max(1.1rem,11px)', color: body.length > MAX_CHARS ? '#ef4444' : 'rgba(155,100,70,0.65)' }}>
          {body.length}/{MAX_CHARS}
        </span>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
          color: ROUGE, borderRadius: 12, padding: '.65rem 1.2rem',
          fontSize: 'max(1.1rem,11px)', marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          background: 'rgba(200,123,82,0.08)', color: ENCRE,
          border: '1px solid rgba(200,123,82,0.18)', borderRadius: 20,
          padding: '.7rem 1.8rem', fontSize: 'max(1.2rem,12px)', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font)',
        }}>
          Annuler
        </button>
        <button onClick={submit} disabled={loading} style={{
          background: 'rgba(255,255,255,0.25)',
          color: ENCRE, border: '1px solid rgba(200,123,82,0.25)', borderRadius: 20,
          padding: '.7rem 2.2rem', fontSize: 'max(1.2rem,12px)', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'var(--font)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
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
              <div style={{ height: 12, background: 'rgba(200,123,82,0.10)', borderRadius: 8, width: '40%', marginBottom: 8 }} />
              <div style={{ height: 16, background: 'rgba(200,123,82,0.10)', borderRadius: 8, width: '75%' }} />
            </div>
          </div>
          <div style={{ height: 12, background: 'rgba(200,123,82,0.08)', borderRadius: 8, marginBottom: 8 }} />
          <div style={{ height: 12, background: 'rgba(200,123,82,0.08)', borderRadius: 8, width: '80%' }} />
        </div>
      ))}
    </div>
  )
}

// ─── FORUM ────────────────────────────────────────────────────────────────────
export default function Forum({ onBack, user, profil, showForm = false, setShowForm = () => {}, onUnreadCount }) {
  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('Tous')
  const [search, setSearch]           = useState('')
  const [showRules, setShowRules]     = useState(false)
  const [error, setError]             = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)

  const authorName = profil?.nom || profil?.prenom || user?.email?.split('@')[0] || 'Anonyme'
  const userId     = user?.id

  // ── Mentions / notifications ─────────────────────────────────────────────────
  const [mentions, setMentions]       = useState([])
  const [showNotifs, setShowNotifs]   = useState(false)
  const unreadCount = mentions.filter(m => !m.read).length

  const fetchMentions = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('forum_mentions')
      .select('*, post:forum_posts(id, title, author)')
      .eq('mentioned_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) { setMentions(data); onUnreadCount?.(data.filter(m => !m.read).length) }
  }, [userId, onUnreadCount])

  useEffect(() => { fetchMentions() }, [fetchMentions])

  async function markAllRead() {
    if (!unreadCount) return
    await supabase.from('forum_mentions').update({ read: true })
      .eq('mentioned_user_id', userId).eq('read', false)
    setMentions(prev => prev.map(m => ({ ...m, read: true })))
    onUnreadCount?.(0)
  }

  // ── Map auteurs (pour autocomplete @ et résolution mentions) ─────────────────
  const authorMap = useMemo(() => {
    const map = {}
    posts.forEach(p => {
      if (p.user_id && p.author) map[p.author.toLowerCase()] = { userId: p.user_id, displayName: p.author }
      p.replies?.forEach(r => {
        if (r.user_id && r.author) map[r.author.toLowerCase()] = { userId: r.user_id, displayName: r.author }
      })
    })
    return map
  }, [posts])

  const authors = useMemo(() =>
    [...new Set(Object.values(authorMap).map(a => a.displayName))].filter(n => n !== authorName), [authorMap, authorName])

  async function insertMentions(text, postId, replyId = null) {
    if (!userId || !text) return
    const names = [...new Set((text.match(/@([\w\-À-ÿ]+)/g) || []).map(m => m.slice(1)))]
    for (const name of names) {
      const entry = authorMap[name.toLowerCase()]
      if (entry?.userId && entry.userId !== userId) {
        try {
          await supabase.from('forum_mentions').insert({
            post_id: postId, reply_id: replyId,
            mentioned_user_id: entry.userId, mentioned_by: userId,
          })
        } catch { /* table absente ou RLS, ne bloque pas l'envoi */ }
      }
    }
  }

  // ── Fetch posts ──────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setError(null)
    try {
      let { data, error: err } = await supabase
        .from('forum_posts')
        .select(`*, replies:forum_replies ( id, author, body, created_at, edited_at, user_id, parent_reply_id, votes:forum_reply_votes(user_id, vote) ), liked_by:forum_likes ( user_id )`)
        .order('created_at', { ascending: false })

      if (err) {
        // Fallback sans les colonnes optionnelles
        const res = await supabase
          .from('forum_posts')
          .select(`*, replies:forum_replies ( id, author, body, created_at, parent_reply_id, votes:forum_reply_votes(user_id, vote) ), liked_by:forum_likes ( user_id )`)
          .order('created_at', { ascending: false })
        if (res.error) throw res.error
        data = res.data
      }
      setPosts(data || [])
    } catch {
      setError("Le forum est temporairement indisponible.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()

    // Temps réel, refetch à chaque changement
    const channel = supabase
      .channel('forum-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' },        fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_replies' },      fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_likes' },        fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_reply_votes' },  fetchPosts)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_mentions', filter: `mentioned_user_id=eq.${userId}` }, fetchMentions)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchPosts, userId, fetchMentions])

  // ── Add post ─────────────────────────────────────────────────────────────────
  async function addPost({ title, body, category }) {
    const { data, error: err } = await supabase
      .from('forum_posts')
      .insert({ user_id: userId, author: authorName, title, body, category })
      .select()

    if (!err && data?.[0]) {
      setPosts(prev => [{ ...data[0], replies: [], liked_by: [] }, ...prev])
      await insertMentions(body, data[0].id)
    }
    setShowForm(false)
  }

  // ── Add reply ─────────────────────────────────────────────────────────────────
  async function addReply(postId, body, parentReplyId = null) {
    const { data, error: err } = await supabase
      .from('forum_replies')
      .insert({ post_id: postId, user_id: userId, author: authorName, body, parent_reply_id: parentReplyId || null })
      .select()

    if (!err && data?.[0]) {
      setPosts(prev => prev.map(p => p.id !== postId ? p : {
        ...p, replies: [...(p.replies || []), data[0]],
      }))
      setSelectedPost(prev => prev?.id === postId ? {
        ...prev, replies: [...(prev.replies || []), data[0]]
      } : prev)
      await insertMentions(body, postId, data[0].id)
    }
  }

  // ── Edit reply ────────────────────────────────────────────────────────────────
  async function editReply(postId, replyId, newBody) {
    const edited_at = new Date().toISOString()
    const { error: err } = await supabase
      .from('forum_replies')
      .update({ body: newBody, edited_at })
      .match({ id: replyId })

    if (!err) {
      const updateReplies = replies => replies.map(r => r.id === replyId ? { ...r, body: newBody, edited_at } : r)
      setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, replies: updateReplies(p.replies || []) }))
      setSelectedPost(prev => prev?.id === postId ? { ...prev, replies: updateReplies(prev.replies || []) } : prev)
    }
  }

  // ── Delete reply ──────────────────────────────────────────────────────────────
  async function deleteReply(postId, replyId) {
    const { error: err } = await supabase
      .from('forum_replies')
      .delete()
      .match({ id: replyId })

    if (!err) {
      const filterReplies = replies => replies.filter(r => r.id !== replyId)
      setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, replies: filterReplies(p.replies || []) }))
      setSelectedPost(prev => prev?.id === postId ? { ...prev, replies: filterReplies(prev.replies || []) } : prev)
    }
  }

  // ── Vote reply (up/down) ──────────────────────────────────────────────────────
  async function voteReply(postId, replyId, vote) {
    if (!userId) return
    const currentVote = selectedPost?.replies
      ?.find(r => r.id === replyId)?.votes
      ?.find(v => v.user_id === userId)?.vote || 0

    const applyVotes = (votes = []) => currentVote === vote
      ? votes.filter(v => v.user_id !== userId)
      : [...votes.filter(v => v.user_id !== userId), { user_id: userId, vote }]

    const updateReplies = replies => replies.map(r =>
      r.id !== replyId ? r : { ...r, votes: applyVotes(r.votes) }
    )
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, replies: updateReplies(p.replies || []) }))
    setSelectedPost(prev => prev?.id === postId ? { ...prev, replies: updateReplies(prev.replies || []) } : prev)

    if (currentVote === vote) {
      await supabase.from('forum_reply_votes').delete().match({ reply_id: replyId, user_id: userId })
    } else {
      await supabase.from('forum_reply_votes').upsert(
        { reply_id: replyId, user_id: userId, vote },
        { onConflict: 'reply_id,user_id' }
      )
    }
  }

  // ── Toggle like ───────────────────────────────────────────────────────────────
  async function toggleLike(postId) {
    if (!userId) return
    const post  = posts.find(p => p.id === postId)
    if (!post) return
    const liked = post.liked_by?.some(l => l.user_id === userId)

    const updatedLikes = (post) => liked
      ? post.liked_by.filter(l => l.user_id !== userId)
      : [...(post.liked_by || []), { user_id: userId }]

    // Optimistic update
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, liked_by: updatedLikes(p) }))
    setSelectedPost(prev => prev?.id === postId ? { ...prev, liked_by: updatedLikes(prev) } : prev)

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

  // Vue détail
  if (selectedPost) {
    return (
      <div style={{ fontFamily:'var(--font)', padding:'40px 16px 120px' }}>
        <PostDetail
          post={selectedPost}
          onReply={addReply}
          onLike={toggleLike}
          onEditReply={editReply}
          onDeleteReply={deleteReply}
          onVote={voteReply}
          onBack={() => setSelectedPost(null)}
          userId={userId}
          authors={authors}
        />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font)', padding: '44px 16px 120px' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(1.4rem)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.55} }
        .forum-in { animation: fadeUp .3s ease both; }
      `}</style>

      {/* ── Top action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, fontSize: 'max(1.1rem,11px)', color: ENCRE, fontWeight: 500 }}>
          Communauté · entraide · bienveillance
        </div>
        {/* Cloche mentions */}
        <button onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markAllRead() }} style={{
          position:'relative', background: showNotifs ? 'rgba(200,123,82,0.14)' : 'rgba(200,123,82,0.07)',
          border:'1px solid rgba(200,123,82,0.22)', borderRadius:20,
          width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', flexShrink:0,
        }}>
          <BellIcon size={15} color={ICONE} />
          {unreadCount > 0 && (
            <span style={{
              position:'absolute', top:-4, right:-4,
              background:'#ef4444', color:'#fff', fontSize:9, fontWeight:800,
              borderRadius:20, minWidth:16, height:16,
              display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px',
            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
        <button onClick={() => setShowRules(r => !r)} style={{
          background: showRules ? 'rgba(200,123,82,0.14)' : 'rgba(200,123,82,0.09)',
          border:'1px solid rgba(200,123,82,0.28)', borderRadius:20,
          padding:'.45rem 1rem', fontSize:'max(1.1rem,11px)', fontWeight:600,
          color:ENCRE, cursor:'pointer', fontFamily:'var(--font)', whiteSpace:'nowrap',
        }}>Règles</button>
      </div>

      {/* ── Panel notifications ── */}
      {showNotifs && (
        <div className="forum-in" style={{
          background:'rgba(255,248,242,0.92)', borderRadius:20, marginBottom:'1.2rem',
          border:'1px solid rgba(200,123,82,0.18)', overflow:'hidden',
          backdropFilter:'blur(20px)', boxShadow:'0 4px 20px rgba(200,123,82,0.08)',
        }}>
          <div style={{ padding:'1rem 1.2rem .7rem', fontWeight:700, fontSize:'max(1.2rem,12px)', color:ENCRE, borderBottom:'1px solid rgba(200,123,82,0.10)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><BellIcon size={14} color={ICONE} /> Mentions</span>
          </div>
          {mentions.length === 0 ? (
            <div style={{ padding:'1.4rem', textAlign:'center', fontSize:'max(1.1rem,11px)', color:ENCRE }}>
              Aucune mention pour l'instant
            </div>
          ) : mentions.map(m => (
            <div key={m.id} onClick={() => { const p = posts.find(p => p.id === m.post_id); if (p) { setSelectedPost(p); setShowNotifs(false) } }}
              style={{
                display:'flex', gap:10, padding:'.85rem 1.2rem', cursor:'pointer',
                borderBottom:'1px solid rgba(200,123,82,0.07)',
                background: m.read ? 'transparent' : 'rgba(200,123,82,0.05)',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                <circle cx="12" cy="8" r="4" fill="rgba(200,123,82,0.70)"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(200,123,82,0.70)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:'max(1.1rem,11px)', color:ENCRE, lineHeight:1.5 }}>
                  Tu as été mentionné(e) dans{' '}
                  <span style={{ fontWeight:700, color:ENCRE }}>
                    « {m.post?.title || 'une discussion'} »
                  </span>
                </div>
                <div style={{ fontSize:'max(0.95rem,9.5px)', color:ENCRE, marginTop:2 }}>
                  {timeAgo(m.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        className="forum-search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une discussion..."
        style={{ ...inputBase, marginBottom: '1rem' }}
      />


      {/* Rules panel */}
      {showRules && (
        <div className="forum-in" style={{
          background: 'rgba(255,248,242,0.80)', borderRadius: 20,
          padding: '1.6rem 1.8rem',
          border: '1.5px solid rgba(200,123,82,0.17)', marginBottom: '1.4rem',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 5px 24px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.82)',
        }}>
          <div style={{ fontSize: 'max(1.3rem,13px)', fontWeight: 800, color: ENCRE, marginBottom: '1rem' }}>
            Règlement du forum
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
              <span style={{ color: ENCRE, fontSize: '1.2rem', flexShrink: 0 }}>✦</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'max(1.2rem,12px)', color: ENCRE, marginBottom: '.15rem' }}>{t}</div>
                <div style={{ fontSize: 'max(1.1rem,11px)', color: ENCRE, lineHeight: 1.6 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New post form */}
      {showForm && (
        <div className="forum-in">
          <NewPostForm onSubmit={addPost} onCancel={() => setShowForm(false)} authors={authors} />
        </div>
      )}

      {/* Category filters, scroll horizontal */}
      <div style={{
        display: 'flex', gap: '.5rem', marginBottom: '1.4rem',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '.42rem 1.1rem', borderRadius: 20,
            fontSize: 'max(1.1rem,11px)', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font)',
            flexShrink: 0,
            background: filter === c ? 'rgba(255,255,255,0.30)' : 'rgba(200,123,82,0.06)',
            color: filter === c ? 'rgba(200,123,82,0.95)' : 'rgba(200,123,82,0.65)',
            border: filter === c ? '1px solid rgba(200,123,82,0.28)' : '1px solid rgba(200,123,82,0.14)',
            boxShadow: filter === c ? 'inset 0 1px 0 rgba(255,255,255,0.8)' : 'none',
            transition: 'all .18s ease',
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(200,123,82,0.06)', border: '1px solid rgba(200,123,82,0.18)',
          borderRadius: 16, padding: '1.4rem 1.6rem',
          fontSize: 'max(1.2rem,12px)', marginBottom: '1.4rem', textAlign: 'center',
          color: ENCRE,
        }}>
          {error}
          <button onClick={fetchPosts} style={{
            display: 'block', margin: '.8rem auto 0',
            background: 'rgba(200,123,82,0.10)', border: '1px solid rgba(200,123,82,0.22)',
            borderRadius: 20, padding: '.4rem 1.4rem',
            fontSize: 'max(1.1rem,11px)', fontWeight: 600,
            color: ENCRE, cursor: 'pointer', fontFamily: 'var(--font)',
          }}>Recharger</button>
        </div>
      )}

      {/* Posts */}
      {loading ? <Skeleton /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '1rem', opacity: 0.40 }}>○</div>
          <div style={{ fontSize: 'max(1.4rem,14px)', fontWeight: 600, color: ENCRE, marginBottom: '.5rem' }}>
            {search ? 'Aucun résultat pour cette recherche' : 'Aucune discussion pour le moment'}
          </div>
          <div style={{ fontSize: 'max(1.2rem,12px)', color: ENCRE, lineHeight: 1.75 }}>
            {search ? "Essaie avec d'autres mots." : 'Lance la première, la communauté t\'attend.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {filtered.map((post, i) => (
            <div key={post.id} style={{ animation: `fadeUp ${0.18 + i * 0.04}s ease both` }}>
              <PostCard post={post} onLike={toggleLike} onOpen={setSelectedPost} userId={userId} />
            </div>
          ))}
        </div>
      )}


    </div>
  )
}
