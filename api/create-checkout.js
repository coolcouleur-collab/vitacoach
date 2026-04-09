export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID

  if (!stripeKey) return res.status(200).json({ erreur: 'STRIPE_SECRET_KEY manquant' })
  if (!priceId) return res.status(200).json({ erreur: 'STRIPE_PRICE_ID manquant' })

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const { email } = req.body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://vitacoach-w3yd.vercel.app?subscribed=true`,
      cancel_url: `https://vitacoach-w3yd.vercel.app?cancelled=true`,
    })

    res.json({ url: session.url })
  } catch (e) {
    res.status(200).json({ erreur: e.message })
  }
}
