// ─── Transcription vocale — parler à Solenn au lieu de taper ─────────────────
// Whisper via Groq : rapide (~1 s pour 30 s d'audio) et quasi gratuit
// (~0,04 $ l'heure d'audio). L'audio arrive en base64 dans le JSON : un
// message vocal de 60 s en opus/aac pèse 100 à 500 Ko, loin de la limite
// Vercel. Pas de langue imposée : Whisper la détecte, l'app vise
// l'international.
// C'est une fonctionnalité qu'aucun tracker n'a : un coach, ça s'écoute et
// ça se parle (2026-08-13).

import Groq, { toFile } from 'groq-sdk'
import { requireOwner } from './_auth.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authUser = await requireOwner(req, res, req.body?.userId || null)
  if (!authUser) return

  const { audio, mime } = req.body || {}
  if (!audio || typeof audio !== 'string') {
    return res.status(400).json({ error: 'audio manquant' })
  }

  try {
    const buffer = Buffer.from(audio, 'base64')
    if (!buffer.length) return res.status(400).json({ error: 'audio vide' })
    // 4 Mo ≈ 8 minutes d'opus : bien au-delà d'un message vocal légitime.
    if (buffer.length > 4 * 1024 * 1024) {
      return res.status(413).json({ error: 'audio trop long' })
    }

    const ext = /mp4|m4a|aac/.test(mime || '') ? 'm4a' : /ogg/.test(mime || '') ? 'ogg' : 'webm'
    const transcription = await groq.audio.transcriptions.create({
      file: await toFile(buffer, `message.${ext}`),
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      temperature: 0,
    })

    const texte = (transcription?.text || '').trim()
    if (!texte) return res.json({ texte: '', vide: true })
    res.json({ texte })
  } catch (err) {
    console.error('Transcription error:', err.message)
    res.status(500).json({ error: 'transcription impossible' })
  }
}
