import { useState, useEffect, useMemo } from 'react'
import { X, ArrowRight, CreditCard, Smartphone, Banknote, Wallet, TrendingUp } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useAppearance } from '../context/AppearanceContext'

const today = () => new Date().toISOString().split('T')[0]

const ACCOUNT_ICONS = {
  debit: CreditCard,
  credit: CreditCard,
  digital: Smartphone,
  cash: Banknote,
  savings: Wallet,
}

function AccountIcon({ type, size = 14 }) {
  const Icon = ACCOUNT_ICONS[type] ?? Wallet
  return <Icon size={size} strokeWidth={1.75} />
}

const emptyForm = { fromId: '', toId: '', amount: '', date: today(), note: '' }

export default function TransferModal({ isOpen, onClose, transfer = null }) {
  const { state, dispatch } = useFinance()
  const { fmt, currency } = useAppearance()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  // destType: 'account' | 'asset'
  const [destType, setDestType] = useState('account')

  useEffect(() => {
    if (isOpen) {
      if (transfer) {
        // If editing a transfer-to-asset, detect it
        const isAssetTransfer = !!transfer.toAsset
        setDestType(isAssetTransfer ? 'asset' : 'account')
        setForm({
          fromId: String(transfer.account),
          toId:   String(isAssetTransfer ? transfer.toAsset : (transfer.toAccount ?? '')),
          amount: String(transfer.amount),
          date:   transfer.date,
          note:   transfer.note || '',
        })
      } else {
        setDestType('account')
        const [first, second] = state.accounts
        setForm({
          ...emptyForm,
          fromId: first?.id  ? String(first.id)  : '',
          toId:   second?.id ? String(second.id) : '',
        })
      }
      setErrors({})
    }
  }, [isOpen, transfer])

  // Reset toId when destType changes
  function switchDestType(type) {
    setDestType(type)
    setForm(prev => ({ ...prev, toId: '' }))
    setErrors(e => ({ ...e, toId: null }))
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const fromAccount = useMemo(
    () => state.accounts.find(a => a.id === Number(form.fromId)),
    [form.fromId, state.accounts]
  )
  const toAccount = useMemo(
    () => destType === 'account' ? state.accounts.find(a => a.id === Number(form.toId)) : null,
    [form.toId, state.accounts, destType]
  )
  const toAsset = useMemo(
    () => destType === 'asset' ? state.assets.find(a => a.id === Number(form.toId)) : null,
    [form.toId, state.assets, destType]
  )
  const amount = Number(form.amount) || 0

  const effectiveFromBalance = useMemo(() => {
    if (!fromAccount) return null
    if (transfer && fromAccount.id === transfer.account) return fromAccount.balance + transfer.amount
    return fromAccount.balance
  }, [fromAccount, transfer])

  const fromAfter = effectiveFromBalance !== null ? effectiveFromBalance - amount : null
  const toAfter   = toAccount ? toAccount.balance + amount : null
  const assetAfter = toAsset ? toAsset.value + amount : null

  function validate() {
    const e = {}
    if (!form.fromId) e.fromId = 'Requerido'
    if (!form.toId) e.toId = 'Requerido'
    if (destType === 'account' && form.fromId && form.toId && form.fromId === form.toId) e.toId = 'Debe ser diferente'
    if (!form.amount || isNaN(amount) || amount <= 0) e.amount = 'Monto inválido'
    if (fromAccount && amount > effectiveFromBalance) e.amount = `Saldo insuficiente (${fmt(effectiveFromBalance)})`
    if (!form.date) e.date = 'Requerido'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (destType === 'asset') {
      dispatch({
        type: 'TRANSFER_TO_ASSET',
        payload: {
          fromId:     Number(form.fromId),
          toAssetId:  Number(form.toId),
          amount,
          date:       form.date,
          note:       form.note,
        },
      })
    } else if (transfer) {
      dispatch({
        type: 'UPDATE_TRANSFER',
        payload: {
          old:    transfer,
          fromId: Number(form.fromId),
          toId:   Number(form.toId),
          amount,
          date:   form.date,
          note:   form.note,
        },
      })
    } else {
      dispatch({
        type: 'TRANSFER',
        payload: {
          fromId: Number(form.fromId),
          toId:   Number(form.toId),
          amount,
          date:   form.date,
          note:   form.note,
        },
      })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {transfer ? 'Editar traspaso' : 'Nuevo traspaso'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Destination type toggle (only for new transfers) */}
          {!transfer && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tipo de destino</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => switchDestType('account')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    destType === 'account'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  Cuenta
                </button>
                <button
                  type="button"
                  onClick={() => switchDestType('asset')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    destType === 'asset'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  Activo
                </button>
              </div>
            </div>
          )}

          {/* From → To */}
          <div className="flex items-start gap-3">
            {/* From */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Origen</label>
              <select
                value={form.fromId}
                onChange={e => set('fromId', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.fromId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <option value="">Cuenta...</option>
                {state.accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.fromId && <p className="text-xs text-red-500 mt-1">{errors.fromId}</p>}
            </div>

            <div className="flex items-end pb-2">
              <ArrowRight size={18} className="text-gray-400 mt-6" strokeWidth={1.75} />
            </div>

            {/* To */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Destino</label>
              {destType === 'account' ? (
                <select
                  value={form.toId}
                  onChange={e => set('toId', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    errors.toId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <option value="">Cuenta...</option>
                  {state.accounts
                    .filter(a => a.id !== Number(form.fromId))
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
              ) : (
                <select
                  value={form.toId}
                  onChange={e => set('toId', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    errors.toId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <option value="">Activo...</option>
                  {state.assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
              {errors.toId && <p className="text-xs text-red-500 mt-1">{errors.toId}</p>}
            </div>
          </div>

          {/* Balance preview */}
          {(fromAccount || toAccount || toAsset) && (
            <div className="flex gap-3">
              {fromAccount && (
                <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fromAccount.color }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{fromAccount.name}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(effectiveFromBalance)}</p>
                  {amount > 0 && (
                    <p className={`text-xs mt-0.5 ${fromAfter < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      → {fmt(fromAfter)}
                    </p>
                  )}
                </div>
              )}
              {toAccount && (
                <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: toAccount.color }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toAccount.name}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(toAccount.balance)}</p>
                  {amount > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">→ {fmt(toAfter)}</p>
                  )}
                </div>
              )}
              {toAsset && (
                <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: toAsset.color ?? '#3b82f6' }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toAsset.name}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(toAsset.value)}</p>
                  {amount > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">→ {fmt(assetAfter)}</p>
                  )}
                </div>
              )}
            </div>
          )}

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

          {/* Date + Note */}
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
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nota (opcional)</label>
              <input
                type="text"
                placeholder="Ej. Ahorro mensual"
                value={form.note}
                onChange={e => set('note', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
              {transfer ? 'Guardar cambios' : 'Confirmar traspaso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
