import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { useTheme } from '../context/ThemeContext'
import InsightCard from '../components/InsightCard'
import { getMonthlySummary, getExpensesByCategory, CHART_COLORS } from '../utils/finance'
import { generateInsights } from '../utils/insights'
import { useAppearance } from '../context/AppearanceContext'
import { useAlerts } from '../context/AlertsContext'

function CustomTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color ?? p.fill }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{fmt?.(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analysis() {
  const { state } = useFinance()
  const { theme } = useTheme()
  const { fmt, fmtShort } = useAppearance()
  const isDark = theme === 'dark'

  const alertPrefs = useAlerts()
  const insights = useMemo(() => generateInsights(state, fmt, alertPrefs), [state, fmt, alertPrefs])
  const alerts = insights.filter(i => i.type === 'alert')
  const infos = insights.filter(i => i.type === 'info')
  const tips = insights.filter(i => i.type === 'tip')
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const gridColor = isDark ? '#1f2937' : '#f3f4f6'

  const byCategory = useMemo(() => getExpensesByCategory(state.transactions), [state.transactions])
  const pieData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const totalExpenses = pieData.reduce((s, d) => s + d.value, 0)

  const monthlyData = useMemo(() => {
    const all = getMonthlySummary(state.transactions, 6)
    const first = all.findIndex(m => m.income > 0 || m.expenses > 0)
    return first === -1 ? all.slice(-1) : all.slice(first)
  }, [state.transactions])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Análisis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: gastos por categoría */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-base font-semibold mb-1">Gastos este mes</h3>
          <p className="text-xs text-gray-400 mb-4">Por categoría</p>
          {pieData.length > 0 ? (
            <div className="flex gap-4 items-center">
              <div className="shrink-0">
                <PieChart width={160} height={160}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={(props) => <CustomTooltip {...props} fmt={fmt} />} />
                </PieChart>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white shrink-0">
                      {((d.value / totalExpenses) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400">Total: <span className="font-semibold text-gray-900 dark:text-white">{fmt(totalExpenses)}</span></p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">Sin gastos este mes.</p>
          )}
        </div>

        {/* Bar: comparativo mensual */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-base font-semibold mb-1">Comparativo mensual</h3>
          <p className="text-xs text-gray-400 mb-4">Ingresos vs gastos</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={monthlyData} barSize={10} barGap={4} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={(props) => <CustomTooltip {...props} fmt={fmt} />} />
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings rate table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold">Tasa de ahorro por mes</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {monthlyData.map(m => {
            const rate = m.income > 0 ? (m.savings / m.income) * 100 : m.expenses > 0 ? -100 : 0
            const isPositive = m.savings >= 0
            return (
              <div key={`${m.month}-${m.year}`} className="flex items-center gap-4 px-5 py-3">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-10 shrink-0">{m.month}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isPositive ? 'bg-blue-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(Math.abs(rate), 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold w-16 text-right shrink-0 ${isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {rate.toFixed(0)}%
                </span>
                <span className="text-xs text-gray-400 w-24 text-right shrink-0 hidden sm:block">
                  {fmt(m.savings)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights panel */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Resumen inteligente
            <span className="ml-2 text-xs font-normal text-gray-400">{insights.length} observaciones</span>
          </h3>

          {alerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                Alertas ({alerts.length})
              </p>
              {alerts.map(i => <InsightCard key={i.id} insight={i} />)}
            </div>
          )}

          {infos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Análisis ({infos.length})
              </p>
              {infos.map(i => <InsightCard key={i.id} insight={i} />)}
            </div>
          )}

          {tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                Sugerencias ({tips.length})
              </p>
              {tips.map(i => <InsightCard key={i.id} insight={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
