import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useAppearance } from '../context/AppearanceContext'

function CustomTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400 capitalize">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>{fmt?.(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ data }) {
  const { theme } = useTheme()
  const { fmt, fmtShort } = useAppearance()
  const isDark = theme === 'dark'

  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const gridColor = isDark ? '#1f2937' : '#f3f4f6'

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradSavings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />

        <XAxis
          dataKey="month"
          tick={{ fill: axisColor, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tickFormatter={fmtShort}
          tick={{ fill: axisColor, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />

        <Tooltip content={(props) => <CustomTooltip {...props} fmt={fmt} />} />

        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 12, color: axisColor }}
          formatter={(value) => ({ income: 'Ingresos', expenses: 'Gastos', savings: 'Ahorro' }[value] ?? value)}
        />

        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#gradIncome)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="income"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#gradExpenses)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="expenses"
        />
        <Area
          type="monotone"
          dataKey="savings"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 3"
          fill="url(#gradSavings)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          name="savings"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
