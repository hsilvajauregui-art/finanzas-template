import { useState, useEffect } from 'react'
import { Crown, Check, X, Loader } from 'lucide-react'
import { useLicense } from '../context/LicenseContext'
import { Capacitor } from '@capacitor/core'
import { getOfferings, purchasePackage, restorePurchases } from '../lib/revenuecat'

const WEB_CHECKOUT_URL = 'https://finzen.lemonsqueezy.com/buy/finzen-pro'

export default function Paywall({ onClose }) {
  const { isPro, status } = useLicense()
  const [offerings, setOfferings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    if (isNative) {
      getOfferings().then(setOfferings)
    }
  }, [isNative])

  async function handlePurchase(pkg) {
    setLoading(true)
    setError(null)
    try {
      const pro = await purchasePackage(pkg)
      if (pro) setSuccess(true)
      else setError('No se pudo completar la compra.')
    } catch (e) {
      if (e?.code !== 'PURCHASE_CANCELLED') {
        setError('Error al procesar la compra. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore() {
    setLoading(true)
    setError(null)
    try {
      const pro = await restorePurchases()
      if (pro) setSuccess(true)
      else setError('No se encontraron compras previas.')
    } catch {
      setError('Error al restaurar compras.')
    } finally {
      setLoading(false)
    }
  }

  if (success || isPro) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Bienvenido a Pro!</h2>
          <p className="text-sm text-gray-400 mb-6">Ya tienes acceso a todas las funciones de Finzen Pro.</p>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm">
            Continuar
          </button>
        </div>
      </div>
    )
  }

  const packages = offerings?.availablePackages ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-8 pb-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
            <X size={20} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Crown size={26} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Finzen Pro</h2>
          <p className="text-blue-200 text-sm mt-1">Desbloquea todas las funciones</p>
        </div>

        {/* Features */}
        <div className="px-6 py-4 space-y-2.5">
          {[
            'Patrimonio neto y activos',
            'Gestión de deudas',
            'Análisis avanzado',
            'Exportar e importar datos',
            'Cuentas ilimitadas',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5">
              <Check size={16} className="text-blue-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
            </div>
          ))}
        </div>

        {/* Purchase options */}
        <div className="px-6 pb-6 space-y-3">
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {isNative ? (
            packages.length > 0 ? (
              packages.map(pkg => (
                <button
                  key={pkg.identifier}
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader size={16} className="animate-spin" /> : null}
                  {pkg.product.title} — {pkg.product.priceString}
                </button>
              ))
            ) : (
              <button
                disabled
                className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-400 text-sm"
              >
                Cargando planes...
              </button>
            )
          ) : (
            <a
              href={WEB_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm text-center"
            >
              Suscribirse — desde $69 MXN/mes
            </a>
          )}

          {isNative && (
            <button
              onClick={handleRestore}
              disabled={loading}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Restaurar compras anteriores
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
