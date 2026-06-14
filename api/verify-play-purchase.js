/**
 * ─────────────────────────────────────────────
 *  Verificación de compras de Google Play Billing
 * ─────────────────────────────────────────────
 * Función serverless (Vercel Function) que recibe el `purchaseToken`
 * generado por la Digital Goods API en la app Android (TWA), lo
 * valida contra la Google Play Developer API y confirma
 * ("acknowledge") la compra para que Google no la reembolse a los
 * 3 días.
 *
 * Variables de entorno requeridas (configurar en el dashboard de Vercel):
 *
 *   GOOGLE_SERVICE_ACCOUNT_JSON  Contenido completo (JSON) de la
 *                                clave de la cuenta de servicio con
 *                                acceso a la Google Play Developer API.
 *
 *   ANDROID_PACKAGE_NAME         Nombre del paquete de la app Android
 *                                publicada en Play Console
 *                                (ej. "dev.finzen.twa").
 *
 * Ver PLAY_BILLING_SETUP.md para los pasos de configuración completos.
 */

import { google } from 'googleapis'

// purchaseState devuelto por la Play Developer API:
// 0 = comprado, 1 = cancelado, 2 = pendiente
const PURCHASE_STATE_PURCHASED = 0
// acknowledgementState: 0 = sin confirmar, 1 = confirmado
const ACK_STATE_NOT_ACKNOWLEDGED = 0

function getAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error('Falta la variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON')
  }

  const credentials = JSON.parse(raw)

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' })
    return
  }

  const { purchaseToken, productId } = req.body || {}

  if (!purchaseToken || !productId) {
    res.status(400).json({ error: 'Faltan purchaseToken o productId.' })
    return
  }

  const packageName = process.env.ANDROID_PACKAGE_NAME
  if (!packageName) {
    res.status(500).json({ error: 'Falta la variable de entorno ANDROID_PACKAGE_NAME.' })
    return
  }

  try {
    const auth = getAuthClient()
    const androidPublisher = google.androidpublisher({ version: 'v3', auth })

    const { data: purchase } = await androidPublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    })

    if (purchase.purchaseState !== PURCHASE_STATE_PURCHASED) {
      res.status(200).json({
        valid: false,
        reason: 'purchase_not_completed',
        purchaseState: purchase.purchaseState,
      })
      return
    }

    if (purchase.acknowledgementState === ACK_STATE_NOT_ACKNOWLEDGED) {
      await androidPublisher.purchases.products.acknowledge({
        packageName,
        productId,
        token: purchaseToken,
        requestBody: {},
      })
    }

    res.status(200).json({
      valid: true,
      orderId: purchase.orderId ?? null,
      purchaseTimeMillis: purchase.purchaseTimeMillis ?? null,
    })
  } catch (err) {
    console.error('verify-play-purchase error:', err)
    res.status(500).json({ error: 'No se pudo verificar la compra con Google Play.' })
  }
}
