import config from '../config'

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

export function fmt(n) {
  return new Intl.NumberFormat(config.currency.locale, {
    style: 'currency',
    currency: config.currency.code,
    maximumFractionDigits: 0,
  }).format(n)
}

// Derive the currency symbol once (e.g. "$", "€", "S/")
const _symbol = new Intl.NumberFormat(config.currency.locale, {
  style: 'currency',
  currency: config.currency.code,
  maximumFractionDigits: 0,
})
  .formatToParts(0)
  .find(p => p.type === 'currency')?.value ?? '$'

export function fmtShort(n) {
  if (Math.abs(n) >= 1_000_000) return `${_symbol}${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${_symbol}${(n / 1_000).toFixed(0)}k`
  return `${_symbol}${n}`
}

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function daysUntilPayment(dueDay) {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (thisMonth > today) return Math.ceil((thisMonth - today) / 86400000)
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
  return Math.ceil((nextMonth - today) / 86400000)
}

export function getMonthlySummary(transactions, months = 6) {
  const now = new Date()
  const result = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()

    const monthTx = transactions.filter(t => {
      const td = new Date(t.date)
      return td.getFullYear() === year && td.getMonth() === month
    })

    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    result.push({ month: MONTHS_ES[month], year, income, expenses, savings: income - expenses })
  }

  return result
}

export function getExpensesByCategory(transactions) {
  const now = new Date()
  return transactions
    .filter(t => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
}
