import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Pencil, AlertTriangle } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import TrendChart from '../components/TrendChart'
import InsightCard from '../components/InsightCard'
import { getMonthlySummary } from '../utils/finance'
import { generateInsights } from '../utils/insights'
import { useAppearance } from '../context/AppearanceContext'
import { useAlerts } from '../context/AlertsContext'

const TYPE_COLORS = {
  income: 'text-green-600 dark:text-green-400',
  expense: 'text-red-600 dark:text-red-400',
  transfer: 'text-blue-600 dark:text-blue-400',
}
const TYPE_SIGN = { income: '+', expense: '-', transfer: '↔ ' }
const TYPE_DOT = { income: 'bg-green-500', expense: 'bg-red-500', transfer: 'bg-blue-500' }

function KpiCard({ label, value, valueClass = '', sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard({ onEditTransaction }) {
  const { state } = useFinance()
  const { fmt, fmtDate } = useAppearance()
  const alertPrefs = useAlerts()

  const now = new Date()

  const thisMonth = useMemo(() => state.transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }), [state.transactions])

  const monthlyIncome = useMemo(
    () => thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [thisMonth]
  )
  const monthlyExpenses = useMemo(
    () => thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [thisMonth]
  )
  const savings = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0
  const totalBalance = useMemo(
    () => state.accounts.reduce((s, a) => s + a.balance, 0),
    [state.accounts]
  )

  const [trendMonths, setTrendMonths] = useState(6)

  const monthlySummary = useMemo(
    () => getMonthlySummary(state.transactions, trendMonths),
    [state.transactions, trendMonths]
  )

  const recentTx = useMemo(
    () => [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [state.transactions]
  )

  const alerts = useMemo(
    () => generateInsights(state, fmt, alertPrefs).filter(i => i.type === 'alert'),
    [state, fmt, alertPrefs]
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>

      {/* Alerts strip */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" strokeWidth={2} />
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
              {alerts.length} alerta{alerts.length > 1 ? 's' : ''} activa{alerts.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Saldo total"
          value={fmt(totalBalance)}
          valueClass="text-gray-900 dark:text-white"
        />
        <KpiCard
          label="Ingresos mensuales"
          value={fmt(monthlyIncome)}
          valueClass="text-green-600 dark:text-green-400"
        />
        <KpiCard
          label="Gastos del mes"
          value={fmt(monthlyExpenses)}
          valueClass="text-red-600 dark:text-red-400"
        />
        <KpiCard
          label="Ahorro del mes"
          value={fmt(savings)}
          valueClass={savings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}
          sub={
            monthlyIncome > 0
              ? `${savingsRate.toFixed(0)}% tasa de ahorro`
              : undefined
          }
        />
      </div>

      {/* Trend chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Tendencia</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400 hidden sm:flex">
              {savings >= 0
                ? <><TrendingUp size={14} className="text-green-500" /> Flujo positivo</>
                : <><TrendingDown size={14} className="text-red-500" /> Flujo negativo</>
              }
            </div>
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
              {[1, 3, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setTrendMonths(n)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    trendMonths === n
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {n}M
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">Ingresos, gastos y ahorro neto por mes</p>
        <TrendChart data={monthlySummary} />
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Últimas transacciones</h3>
          <span className="text-xs text-gray-400">{state.transactions.length} en total</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentTx.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[t.type] ?? 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {t.category}{t.subcategory ? ` · ${t.subcategory}` : ''}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {fmtDate(t.date)}{t.note ? ` · ${t.note}` : ''}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${TYPE_COLORS[t.type] ?? ''}`}>
                {TYPE_SIGN[t.type]}{fmt(t.amount)}
              </span>
              {t.type !== 'transfer' && (
                <button
                  onClick={() => onEditTransaction(t)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          ))}
          {recentTx.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Sin transacciones aún.</p>
          )}
        </div>
      </div>
    </div>
  )
}
