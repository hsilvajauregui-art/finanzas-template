import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { Capacitor } from '@capacitor/core'

const REVENUECAT_API_KEY = 'test_IDLbAQOKgpnPssNwVnVulmodUZj'
const ENTITLEMENT_ID = 'Finzen Pro'

let configured = false

export async function configureRevenueCat(userId) {
  // Only works in native app (Android/iOS)
  if (!Capacitor.isNativePlatform()) return

  if (!configured) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY })
    configured = true
  }

  if (userId) {
    await Purchases.logIn({ appUserID: userId })
  }
}

export async function getRevenueCatIsPro() {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID]
  } catch {
    return false
  }
}

export async function getOfferings() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { current } = await Purchases.getOfferings()
    return current
  } catch {
    return null
  }
}

export async function purchasePackage(pkg) {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID]
}

export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases()
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID]
}
