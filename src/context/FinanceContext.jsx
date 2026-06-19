import { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'finanzas-data'

export const initialState = {
  incomes: [
    { id: 1, source: 'Salario', amount: 15000, frequency: 'monthly', color: '#3b82f6' },
    { id: 2, source: 'Freelance Diseño', amount: 3500, frequency: 'monthly', color: '#8b5cf6' },
  ],
  accounts: [
    { id: 1, name: 'BBVA Débito',  type: 'debit',   balance: 32450, color: '#3b82f6', icon: 'card'    },
    { id: 2, name: 'Nu',           type: 'digital',  balance: 8200,  color: '#8b5cf6', icon: 'phone'   },
    { id: 3, name: 'HSBC Ahorro',  type: 'savings',  balance: 22500, color: '#10b981', icon: 'savings' },
    { id: 4, name: 'Efectivo',     type: 'cash',     balance: 1800,  color: '#f59e0b', icon: 'cash'    },
  ],
  transactions: [
    // ── OCTUBRE 2025 ── income 15 000 · expenses ≈14 084 · savings ≈916
    { id: 101, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2025-10-05', account: 1, note: 'Salario octubre' },
    { id: 102, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2025-10-01', account: 1, note: '' },
    { id: 103, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2025-10-10', account: 1, note: 'Totalplay' },
    { id: 104, type: 'expense', category: 'Vivienda',       subcategory: 'Luz',        amount: 420,   date: '2025-10-10', account: 1, note: 'CFE' },
    { id: 105, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 185,   date: '2025-10-10', account: 4, note: '' },
    { id: 106, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2025-10-07', account: 2, note: 'Netflix' },
    { id: 107, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2025-10-02', account: 2, note: 'Mensualidad' },
    { id: 108, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1580,  date: '2025-10-06', account: 1, note: 'Walmart' },
    { id: 109, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 980,   date: '2025-10-23', account: 1, note: 'Mercado' },
    { id: 110, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 680,   date: '2025-10-04', account: 1, note: '' },
    { id: 111, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 620,   date: '2025-10-16', account: 2, note: 'Cena viernes' },
    { id: 112, type: 'expense', category: 'Transporte',     subcategory: 'Uber/Taxi',  amount: 280,   date: '2025-10-22', account: 2, note: '' },
    { id: 113, type: 'expense', category: 'Entretenimiento',subcategory: 'Salidas',    amount: 350,   date: '2025-10-19', account: 2, note: 'Cine' },
    { id: 114, type: 'expense', category: 'Alimentación',   subcategory: 'Café',       amount: 240,   date: '2025-10-28', account: 4, note: '' },
    { id: 116, type: 'transfer',category: 'Traspaso',       subcategory: '',           amount: 4000,  date: '2025-10-30', account: 1, toAccount: 3, note: 'Ahorro mensual' },

    // ── NOVIEMBRE 2025 ── income 19 500 · expenses ≈16 749 · savings ≈2 751
    { id: 201, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2025-11-05', account: 1, note: 'Salario noviembre' },
    { id: 202, type: 'income',  category: 'Freelance',      subcategory: '',           amount: 4500,  date: '2025-11-18', account: 2, note: 'Proyecto branding' },
    { id: 203, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2025-11-01', account: 1, note: '' },
    { id: 204, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2025-11-10', account: 1, note: 'Totalplay' },
    { id: 205, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 200,   date: '2025-11-10', account: 4, note: '' },
    { id: 206, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2025-11-07', account: 2, note: 'Netflix' },
    { id: 207, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2025-11-03', account: 2, note: '' },
    { id: 208, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1720,  date: '2025-11-05', account: 1, note: 'Walmart' },
    { id: 209, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1050,  date: '2025-11-21', account: 1, note: 'Mercado' },
    { id: 210, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 720,   date: '2025-11-07', account: 1, note: '' },
    { id: 211, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 880,   date: '2025-11-22', account: 2, note: 'Cena con clientes' },
    { id: 212, type: 'expense', category: 'Transporte',     subcategory: 'Uber/Taxi',  amount: 310,   date: '2025-11-15', account: 2, note: '' },
    { id: 213, type: 'expense', category: 'Ropa',           subcategory: 'Ropa',       amount: 1850,  date: '2025-11-27', account: 1, note: 'Liverpool' },
    { id: 214, type: 'expense', category: 'Salud',          subcategory: 'Médico',     amount: 850,   date: '2025-11-25', account: 1, note: 'Consulta + análisis' },
    { id: 215, type: 'expense', category: 'Entretenimiento',subcategory: 'Salidas',    amount: 420,   date: '2025-11-30', account: 2, note: '' },
    { id: 217, type: 'transfer',category: 'Traspaso',       subcategory: '',           amount: 1500,  date: '2025-11-30', account: 2, toAccount: 3, note: 'Ahorro extra' },

    // ── DICIEMBRE 2025 ── income 20 000 · expenses ≈22 369 · savings ≈-2 369  (Navidad)
    { id: 301, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2025-12-05', account: 1, note: 'Salario diciembre' },
    { id: 302, type: 'income',  category: 'Salario',        subcategory: 'Bono',       amount: 5000,  date: '2025-12-15', account: 1, note: 'Aguinaldo' },
    { id: 303, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2025-12-01', account: 1, note: '' },
    { id: 304, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2025-12-10', account: 1, note: 'Totalplay' },
    { id: 305, type: 'expense', category: 'Vivienda',       subcategory: 'Luz',        amount: 480,   date: '2025-12-10', account: 1, note: 'CFE' },
    { id: 306, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 260,   date: '2025-12-10', account: 4, note: 'Frío diciembre' },
    { id: 307, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2025-12-07', account: 2, note: 'Netflix' },
    { id: 308, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2025-12-02', account: 2, note: '' },
    { id: 309, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 2100,  date: '2025-12-06', account: 1, note: 'Despensa navideña' },
    { id: 310, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1400,  date: '2025-12-22', account: 1, note: 'Última compra del año' },
    { id: 311, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 780,   date: '2025-12-04', account: 1, note: '' },
    { id: 312, type: 'expense', category: 'Otros',          subcategory: '',           amount: 3200,  date: '2025-12-18', account: 1, note: 'Regalos navideños' },
    { id: 313, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 1850,  date: '2025-12-24', account: 1, note: 'Cena navideña familiar' },
    { id: 314, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 950,   date: '2025-12-31', account: 2, note: 'Cena año nuevo' },
    { id: 315, type: 'expense', category: 'Entretenimiento',subcategory: 'Salidas',    amount: 880,   date: '2025-12-27', account: 2, note: 'Posadas' },
    { id: 316, type: 'expense', category: 'Ropa',           subcategory: 'Ropa',       amount: 1200,  date: '2025-12-20', account: 1, note: 'Outfit navideño' },
    { id: 317, type: 'expense', category: 'Transporte',     subcategory: 'Uber/Taxi',  amount: 520,   date: '2025-12-28', account: 2, note: '' },

    // ── ENERO 2026 ── income 15 000 · expenses ≈14 029 · savings ≈971  (pos-navidad)
    { id: 401, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2026-01-05', account: 1, note: 'Salario enero' },
    { id: 402, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2026-01-01', account: 1, note: '' },
    { id: 403, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2026-01-10', account: 1, note: 'Totalplay' },
    { id: 404, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 210,   date: '2026-01-10', account: 4, note: '' },
    { id: 405, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2026-01-07', account: 2, note: 'Netflix' },
    { id: 406, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2026-01-02', account: 2, note: '' },
    { id: 407, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1450,  date: '2026-01-07', account: 1, note: 'Walmart' },
    { id: 408, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 880,   date: '2026-01-23', account: 1, note: 'Mercado' },
    { id: 409, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 640,   date: '2026-01-06', account: 1, note: '' },
    { id: 410, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 480,   date: '2026-01-17', account: 2, note: '' },
    { id: 411, type: 'expense', category: 'Transporte',     subcategory: 'Uber/Taxi',  amount: 200,   date: '2026-01-20', account: 2, note: '' },
    { id: 412, type: 'expense', category: 'Educación',      subcategory: 'Cursos',     amount: 1200,  date: '2026-01-15', account: 2, note: 'Curso UX diseño' },
    { id: 413, type: 'expense', category: 'Alimentación',   subcategory: 'Café',       amount: 220,   date: '2026-01-28', account: 4, note: '' },

    // ── FEBRERO 2026 ── income 18 500 · expenses ≈14 424 · savings ≈4 076
    { id: 501, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2026-02-05', account: 1, note: 'Salario febrero' },
    { id: 502, type: 'income',  category: 'Freelance',      subcategory: '',           amount: 3500,  date: '2026-02-20', account: 2, note: 'App móvil cliente' },
    { id: 503, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2026-02-01', account: 1, note: '' },
    { id: 504, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2026-02-10', account: 1, note: 'Totalplay' },
    { id: 505, type: 'expense', category: 'Vivienda',       subcategory: 'Luz',        amount: 440,   date: '2026-02-10', account: 1, note: 'CFE' },
    { id: 506, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 185,   date: '2026-02-10', account: 4, note: '' },
    { id: 507, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2026-02-07', account: 2, note: 'Netflix' },
    { id: 508, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2026-02-03', account: 2, note: '' },
    { id: 509, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1600,  date: '2026-02-04', account: 1, note: 'Walmart' },
    { id: 510, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 920,   date: '2026-02-21', account: 1, note: 'Mercado' },
    { id: 511, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 700,   date: '2026-02-06', account: 1, note: '' },
    { id: 512, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 1250,  date: '2026-02-14', account: 2, note: 'Cena San Valentín' },
    { id: 513, type: 'expense', category: 'Otros',          subcategory: '',           amount: 580,   date: '2026-02-14', account: 2, note: 'Detalle San Valentín' },
    { id: 514, type: 'transfer',category: 'Traspaso',       subcategory: '',           amount: 3000,  date: '2026-02-25', account: 2, toAccount: 3, note: 'Ahorro mensual' },

    // ── MARZO 2026 ── income 15 000 · expenses ≈16 514 · savings ≈-1 514  (servicio auto)
    { id: 601, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2026-03-05', account: 1, note: 'Salario marzo' },
    { id: 602, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2026-03-01', account: 1, note: '' },
    { id: 603, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2026-03-10', account: 1, note: 'Totalplay' },
    { id: 604, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 175,   date: '2026-03-10', account: 4, note: '' },
    { id: 605, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2026-03-07', account: 2, note: 'Netflix' },
    { id: 606, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2026-03-03', account: 2, note: '' },
    { id: 607, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1680,  date: '2026-03-06', account: 1, note: 'Walmart' },
    { id: 608, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1050,  date: '2026-03-24', account: 1, note: 'Mercado' },
    { id: 609, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 750,   date: '2026-03-05', account: 1, note: '' },
    { id: 610, type: 'expense', category: 'Transporte',     subcategory: 'Mantenimiento',amount: 2800, date: '2026-03-20', account: 1, note: 'Servicio + llantas' },
    { id: 611, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 680,   date: '2026-03-15', account: 2, note: '' },
    { id: 612, type: 'expense', category: 'Transporte',     subcategory: 'Uber/Taxi',  amount: 250,   date: '2026-03-18', account: 2, note: '' },
    { id: 613, type: 'expense', category: 'Entretenimiento',subcategory: 'Salidas',    amount: 380,   date: '2026-03-28', account: 2, note: '' },
    { id: 615, type: 'transfer',category: 'Traspaso',       subcategory: '',           amount: 2000,  date: '2026-03-31', account: 1, toAccount: 2, note: 'Recarga Nu' },

    // ── ABRIL 2026 ── income 15 000 · expenses ≈16 474 · savings ≈-1 474  (ropa + salud)
    { id: 701, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2026-04-05', account: 1, note: 'Salario abril' },
    { id: 702, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2026-04-01', account: 1, note: '' },
    { id: 703, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2026-04-10', account: 1, note: 'Totalplay' },
    { id: 704, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 165,   date: '2026-04-10', account: 4, note: '' },
    { id: 705, type: 'expense', category: 'Vivienda',       subcategory: 'Luz',        amount: 380,   date: '2026-04-10', account: 1, note: 'CFE' },
    { id: 706, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2026-04-07', account: 2, note: 'Netflix' },
    { id: 707, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2026-04-02', account: 2, note: '' },
    { id: 708, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1750,  date: '2026-04-07', account: 1, note: 'Walmart' },
    { id: 709, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1100,  date: '2026-04-22', account: 1, note: 'Mercado' },
    { id: 710, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 720,   date: '2026-04-04', account: 1, note: '' },
    { id: 711, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 780,   date: '2026-04-19', account: 2, note: '' },
    { id: 712, type: 'expense', category: 'Transporte',     subcategory: 'Uber/Taxi',  amount: 320,   date: '2026-04-16', account: 2, note: '' },
    { id: 713, type: 'expense', category: 'Ropa',           subcategory: 'Ropa',       amount: 1650,  date: '2026-04-12', account: 1, note: 'Ropa primavera' },
    { id: 714, type: 'expense', category: 'Entretenimiento',subcategory: 'Salidas',    amount: 480,   date: '2026-04-26', account: 2, note: '' },
    { id: 715, type: 'expense', category: 'Salud',          subcategory: 'Farmacia',   amount: 380,   date: '2026-04-23', account: 1, note: '' },

    // ── MAYO 2026 ── income 15 000 · expenses ≈15 669 · savings ≈-669  (urgencias médicas)
    { id: 801, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2026-05-05', account: 1, note: 'Salario mayo' },
    { id: 802, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2026-05-01', account: 1, note: '' },
    { id: 803, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2026-05-10', account: 1, note: 'Totalplay' },
    { id: 804, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 170,   date: '2026-05-10', account: 4, note: '' },
    { id: 805, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2026-05-07', account: 2, note: 'Netflix' },
    { id: 806, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2026-05-02', account: 2, note: '' },
    { id: 807, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1620,  date: '2026-05-06', account: 1, note: 'Walmart' },
    { id: 808, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 1080,  date: '2026-05-23', account: 1, note: 'Mercado' },
    { id: 809, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 700,   date: '2026-05-05', account: 1, note: '' },
    { id: 810, type: 'expense', category: 'Salud',          subcategory: 'Médico',     amount: 1200,  date: '2026-05-15', account: 1, note: 'Urgencias' },
    { id: 811, type: 'expense', category: 'Salud',          subcategory: 'Farmacia',   amount: 650,   date: '2026-05-16', account: 1, note: 'Medicamentos' },
    { id: 812, type: 'expense', category: 'Alimentación',   subcategory: 'Restaurante',amount: 620,   date: '2026-05-10', account: 2, note: '' },
    { id: 813, type: 'expense', category: 'Transporte',     subcategory: 'Uber/Taxi',  amount: 280,   date: '2026-05-20', account: 2, note: '' },
    { id: 814, type: 'expense', category: 'Entretenimiento',subcategory: 'Salidas',    amount: 350,   date: '2026-05-25', account: 2, note: '' },
    { id: 815, type: 'expense', category: 'Alimentación',   subcategory: 'Café',       amount: 250,   date: '2026-05-28', account: 4, note: '' },

    // ── JUNIO 2026 (hasta el día 12) ── income 15 000 · expenses ≈10 544
    { id: 901, type: 'income',  category: 'Salario',        subcategory: 'Quincena',   amount: 15000, date: '2026-06-05', account: 1, note: 'Salario junio' },
    { id: 902, type: 'expense', category: 'Vivienda',       subcategory: 'Renta',      amount: 7500,  date: '2026-06-01', account: 1, note: '' },
    { id: 903, type: 'expense', category: 'Vivienda',       subcategory: 'Internet',   amount: 550,   date: '2026-06-10', account: 1, note: 'Totalplay' },
    { id: 904, type: 'expense', category: 'Vivienda',       subcategory: 'Gas',        amount: 165,   date: '2026-06-10', account: 4, note: '' },
    { id: 905, type: 'expense', category: 'Entretenimiento',subcategory: 'Streaming',  amount: 199,   date: '2026-06-07', account: 2, note: 'Netflix' },
    { id: 906, type: 'expense', category: 'Salud',          subcategory: 'Gym',        amount: 500,   date: '2026-06-02', account: 2, note: '' },
    { id: 907, type: 'expense', category: 'Alimentación',   subcategory: 'Super',      amount: 850,   date: '2026-06-06', account: 1, note: 'Walmart' },
    { id: 908, type: 'expense', category: 'Transporte',     subcategory: 'Gasolina',   amount: 600,   date: '2026-06-04', account: 1, note: '' },
    { id: 909, type: 'expense', category: 'Alimentación',   subcategory: 'Café',       amount: 180,   date: '2026-06-11', account: 4, note: '' },
  ],
  debts: [
    { id: 1, name: 'Tarjeta BBVA Crédito', totalAmount: 18000,  remainingAmount: 11400,  monthlyPayment: 1800, interestRate: 36, dueDay: 15, color: '#ef4444' },
    { id: 2, name: 'Crédito Auto Mazda',   totalAmount: 180000, remainingAmount: 152000, monthlyPayment: 4200, interestRate: 12, dueDay: 5,  color: '#f97316' },
    { id: 3, name: 'Crédito Personal',     totalAmount: 30000,  remainingAmount: 19500,  monthlyPayment: 2500, interestRate: 24, dueDay: 28, color: '#8b5cf6' },
  ],
  assets: [
    { id: 1, name: 'CETES 28d',          type: 'investment', value: 28000,  currency: 'MXN', color: '#3b82f6' },
    { id: 2, name: 'GBM+ S&P500',        type: 'investment', value: 45000,  currency: 'MXN', color: '#8b5cf6' },
    { id: 3, name: 'Depto. Narvarte',     type: 'property',   value: 920000, currency: 'MXN', color: '#10b981' },
    { id: 4, name: 'Mazda 3 2022',        type: 'vehicle',    value: 185000, currency: 'MXN', color: '#f59e0b' },
    { id: 5, name: 'Ahorro HSBC',         type: 'cash',       value: 22500,  currency: 'MXN', color: '#6366f1' },
  ],
  goals: [
    { id: 1, name: 'Fondo de emergencia', targetAmount: 90000,  currentAmount: 28500, deadline: '2027-06-30', color: '#3b82f6' },
    { id: 2, name: 'Viaje a Europa',      targetAmount: 65000,  currentAmount: 21000, deadline: '2027-09-01', color: '#f59e0b' },
    { id: 3, name: 'Enganche depa propia',targetAmount: 300000, currentAmount: 48000, deadline: '2030-01-01', color: '#10b981' },
  ],
  categories: {
    expense: [
      { name: 'Alimentación',    subcategories: ['Super', 'Restaurante', 'Café', 'Delivery'] },
      { name: 'Transporte',      subcategories: ['Gasolina', 'Uber/Taxi', 'Transporte público', 'Mantenimiento'] },
      { name: 'Vivienda',        subcategories: ['Renta', 'Agua', 'Luz', 'Internet', 'Gas'] },
      { name: 'Salud',           subcategories: ['Médico', 'Farmacia', 'Gym', 'Seguro'] },
      { name: 'Entretenimiento', subcategories: ['Streaming', 'Salidas', 'Hobbies', 'Libros'] },
      { name: 'Ropa',            subcategories: ['Ropa', 'Calzado', 'Accesorios'] },
      { name: 'Educación',       subcategories: ['Colegiatura', 'Cursos', 'Libros', 'Software'] },
      { name: 'Deudas',          subcategories: [] },
      { name: 'Ahorro',          subcategories: [] },
      { name: 'Otros',           subcategories: [] },
    ],
    income: [
      { name: 'Salario',     subcategories: ['Quincena', 'Bono'] },
      { name: 'Freelance',   subcategories: [] },
      { name: 'Inversiones', subcategories: [] },
      { name: 'Ahorro',      subcategories: [] },
      { name: 'Otros',       subcategories: [] },
    ],
  },
}

export const emptyState = {
  incomes:      [],
  accounts:     [],
  transactions: [],
  debts:        [],
  assets:       [],
  goals:        [],
  categories:   initialState.categories,
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const t = { ...action.payload, id: Date.now() }
      const delta = t.type === 'income' ? t.amount : -t.amount
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === t.account ? { ...a, balance: a.balance + delta } : a
        ),
        transactions: [...state.transactions, t],
      }
    }
    case 'UPDATE_TRANSACTION': {
      const newT = action.payload
      const oldT = state.transactions.find(t => t.id === newT.id)
      return {
        ...state,
        accounts: state.accounts.map(a => {
          let bal = a.balance
          if (oldT && a.id === oldT.account) bal -= oldT.type === 'income' ? oldT.amount : -oldT.amount
          if (a.id === newT.account) bal += newT.type === 'income' ? newT.amount : -newT.amount
          return bal !== a.balance ? { ...a, balance: bal } : a
        }),
        transactions: state.transactions.map(t => t.id === newT.id ? newT : t),
      }
    }
    case 'DELETE_TRANSACTION': {
      const t = state.transactions.find(tx => tx.id === action.payload)
      return {
        ...state,
        accounts: state.accounts.map(a => {
          if (!t || a.id !== t.account) return a
          const delta = t.type === 'income' ? -t.amount : t.amount
          return { ...a, balance: a.balance + delta }
        }),
        transactions: state.transactions.filter(tx => tx.id !== action.payload),
      }
    }
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) }
    case 'ADD_CATEGORY':
      // payload: { type: 'expense'|'income', name }
      return {
        ...state,
        categories: {
          ...state.categories,
          [action.payload.type]: [
            ...state.categories[action.payload.type],
            { name: action.payload.name, subcategories: [] },
          ],
        },
      }
    case 'UPDATE_CATEGORY':
      // payload: { type, oldName, newName }; also renames matching transactions for consistency
      return {
        ...state,
        categories: {
          ...state.categories,
          [action.payload.type]: state.categories[action.payload.type].map(
            c => c.name === action.payload.oldName ? { ...c, name: action.payload.newName } : c
          ),
        },
        transactions: state.transactions.map(t =>
          t.type === action.payload.type && t.category === action.payload.oldName
            ? { ...t, category: action.payload.newName }
            : t
        ),
      }
    case 'DELETE_CATEGORY':
      // payload: { type, name }
      return {
        ...state,
        categories: {
          ...state.categories,
          [action.payload.type]: state.categories[action.payload.type].filter(
            c => c.name !== action.payload.name
          ),
        },
      }
    case 'TRANSFER':
      return {
        ...state,
        accounts: state.accounts.map(a => {
          if (a.id === action.payload.fromId) return { ...a, balance: a.balance - action.payload.amount }
          if (a.id === action.payload.toId) return { ...a, balance: a.balance + action.payload.amount }
          return a
        }),
        transactions: [...state.transactions, {
          id: Date.now(),
          type: 'transfer',
          category: 'Traspaso',
          subcategory: '',
          amount: action.payload.amount,
          date: action.payload.date,
          account: action.payload.fromId,
          toAccount: action.payload.toId,
          note: action.payload.note || '',
        }],
      }
    case 'DELETE_TRANSFER': {
      const t = action.payload
      return {
        ...state,
        accounts: state.accounts.map(a => {
          if (a.id === t.account)   return { ...a, balance: a.balance + t.amount }
          if (a.id === t.toAccount) return { ...a, balance: a.balance - t.amount }
          return a
        }),
        transactions: state.transactions.filter(tx => tx.id !== t.id),
      }
    }
    case 'UPDATE_TRANSFER': {
      const { old: oldT, fromId, toId, amount, date, note } = action.payload
      return {
        ...state,
        accounts: state.accounts.map(a => {
          let bal = a.balance
          if (a.id === oldT.account)   bal += oldT.amount
          if (a.id === oldT.toAccount) bal -= oldT.amount
          if (a.id === fromId)         bal -= amount
          if (a.id === toId)           bal += amount
          return bal !== a.balance ? { ...a, balance: bal } : a
        }),
        transactions: state.transactions.map(tx =>
          tx.id === oldT.id
            ? { ...tx, account: fromId, toAccount: toId, amount, date, note }
            : tx
        ),
      }
    }
    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_DEBT':
      return { ...state, debts: state.debts.map(d => d.id === action.payload.id ? action.payload : d) }
    case 'DELETE_DEBT':
      return { ...state, debts: state.debts.filter(d => d.id !== action.payload) }
    case 'PAY_DEBT': {
      // payload: { debtId, amount, accountId, date, note }
      const { debtId, amount, accountId, date, note } = action.payload
      const debt = state.debts.find(d => d.id === debtId)
      if (!debt) return state
      const newRemaining = Math.max(0, debt.remainingAmount - amount)
      return {
        ...state,
        debts: state.debts.map(d => d.id === debtId ? { ...d, remainingAmount: newRemaining } : d),
        accounts: state.accounts.map(a => a.id === accountId ? { ...a, balance: a.balance - amount } : a),
        transactions: [...state.transactions, {
          id: Date.now(),
          type: 'expense',
          category: 'Deudas',
          subcategory: debt.name,
          amount,
          date,
          account: accountId,
          note: note || `Pago ${debt.name}`,
        }],
      }
    }
    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_ASSET':
      return { ...state, assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'DELETE_ASSET':
      return { ...state, assets: state.assets.filter(a => a.id !== action.payload) }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) }
    case 'WITHDRAW_GOAL': {
      // payload: { goalId, amount, accountId, date, note }
      const { goalId, amount, accountId, date, note } = action.payload
      const goal = state.goals.find(g => g.id === goalId)
      if (!goal) return state
      const newCurrent = Math.max(0, goal.currentAmount - amount)
      return {
        ...state,
        goals: state.goals.map(g => g.id === goalId ? { ...g, currentAmount: newCurrent } : g),
        accounts: state.accounts.map(a => a.id === accountId ? { ...a, balance: a.balance + amount } : a),
        transactions: [...state.transactions, {
          id: Date.now(),
          type: 'income',
          category: 'Ahorro',
          subcategory: goal.name,
          amount,
          date,
          account: accountId,
          note: note || `Retiro de meta ${goal.name}`,
        }],
      }
    }
    case 'CONTRIBUTE_GOAL': {
      // payload: { goalId, amount, accountId, date, note }
      const { goalId, amount, accountId, date, note } = action.payload
      const goal = state.goals.find(g => g.id === goalId)
      if (!goal) return state
      const newCurrent = Math.min(goal.targetAmount, goal.currentAmount + amount)
      return {
        ...state,
        goals: state.goals.map(g => g.id === goalId ? { ...g, currentAmount: newCurrent } : g),
        accounts: state.accounts.map(a => a.id === accountId ? { ...a, balance: a.balance - amount } : a),
        transactions: [...state.transactions, {
          id: Date.now(),
          type: 'expense',
          category: 'Ahorro',
          subcategory: goal.name,
          amount,
          date,
          account: accountId,
          note: note || `Aporte a meta ${goal.name}`,
        }],
      }
    }
    case 'ADD_INCOME':
      return { ...state, incomes: [...state.incomes, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_INCOME':
      return { ...state, incomes: state.incomes.map(i => i.id === action.payload.id ? action.payload : i) }
    case 'DELETE_INCOME':
      return { ...state, incomes: state.incomes.filter(i => i.id !== action.payload) }
    case 'LOAD':
      return action.payload
    default:
      return state
  }
}

function applyBackwardCompat(parsed, init) {
  if (!parsed.categories) parsed.categories = init.categories
  if (parsed.categories?.expense && !parsed.categories.expense.some(c => c.name === 'Deudas'))
    parsed.categories.expense = [...parsed.categories.expense, { name: 'Deudas', subcategories: [] }]
  if (parsed.categories?.expense && !parsed.categories.expense.some(c => c.name === 'Ahorro'))
    parsed.categories.expense = [...parsed.categories.expense, { name: 'Ahorro', subcategories: [] }]
  if (parsed.categories?.income && !parsed.categories.income.some(c => c.name === 'Ahorro'))
    parsed.categories.income = [...parsed.categories.income, { name: 'Ahorro', subcategories: [] }]
  if (parsed.transactions)
    parsed.transactions = parsed.transactions.map(t =>
      t.type === 'transfer' && t.toAccount == null
        ? { ...t, toAccount: t.to ?? t.destination ?? t.toId ?? null }
        : t
    )
  if (parsed.assets) {
    const vehiclePattern = /\b(auto|coche|carro|camioneta|truck|van|sedan|suv|moto|mazda|toyota|honda|ford|chevrolet|nissan|kia|hyundai|vw|volkswagen)\b/i
    parsed.assets = parsed.assets.map(a =>
      a.type === 'property' && vehiclePattern.test(a.name) ? { ...a, type: 'vehicle' } : a
    )
  }
  return parsed
}

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loaded, setLoaded] = useState(false)

  // Cargar datos desde Supabase al iniciar sesión
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoaded(true); return }

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data?.data && Object.keys(data.data).length > 0) {
        // Datos en Supabase — cargarlos
        const compatible = applyBackwardCompat(data.data, initialState)
        dispatch({ type: 'LOAD', payload: compatible })
      } else {
        // Usuario nuevo — intentar migrar desde localStorage
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const parsed = applyBackwardCompat(JSON.parse(saved), initialState)
            dispatch({ type: 'LOAD', payload: parsed })
          }
        } catch { /* nada */ }
      }
      setLoaded(true)
    }
    loadData()
  }, [])

  // Guardar en Supabase cada vez que cambia el estado
  useEffect(() => {
    if (!loaded) return
    async function saveData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase
        .from('user_data')
        .upsert({ user_id: user.id, data: state, updated_at: new Date().toISOString() })
    }
    saveData()
    // También mantener localStorage como respaldo offline
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, loaded])

  if (!loaded) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <FinanceContext.Provider value={{ state, dispatch }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  return useContext(FinanceContext)
}
