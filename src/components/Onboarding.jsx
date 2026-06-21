import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'

const ACCOUNT_TYPES = [
  { value: 'debit',   label: 'Débito',   emoji: '💳' },
  { value: 'savings', label: 'Ahorro',   emoji: '🏦' },
  { value: 'digital', label: 'Digital',  emoji: '📱' },
  { value: 'cash',    label: 'Efectivo', emoji: '💵' },
  { value: 'credit',  label: 'Crédito',  emoji: '🔵' },
]

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16']

const STEPS = ['welcome', 'account', 'done']

export default function Onboarding({ onComplete }) {
  const { dispatch } = useFinance()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    type: 'debit',
    balance: '',
    color: '#3b82f6',
  })
  const [error, setError] = useState('')

  function set(field, val) {
    setForm(p => ({ ...p, [field]: val }))
    setError('')
  }

  function handleAddAccount() {
    if (!form.name.trim()) { setError('Escribe un nombre para la cuenta'); return }
    const balance = parseFloat(form.balance) || 0
    dispatch({
      type: 'ADD_ACCOUNT',
      payload: { name: form.name.trim(), type: form.type, balance, color: form.color },
    })
    setStep(2)
  }

  // STEP 0 — Welcome
  if (step === 0) return (
    <Screen>
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
          <svg viewBox="0 0 40 40" className="w-12 h-12">
            <rect x="6" y="24" width="7" height="10" rx="2" fill="white" opacity="0.75"/>
            <rect x="16" y="16" width="7" height="18" rx="2" fill="white"/>
            <rect x="26" y="8" width="7" height="26" rx="2" fill="white" opacity="0.75"/>
            <circle cx="9.5" cy="21" r="2.5" fill="white" opacity="0.9"/>
            <circle cx="19.5" cy="13" r="2.5" fill="white" opacity="0.9"/>
            <circle cx="29.5" cy="5.5" r="2.5" fill="white" opacity="0.9"/>
            <path d="M9.5 21 L19.5 13 L29.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Bienvenido a Finzen</h1>
        <p className="text-slate-400 text-sm max-w-xs mb-8">
          En menos de un minuto vas a tener el control de tus finanzas. Empecemos configurando tu primera cuenta.
        </p>

        <div className="w-full space-y-3 mb-8">
          {[
            ['📊', 'Dashboard en tiempo real', 'Saldo, ingresos y gastos de un vistazo'],
            ['💳', 'Múltiples cuentas', 'Débito, ahorro, efectivo, digital...'],
            ['📈', 'Patrimonio e inversiones', 'Ve cómo crece tu riqueza con el tiempo'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-3 text-left">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-slate-400 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep(1)}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
        >
          Empezar →
        </button>
      </div>
    </Screen>
  )

  // STEP 1 — Add first account
  if (step === 1) return (
    <Screen>
      <StepDots current={0} total={1} />
      <h2 className="text-xl font-bold text-white mb-1">Primera cuenta</h2>
      <p className="text-slate-400 text-sm mb-6">¿Con cuál cuenta quieres empezar?</p>

      {/* Type */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {ACCOUNT_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => set('type', t.value)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition ${
              form.type === t.value
                ? 'border-blue-500 bg-blue-600/20 text-white'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            <span className="text-lg">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre de la cuenta</label>
        <input
          type="text"
          placeholder="Ej. BBVA Débito, Efectivo, Nu..."
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Balance */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Saldo actual (opcional)</label>
        <input
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={form.balance}
          onChange={e => set('balance', e.target.value)}
          className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Color */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Color</label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => set('color', c)}
              className={`w-7 h-7 rounded-full transition ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <button
        onClick={handleAddAccount}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
      >
        Agregar cuenta →
      </button>

      <button
        onClick={() => setStep(2)}
        className="w-full py-2 mt-2 text-slate-500 text-sm hover:text-slate-300 transition"
      >
        Saltar por ahora
      </button>
    </Screen>
  )

  // STEP 2 — Done
  return (
    <Screen>
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">¡Todo listo!</h2>
        <p className="text-slate-400 text-sm max-w-xs mb-8">
          Tu cuenta está configurada. Ahora puedes registrar tus primeros movimientos y empezar a ver el panorama de tus finanzas.
        </p>

        <div className="w-full space-y-2 mb-8 text-left">
          {[
            '➕  Registra ingresos y gastos con el botón +',
            '🔄  Haz traspasos entre tus cuentas',
            '📊  Revisa el análisis de gastos cada mes',
          ].map(tip => (
            <div key={tip} className="bg-slate-800/60 rounded-xl px-4 py-2.5 text-slate-300 text-sm">
              {tip}
            </div>
          ))}
        </div>

        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
        >
          Ir al dashboard →
        </button>
      </div>
    </Screen>
  )
}

function Screen({ children }) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}

function StepDots({ current, total }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {Array.from({ length: total + 1 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'}`}
        />
      ))}
    </div>
  )
}
