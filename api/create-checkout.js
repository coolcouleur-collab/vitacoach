import Stripe from 'stripe'

// Doublon serverless de la route Express (server.js) — en prod, vercel.json
// réécrit /api/* vers Render, donc c'est server.js qui sert. Garder les deux
// implémentations alignées : mêmes plans, mêmes montants.
const PLANS = {
  annual:  { unit_amount: 4499, interval: 'year',  label: 'Solenn Pro — Annuel' },
  monthly: { unit_amount: 799,  interval: 'month', label: 'Solenn Pro — Mensuel' },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Voir server.js : une clé collée depuis un dashboard embarque souvent un
  // retour à la ligne invisible, ce qui rend l'en-tête Authorization illégal
  // et fait échouer la requête AVANT l'envoi (erreur « connection to Stripe »).
  const stripeKey = (process.env.STRIPE_SECRET_KEY || '').replace(/[\s​-‍﻿]/g, '')
  if (!stripeKey) return res.status(500).json({ erreur: 'STRIPE_SECRET_KEY manquant' })

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const { email, userId } = req.body
    const planKey = PLANS[req.body?.plan] ? req.body.plan : 'annual'
    const plan = PLANS[planKey]
    const origin = req.headers.origin || 'https://meet-solenn.com'

    const session = await stripe.checkout.sessions.create({
      // Pas de payment_method_types : moyens de paiement pilotés par le
      // Dashboard Stripe (carte, Apple Pay, Google Pay, PayPal, Link…)
      mode: 'subscription',
      locale: 'fr',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: plan.label,
            description: 'Coach IA illimité · Analyses personnalisées · Toutes les fonctionnalités',
          },
          unit_amount: plan.unit_amount,
          recurring: { interval: plan.interval },
        },
        quantity: 1,
      }],
      // session_id indispensable : le frontend ne fait confiance qu'à la
      // vérification serveur via check-subscription, jamais au paramètre d'URL.
      success_url: `${origin}/?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cancelled=true`,
      allow_promotion_codes: true,
      metadata: { userId: userId || 'anonymous', plan: planKey, ref: req.body?.ref || null },
    })

    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ erreur: e.message })
  }
}
