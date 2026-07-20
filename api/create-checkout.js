import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID

  if (!stripeKey) return res.status(500).json({ erreur: 'STRIPE_SECRET_KEY manquant' })
  if (!priceId) return res.status(500).json({ erreur: 'STRIPE_PRICE_ID manquant' })

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const { email, userId } = req.body
    const origin = req.headers.origin || 'https://meet-solenn.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      locale: 'fr',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      // session_id indispensable : le frontend ne fait confiance qu'à la
      // vérification serveur via check-subscription, jamais au paramètre d'URL.
      success_url: `${origin}/?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cancelled=true`,
      metadata: { userId: userId || 'anonymous' },
    })

    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ erreur: e.message })
  }
}
