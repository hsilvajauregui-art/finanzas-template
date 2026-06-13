import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import ColorPicker from './ColorPicker'
import { fmt } from '../utils/finance'

const emptyForm = { name: '', targetAmount: '', currentAmount: '', deadline: '', color: '#3b82f6' }

export default function GoalModal({ isOpen, onClose, goal }) {
  const { dispatch } = useFinance()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(goal)

  useEffect(() => {
    if (isOpen) {
      setForm(goal
        ? { ...goal, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount) }
        : emptyForm
      )
      setErrors({})
    }
  }, [isOpen, goal])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const target = Number(form.targetAmount) || 0
  const current = Number(form.currentAmount) || 0
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (!form.targetAmount || isNaN(target) || target <= 0) e.targetAmount = 'Monto inválido'
    if (form.currentAmount && (isNaN(current) || current < 0)) e.currentAmount = 'Monto inválido'
    if (!form.deadline) e.deadline = 'Requerido'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form, targetAmount: target, currentAmount: current }
    dispatch({ type: isEditing ? 'UPDATE_GOAL' : 'ADD_GOAL', payload })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar meta' : 'Nueva meta'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
            <input
              type="text"
              placeholder="Ej. Fondo de emergencia"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Meta (MXN)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.targetAmount}
                onChange={e => set('targetAmount', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.targetAmount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
              {errors.targetAmount && <p className="text-xs text-red-500 mt-1">{errors.targetAmount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ahorrado</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.currentAmount}
                onChange={e => set('currentAmount', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.currentAmount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
            </div>
          </div>

          {/* Progress preview */}
          {target > 0 && (
            <div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: form.color }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{progress.toFixed(0)}% · faltan {fmt(target - current)}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha límite</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.deadline ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
          </div>

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
