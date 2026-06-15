import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useAppearance } from '../context/AppearanceContext'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function PayDebtModal({ isOpen, onClose, debt }) {
  const { state, dispatch } = useFinance()
  const { fmt } = useAppearance()
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && debt) {
      setAmount(String(Math.min(debt.monthlyPayment, debt.remainingAmount) || ''))
      setAccountId(state.accounts[0]?.id ? String(state.accounts[0].id) : '')
      setDate(today())
      setNote('')
      setErrors({})
    }
  }, [isOpen, debt])

  if (!isOpen || !debt) return null

  const amountNum = Number(amount) || 0
  const account = state.accounts.find(a => a.id === Number(accountId))
  const newRemaining = Math.max(0, debt.remainingAmount - amountNum)

  function validate() {
    const e = {}
    if (!amount || isNaN(amountNum) || amountNum <= 0) e.amount = 'Inválido'
    if (!accountId) e.accountId = 'Requerido'
    if (!date) e.date = 'Requerido'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    dispatch({
      type: 'PAY_DEBT',
      payload: {
        debtId: debt.id,
        amount: amountNum,
        accountId: Number(accountId),
        date,
        note,
      },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Registrar pago — {debt.name}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            Saldo restante actual: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(debt.remainingAmount)}</span>
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto del pago</label>
            <input
              type="number" min="0" step="0.01" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.amount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cuenta de origen</label>
            <select
              value={accountId} onChange={e => setAccountId(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.accountId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <option value="" disabled>Selecciona una cuenta</option>
              {state.accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {fmt(a.balance)}</option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha</label>
            <input
              type="date"
              value={date} onChange={e => setDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.date ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nota (opcional)</label>
            <input
              type="text" placeholder={`Pago ${debt.name}`}
              value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            Nuevo saldo restante: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(newRemaining)}</span>
            {account && <> · Nuevo saldo en {account.name}: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(account.balance - amountNum)}</span></>}
          </p>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
              Registrar pago
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
