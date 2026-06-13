import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import ColorPicker from './ColorPicker'

const ASSET_TYPES = [
  { value: 'investment', label: 'Inversión' },
  { value: 'property', label: 'Inmueble' },
  { value: 'vehicle', label: 'Vehículo' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'other', label: 'Otro' },
]

const emptyForm = { name: '', type: 'investment', value: '', currency: 'MXN', color: '#3b82f6' }

export default function AssetModal({ isOpen, onClose, asset }) {
  const { dispatch } = useFinance()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(asset)

  useEffect(() => {
    if (isOpen) {
      setForm(asset ? { ...asset, value: String(asset.value) } : emptyForm)
      setErrors({})
    }
  }, [isOpen, asset])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) < 0) e.value = 'Valor inválido'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form, value: Number(form.value) }
    dispatch({ type: isEditing ? 'UPDATE_ASSET' : 'ADD_ASSET', payload })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar activo' : 'Nuevo activo'}
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
              placeholder="Ej. CETES 28d"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={e => set('currency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.value}
              onChange={e => set('value', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.value ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
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
