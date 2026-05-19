import Stripe from 'stripe'

const PLANS = {
  light:    { name: 'ライトプラン',      price: 128000, interval: 'month' }, // 1,280円
  standard: { name: 'スタンダードプラン', price: 298000, interval: 'month' }, // 2,980円
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { plan, userId, successUrl, cancelUrl } = req.body
  if (!plan || !userId || !PLANS[plan]) return res.status(400).json({ error: 'Invalid request' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: { name: PLANS[plan].name },
            recurring: { interval: PLANS[plan].interval },
            unit_amount: PLANS[plan].price,
          },
          quantity: 1,
        },
      ],
      metadata: { userId, plan },
      success_url: successUrl || `${req.headers.origin}/?payment=success`,
      cancel_url: cancelUrl || `${req.headers.origin}/?payment=cancel`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
