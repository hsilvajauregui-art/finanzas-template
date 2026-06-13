# Finanzas Personal

Template de control de finanzas personales construido con React 19, Vite y Tailwind CSS. Incluye dashboard, historial de transacciones, gestión de deudas, patrimonio, metas de ahorro y motor de insights automático. Instalable como PWA. Sin backend — todos los datos se guardan en `localStorage`.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss) ![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8)

---

## Instalación

**Requisitos:** Node.js 18+

```bash
# 1. Clonar e instalar dependencias
git clone <url-del-repo>
cd finanzas-template
npm install

# 2. Servidor de desarrollo
npm run dev
# Abre http://localhost:5173
```

### Otros comandos

| Comando           | Descripción                                   |
|-------------------|-----------------------------------------------|
| `npm run build`   | Build de producción en `dist/`                |
| `npm run preview` | Sirve el build localmente para revisión final |
| `npm run lint`    | Verificación con ESLint                       |

### Despliegue

La app es un SPA estático — se puede alojar en cualquier servicio de hosting estático.

**Netlify:** build command `npm run build`, publish dir `dist`  
**Vercel:** `npx vercel --prod`  
**GitHub Pages:** agrega `base: '/nombre-repo/'` en `vite.config.js` para deploys en subruta.

---

## Personalización

### Moneda

**Opción 1 — Por defecto en `src/config.js`** (afecta a todos los usuarios nuevos):

```js
currency: {
  code: 'MXN',     // ISO 4217: 'USD' | 'EUR' | 'ARS' | 'COP' | 'CLP' | 'PEN'
  locale: 'es-MX', // BCP 47:   'en-US' | 'de-DE' | 'es-AR' | 'es-CO'
}
```

Todos los formatters, gráficas y exportaciones se actualizan automáticamente.

**Opción 2 — En tiempo de ejecución** (por usuario, persiste en `localStorage`):  
Ve a **Configuración → Apariencia → Moneda** y selecciona MXN, USD o EUR.

Para agregar más monedas, extiende el array `CURRENCY_OPTIONS` en `src/context/AppearanceContext.jsx`.

### Tema (claro / oscuro)

El tema se cambia en **Configuración → Apariencia → Tema** con tres modos:

| Modo | Comportamiento |
|---|---|
| Automático | Sigue la preferencia del sistema operativo |
| Claro | Siempre modo claro |
| Oscuro | Siempre modo oscuro |

La preferencia se guarda en `localStorage` bajo la clave `finanzas-theme`.

### Categorías de gastos e ingresos

Las categorías se gestionan en **Configuración → Categorías y cuentas**:

- **Agregar** — botón "Agregar categoría" al final de la lista
- **Renombrar** — icono de lápiz junto a cada categoría
- **Eliminar** — solo es posible si la categoría no tiene transacciones asociadas

Para cambiar los valores por defecto que se cargan en la primera visita, edita `initialState.categories` en `src/context/FinanceContext.jsx`:

```js
categories: {
  expense: [
    { name: 'Alimentación' },
    { name: 'Vivienda' },
    // agrega o elimina categorías aquí
  ],
  income: [
    { name: 'Salario' },
    { name: 'Freelance' },
  ],
},
```

### Nombre e ícono de la app

```js
// src/config.js
app: {
  name: 'Finanzas Personal',  // aparece en sidebar y pestaña del navegador
  shortName: 'Finanzas',      // nombre corto en PWA
  icon: '💰',                 // emoji en el sidebar
}
```

**Ícono PWA:** reemplaza `public/icon.svg`. Para soporte en iOS agrega también `public/apple-touch-icon.png` (180×180 px).

### Umbrales de alertas

```js
// src/config.js
lowBalanceThreshold: 500,  // alerta si una cuenta cae por debajo de este monto
emergencyFundMonths: 3,    // meta de fondo de emergencia en meses de gastos
maxDebtRatio: 30,          // % máximo saludable de deuda/ingresos
```

Los umbrales también se pueden ajustar por usuario desde **Configuración → Alertas** sin tocar el código.

### Datos de demo

Al arrancar por primera vez la app carga 9 meses de historial de demo (Oct 2025 – Jun 2026): ~128 transacciones, 4 cuentas, 4 traspasos, 3 deudas, 5 activos y 3 metas. Para borrarlo todo y partir de cero usa **Datos → Borrar todos los datos**. Para modificar los datos de demo edita `initialState` en `src/context/FinanceContext.jsx`.

### Tabla de referencia rápida

| Objetivo | Archivo | Dónde |
|---|---|---|
| Moneda por defecto | `src/config.js` | `currency` |
| Nombre de la app | `src/config.js` | `app.name` |
| Ícono del sidebar | `src/config.js` | `app.icon` |
| Ícono PWA | `public/icon.svg` | — |
| Categorías por defecto | `src/context/FinanceContext.jsx` | `initialState.categories` |
| Umbrales de alertas | `src/config.js` | `lowBalanceThreshold`, `maxDebtRatio` |
| Reglas de insights | `src/utils/insights.js` | `generateInsights()` |
| Paleta de gráficas | `src/utils/finance.js` | `CHART_COLORS` |

---

## Estructura del proyecto

```
src/
├── config.js                   ← Punto de entrada para personalizar la app
├── App.jsx                     ← Raíz: routing por estado y modales globales
│
├── context/
│   ├── FinanceContext.jsx      ← Estado global (useReducer + localStorage)
│   │                              Contiene: transacciones, cuentas, deudas,
│   │                              activos, metas, categorías, initialState
│   ├── AppearanceContext.jsx   ← Moneda y formato de fecha (runtime)
│   ├── ThemeContext.jsx        ← Tema claro / oscuro / automático
│   └── AlertsContext.jsx       ← Preferencias del motor de insights
│
├── pages/
│   ├── Dashboard.jsx           ← KPIs del mes, tendencia 6M, transacciones recientes
│   ├── Accounts.jsx            ← Cuentas bancarias, saldos y movimientos
│   ├── Patrimony.jsx           ← Activos, distribución por tipo y metas de ahorro
│   ├── Debts.jsx               ← Deudas, progreso de pago y próximos vencimientos
│   ├── Analysis.jsx            ← Gastos por categoría, comparativo mensual e insights
│   ├── History.jsx             ← Historial completo con filtros por tipo;
│   │                              editar y eliminar cualquier transacción
│   │                              (ingresos, gastos y traspasos)
│   ├── Settings.jsx            ← Exportar JSON / CSV, importar backup, borrar datos
│   └── Config.jsx              ← Apariencia, categorías, cuentas y alertas
│
├── components/
│   ├── Layout.jsx              ← Sidebar fijo + topbar mobile con hamburger
│   ├── TransactionModal.jsx    ← Alta y edición de ingresos y gastos
│   ├── TransferModal.jsx       ← Traspasos entre cuentas con preview de saldo
│   ├── DebtModal.jsx           ← Alta y edición de deudas
│   ├── AssetModal.jsx          ← Alta y edición de activos (inversiones, inmuebles…)
│   ├── GoalModal.jsx           ← Alta y edición de metas de ahorro
│   ├── TrendChart.jsx          ← Gráfica de área (ingresos / gastos / ahorro neto)
│   ├── InsightCard.jsx         ← Tarjeta de alerta, análisis o sugerencia
│   ├── ColorPicker.jsx         ← Selector de color reutilizable
│   ├── InstallPrompt.jsx       ← Banner de instalación PWA
│   └── UpdatePrompt.jsx        ← Banner de actualización PWA (nuevo service worker)
│
└── utils/
    ├── finance.js              ← getMonthlySummary, getExpensesByCategory,
    │                              daysUntilPayment, CHART_COLORS
    └── insights.js             ← Motor de 12 reglas automáticas (alertas,
                                   análisis y sugerencias)
```

---

## Stack

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19 | UI y estado |
| Vite | 8 | Bundler y dev server |
| Tailwind CSS | 4 | Estilos utilitarios |
| Recharts | 3 | Gráficas (área, barras, dona) |
| Lucide React | 1 | Iconos |
| vite-plugin-pwa | 1 | Service worker e instalación offline |
