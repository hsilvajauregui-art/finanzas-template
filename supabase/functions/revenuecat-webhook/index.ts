import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REVENUECAT_WEBHOOK_AUTH = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify authorization header (RevenueCat sends value directly or as Bearer)
  const authHeader = req.headers.get('authorization') ?? ''
  if (REVENUECAT_WEBHOOK_AUTH) {
    const valid = authHeader === REVENUECAT_WEBHOOK_AUTH || authHeader === `Bearer ${REVENUECAT_WEBHOOK_AUTH}`
    if (!valid) return new Response('Unauthorized', { status: 401 })
  }

  const payload = await req.json()
  const event = payload.event
  const eventType: string = event?.type ?? ''
  const appUserId: string = event?.app_user_id ?? ''

  if (!appUserId) {
    return new Response('No app_user_id', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const activeEvents = [
    'INITIAL_PURCHASE',
    'RENEWAL',
    'PRODUCT_CHANGE',
    'UNCANCELLATION',
  ]
  const inactiveEvents = [
    'CANCELLATION',
    'EXPIRATION',
    'BILLING_ISSUE',
  ]

  const isPro = activeEvents.includes(eventType)
  const isCancelled = inactiveEvents.includes(eventType)

  if (!isPro && !isCancelled) {
    return new Response('Event ignored', { status: 200 })
  }

  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: appUserId,
      is_pro: isPro,
      pro_source: isPro ? 'revenuecat' : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return new Response('DB error: ' + error.message, { status: 500 })

  return new Response('OK', { status: 200 })
})
