import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X as XIcon, ExternalLink, RotateCcw, Crown, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAppearance, CURRENCY_OPTIONS, DATE_FORMAT_OPTIONS } from '../context/AppearanceContext'
import { useAlerts } from '../context/AlertsContext'
import { useFinance } from '../context/FinanceContext'
import { initialState } from '../context/FinanceContext'
import { useLicense } from '../context/LicenseContext'
import { useAuth } from '../context/AuthContext'
import config from '../config'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Section({ title, description, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  )
}

// ─── Appearance options ───────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: 'auto',  label: 'Automático (sistema)' },
  { value: 'light', label: 'Claro' },
  { value: 'dark',  label: 'Oscuro' },
]

// ─── Categories CRUD ─────────────────────────────────────────────────────────

function CategoriesTab({ catType }) {
  const { state, dispatch } = useFinance()
  const categories = state.categories[catType] ?? []

  const [editingName, setEditingName] = useState(null)
  const [editValue, setEditValue]     = useState('')
  const [addingNew, setAddingNew]     = useState(false)
  const [newName, setNewName]         = useState('')
  const [dupError, setDupError]       = useState(false)

  function txCount(catName) {
    return state.transactions.filter(t => t.type === catType && t.category === catName).length
  }

  function startEdit(cat) {
    setEditingName(cat.name); setEditValue(cat.name); setDupError(false); setAddingNew(false)
  }
  function cancelEdit() { setEditingName(null); setDupError(false) }
  function confirmEdit() {
    const trimmed = editValue.trim()
    if (!trimmed) { cancelEdit(); return }
    if (trimmed !== editingName && categories.some(c => c.name === trimmed)) { setDupError(true); return }
    if (trimmed !== editingName) dispatch({ type: 'UPDATE_CATEGORY', payload: { type: catType, oldName: editingName, newName: trimmed } })
    setEditingName(null); setDupError(false)
  }
  function handleDelete(cat) {
    if (txCount(cat.name) > 0) return
    dispatch({ type: 'DELETE_CATEGORY', payload: { type: catType, name: cat.name } })
  }
  function startAdd() { setAddingNew(true); setNewName(''); setDupError(false); setEditingName(null) }
  function cancelAdd() { setAddingNew(false); setDupError(false) }
  function confirmAdd() {
    const trimmed = newName.trim()
    if (!trimmed) { cancelAdd(); return }
    if (categories.some(c => c.name === trimmed)) { setDupError(true); return }
    dispatch({ type: 'ADD_CATEGORY', payload: { type: catType, name: trimmed } })
    setAddingNew(false); setNewName(''); setDupError(false)
  }

  const editInputClass = (err) => `flex-1 px-2.5 py-1 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition ${err ? 'border-red-400 focus:ring-red-400' : 'border-blue-400 focus:ring-blue-500'}`
  const iconBtn = (color) => `p-1.5 rounded-lg transition-colors ${color}`

  return (
    <div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {categories.map(cat => {
          const count = txCount(cat.name)
          const isEditing = editingName === cat.name
          return (
            <div key={cat.name} className="flex items-center gap-2 py-2.5 first:pt-0">
              {isEditing ? (
                <>
                  <input autoFocus value={editValue} onChange={e => { setEditValue(e.target.value); setDupError(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit() }}
                    className={editInputClass(dupError)} />
                  {dupError && <span className="text-xs text-red-500 shrink-0">Ya existe</span>}
                  <button onClick={confirmEdit} title="Confirmar" className={iconBtn('text-green-600 hover:bg-green-50 dark:hover:bg-green-950')}><Check size={14} /></button>
                  <button onClick={cancelEdit} title="Cancelar" className={iconBtn('text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}><XIcon size={14} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">{cat.name}</span>
                  {count > 0 && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">{count} {count === 1 ? 'transacción' : 'transacciones'}</span>}
                  <button onClick={() => startEdit(cat)} title="Renombrar" className={iconBtn('text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 shrink-0')}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(cat)} disabled={count > 0}
                    title={count > 0 ? `No se puede eliminar: tiene ${count} ${count === 1 ? 'transacción' : 'transacciones'}` : 'Eliminar'}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${count > 0 ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'}`}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {addingNew ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={newName} onChange={e => { setNewName(e.target.value); setDupError(false) }}
              onKeyDown={e => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') cancelAdd() }}
              placeholder="Nombre de categoría" className={editInputClass(dupError)} />
            {dupError && <span className="text-xs text-red-500 shrink-0">Ya existe</span>}
            <button onClick={confirmAdd} title="Agregar" className={iconBtn('text-green-600 hover:bg-green-50 dark:hover:bg-green-950')}><Check size={14} /></button>
            <button onClick={cancelAdd} title="Cancelar" className={iconBtn('text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}><XIcon size={14} /></button>
          </div>
        ) : (
          <button onClick={startAdd} className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            <Plus size={14} strokeWidth={2.5} />Agregar categoría
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Accounts CRUD ────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'debit',   label: 'Débito' },
  { value: 'credit',  label: 'Crédito' },
  { value: 'digital', label: 'Digital' },
  { value: 'cash',    label: 'Efectivo' },
  { value: 'savings', label: 'Ahorro' },
]
const ACCOUNT_TYPE_LABELS = Object.fromEntries(ACCOUNT_TYPE_OPTIONS.map(o => [o.value, o.label]))
const PRESET_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f97316', '#f59e0b', '#06b6d4', '#ec4899']

const emptyNewAcc = { name: '', type: 'debit', balance: '', color: '#3b82f6' }

function AccountsTab({ onNavigate }) {
  const { state, dispatch } = useFinance()
  const { fmt } = useAppearance()
  const { isPro } = useLicense()
  const atAccountLimit = !isPro && state.accounts.length >= config.licensing.freeAccountLimit
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')
  const [editType, setEditType]   = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newAcc, setNewAcc]       = useState(emptyNewAcc)

  function txCount(accountId) {
    return state.transactions.filter(
      t => t.account === accountId || t.toAccount === accountId
    ).length
  }

  function startEdit(account) { setEditingId(account.id); setEditName(account.name); setEditType(account.type); setEditBalance(String(account.balance)) }
  function cancelEdit() { setEditingId(null) }
  function confirmEdit() {
    const trimmed = editName.trim()
    if (!trimmed) { cancelEdit(); return }
    const balance = Number(editBalance)
    const account = state.accounts.find(a => a.id === editingId)
    dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...account, name: trimmed, type: editType, balance: isNaN(balance) ? account.balance : balance } })
    setEditingId(null)
  }
  function handleDelete(account) {
    if (txCount(account.id) > 0) return
    if (!confirm(`¿Eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`)) return
    dispatch({ type: 'DELETE_ACCOUNT', payload: account.id })
  }

  function startAdd() { setAddingNew(true); setNewAcc(emptyNewAcc); setEditingId(null) }
  function cancelAdd() { setAddingNew(false) }
  function confirmAdd() {
    const name = newAcc.name.trim()
    if (!name) return
    dispatch({
      type: 'ADD_ACCOUNT',
      payload: { name, type: newAcc.type, balance: Number(newAcc.balance) || 0, color: newAcc.color, icon: newAcc.type },
    })
    setAddingNew(false)
  }

  const typeSelect = (value, onChange) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0">
      {ACCOUNT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {state.accounts.map(account => {
          const count = txCount(account.id)
          const isEditing = editingId === account.id
          return (
            <div key={account.id} className="py-2.5 first:pt-0">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: account.color }} />
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit() }}
                    className="flex-1 min-w-[100px] px-2.5 py-1 text-sm rounded-lg border border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {typeSelect(editType, setEditType)}
                  <input type="number" step="0.01" value={editBalance} onChange={e => setEditBalance(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit() }}
                    className="w-28 px-2.5 py-1 text-sm rounded-lg border border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0" />
                  <button onClick={confirmEdit} title="Guardar" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition-colors shrink-0"><Check size={14} /></button>
                  <button onClick={cancelEdit} title="Cancelar" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"><XIcon size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: account.color }} />
                  <span className="flex-1 text-sm text-gray-900 dark:text-white min-w-0 truncate">{account.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 tabular-nums">{fmt(account.balance)}</span>
                  {count > 0 && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">{count} txns</span>}
                  <button onClick={() => startEdit(account)} title="Editar" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors shrink-0"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(account)} disabled={count > 0}
                    title={count > 0 ? `No se puede eliminar: tiene ${count} transacciones` : 'Eliminar'}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${count > 0 ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add new account */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {addingNew ? (
          <div className="space-y-3">
            {/* Name + type */}
            <div className="flex gap-2">
              <input autoFocus value={newAcc.name} onChange={e => setNewAcc(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Escape' && cancelAdd()}
                placeholder="Nombre de cuenta"
                className="flex-1 px-2.5 py-1 text-sm rounded-lg border border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {typeSelect(newAcc.type, v => setNewAcc(p => ({ ...p, type: v })))}
            </div>
            {/* Balance */}
            <input type="number" min="0" step="0.01" placeholder="Saldo inicial (0)" value={newAcc.balance}
              onChange={e => setNewAcc(p => ({ ...p, balance: e.target.value }))}
              className="w-full px-2.5 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {/* Color swatches */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 mr-1">Color:</span>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewAcc(p => ({ ...p, color: c }))}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newAcc.color === c ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            {/* Confirm / cancel */}
            <div className="flex gap-2 pt-1">
              <button onClick={cancelAdd}
                className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmAdd} disabled={!newAcc.name.trim()}
                className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors">
                Agregar cuenta
              </button>
            </div>
          </div>
        ) : atAccountLimit ? (
          <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              El plan Free permite hasta {config.licensing.freeAccountLimit} cuentas. Actualiza a Pro para agregar más.
            </p>
            <button onClick={() => onNavigate?.('settings')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shrink-0">
              <Crown size={13} strokeWidth={2} />Obtener Pro
            </button>
          </div>
        ) : (
          <button onClick={startAdd} className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            <Plus size={14} strokeWidth={2.5} />Nueva cuenta
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Config({ onNavigate }) {
  const { preference, setPreference } = useTheme()
  const { currency, dateFormat, fmt, setCurrency, setDateFormat } = useAppearance()
  const { debtRatioThreshold, warnLargeExpense, paymentReminderDays,
          setDebtRatioThreshold, setWarnLargeExpense, setPaymentReminderDays } = useAlerts()
  const { dispatch } = useFinance()
  const { user, signOut } = useAuth()

  const [catAccountTab, setCatAccountTab] = useState('categories')
  const [catType, setCatType]             = useState('expense')
  const [resetModalOpen, setResetModalOpen] = useState(false)

  function handleReset() {
    dispatch({ type: 'LOAD', payload: initialState })
    setResetModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h2>

      {/* Apariencia */}
      <Section title="Apariencia" description="Personaliza el aspecto visual y el formato de la aplicación">
        <Row label="Tema" hint={preference === 'auto' ? 'Sigue la preferencia del sistema operativo' : undefined}>
          <SelectInput value={preference} onChange={setPreference} options={THEME_OPTIONS} />
        </Row>
        <Row label="Moneda" hint={`Vista previa: ${fmt(12500)}`}>
          <SelectInput value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
        </Row>
        <Row label="Formato de fecha">
          <SelectInput value={dateFormat} onChange={setDateFormat} options={DATE_FORMAT_OPTIONS} />
        </Row>
      </Section>

      {/* Categorías y cuentas */}
      <Section title="Categorías y cuentas" description="Gestiona las categorías de gastos e ingresos y las cuentas">
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 gap-1 mb-5">
          {[['categories', 'Categorías'], ['accounts', 'Cuentas']].map(([val, lbl]) => (
            <button key={val} onClick={() => setCatAccountTab(val)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${catAccountTab === val ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {lbl}
            </button>
          ))}
        </div>

        {catAccountTab === 'categories' ? (
          <>
            <div className="flex gap-2 mb-4">
              {[['expense', 'Gastos'], ['income', 'Ingresos']].map(([val, lbl]) => (
                <button key={val} onClick={() => setCatType(val)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${catType === val ? (val === 'expense' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300') : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            <CategoriesTab key={catType} catType={catType} />
          </>
        ) : (
          <AccountsTab onNavigate={onNavigate} />
        )}
      </Section>

      {/* Alertas */}
      <Section title="Alertas" description="Configura los umbrales y notificaciones del motor de insights">
        <Row label="Umbral de carga de deuda"
          hint={`Alerta cuando los pagos mensuales de deuda superen el ${debtRatioThreshold}% de los ingresos`}>
          <div className="flex items-center gap-1.5">
            <input type="number" min="10" max="60" step="5" value={debtRatioThreshold}
              onChange={e => {
                const v = Math.min(60, Math.max(10, parseInt(e.target.value, 10) || 30))
                setDebtRatioThreshold(v)
              }}
              className="w-16 px-2 py-1.5 text-sm text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
          </div>
        </Row>

        <Row label="Gastos inusuales"
          hint="Alerta si un gasto individual supera 1.5× el promedio histórico de su categoría">
          <Toggle checked={warnLargeExpense} onChange={setWarnLargeExpense} />
        </Row>

        <Row label="Anticipación de pagos"
          hint="Días de antelación para recordatorios de vencimiento de deuda">
          <SelectInput
            value={paymentReminderDays}
            onChange={v => setPaymentReminderDays(Number(v))}
            options={[
              { value: 1, label: '1 día' },
              { value: 3, label: '3 días' },
              { value: 7, label: '7 días' },
            ]}
          />
        </Row>
      </Section>

      {/* Datos */}
      <Section title="Datos" description="Exporta, importa y respalda tu información financiera">
        <Row label="Exportar e importar" hint="Respaldos JSON, historial CSV, restauración de datos">
          <button onClick={() => onNavigate?.('settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Ir a Datos <ExternalLink size={13} strokeWidth={2} />
          </button>
        </Row>
        <Row label="Restablecer todos los datos" hint="Borra todo y restaura los datos de ejemplo originales">
          <button onClick={() => setResetModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
            Restablecer
          </button>
        </Row>
      </Section>

      {/* ── Cuenta ── */}
      <Section title="Cuenta" description="Gestión de sesión">
        <Row label={user?.email ?? ''} hint="Sesión activa">
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <LogOut size={14}/>
            Cerrar sesión
          </button>
        </Row>
      </Section>

      {/* Reset confirmation modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setResetModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <RotateCcw size={17} className="text-red-600 dark:text-red-400" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">¿Restablecer todos los datos?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              Esta acción eliminará todas tus transacciones, cuentas, deudas, activos y metas.
              Serán restaurados los datos de ejemplo.{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">No se puede deshacer.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setResetModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button onClick={handleReset}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
