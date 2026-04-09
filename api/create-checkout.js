export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { userId, email } = req.body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `https://vitacoach-w3yd.vercel.app?subscribed=true`,
      cancel_url: `https://vitacoach-w3yd.vercel.app?cancelled=true`,
    })

    res.json({ url: session.url })
  } catch (e) {
    res.status(200).json({ erreur: e.message, stack: e.stack?.slice(0, 300) })
  }
}
