import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import {
  PRO_SKU,
  getPlayBillingService,
  listExistingPurchases,
  purchaseProduct,
  completePaymentRequest,
} from '../lib/playBilling'

const STORAGE_KEY = 'finanzas-license'
const INSTANCE_NAME_KEY = 'finanzas-license-instance-name'

const LicenseContext = createContext(null)

function loadLicense() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLicense(data) {
  if (data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function getInstanceName() {
  let name = localStorage.getItem(INSTANCE_NAME_KEY)
  if (!name) {
    name = `finzen-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(INSTANCE_NAME_KEY, name)
  }
  return name
}

/**
 * Verifica (y confirma) un purchaseToken de Google Play con el
 * backend. Devuelve `true` si la compra es válida.
 */
async function verifyPlayPurchase(purchaseToken, productId) {
  try {
    const res = await fetch('/api/verify-play-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseToken, productId }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return !!data.valid
  } catch {
    return false
  }
}

export function LicenseProvider({ children }) {
  const [license, setLicense] = useState(loadLicense)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)
  const [playBillingAvailable, setPlayBillingAvailable] = useState(false)

  const isPro = !!license?.activated

  // Permite activar Pro manualmente visitando una URL con
  // ?finzenpro=KEY (uso personal del propietario de la app, sin pasar
  // por Lemon Squeezy ni Google Play). Limpia el parámetro de la URL
  // después de activarlo para que no quede visible ni se comparta
  // accidentalmente al copiar el link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const unlockKey = params.get('finzenpro')
    if (!unlockKey) return

    if (unlockKey === 'hsj-2026' && !isPro) {
      const record = {
        source: 'manual',
        activated: true,
        activatedAt: new Date().toISOString(),
      }
      saveLicense(record)
      setLicense(record)
    }

    params.delete('finzenpro')
    const newSearch = params.toString()
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
    window.history.replaceState({}, '', newUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al cargar dentro de la app de Android (TWA), revisa si el usuario
  // ya tiene "Finzen Pro" comprado vía Google Play y, de ser así,
  // activa Pro automáticamente (cubre reinstalaciones, nuevos
  // dispositivos, etc.).
  useEffect(() => {
    let cancelled = false

    async function checkPlayPurchases() {
      const service = await getPlayBillingService()
      if (cancelled) return

      setPlayBillingAvailable(!!service)
      if (!service || isPro) return

      try {
        const purchases = await listExistingPurchases(service)
        const proPurchase = purchases.find((p) => p.itemIds?.includes(PRO_SKU) ?? p.itemId === PRO_SKU)
        if (!proPurchase || cancelled) return

        const valid = await verifyPlayPurchase(proPurchase.purchaseToken, PRO_SKU)
        if (!valid || cancelled) return

        const record = {
          source: 'play',
          activated: true,
          purchaseToken: proPurchase.purchaseToken,
          activatedAt: new Date().toISOString(),
        }
        saveLicense(record)
        setLicense(record)
      } catch {
        // Sin conexión o sin compras previas: no hacer nada.
      }
    }

    checkPlayPurchases()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activate = useCallback(async (rawKey) => {
    const licenseKey = rawKey.trim()
    if (!licenseKey) {
      setError('Ingresa un código de licencia.')
      return false
    }

    setStatus('loading')
    setError(null)

    try {
      const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          license_key: licenseKey,
          instance_name: getInstanceName(),
        }),
      })

      const data = await res.json()

      if (!data.activated) {
        setStatus('error')
        setError(data.error || 'No se pudo activar la licencia. Verifica el código.')
        return false
      }

      const record = {
        source: 'lemonsqueezy',
        licenseKey,
        activated: true,
        instanceId: data.instance?.id ?? null,
        activatedAt: new Date().toISOString(),
      }
      saveLicense(record)
      setLicense(record)
      setStatus('idle')
      return true
    } catch {
      setStatus('error')
      setError('No se pudo conectar con el servidor de licencias. Revisa tu conexión a internet.')
      return false
    }
  }, [])

  /**
   * Compra "Finzen Pro" mediante Google Play Billing. Solo funciona
   * dentro de la app de Android (Trusted Web Activity).
   */
  const purchasePro = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const { paymentResponse, purchaseToken } = await purchaseProduct(PRO_SKU)
      const valid = await verifyPlayPurchase(purchaseToken, PRO_SKU)
      await completePaymentRequest(paymentResponse, valid)

      if (!valid) {
        setStatus('error')
        setError('No se pudo verificar la compra. Intenta de nuevo o contacta soporte.')
        return false
      }

      const record = {
        source: 'play',
        activated: true,
        purchaseToken,
        activatedAt: new Date().toISOString(),
      }
      saveLicense(record)
      setLicense(record)
      setStatus('idle')
      return true
    } catch (err) {
      setStatus(err?.name === 'AbortError' ? 'idle' : 'error')
      if (err?.name !== 'AbortError') {
        setError('No se pudo completar la compra. Intenta de nuevo.')
      }
      return false
    }
  }, [])

  const deactivate = useCallback(async () => {
    if (license?.source !== 'play' && license?.licenseKey && license?.instanceId) {
      try {
        await fetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            license_key: license.licenseKey,
            instance_id: license.instanceId,
          }),
        })
      } catch {
        // Ignore network errors — clear local state regardless
      }
    }
    saveLicense(null)
    setLicense(null)
    setStatus('idle')
    setError(null)
  }, [license])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      isPro,
      license,
      status,
      error,
      activate,
      deactivate,
      clearError,
      playBillingAvailable,
      purchasePro,
    }),
    [isPro, license, status, error, activate, deactivate, clearError, playBillingAvailable, purchasePro]
  )

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  )
}

export function useLicense() {
  return useContext(LicenseContext)
}
