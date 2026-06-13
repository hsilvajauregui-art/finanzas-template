import { createContext, useContext, useState, useMemo } from 'react'

const AlertsContext = createContext(null)

export function AlertsProvider({ children }) {
  const [debtRatioThreshold, _setDebt] = useState(() => {
    const v = parseInt(localStorage.getItem('finanzas-alert-debt-ratio') ?? '30', 10)
    return isNaN(v) ? 30 : Math.min(60, Math.max(10, v))
  })

  const [warnLargeExpense, _setWarn] = useState(
    () => localStorage.getItem('finanzas-alert-large-expense') !== 'false'
  )

  const [paymentReminderDays, _setReminder] = useState(() => {
    const v = parseInt(localStorage.getItem('finanzas-alert-reminder-days') ?? '3', 10)
    return [1, 3, 7].includes(v) ? v : 3
  })

  function setDebtRatioThreshold(v) {
    _setDebt(v)
    localStorage.setItem('finanzas-alert-debt-ratio', String(v))
  }
  function setWarnLargeExpense(v) {
    _setWarn(v)
    localStorage.setItem('finanzas-alert-large-expense', String(v))
  }
  function setPaymentReminderDays(v) {
    _setReminder(v)
    localStorage.setItem('finanzas-alert-reminder-days', String(v))
  }

  const value = useMemo(
    () => ({
      debtRatioThreshold, warnLargeExpense, paymentReminderDays,
      setDebtRatioThreshold, setWarnLargeExpense, setPaymentReminderDays,
    }),
    [debtRatioThreshold, warnLargeExpense, paymentReminderDays]
  )

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

const DEFAULT_ALERTS = {
  debtRatioThreshold: 30,
  warnLargeExpense: true,
  paymentReminderDays: 3,
  setDebtRatioThreshold: () => {},
  setWarnLargeExpense: () => {},
  setPaymentReminderDays: () => {},
}

export function useAlerts() { return useContext(AlertsContext) ?? DEFAULT_ALERTS }
