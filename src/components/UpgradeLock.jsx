import { useState } from 'react'
import { Crown, Lock } from 'lucide-react'
import Paywall from './Paywall'

const FEATURE_COPY = {
  patrimony: {
    title: 'Patrimonio',
    desc: 'Visualiza la evolución de tus activos, deudas y patrimonio neto a lo largo del tiempo.',
  },
  debts: {
    title: 'Deudas',
    desc: 'Da seguimiento a tus deudas, calendarios de pago y estrategias de liquidación.',
  },
  analysis: {
    title: 'Análisis',
    desc: 'Desglose detallado de gastos e ingresos, comparativas y tendencias por categoría.',
  },
  data: {
    title: 'Exportar e importar datos',
    desc: 'Descarga respaldos completos en JSON/CSV y restaura tu información cuando lo necesites.',
  },
}

export default function UpgradeLock({ feature, onNavigate }) {
  const [showPaywall, setShowPaywall] = useState(false)
  const copy = FEATURE_COPY[feature] ?? { title: 'Esta función', desc: 'Disponible en el plan Pro.' }

  return (
    <>
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center mb-4">
          <Lock size={24} className="text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">
          {copy.title} es una función Pro
        </h2>
        <p className="text-sm text-gray-400 max-w-sm mb-6">{copy.desc}</p>
        <button
          onClick={() => setShowPaywall(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
        >
          <Crown size={16} strokeWidth={2} />
          Desbloquear con Finzen Pro
        </button>
      </div>
      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </>
  )
}
