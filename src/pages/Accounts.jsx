import { useMemo } from 'react'
import { CreditCard, Smartphone, Banknote, Wallet, ArrowLeftRight, ArrowRight } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useAppearance } from '../context/AppearanceContext'

const ACCOUNT_ICONS = {
  debit: CreditCard,
  credit: CreditCard,
  digital: Smartphone,
  cash: Banknote,
  savings: Wallet,
}
const TYPE_LABELS = {
  debit: 'Débito',
  credit: 'Crédito',
  digital: 'Digital',
  cash: 'Efectivo',
  savings: 'Ahorro',
}

function AccountCard({ account, fmt }) {
  const Icon = ACCOUNT_ICONS[account.type] ?? Wallet
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${account.color}20` }}
        >
          <Icon size={18} strokeWidth={1.75} style={{ color: account.color }} />
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {TYPE_LABELS[account.type] ?? account.type}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{account.name}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(account.balance)}</p>
    </div>
  )
}

export default function Accounts({ onNewTransfer }) {
  const { state } = useFinance()
  const { fmt, fmtDate } = useAppearance()

  const totalBalance = useMemo(
    () => state.accounts.reduce((s, a) => s + a.balance, 0),
    [state.accounts]
  )

  const transfers = useMemo(
    () =>
      [...state.transactions]
        .filter(t => t.type === 'transfer')
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [state.transactions]
  )

  function accountName(id) {
    if (id == null) return '—'
    return state.accounts.find(a => a.id === id)?.name ?? '(eliminada)'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cuentas</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Saldo total: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(totalBalance)}</span>
          </p>
        </div>
        <button
          onClick={onNewTransfer}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <ArrowLeftRight size={15} strokeWidth={2} />
          Nuevo traspaso
        </button>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.accounts.map(account => (
          <AccountCard key={account.id} account={account} fmt={fmt} />
        ))}
      </div>

      {/* Transfer history */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Historial de traspasos</h3>
          <span className="text-xs text-gray-400">{transfers.length} registros</span>
        </div>

        {transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ArrowLeftRight size={18} className="text-gray-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-gray-400">Sin traspasos registrados</p>
            <button
              onClick={onNewTransfer}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {transfers.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                {/* Icon */}
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={13} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>

                {/* Route */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                    <span className="truncate">{accountName(t.account)}</span>
                    <ArrowRight size={12} className="text-gray-400 shrink-0" strokeWidth={2} />
                    <span className="truncate">{accountName(t.toAccount)}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {fmtDate(t.date)}{t.note ? ` · ${t.note}` : ''}
                  </p>
                </div>

                {/* Amount */}
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                  {fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
