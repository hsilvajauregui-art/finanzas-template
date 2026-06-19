import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth()
  const [mode, setMode]       = useState('login') // 'login' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = mode === 'login'
      ? await signInEmail(email, password)
      : await signUpEmail(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else if (mode === 'register') {
      setMessage('Revisa tu correo para confirmar tu cuenta.')
    }
  }

  const handleGoogle = async () => {
    setError(null)
    const { error } = await signInGoogle()
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-7 h-7">
              <rect x="6" y="24" width="7" height="10" rx="2" fill="white" opacity="0.75"/>
              <rect x="16" y="16" width="7" height="18" rx="2" fill="white"/>
              <rect x="26" y="8" width="7" height="26" rx="2" fill="white" opacity="0.75"/>
              <circle cx="9.5" cy="21" r="2.5" fill="white" opacity="0.9"/>
              <circle cx="19.5" cy="13" r="2.5" fill="white" opacity="0.9"/>
              <circle cx="29.5" cy="5.5" r="2.5" fill="white" opacity="0.9"/>
              <path d="M9.5 21 L19.5 13 L29.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">Finzen</span>
        </div>

        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-xl">
          <h2 className="text-white text-lg font-semibold mb-1">
            {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Empieza a controlar tus finanzas'}
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-2.5 rounded-xl mb-4 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-700"/>
            <span className="text-slate-500 text-xs">o con correo</span>
            <div className="flex-1 h-px bg-slate-700"/>
          </div>

          {/* Formulario email */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#0f172a] text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-[#0f172a] text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {message && <p className="text-green-400 text-xs">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-4">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setMessage(null) }}
              className="text-blue-400 hover:underline"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
