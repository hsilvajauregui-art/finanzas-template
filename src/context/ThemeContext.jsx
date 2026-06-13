import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function resolveTheme(preference, systemDark) {
  return preference === 'auto' ? (systemDark ? 'dark' : 'light') : preference
}

export function ThemeProvider({ children }) {
  const [preference, _setPreference] = useState(() => {
    const saved = localStorage.getItem('finanzas-theme')
    return ['auto', 'light', 'dark'].includes(saved) ? saved : 'auto'
  })

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Always track system dark mode changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const theme = resolveTheme(preference, systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function setPreference(pref) {
    _setPreference(pref)
    localStorage.setItem('finanzas-theme', pref)
  }

  return (
    <ThemeContext.Provider value={{ preference, theme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
