/**
 * ─────────────────────────────────────────────
 *  FINANZAS PERSONAL — Template Configuration
 * ─────────────────────────────────────────────
 * Edit this file to customize the template.
 * All changes here propagate across the entire app.
 */

const config = {
  app: {
    /** Displayed in the sidebar, browser tab, and PWA manifest */
    name: 'Finanzas Personal',
    shortName: 'Finanzas',
    description: 'Control de finanzas personales — cuentas, deudas, inversiones y metas',
    /** Change the emoji icon in the sidebar */
    icon: '💰',
  },

  currency: {
    /**
     * ISO 4217 currency code.
     * Examples: 'MXN' | 'USD' | 'EUR' | 'ARS' | 'COP' | 'CLP' | 'PEN'
     */
    code: 'MXN',
    /**
     * BCP 47 locale for number formatting.
     * Examples: 'es-MX' | 'en-US' | 'es-AR' | 'es-CO' | 'es-CL' | 'de-DE'
     */
    locale: 'es-MX',
  },

  /**
   * Low-balance alert threshold (used in the insights engine).
   * An alert fires when any account balance falls below this value.
   */
  lowBalanceThreshold: 500,

  /**
   * Emergency fund target in months of expenses.
   * Conventional recommendation is 3–6 months.
   */
  emergencyFundMonths: 3,

  /**
   * Maximum healthy debt-to-income ratio (percentage).
   * An alert fires when monthly debt payments exceed this % of income.
   */
  maxDebtRatio: 30,

  /**
   * Plan Free vs Pro (modelo freemium).
   * Edita `checkoutUrl` con el link de compra de Lemon Squeezy.
   */
  licensing: {
    /** URL de checkout de la suscripción mensual en Lemon Squeezy */
    checkoutUrl: 'https://finzen.lemonsqueezy.com/buy/1796312',
    /** Portal de cliente de Lemon Squeezy para gestionar/cancelar suscripción */
    customerPortalUrl: 'https://app.lemonsqueezy.com/my-orders',
    freeAccountLimit: 2,
    freeHistoryDays: 30,
  },
}

export default config
