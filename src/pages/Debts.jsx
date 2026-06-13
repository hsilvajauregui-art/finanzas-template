import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, Calendar, Clock } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import DebtModal from '../components/DebtModal'
import { daysUntilPayment } from '../utils/finance'
import { useAppearance } from '../context/AppearanceContext'

function urgencyStyle(days) {
  if (days <= 3) return { badge: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400', icon: 'text-red-500' }
  if (days <= 7) return { badge: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400', icon: 'text-orange-500' }
  return { badge: 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400', icon: 'text-gray-400' }
}

export default function Debts() {
  const { state, dispatch } = useFinance()
  const { fmt } = useAppearance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState(null)

  const totalDebt = useMemo(() => state.debts.reduce((s, d) => s + d.remainingAmount, 0), [state.debts])
  const totalMonthly = useMemo(() => state.debts.reduce((s, d) => s + d.monthlyPayment, 0), [state.debts])
  const monthlyIncome = useMemo(() => state.incomes.reduce((s, i) => s + i.amount, 0), [state.incomes])
  const debtRatio = monthlyIncome > 0 ? (totalMonthly / monthlyIncome) * 100 : 0

  function openEdit(debt) { setEditingDebt(debt); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingDebt(null) }

  // Sort debts: most urgent first (by days until payment)
  const sortedDebts = useMemo(
    () => [...state.debts].sort((a, b) => daysUntilPayment(a.dueDay) - daysUntilPayment(b.dueDay)),
    [state.debts]
  )

  // Next 3 upcoming payments for the calendar strip
  const upcoming = useMemo(
    () =>
      [...state.debts]
        .map(d => ({ ...d, days: daysUntilPayment(d.dueDay) }))
        .sort((a, b) => a.days - b.days)
        .slice(0, 3),
    [state.debts]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deudas</h2>
        <button
          onClick={() => { setEditingDebt(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Nueva deuda
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Deuda total</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmt(totalDebt)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pago mensual total</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{fmt(totalMonthly)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">% de ingresos en deuda</p>
          <p className={`text-2xl font-bold mt-1 ${debtRatio > 40 ? 'text-red-600 dark:text-red-400' : debtRatio > 25 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
            {debtRatio.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">{debtRatio <= 25 ? 'Saludable' : debtRatio <= 40 ? 'Moderado' : 'Alto'}</p>
        </div>
      </div>

      {/* Upcoming payments strip */}
      {upcoming.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Próximos pagos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map(d => {
              const { badge, icon } = urgencyStyle(d.days)
              return (
                <div key={d.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${badge}`}>
                  <Clock size={14} className={icon} strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{d.name}</p>
                    <p className="text-xs opacity-75">
                      {d.days === 0 ? 'Hoy' : d.days === 1 ? 'Mañana' : `en ${d.days} días`} · día {d.dueDay}
                    </p>
                  </div>
                  <span className="text-xs font-bold shrink-0">{fmt(d.monthlyPayment)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Debt cards */}
      {state.debts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <AlertCircle size={18} className="text-gray-400" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-gray-400">Sin deudas registradas</p>
          <button onClick={() => { setEditingDebt(null); setModalOpen(true) }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Agregar primera deuda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedDebts.map(debt => {
            const paid = debt.totalAmount - debt.remainingAmount
            const progress = debt.totalAmount > 0 ? (paid / debt.totalAmount) * 100 : 0
            const monthsLeft = debt.monthlyPayment > 0 ? Math.ceil(debt.remainingAmount / debt.monthlyPayment) : null
            const days = daysUntilPayment(debt.dueDay)
            const { badge } = urgencyStyle(days)

            return (
              <div
                key={debt.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 group"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{debt.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{debt.interestRate}% anual</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>
                      {days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `día ${debt.dueDay}`}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(debt)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { if (confirm('¿Eliminar esta deuda?')) dispatch({ type: 'DELETE_DEBT', payload: debt.id }) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Saldo restante</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{fmt(debt.remainingAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Pago mensual</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(debt.monthlyPayment)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: debt.color }}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{progress.toFixed(0)}% pagado ({fmt(paid)})</span>
                  {monthsLeft !== null && (
                    <span>{monthsLeft} meses restantes</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DebtModal isOpen={modalOpen} onClose={closeModal} debt={editingDebt} />
    </div>
  )
}
