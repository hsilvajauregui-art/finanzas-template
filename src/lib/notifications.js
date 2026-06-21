import { Capacitor } from '@capacitor/core'

let LocalNotifications = null

async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null
  if (!LocalNotifications) {
    const mod = await import('@capacitor/local-notifications')
    LocalNotifications = mod.LocalNotifications
  }
  return LocalNotifications
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    const plugin = await getPlugin()
    const { display } = await plugin.requestPermissions()
    return display === 'granted'
  }
  // Web
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function hasNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    const plugin = await getPlugin()
    const { display } = await plugin.checkPermissions()
    return display === 'granted'
  }
  return 'Notification' in window && Notification.permission === 'granted'
}

// ── Schedule helpers ──────────────────────────────────────────────────────────

function nextOccurrence(hour, minute) {
  const now = new Date()
  const next = new Date()
  next.setHours(hour, minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next
}

// ── Daily expense reminder ────────────────────────────────────────────────────

const DAILY_ID = 1001

export async function scheduleDailyReminder(hour = 20, minute = 0) {
  const plugin = await getPlugin()
  if (plugin) {
    // Native: cancel existing then re-schedule
    try { await plugin.cancel({ notifications: [{ id: DAILY_ID }] }) } catch {}
    await plugin.schedule({
      notifications: [{
        id: DAILY_ID,
        title: '📊 Finzen',
        body: '¿Ya registraste tus gastos de hoy?',
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
        sound: null,
        smallIcon: 'ic_launcher_foreground',
      }],
    })
  } else {
    // Web: show immediately if it's past the target hour and hasn't fired today
    const lastFired = localStorage.getItem('finzen_daily_notif_date')
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    if (lastFired !== today && now.getHours() >= hour) {
      showWebNotification('📊 Finzen', '¿Ya registraste tus gastos de hoy?')
      localStorage.setItem('finzen_daily_notif_date', today)
    }
    // Schedule for later today / tomorrow via timeout
    const next = nextOccurrence(hour, minute)
    const ms = next - now
    setTimeout(() => {
      showWebNotification('📊 Finzen', '¿Ya registraste tus gastos de hoy?')
      localStorage.setItem('finzen_daily_notif_date', new Date().toISOString().split('T')[0])
    }, ms)
  }
}

export async function cancelDailyReminder() {
  const plugin = await getPlugin()
  if (plugin) {
    try { await plugin.cancel({ notifications: [{ id: DAILY_ID }] }) } catch {}
  }
}

// ── Debt due-date reminders ───────────────────────────────────────────────────

export async function scheduleDebtReminders(debts) {
  const plugin = await getPlugin()
  if (!debts?.length) return

  const today = new Date()
  const notifications = []
  const webMessages = []

  debts.forEach((debt, i) => {
    if (!debt.dueDay || debt.remainingAmount <= 0) return
    const dueDate = new Date(today.getFullYear(), today.getMonth(), debt.dueDay)
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1)

    const daysUntil = Math.round((dueDate - today) / 86400000)

    if (daysUntil === 3 || daysUntil === 1) {
      const label = daysUntil === 1 ? 'mañana' : 'en 3 días'
      const body = `Pago de "${debt.name}" vence ${label} — $${debt.monthlyPayment?.toLocaleString('es-MX') ?? ''}`

      if (plugin) {
        const scheduleDate = new Date(dueDate)
        scheduleDate.setDate(scheduleDate.getDate() - daysUntil)
        scheduleDate.setHours(9, 0, 0, 0)
        notifications.push({
          id: 2000 + i,
          title: '💳 Vencimiento próximo',
          body,
          schedule: { at: scheduleDate, allowWhileIdle: true },
          sound: null,
          smallIcon: 'ic_launcher_foreground',
        })
      } else {
        webMessages.push(body)
      }
    }
  })

  if (plugin && notifications.length) {
    // Cancel old debt notifications
    try {
      const ids = Array.from({ length: 20 }, (_, i) => ({ id: 2000 + i }))
      await plugin.cancel({ notifications: ids })
    } catch {}
    await plugin.schedule({ notifications })
  }

  // Web: show immediately (once per day)
  if (webMessages.length) {
    const today = new Date().toISOString().split('T')[0]
    const lastDebt = localStorage.getItem('finzen_debt_notif_date')
    if (lastDebt !== today) {
      webMessages.forEach(msg => showWebNotification('💳 Vencimiento próximo', msg))
      localStorage.setItem('finzen_debt_notif_date', today)
    }
  }
}

// ── Web notification helper ───────────────────────────────────────────────────

function showWebNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' })
    })
  } else {
    new Notification(title, { body, icon: '/icon-192.png' })
  }
}

// ── Init: call on app start if notifications enabled ─────────────────────────

export async function initNotifications(debts = []) {
  const prefs = getNotifPrefs()
  if (!prefs.enabled) return

  const hasPermission = await hasNotificationPermission()
  if (!hasPermission) return

  await scheduleDailyReminder(prefs.hour, prefs.minute)
  await scheduleDebtReminders(debts)
}

// ── Preferences (stored in localStorage) ─────────────────────────────────────

const PREFS_KEY = 'finzen_notif_prefs'

export function getNotifPrefs() {
  try {
    const saved = localStorage.getItem(PREFS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { enabled: false, hour: 20, minute: 0, debtAlerts: true }
}

export function saveNotifPrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}
