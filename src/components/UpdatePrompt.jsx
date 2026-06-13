import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 z-40 w-72 bg-white dark:bg-gray-900 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-xl p-4 flex gap-3 items-start">
      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
        <RefreshCw size={16} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Actualización disponible</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Hay una nueva versión de la app lista para instalar
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            Actualizar ahora
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Después
          </button>
        </div>
      </div>

      <button
        onClick={() => setNeedRefresh(false)}
        className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
