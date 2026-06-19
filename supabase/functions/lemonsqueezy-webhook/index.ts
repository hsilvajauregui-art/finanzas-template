import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LEMON_SQUEEZY_SIGNING_SECRET = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? ''

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-signature')
  if (!signature || !LEMON_SQUEEZY_SIGNING_SECRET) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(LEMON_SQUEEZY_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  return signature === expected
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()

  const valid = await verifySignature(req, body)
  if (!valid) {
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(body)
  const eventName: string = payload.meta?.event_name ?? ''
  const userEmail: string = payload.data?.attributes?.user_email ?? ''

  if (!userEmail) {
    return new Response('No user email', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Find user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) return new Response('Error fetching users', { status: 500 })

  const user = users.find(u => u.email === userEmail)
  if (!user) return new Response('User not found', { status: 404 })

  const isPro = ['subscription_created', 'subscription_updated', 'subscription_resumed'].includes(eventName)
  const isCancelled = ['subscription_cancelled', 'subscription_expired'].includes(eventName)

  if (!isPro && !isCancelled) {
    return new Response('Event ignored', { status: 200 })
  }

  const endsAt = payload.data?.attributes?.ends_at ?? null

  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: user.id,
      is_pro: isPro,
      pro_source: isPro ? 'lemonsqueezy' : null,
      pro_expires_at: isCancelled ? endsAt : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return new Response('DB error: ' + error.message, { status: 500 })

  return new Response('OK', { status: 200 })
})
