import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, returnUrl } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('user_data')
    .select('profile')
    .eq('user_id', userId)
    .single()

  if (error || !data?.profile?.stripeCustomerId) {
    return res.status(404).json({ error: '決済情報が見つかりません。サポートにお問い合わせください。' })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.billingPortal.sessions.create({
      customer: data.profile.stripeCustomerId,
      return_url: returnUrl || req.headers.origin || 'https://ai-exam-coach.vercel.app',
    })
    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
