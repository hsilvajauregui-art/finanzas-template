import { useState } from 'react'
import {
  LayoutDashboard, CreditCard, TrendingUp, AlertCircle,
  BarChart2, History, Plus, ArrowLeftRight, Database, Menu, X, Settings,
} from 'lucide-react'
import config from '../config'

const NAV_MAIN = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Cuentas', icon: CreditCard },
  { id: 'patrimony', label: 'Patrimonio', icon: TrendingUp },
  { id: 'debts', label: 'Deudas', icon: AlertCircle },
  { id: 'analysis', label: 'Análisis', icon: BarChart2 },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'settings', label: 'Datos', icon: Database },
]

const NAV_BOTTOM = [
  { id: 'config', label: 'Configuración', icon: Settings },
]

export default function Layout({ currentPage, onNavigate, onNewTransaction, onNewTransfer, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function closeSidebar() { setSidebarOpen(false) }
  function navigate(id) { onNavigate(id); closeSidebar() }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={[
        'fixed inset-y-0 left-0 z-30 w-60 shrink-0 flex flex-col',
        'border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        'transition-transform duration-200',
        'md:relative md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>

        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              {config.app.icon} {config.app.shortName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {config.app.description.split('—')[0].trim()}
            </p>
          </div>
          <button
            onClick={closeSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* CTAs */}
        <div className="p-3 space-y-1.5 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => { onNewTransaction(); closeSidebar() }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nueva transacción
          </button>
          <button
            onClick={() => { onNewTransfer(); closeSidebar() }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftRight size={15} strokeWidth={1.75} />
            Nuevo traspaso
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto flex flex-col">
          <div className="space-y-0.5">
            {NAV_MAIN.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
            {NAV_BOTTOM.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {config.app.icon} {config.app.shortName}
          </span>
        </div>

        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
