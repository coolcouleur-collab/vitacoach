import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

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
    metadata: { userId }
  })

  res.json({ url: session.url })
}
