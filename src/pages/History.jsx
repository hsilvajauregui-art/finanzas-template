import { useState } from 'react'
import { Pencil, Trash2, Crown } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useAppearance } from '../context/AppearanceContext'
import { useLicense } from '../context/LicenseContext'
import config from '../config'
import TransferModal from '../components/TransferModal'

const TYPE_LABELS = { all: 'Todo', income: 'Ingresos', expense: 'Gastos', transfer: 'Traspasos' }
const TYPE_COLORS = {
  income: 'text-green-600 dark:text-green-400',
  expense: 'text-red-600 dark:text-red-400',
  transfer: 'text-blue-600 dark:text-blue-400',
}
const TYPE_SIGN = { income: '+', expense: '-', transfer: '↔ ' }

export default function History({ onEditTransaction, onNavigate }) {
  const { state, dispatch } = useFinance()
  const { fmt, fmtDate } = useAppearance()
  const { isPro } = useLicense()
  const [filter, setFilter] = useState('all')
  const [editingTransfer, setEditingTransfer] = useState(null)

  const historyCutoff = new Date()
  historyCutoff.setDate(historyCutoff.getDate() - config.licensing.freeHistoryDays)

  const hiddenByPlan = !isPro
    ? state.transactions.filter(t => new Date(t.date) < historyCutoff).length
    : 0

  const filtered = [...state.transactions]
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => isPro || new Date(t.date) >= historyCutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  function handleDelete(id) {
    if (confirm('¿Eliminar esta transacción?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: id })
    }
  }

  function handleDeleteTransfer(t) {
    if (confirm('¿Eliminar este traspaso? Se revertirán los saldos de las cuentas involucradas.')) {
      dispatch({ type: 'DELETE_TRANSFER', payload: t })
    }
  }

  function handleEditTransfer(t) {
    setEditingTransfer(t)
  }

  function closeTransferModal() {
    setEditingTransfer(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historial</h2>
        <span className="text-sm text-gray-400">{filtered.length} registros</span>
      </div>

      {/* Free plan history limit notice */}
      {hiddenByPlan > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Plan Free: solo se muestran los últimos {config.licensing.freeHistoryDays} días.
            {' '}{hiddenByPlan} {hiddenByPlan === 1 ? 'transacción anterior está oculta' : 'transacciones anteriores están ocultas'}.
          </p>
          <button onClick={() => onNavigate?.('settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shrink-0">
            <Crown size={13} strokeWidth={2} />Obtener Pro
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(TYPE_LABELS).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Sin transacciones.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(t => {
              const account  = state.accounts.find(a => a.id === t.account)
              const toAcct   = t.type === 'transfer'
                ? state.accounts.find(a => a.id === t.toAccount)
                : null

              const subtitle = t.type === 'transfer'
                ? `${fmtDate(t.date)} · ${account?.name ?? '—'} → ${toAcct?.name ?? '(eliminada)'}${t.note ? ` · ${t.note}` : ''}`
                : `${fmtDate(t.date)}${account ? ` · ${account.name}` : ''}${t.note ? ` · ${t.note}` : ''}`

              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  {/* Color dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    t.type === 'income' ? 'bg-green-500' :
                    t.type === 'transfer' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {t.category}{t.subcategory ? ` · ${t.subcategory}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                  </div>

                  {/* Amount */}
                  <span className={`text-sm font-semibold shrink-0 ${TYPE_COLORS[t.type] ?? ''}`}>
                    {TYPE_SIGN[t.type]}{fmt(t.amount)}
                  </span>

                  {/* Actions — visible on hover (desktop) / always visible (mobile) */}
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => t.type === 'transfer' ? handleEditTransfer(t) : onEditTransaction(t)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => t.type === 'transfer' ? handleDeleteTransfer(t) : handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <TransferModal
        isOpen={editingTransfer !== null}
        onClose={closeTransferModal}
        transfer={editingTransfer}
      />
    </div>
  )
}
