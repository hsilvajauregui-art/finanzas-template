import {
  Clock, TrendingDown, AlertTriangle, Target, AlertCircle,
  PieChart, Percent, BarChart2, Shield, Zap, Calculator,
} from 'lucide-react'

const ICONS = {
  Clock, TrendingDown, AlertTriangle, Target, AlertCircle,
  PieChart, Percent, BarChart2, Shield, Zap, Calculator,
}

const STYLES = {
  alert: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-50 dark:bg-red-950',
    iconColor: 'text-red-600 dark:text-red-400',
    valueBg: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
    label: 'Alerta',
    labelColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    valueBg: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    label: 'Análisis',
    labelColor: 'text-blue-600 dark:text-blue-400',
  },
  tip: {
    border: 'border-l-green-500',
    iconBg: 'bg-green-50 dark:bg-green-950',
    iconColor: 'text-green-600 dark:text-green-400',
    valueBg: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
    label: 'Sugerencia',
    labelColor: 'text-green-600 dark:text-green-400',
  },
}

export default function InsightCard({ insight }) {
  const s = STYLES[insight.type]
  const Icon = ICONS[insight.icon] ?? AlertCircle

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 ${s.border} p-4 flex items-start gap-3`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.iconBg}`}>
        <Icon size={15} strokeWidth={1.75} className={s.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold ${s.labelColor}`}>{s.label}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{insight.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{insight.body}</p>
      </div>
      {insight.value && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${s.valueBg}`}>
          {insight.value}
        </span>
      )}
    </div>
  )
}
