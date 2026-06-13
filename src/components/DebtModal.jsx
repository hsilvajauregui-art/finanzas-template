import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import ColorPicker from './ColorPicker'
import { fmt } from '../utils/finance'

const emptyForm = {
  name: '',
  totalAmount: '',
  remainingAmount: '',
  monthlyPayment: '',
  interestRate: '',
  dueDay: '15',
  color: '#ef4444',
}

export default function DebtModal({ isOpen, onClose, debt }) {
  const { dispatch } = useFinance()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(debt)

  useEffect(() => {
    if (isOpen) {
      setForm(debt
        ? {
            ...debt,
            totalAmount: String(debt.totalAmount),
            remainingAmount: String(debt.remainingAmount),
            monthlyPayment: String(debt.monthlyPayment),
            interestRate: String(debt.interestRate),
            dueDay: String(debt.dueDay),
          }
        : emptyForm
      )
      setErrors({})
    }
  }, [isOpen, debt])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const remaining = Number(form.remainingAmount) || 0
  const monthly = Number(form.monthlyPayment) || 0
  const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : null

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (!form.totalAmount || isNaN(Number(form.totalAmount)) || Number(form.totalAmount) <= 0) e.totalAmount = 'Inválido'
    if (!form.remainingAmount || isNaN(remaining) || remaining < 0) e.remainingAmount = 'Inválido'
    if (!form.monthlyPayment || isNaN(monthly) || monthly <= 0) e.monthlyPayment = 'Inválido'
    if (!form.interestRate || isNaN(Number(form.interestRate)) || Number(form.interestRate) < 0) e.interestRate = 'Inválido'
    const day = Number(form.dueDay)
    if (!form.dueDay || isNaN(day) || day < 1 || day > 31) e.dueDay = '1–31'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = {
      ...form,
      totalAmount: Number(form.totalAmount),
      remainingAmount: remaining,
      monthlyPayment: monthly,
      interestRate: Number(form.interestRate),
      dueDay: Number(form.dueDay),
    }
    dispatch({ type: isEditing ? 'UPDATE_DEBT' : 'ADD_DEBT', payload })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar deuda' : 'Nueva deuda'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
            <input
              type="text" placeholder="Ej. Tarjeta BBVA"
              value={form.name} onChange={e => set('name', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto total</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.totalAmount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
              {errors.totalAmount && <p className="text-xs text-red-500 mt-1">{errors.totalAmount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Saldo restante</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.remainingAmount} onChange={e => set('remainingAmount', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.remainingAmount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
              {errors.remainingAmount && <p className="text-xs text-red-500 mt-1">{errors.remainingAmount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pago mensual</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.monthlyPayment} onChange={e => set('monthlyPayment', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.monthlyPayment ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
              {errors.monthlyPayment && <p className="text-xs text-red-500 mt-1">{errors.monthlyPayment}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tasa anual %</label>
              <input
                type="number" min="0" step="0.1" placeholder="0"
                value={form.interestRate} onChange={e => set('interestRate', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.interestRate ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
              {errors.interestRate && <p className="text-xs text-red-500 mt-1">{errors.interestRate}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Día de pago</label>
              <input
                type="number" min="1" max="31" placeholder="15"
                value={form.dueDay} onChange={e => set('dueDay', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.dueDay ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
              {errors.dueDay && <p className="text-xs text-red-500 mt-1">{errors.dueDay}</p>}
            </div>
          </div>

          {/* Payoff estimate */}
          {monthsLeft !== null && (
            <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              Liquidación estimada en <span className="font-semibold text-gray-700 dark:text-gray-200">{monthsLeft} meses</span>
              {' '}· {fmt(remaining)} ÷ {fmt(monthly)}/mes
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Color</label>
            <ColorPicker value={form.color} onChange={c => set('color', c)} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
              {isEditing ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
