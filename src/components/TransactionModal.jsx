import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useAppearance } from '../context/AppearanceContext'

const today = () => new Date().toISOString().split('T')[0]

const emptyForm = {
  type: 'expense',
  category: '',
  subcategory: '',
  amount: '',
  date: today(),
  account: '',
  note: '',
}

export default function TransactionModal({ isOpen, onClose, transaction, onSuccess }) {
  const { state, dispatch } = useFinance()
  const { currency } = useAppearance()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const isEditing = Boolean(transaction)

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setForm({ ...transaction, amount: String(transaction.amount) })
      } else {
        setForm({ ...emptyForm, account: state.accounts[0]?.id ?? '' })
      }
      setErrors({})
    }
  }, [isOpen, transaction])

  const categories = state.categories?.[form.type] ?? []
  const selectedCat = categories.find(c => c.name === form.category)
  const subcategories = selectedCat?.subcategories ?? []

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Reset subcategory when category changes
      if (field === 'category') next.subcategory = ''
      // Reset category + subcategory when type changes
      if (field === 'type') { next.category = ''; next.subcategory = '' }
      return next
    })
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.category) e.category = 'Requerido'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Monto inválido'
    if (!form.date) e.date = 'Requerido'
    if (!form.account) e.account = 'Requerido'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = { ...form, amount: Number(form.amount), account: Number(form.account) }

    if (isEditing) {
      dispatch({ type: 'UPDATE_TRANSACTION', payload })
      onSuccess?.('Transacción actualizada')
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload })
      onSuccess?.('Transacción guardada')
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar transacción' : 'Nueva transacción'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 gap-1">
            {['expense', 'income'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
                      : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t === 'expense' ? 'Gasto' : 'Ingreso'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto ({currency})</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                errors.amount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                errors.category ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <option value="" disabled>Seleccionar...</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subcategoría</label>
              <select
                value={form.subcategory}
                onChange={e => set('subcategory', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">Sin subcategoría</option>
                {subcategories.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date + Account (2 columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.date ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cuenta</label>
              <select
                value={form.account}
                onChange={e => set('account', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.account ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <option value="">Cuenta...</option>
                {state.accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.account && <p className="text-xs text-red-500 mt-1">{errors.account}</p>}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nota (opcional)</label>
            <input
              type="text"
              placeholder="Ej. Walmart semanal"
              value={form.note}
              onChange={e => set('note', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              {isEditing ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
