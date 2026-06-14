import { useState, useEffect, Component } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { FinanceProvider } from './context/FinanceContext'
import { AppearanceProvider } from './context/AppearanceContext'
import { AlertsProvider } from './context/AlertsContext'
import { LicenseProvider, useLicense } from './context/LicenseContext'
import UpgradeLock from './components/UpgradeLock'
import Layout from './components/Layout'
import TransactionModal from './components/TransactionModal'
import TransferModal from './components/TransferModal'
import InstallPrompt from './components/InstallPrompt'
import UpdatePrompt from './components/UpdatePrompt'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Patrimony from './pages/Patrimony'
import Debts from './pages/Debts'
import Analysis from './pages/Analysis'
import History from './pages/History'
import Settings from './pages/Settings'
import Config from './pages/Config'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '24px', fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#b91c1c', margin: '0 0 12px' }}>Error en la app:</h2>
          <pre style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#7f1d1d', fontSize: '13px' }}>
            {String(this.state.error)}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const PAGES = {
  dashboard: Dashboard,
  accounts: Accounts,
  patrimony: Patrimony,
  debts: Debts,
  analysis: Analysis,
  history: History,
  settings: Settings,
  config: Config,
}

const LOCKED_PAGES = new Set(['patrimony', 'debts', 'analysis'])

function GatedPage({ pageKey, Page, onNavigate, ...rest }) {
  const { isPro } = useLicense()
  if (LOCKED_PAGES.has(pageKey) && !isPro) {
    return <UpgradeLock feature={pageKey} onNavigate={onNavigate} />
  }
  return <Page onNavigate={onNavigate} {...rest} />
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const Page = PAGES[currentPage]

  function openNewTransaction() {
    setEditingTransaction(null)
    setTxModalOpen(true)
  }

  function openEditTransaction(transaction) {
    setEditingTransaction(transaction)
    setTxModalOpen(true)
  }

  function closeTransaction() {
    setTxModalOpen(false)
    setEditingTransaction(null)
  }

  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AppearanceProvider>
      <LicenseProvider>
      <AlertsProvider>
      <FinanceProvider>
        <Layout
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onNewTransaction={openNewTransaction}
          onNewTransfer={() => setTransferOpen(true)}
        >
          <GatedPage
            pageKey={currentPage}
            Page={Page}
            onEditTransaction={openEditTransaction}
            onNewTransfer={() => setTransferOpen(true)}
            onNavigate={setCurrentPage}
          />
        </Layout>

        <TransactionModal
          isOpen={txModalOpen}
          onClose={closeTransaction}
          transaction={editingTransaction}
          onSuccess={msg => setToast(msg)}
        />

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-xl text-sm font-medium pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            {toast}
          </div>
        )}
        <TransferModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
        />
        <InstallPrompt />
        <UpdatePrompt />
      </FinanceProvider>
      </AlertsProvider>
      </LicenseProvider>
      </AppearanceProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}
