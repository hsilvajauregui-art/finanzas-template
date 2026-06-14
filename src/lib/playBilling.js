/**
 * ─────────────────────────────────────────────
 *  Google Play Billing (Digital Goods API)
 * ─────────────────────────────────────────────
 * Utilidades para comprar y verificar "Finzen Pro" cuando la app
 * corre dentro de la Trusted Web Activity (TWA) publicada en
 * Google Play, usando la Digital Goods API + Payment Request API.
 *
 * En navegadores normales (web/PWA fuera de la TWA), estas funciones
 * no están disponibles y la app debe usar el flujo de licencia de
 * Lemon Squeezy (ver LicenseContext).
 */

export const PLAY_BILLING_METHOD = 'https://play.google.com/billing'

/** SKU del producto "Finzen Pro" configurado en Play Console. */
export const PRO_SKU = 'finzen_pro'

/**
 * Devuelve el servicio de Digital Goods para Google Play, o `null`
 * si la API no existe o Play Billing no está disponible (p. ej.
 * estamos en un navegador de escritorio o en la PWA web normal).
 */
export async function getPlayBillingService() {
  if (typeof window === 'undefined' || !('getDigitalGoodsService' in window)) {
    return null
  }

  try {
    return await window.getDigitalGoodsService(PLAY_BILLING_METHOD)
  } catch {
    return null
  }
}

/** true si la app corre dentro de la TWA con Play Billing disponible. */
export async function isPlayBillingAvailable() {
  const service = await getPlayBillingService()
  return service !== null
}

/**
 * Obtiene detalles (precio, título, descripción) de uno o más SKUs
 * desde Play Console.
 */
export async function getProductDetails(service, skus = [PRO_SKU]) {
  const details = await service.getDetails(skus)
  return details.map((item) => ({
    itemId: item.itemId,
    title: item.title,
    description: item.description,
    price: item.price,
    formattedPrice: new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: item.price.currency,
    }).format(item.price.value),
  }))
}

/**
 * Devuelve las compras/entitlements existentes del usuario para esta
 * app (compras no consumidas o suscripciones activas).
 */
export async function listExistingPurchases(service) {
  return service.listPurchases()
}

/**
 * Inicia el flujo de compra de Play Billing para el SKU indicado.
 * Resuelve con el `purchaseToken` que debe enviarse al backend para
 * verificar y confirmar ("acknowledge") la compra.
 *
 * Lanza un error si el usuario cancela o si Play Billing no está
 * disponible.
 */
export async function purchaseProduct(sku = PRO_SKU) {
  const service = await getPlayBillingService()
  if (!service) {
    throw new Error('Google Play Billing no está disponible en este entorno.')
  }

  const paymentMethods = [
    {
      supportedMethods: PLAY_BILLING_METHOD,
      data: { sku },
    },
  ]

  // El total es obligatorio para PaymentRequest pero Play Billing usa
  // el precio configurado en Play Console, así que estos valores son
  // solo de relleno.
  const paymentDetails = {
    total: {
      label: 'Total',
      amount: { currency: 'USD', value: '0' },
    },
  }

  const request = new PaymentRequest(paymentMethods, paymentDetails)
  const paymentResponse = await request.show()
  const { purchaseToken } = paymentResponse.details

  return { service, paymentResponse, purchaseToken, sku }
}

/**
 * Marca el `PaymentRequest` como exitoso o fallido tras la
 * verificación en el backend. Esto le permite al sistema mostrar el
 * mensaje de confirmación nativo.
 */
export async function completePaymentRequest(paymentResponse, success) {
  return paymentResponse.complete(success ? 'success' : 'fail')
}

/**
 * Marca una compra como consumida, permitiendo que pueda comprarse de
 * nuevo (no aplica a "Finzen Pro", que es una compra única
 * permanente, pero se deja disponible por completitud).
 */
export async function consumePurchase(service, purchaseToken) {
  return service.consume(purchaseToken)
}
