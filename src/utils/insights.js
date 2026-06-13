import config from '../config'
import { daysUntilPayment } from './finance'

// Each insight: { id, type: 'alert'|'info'|'tip', icon, title, body, value? }
// Sorted by priority: alerts first, then info, then tips.

export function generateInsights(state, fmt, alertPrefs = {}) {
  const debtRatioThreshold  = alertPrefs.debtRatioThreshold  ?? config.maxDebtRatio
  const warnLargeExpense    = alertPrefs.warnLargeExpense     !== false
  const paymentReminderDays = alertPrefs.paymentReminderDays  ?? 3

  const insights = []
  const now = new Date()

  const thisMonthTx = state.transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthIncome = state.incomes.reduce((s, i) => s + i.amount, 0)
  const monthExpenses = thisMonthTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const savings = monthIncome - monthExpenses

  // ─── ALERTS ──────────────────────────────────────────────────────────────

  // 1. Deuda vence en ≤ paymentReminderDays días
  state.debts.forEach(debt => {
    const days = daysUntilPayment(debt.dueDay)
    if (days <= paymentReminderDays) {
      insights.push({
        id: `debt-due-${debt.id}`,
        type: 'alert',
        icon: 'Clock',
        title: `Pago próximo: ${debt.name}`,
        body: days === 0
          ? `Vence hoy (día ${debt.dueDay})`
          : days === 1
          ? `Vence mañana (día ${debt.dueDay})`
          : `Vence en ${days} días (día ${debt.dueDay})`,
        value: fmt(debt.monthlyPayment),
      })
    }
  })

  // 2. Flujo negativo: gastos > ingresos este mes
  if (monthIncome > 0 && monthExpenses > monthIncome) {
    insights.push({
      id: 'negative-cashflow',
      type: 'alert',
      icon: 'TrendingDown',
      title: 'Flujo negativo este mes',
      body: `Tus gastos (${fmt(monthExpenses)}) superan tus ingresos (${fmt(monthIncome)})`,
      value: fmt(monthExpenses - monthIncome),
    })
  }

  // 3. Saldo bajo en cuenta
  state.accounts.forEach(account => {
    if (account.balance >= 0 && account.balance < config.lowBalanceThreshold) {
      insights.push({
        id: `low-balance-${account.id}`,
        type: 'alert',
        icon: 'AlertTriangle',
        title: `Saldo bajo: ${account.name}`,
        body: `Solo quedan ${fmt(account.balance)} disponibles en esta cuenta`,
        value: fmt(account.balance),
      })
    }
  })

  // 4. Meta vencida sin completar
  state.goals.forEach(goal => {
    const days = Math.ceil((new Date(goal.deadline) - now) / 86400000)
    if (days < 0 && goal.currentAmount < goal.targetAmount) {
      const pct = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)
      insights.push({
        id: `goal-overdue-${goal.id}`,
        type: 'alert',
        icon: 'Target',
        title: `Meta vencida: ${goal.name}`,
        body: `Alcanzaste ${pct}% (${fmt(goal.currentAmount)} de ${fmt(goal.targetAmount)})`,
      })
    }
  })

  // 5. Ratio deuda/ingreso > umbral configurable
  const totalMonthlyDebt = state.debts.reduce((s, d) => s + d.monthlyPayment, 0)
  const debtRatio = monthIncome > 0 ? (totalMonthlyDebt / monthIncome) * 100 : 0
  if (debtRatio > debtRatioThreshold) {
    insights.push({
      id: 'high-debt-ratio',
      type: 'alert',
      icon: 'AlertCircle',
      title: 'Carga de deuda alta',
      body: `El ${debtRatio.toFixed(0)}% de tus ingresos se va en pagos de deuda. Lo recomendado es máximo ${debtRatioThreshold}%`,
      value: `${debtRatio.toFixed(0)}%`,
    })
  }

  // 5b. Gasto individual inusual (> 1.5× promedio histórico de su categoría)
  if (warnLargeExpense) {
    const byCat = {}
    thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
      if (!byCat[t.category]) byCat[t.category] = []
      byCat[t.category].push(t)
    })
    Object.entries(byCat).forEach(([cat, txs]) => {
      const historical = state.transactions.filter(tx => {
        const d = new Date(tx.date)
        return tx.type === 'expense' && tx.category === cat &&
          !(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
      })
      if (historical.length < 3) return
      const avg = historical.reduce((s, tx) => s + tx.amount, 0) / historical.length
      const maxTx = txs.reduce((m, tx) => tx.amount > m.amount ? tx : m, txs[0])
      if (maxTx.amount > avg * 1.5) {
        insights.push({
          id: `large-expense-${cat}`,
          type: 'alert',
          icon: 'TrendingUp',
          title: `Gasto inusual: ${cat}`,
          body: `${fmt(maxTx.amount)} — ${((maxTx.amount / avg - 1) * 100).toFixed(0)}% sobre el promedio histórico (${fmt(Math.round(avg))})`,
          value: fmt(maxTx.amount),
        })
      }
    })
  }

  // ─── INFO ─────────────────────────────────────────────────────────────────

  // 6. Mayor categoría de gasto
  const byCategory = thisMonthTx
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
  if (topCategory && monthExpenses > 0) {
    const pct = ((topCategory[1] / monthExpenses) * 100).toFixed(0)
    insights.push({
      id: 'top-spending-category',
      type: 'info',
      icon: 'PieChart',
      title: `Mayor gasto del mes: ${topCategory[0]}`,
      body: `Representa el ${pct}% de tus gastos totales de este mes`,
      value: fmt(topCategory[1]),
    })
  }

  // 7. Tasa de ahorro
  if (monthIncome > 0) {
    const rate = ((savings / monthIncome) * 100)
    const rateStr = `${rate.toFixed(0)}%`
    insights.push({
      id: 'savings-rate',
      type: 'info',
      icon: 'Percent',
      title: 'Tasa de ahorro este mes',
      body: rate >= 20
        ? `Excelente: estás ahorrando el ${rateStr} de tus ingresos (meta: 20%)`
        : rate >= 10
        ? `Bien: ahorras el ${rateStr}. Intenta llegar al 20%`
        : rate >= 0
        ? `Bajo: solo ahorras el ${rateStr}. La meta recomendada es 20%`
        : `Flujo negativo: gastaste ${fmt(Math.abs(savings))} más de lo que ingresaste`,
      value: rateStr,
    })
  }

  // 8. Meta más cerca de completarse
  const nearestGoal = state.goals
    .filter(g => g.currentAmount < g.targetAmount && g.targetAmount > 0)
    .map(g => ({ ...g, pct: g.currentAmount / g.targetAmount }))
    .sort((a, b) => b.pct - a.pct)[0]
  if (nearestGoal) {
    insights.push({
      id: `goal-nearest-${nearestGoal.id}`,
      type: 'info',
      icon: 'Target',
      title: `Meta más avanzada: ${nearestGoal.name}`,
      body: `${(nearestGoal.pct * 100).toFixed(0)}% completada · faltan ${fmt(nearestGoal.targetAmount - nearestGoal.currentAmount)} para lograrlo`,
      value: `${(nearestGoal.pct * 100).toFixed(0)}%`,
    })
  }

  // 9. Patrimonio neto
  const totalAssets = state.assets.reduce((s, a) => s + a.value, 0)
  const totalDebts = state.debts.reduce((s, d) => s + d.remainingAmount, 0)
  const netWorth = totalAssets - totalDebts
  if (state.assets.length > 0) {
    insights.push({
      id: 'net-worth',
      type: 'info',
      icon: 'BarChart2',
      title: 'Tu patrimonio neto actual',
      body: netWorth >= 0
        ? `Tus activos (${fmt(totalAssets)}) superan tus deudas (${fmt(totalDebts)})`
        : `Tus deudas (${fmt(totalDebts)}) superan tus activos (${fmt(totalAssets)})`,
      value: fmt(netWorth),
    })
  }

  // ─── TIPS ─────────────────────────────────────────────────────────────────

  // 10. Fondo de emergencia
  if (monthExpenses > 0) {
    const recommended = monthExpenses * config.emergencyFundMonths
    const liquid = state.accounts.reduce((s, a) => s + a.balance, 0)
    const pct = Math.min((liquid / recommended) * 100, 100)
    if (pct < 100) {
      insights.push({
        id: 'emergency-fund',
        type: 'tip',
        icon: 'Shield',
        title: 'Fondo de emergencia incompleto',
        body: `Tienes ${fmt(liquid)} de los ${fmt(recommended)} recomendados (${config.emergencyFundMonths} meses de gastos). Llevas un ${pct.toFixed(0)}%`,
        value: `${pct.toFixed(0)}%`,
      })
    }
  }

  // 11. Paga la deuda de mayor tasa con el ahorro del mes
  const highestRateDebt = state.debts
    .filter(d => d.remainingAmount > 0)
    .sort((a, b) => b.interestRate - a.interestRate)[0]
  if (highestRateDebt && savings > 100) {
    const normalMonths = Math.ceil(highestRateDebt.remainingAmount / highestRateDebt.monthlyPayment)
    const extraMonths = Math.ceil(highestRateDebt.remainingAmount / (highestRateDebt.monthlyPayment + savings))
    const saved = normalMonths - extraMonths
    if (saved >= 2) {
      insights.push({
        id: `accelerate-debt-${highestRateDebt.id}`,
        type: 'tip',
        icon: 'Zap',
        title: `Acelera: ${highestRateDebt.name} (${highestRateDebt.interestRate}% anual)`,
        body: `Si aplicas tu ahorro de ${fmt(savings)}/mes a esta deuda, la liquidarías ${saved} meses antes`,
      })
    }
  }

  // 12. Meta con fecha límite próxima necesita ahorro mensual
  const urgentGoal = state.goals
    .filter(g => g.currentAmount < g.targetAmount)
    .map(g => ({ ...g, daysLeft: Math.ceil((new Date(g.deadline) - now) / 86400000) }))
    .filter(g => g.daysLeft > 0 && g.daysLeft <= 365)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0]
  if (urgentGoal) {
    const monthsLeft = urgentGoal.daysLeft / 30
    const needed = urgentGoal.targetAmount - urgentGoal.currentAmount
    const monthly = needed / monthsLeft
    insights.push({
      id: `goal-plan-${urgentGoal.id}`,
      type: 'tip',
      icon: 'Calculator',
      title: `Plan para: ${urgentGoal.name}`,
      body: `Necesitas apartar ${fmt(monthly)}/mes durante los próximos ${Math.ceil(monthsLeft)} meses para cumplirla`,
      value: fmt(monthly),
    })
  }

  // Sort: alerts → info → tips
  const ORDER = { alert: 0, info: 1, tip: 2 }
  return insights.sort((a, b) => ORDER[a.type] - ORDER[b.type])
}
