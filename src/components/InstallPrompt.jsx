import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', '1')
    setVisible(false)
  }

  useEffect(() => {
    if (localStorage.getItem('pwa-install-dismissed') === '1') return
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setVisible(false)
      setInstalled(true)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible || installed) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-4 flex gap-3 items-start">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
        <img src="/icon.svg" alt="App icon" className="w-6 h-6" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Instalar app</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          Agrega Finanzas a tu pantalla de inicio para acceder sin internet
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <Download size={12} strokeWidth={2.5} />
            Instalar
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
