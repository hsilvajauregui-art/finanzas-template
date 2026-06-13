import { createContext, useContext, useState, useCallback, useMemo } from 'react'

export const CURRENCY_OPTIONS = [
  { value: 'MXN', locale: 'es-MX', label: 'MXN — Peso mexicano' },
  { value: 'USD', locale: 'en-US', label: 'USD — Dólar estadounidense' },
  { value: 'EUR', locale: 'de-DE', label: 'EUR — Euro' },
]

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA  (31/12/2025)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA  (12/31/2025)' },
]

const AppearanceContext = createContext(null)

export function AppearanceProvider({ children }) {
  const [currency, _setCurrency] = useState(
    () => localStorage.getItem('finanzas-currency') ?? 'MXN'
  )
  const [dateFormat, _setDateFormat] = useState(
    () => localStorage.getItem('finanzas-date-format') ?? 'DD/MM/YYYY'
  )

  const locale = useMemo(
    () => CURRENCY_OPTIONS.find(o => o.value === currency)?.locale ?? 'es-MX',
    [currency]
  )

  const currencySymbol = useMemo(
    () =>
      new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
        .formatToParts(0)
        .find(p => p.type === 'currency')?.value ?? '$',
    [currency, locale]
  )

  const fmt = useCallback(
    (n) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(n),
    [currency, locale]
  )

  const fmtShort = useCallback(
    (n) => {
      if (Math.abs(n) >= 1_000_000) return `${currencySymbol}${(n / 1_000_000).toFixed(1)}M`
      if (Math.abs(n) >= 1_000) return `${currencySymbol}${(n / 1_000).toFixed(0)}k`
      return `${currencySymbol}${n}`
    },
    [currencySymbol]
  )

  const fmtDate = useCallback(
    (dateStr) => {
      if (!dateStr) return ''
      const [year, month, day] = dateStr.split('-')
      return dateFormat === 'MM/DD/YYYY' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`
    },
    [dateFormat]
  )

  function setCurrency(c) {
    _setCurrency(c)
    localStorage.setItem('finanzas-currency', c)
  }

  function setDateFormat(f) {
    _setDateFormat(f)
    localStorage.setItem('finanzas-date-format', f)
  }

  const value = useMemo(
    () => ({ currency, dateFormat, fmt, fmtShort, fmtDate, setCurrency, setDateFormat }),
    [currency, dateFormat, fmt, fmtShort, fmtDate]
  )

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  return useContext(AppearanceContext)
}
