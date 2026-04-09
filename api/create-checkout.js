import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { userId, email } = req.body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `https://vitacoach-w3yd.vercel.app?subscribed=true&userId=${userId}`,
      cancel_url: `https://vitacoach-w3yd.vercel.app?cancelled=true`,
      metadata: { userId: userId || '' }
    })

    res.json({ url: session.url })
  } catch (e) {
    console.error('Stripe error:', e.message)
    res.status(500).json({ erreur: e.message })
  }
}
