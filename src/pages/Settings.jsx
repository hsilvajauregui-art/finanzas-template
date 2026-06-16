import { useState, useRef, useEffect } from 'react'
import { Download, Upload, RotateCcw, FileJson, FileText, CheckCircle, XCircle, AlertTriangle, Smartphone, Info, Crown, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { emptyState } from '../context/FinanceContext'
import { useAppearance } from '../context/AppearanceContext'
import { useLicense } from '../context/LicenseContext'
import config from '../config'
import UpgradeLock from '../components/UpgradeLock'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStamp() {
  return new Date().toISOString().split('T')[0]
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `finanzas-backup-${dateStamp()}.json`)
}

function exportCSV(state) {
  const accountMap = Object.fromEntries(state.accounts.map(a => [a.id, a.name]))
  const TYPE_LABEL = { income: 'Ingreso', expense: 'Gasto', transfer: 'Traspaso' }
  const headers = ['Fecha', 'Tipo', 'Categoría', 'Subcategoría', 'Monto', 'Cuenta', 'Nota']
  const rows = [...state.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(t => [
      t.date,
      TYPE_LABEL[t.type] ?? t.type,
      t.category,
      t.subcategory || '',
      t.amount,
      accountMap[t.account] || '',
      t.note || '',
    ])
  const escape = v => `"${String(v).replace(/"/g, '""')}"`
  const csv = '﻿' + [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `finanzas-historial-${dateStamp()}.csv`)
}

const REQUIRED_KEYS = ['transactions', 'accounts', 'debts', 'assets', 'goals', 'incomes', 'categories']

function validateImport(data) {
  if (typeof data !== 'object' || data === null) return 'El archivo no es un objeto JSON válido.'
  const missing = REQUIRED_KEYS.filter(k => !(k in data))
  if (missing.length) return `Faltan campos requeridos: ${missing.join(', ')}`
  if (!Array.isArray(data.transactions)) return '"transactions" debe ser un array.'
  if (!Array.isArray(data.accounts)) return '"accounts" debe ser un array.'
  return null
}

function importSummary(data) {
  return [
    { label: 'Transacciones', value: data.transactions?.length ?? 0 },
    { label: 'Cuentas', value: data.accounts?.length ?? 0 },
    { label: 'Deudas', value: data.debts?.length ?? 0 },
    { label: 'Activos', value: data.assets?.length ?? 0 },
    { label: 'Metas', value: data.goals?.length ?? 0 },
  ]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function ActionRow({ icon: Icon, label, description, onClick, variant = 'default', disabled = false }) {
  const variants = {
    default: 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
    primary: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950',
    danger: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950',
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${variants[variant]}`}>
          <Icon size={17} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}
      >
        Ejecutar
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { state, dispatch } = useFinance()
  const { fmt } = useAppearance()
  const {
    isPro,
    license,
    status: licenseStatus,
    error: licenseError,
    activate,
    deactivate,
    clearError,
    playBillingAvailable,
    purchasePro,
  } = useLicense()
  const fileInputRef = useRef(null)

  const [importFile, setImportFile] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [licenseKeyInput, setLicenseKeyInput] = useState('')
  const [activateSuccess, setActivateSuccess] = useState(false)

  async function handleActivate() {
    setActivateSuccess(false)
    const ok = await activate(licenseKeyInput)
    if (ok) {
      setActivateSuccess(true)
      setLicenseKeyInput('')
    }
  }

  async function handlePurchasePro() {
    setActivateSuccess(false)
    const ok = await purchasePro()
    if (ok) {
      setActivateSuccess(true)
    }
  }

  function handleDeactivate() {
    deactivate()
    setActivateSuccess(false)
  }

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  // ── Stats about current data
  const stats = [
    { label: 'Transacciones', value: state.transactions.length },
    { label: 'Cuentas', value: state.accounts.length },
    { label: 'Deudas', value: state.debts.length },
    { label: 'Activos', value: state.assets.length },
    { label: 'Metas', value: state.goals.length },
    { label: 'Total en cuentas', value: fmt(state.accounts.reduce((s, a) => s + a.balance, 0)) },
  ]

  // ── File input handler
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const error = validateImport(data)
        setImportFile({ name: file.name, data: error ? null : data, error })
      } catch {
        setImportFile({ name: file.name, data: null, error: 'El archivo no es un JSON válido.' })
      }
    }
    reader.readAsText(file)
    // Reset input so selecting the same file again triggers onChange
    e.target.value = ''
  }

  function handleImport() {
    if (!importFile?.data) return
    dispatch({ type: 'LOAD', payload: importFile.data })
    setImportStatus('success')
    setImportFile(null)
  }

  function handleReset() {
    if (!resetConfirm) { setResetConfirm(true); return }
    dispatch({ type: 'LOAD', payload: emptyState })
    setResetConfirm(false)
    setImportFile(null)
    setImportStatus(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Datos</h2>
        <p className="text-sm text-gray-400 mt-0.5">Exporta, importa o restablece tu información financiera</p>
      </div>

      {/* Plan / Licencia */}
      <SectionCard
        title="Plan"
        description={isPro ? 'Tienes acceso completo a todas las funciones' : 'Estás usando el plan Free con funciones limitadas'}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isPro
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}>
            {isPro ? <Crown size={20} strokeWidth={2} /> : <ShieldCheck size={20} strokeWidth={1.75} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {isPro ? 'Finzen Pro' : 'Plan Free'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isPro
                ? 'Cuentas ilimitadas, historial completo, Patrimonio, Deudas, Análisis y exportación de datos.'
                : `Hasta ${config.licensing.freeAccountLimit} cuentas, últimos ${config.licensing.freeHistoryDays} días de historial y Dashboard básico.`}
            </p>
          </div>
        </div>

        {isPro ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
              <CheckCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">
                {license?.source === 'play'
                  ? 'Suscripción verificada con Google Play'
                  : `Suscripción activa${license?.licenseKey ? ` · ${'•'.repeat(6)}${license.licenseKey.slice(-4)}` : ''}`}
              </p>
            </div>
            {license?.source !== 'play' && (
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={config.licensing.customerPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink size={12} strokeWidth={2} />
                  Gestionar suscripción
                </a>
                <button
                  onClick={handleDeactivate}
                  className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Desconectar de este dispositivo
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activateSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">¡Suscripción activada! Ya tienes acceso Pro.</p>
              </div>
            )}
            {licenseError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{licenseError}</p>
              </div>
            )}

            {playBillingAvailable ? (
              <button
                onClick={handlePurchasePro}
                disabled={licenseStatus === 'loading'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                <Crown size={14} strokeWidth={2} />
                {licenseStatus === 'loading' ? 'Procesando…' : 'Suscribirse a Finzen Pro — $59/mes'}
              </button>
            ) : (
              <>
                <a
                  href={config.licensing.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Crown size={16} strokeWidth={2} />
                    <div className="text-left">
                      <p className="text-sm font-semibold">Obtener Finzen Pro</p>
                      <p className="text-xs text-amber-100">$59 MXN / mes · cancela cuando quieras</p>
                    </div>
                  </div>
                  <ExternalLink size={14} strokeWidth={2} className="text-amber-200" />
                </a>

                <div className="space-y-1.5">
                  <p className="text-xs text-gray-400 font-medium">¿Ya tienes una suscripción? Ingresa tu clave de acceso:</p>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.75} />
                      <input
                        type="text"
                        value={licenseKeyInput}
                        onChange={e => { setLicenseKeyInput(e.target.value); clearError() }}
                        placeholder="Clave de acceso"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleActivate}
                      disabled={licenseStatus === 'loading' || !licenseKeyInput.trim()}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      {licenseStatus === 'loading' ? 'Activando…' : 'Activar'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SectionCard>

      {/* Current data summary */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos actuales</p>
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export / Import — Pro only */}
      {!isPro ? (
        <SectionCard
          title="Exportar e importar"
          description="Respaldos y restauración de datos"
        >
          <UpgradeLock feature="data" />
        </SectionCard>
      ) : (
      <>
      {/* Export */}
      <SectionCard
        title="Exportar"
        description="Descarga tus datos para guardar un respaldo o migrar a otro dispositivo"
      >
        <ActionRow
          icon={FileJson}
          label="Exportar respaldo completo (.json)"
          description="Incluye transacciones, cuentas, deudas, activos y metas"
          variant="primary"
          onClick={() => exportJSON(state)}
        />
        <ActionRow
          icon={FileText}
          label="Exportar historial de transacciones (.csv)"
          description={`${state.transactions.length} registros — compatible con Excel y Google Sheets`}
          onClick={() => exportCSV(state)}
        />
      </SectionCard>

      {/* Import */}
      <SectionCard
        title="Importar"
        description="Restaura tus datos desde un archivo de respaldo .json"
      >
        {importStatus === 'success' && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Datos restaurados correctamente</p>
          </div>
        )}

        {/* File drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${
            importFile?.error
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50'
              : importFile?.data
              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          {!importFile ? (
            <>
              <Upload size={22} className="text-gray-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Haz clic para seleccionar un archivo
              </p>
              <p className="text-xs text-gray-400 mt-1">Solo archivos .json exportados desde esta app</p>
            </>
          ) : importFile.error ? (
            <>
              <XCircle size={22} className="text-red-500 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{importFile.name}</p>
              <p className="text-xs text-red-500 mt-1">{importFile.error}</p>
              <p className="text-xs text-gray-400 mt-2">Haz clic para seleccionar otro archivo</p>
            </>
          ) : (
            <>
              <CheckCircle size={22} className="text-green-500 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">{importFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">Archivo válido · haz clic para cambiar</p>
            </>
          )}
        </div>

        {/* Preview */}
        {importFile?.data && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Vista previa del archivo
            </p>
            <div className="grid grid-cols-5 gap-2">
              {importSummary(importFile.data).map(s => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-3 flex items-center gap-1.5">
              <AlertTriangle size={12} strokeWidth={2} />
              Esto reemplazará todos tus datos actuales. Esta acción no se puede deshacer.
            </p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!importFile?.data}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
        >
          Restaurar datos desde archivo
        </button>
      </SectionCard>
      </>
      )}

      {/* PWA status */}
      <SectionCard
        title="Aplicación instalable (PWA)"
        description="Instala la app en tu dispositivo para acceder sin navegador y con soporte offline"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
            <img src="/icon.svg" alt="App icon" className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Finanzas Personal</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Control de finanzas · versión instalable
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {isStandalone ? (
                <>
                  <CheckCircle size={13} className="text-green-500" strokeWidth={2} />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Instalada y corriendo como app</span>
                </>
              ) : (
                <>
                  <Smartphone size={13} className="text-blue-500" strokeWidth={2} />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Busca el banner de instalación o el ícono en la barra del navegador
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { icon: '⚡', text: 'Carga instantánea gracias al Service Worker' },
            { icon: '📴', text: 'Funciona sin conexión — tus datos están en el dispositivo' },
            { icon: '🏠', text: 'Acceso directo desde pantalla de inicio' },
            { icon: '🔒', text: 'Sin necesidad de cuenta — datos 100% locales' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Demo data note */}
      <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800 p-4 flex gap-3 items-start">
        <Info size={16} strokeWidth={1.75} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">¿Explorando con datos de ejemplo?</p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
            La app viene precargada con un historial ficticio para que puedas explorar todas las funciones.
            Cuando estés listo para ingresar tus propios datos, usa el botón <span className="font-semibold">Borrar todos los datos</span> de abajo para empezar desde cero.
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100 dark:border-red-900">
          <h3 className="text-base font-semibold text-red-700 dark:text-red-400">Zona de peligro</h3>
          <p className="text-sm text-gray-400 mt-0.5">Estas acciones son permanentes e irreversibles</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                <RotateCcw size={17} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Borrar todos los datos</p>
                <p className="text-xs text-gray-400">Elimina todas las transacciones, cuentas, deudas y activos</p>
              </div>
            </div>
            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="px-4 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Restablecer
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">¿Confirmas?</p>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  Sí, restablecer
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
