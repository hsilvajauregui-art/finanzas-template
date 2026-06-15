import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, Home, Car, Banknote, Package, Target, PiggyBank } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { useTheme } from '../context/ThemeContext'
import AssetModal from '../components/AssetModal'
import GoalModal from '../components/GoalModal'
import GoalContributionModal from '../components/GoalContributionModal'
import { CHART_COLORS } from '../utils/finance'
import { useAppearance } from '../context/AppearanceContext'

const ASSET_ICONS = {
  investment: TrendingUp,
  property: Home,
  vehicle: Car,
  cash: Banknote,
  other: Package,
}
const ASSET_TYPE_LABELS = {
  investment: 'Inversión',
  property: 'Inmueble',
  vehicle: 'Vehículo',
  cash: 'Efectivo',
  other: 'Otro',
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / 86400000)
}

function goalStatus(goal) {
  const days = daysUntil(goal.deadline)
  if (goal.currentAmount >= goal.targetAmount) return { label: 'Completada', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' }
  if (days < 0) return { label: 'Vencida', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' }
  const needed = goal.targetAmount - goal.currentAmount
  const monthsLeft = days / 30
  const monthlyNeeded = monthsLeft > 0 ? needed / monthsLeft : Infinity
  return {
    label: `${days}d restantes`,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800',
    monthlyNeeded,
  }
}

function CustomTooltip({ active, payload, fmt }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-900 dark:text-white">{payload[0].name}</p>
      <p className="text-gray-500 dark:text-gray-400">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function Patrimony() {
  const { state, dispatch } = useFinance()
  const { fmt } = useAppearance()
  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [contribModalOpen, setContribModalOpen] = useState(false)
  const [contributingGoal, setContributingGoal] = useState(null)

  const totalAssets = useMemo(() => state.assets.reduce((s, a) => s + a.value, 0), [state.assets])
  const totalDebts = useMemo(() => state.debts.reduce((s, d) => s + d.remainingAmount, 0), [state.debts])
  const netWorth = totalAssets - totalDebts

  // Group assets by type for pie chart
  const byType = useMemo(() => {
    const groups = state.assets.reduce((acc, a) => {
      const label = ASSET_TYPE_LABELS[a.type] ?? a.type
      acc[label] = (acc[label] || 0) + a.value
      return acc
    }, {})
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [state.assets])

  function openEditAsset(asset) { setEditingAsset(asset); setAssetModalOpen(true) }
  function closeAssetModal() { setAssetModalOpen(false); setEditingAsset(null) }
  function openEditGoal(goal) { setEditingGoal(goal); setGoalModalOpen(true) }
  function closeGoalModal() { setGoalModalOpen(false); setEditingGoal(null) }
  function openContribute(goal) { setContributingGoal(goal); setContribModalOpen(true) }
  function closeContribModal() { setContribModalOpen(false); setContributingGoal(null) }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patrimonio</h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Activos totales</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmt(totalAssets)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Deudas totales</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmt(totalDebts)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Patrimonio neto</p>
          <p className={`text-2xl font-bold mt-1 ${netWorth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
            {fmt(netWorth)}
          </p>
        </div>
      </div>

      {/* Assets: chart + list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Donut chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3 self-start">Distribución</p>
          {byType.length > 0 ? (
            <>
              <PieChart width={160} height={160}>
                <Pie data={byType} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} isAnimationActive={false}>
                  {byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip fmt={fmt} />} />
              </PieChart>
              <div className="w-full space-y-1.5 mt-2">
                {byType.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{d.name}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {((d.value / totalAssets) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Sin activos.</p>
          )}
        </div>

        {/* Assets list */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Activos</h3>
            <button
              onClick={() => { setEditingAsset(null); setAssetModalOpen(true) }}
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus size={14} strokeWidth={2.5} /> Agregar
            </button>
          </div>
          {state.assets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin activos registrados.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {state.assets.map(asset => {
                const Icon = ASSET_ICONS[asset.type] ?? Package
                return (
                  <div key={asset.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${asset.color}20` }}>
                      <Icon size={15} strokeWidth={1.75} style={{ color: asset.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{asset.name}</p>
                      <p className="text-xs text-gray-400">{ASSET_TYPE_LABELS[asset.type] ?? asset.type} · {asset.currency}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{fmt(asset.value)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditAsset(asset)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { if (confirm('¿Eliminar este activo?')) dispatch({ type: 'DELETE_ASSET', payload: asset.id }) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Metas de ahorro</h3>
          </div>
          <button
            onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }}
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus size={14} strokeWidth={2.5} /> Agregar
          </button>
        </div>

        {state.goals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin metas registradas.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {state.goals.map(goal => {
              const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0
              const status = goalStatus(goal)
              return (
                <div key={goal.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{goal.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmt(goal.currentAmount)} de {fmt(goal.targetAmount)}
                        {status.monthlyNeeded && (
                          <span> · necesitas {fmt(status.monthlyNeeded)}/mes</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openContribute(goal)}
                          disabled={goal.currentAmount >= goal.targetAmount}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Agregar aporte"
                        >
                          <PiggyBank size={13} />
                        </button>
                        <button onClick={() => openEditGoal(goal)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { if (confirm('¿Eliminar esta meta?')) dispatch({ type: 'DELETE_GOAL', payload: goal.id }) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{progress.toFixed(0)}% · vence {goal.deadline}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AssetModal isOpen={assetModalOpen} onClose={closeAssetModal} asset={editingAsset} />
      <GoalModal isOpen={goalModalOpen} onClose={closeGoalModal} goal={editingGoal} />
      <GoalContributionModal isOpen={contribModalOpen} onClose={closeContribModal} goal={contributingGoal} />
    </div>
  )
}
