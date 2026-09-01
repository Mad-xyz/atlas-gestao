// RESUMO: Tela de Login Hardened (Skill 007 Security Standard).
// Usa loginSmart: mesmo e-mail, PIN diferente = papel diferente.
// 3 cliques na logo → modo Admin (PIN admin visível).
// Proteção contra força bruta (Rate limiting de 5 tentativas com lockout de 3 min).
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { LogIn, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AmbientBackground from '../../components/shared/AmbientBackground'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 3 * 60 * 1000 // 3 minutos

export default function LoginPage() {
  // ── Pre-fill vindo do cadastro (?email=...&pin=...) ────────────────────
  // (precisa vir ANTES do useState, senão dá erro de tempo de inicialização)
  const [searchParams] = useSearchParams()
  const urlEmail = searchParams.get('email') || ''
  const urlPin   = searchParams.get('pin') || ''
  const tentouAutoLogin = useRef(false)

  const [email, setEmail]       = useState(urlEmail)
  const [pin, setPin]           = useState(urlPin)
  const [showPin, setShowPin]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [clickCount, setClickCount]   = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const saved = localStorage.getItem('rs_login_attempts')
    return saved ? parseInt(saved, 10) : 0
  })
  const [lockoutTime, setLockoutTime] = useState(() => {
    const saved = localStorage.getItem('rs_login_lockout_until')
    return saved ? parseInt(saved, 10) : 0
  })
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const timerRef = useRef(null)

  const { loginSmart, sendResetEmail } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/'

  // ── Monitor de Bloqueio por Força Bruta ──────────────────────────
  useEffect(() => {
    if (!lockoutTime) return

    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.ceil((lockoutTime - now) / 1000)
      if (diff <= 0) {
        setLockoutTime(0)
        setFailedAttempts(0)
        setRemainingSeconds(0)
        localStorage.removeItem('rs_login_lockout_until')
        localStorage.removeItem('rs_login_attempts')
      } else {
        setRemainingSeconds(diff)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [lockoutTime])

  // ── 3 cliques na logo → modo Admin ──────────────────────────────
  const handleLogoClick = () => {
    if (isAdminMode) return
    setClickCount(prev => {
      const next = prev + 1
      if (timerRef.current) clearTimeout(timerRef.current)
      if (next >= 3) {
        setIsAdminMode(true)
        return 0
      }
      timerRef.current = setTimeout(() => setClickCount(0), 2000)
      return next
    })
  }

  // ── Input Sanitization ─────────────────────────────────────────
  const sanitizeEmail = (raw) => {
    return String(raw || '').trim().toLowerCase().replace(/<[^>]*>?/g, '')
  }

  const sanitizePin = (raw) => {
    return String(raw || '').trim().replace(/\D/g, '').slice(0, 6)
  }

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (lockoutTime && Date.now() < lockoutTime) {
      setError(`Login temporariamente bloqueado por segurança. Aguarde ${remainingSeconds}s.`)
      return
    }

    const cleanEmail = sanitizeEmail(email)
    const cleanPin   = sanitizePin(pin)

    if (!cleanEmail || !cleanPin) {
      setError('Por favor, informe seu e-mail e PIN válidos.')
      return
    }

    if (cleanPin.length < 6) {
      setError('O PIN deve conter exatamente 6 dígitos numéricos.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await loginSmart(cleanEmail, cleanPin)
      // Sucesso → reseta contadores de falha
      setFailedAttempts(0)
      setLockoutTime(0)
      localStorage.removeItem('rs_login_attempts')
      localStorage.removeItem('rs_login_lockout_until')
      navigate(from, { replace: true })
    } catch (err) {
      console.error('[LoginPage Security]', err)
      
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      localStorage.setItem('rs_login_attempts', newAttempts.toString())

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS
        setLockoutTime(lockUntil)
        localStorage.setItem('rs_login_lockout_until', lockUntil.toString())
        setError(`Muitas tentativas incorretas. Bloqueio de segurança ativado por 3 minutos.`)
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas no servidor. Aguarde alguns instantes e tente novamente.')
      } else {
        const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts
        setError(`${err.message || 'Credenciais inválidas.'} (${remainingAttempts} tentativa${remainingAttempts === 1 ? '' : 's'} restante${remainingAttempts === 1 ? '' : 's'})`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPin = async () => {
    const cleanEmail = sanitizeEmail(email)
    if (!cleanEmail) { setError('Informe seu e-mail para recuperar o PIN.'); return }
    setLoading(true); setError(null); setSuccess(null)
    try {
      await sendResetEmail(cleanEmail)
      setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
    } catch {
      setError('Erro ao enviar e-mail. Verifique se o endereço está correto.')
    } finally {
      setLoading(false)
    }
  }

  // ── Login automático quando chegamos com e-mail + PIN (via cadastro) ──────
  useEffect(() => {
    if (tentouAutoLogin.current) return
    if (!urlEmail || !urlPin) return
    tentouAutoLogin.current = true
    // Executa o mesmo fluxo do submit, com os dados vindos da URL.
    handleSubmit({ preventDefault: () => {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLocked = lockoutTime > 0 && remainingSeconds > 0

  // ── UI ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[#050505] overflow-hidden relative">
      <AmbientBackground />

      <div className="w-full max-w-md relative z-10">

        {/* Logo (clicável) */}
        <div className="text-center mb-10">
          <button
            type="button"
            onClick={handleLogoClick}
            className="group relative inline-flex flex-col items-center transition-all active:scale-95"
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src="/logo.webp"
                alt="Logo Academy"
                className="w-20 h-20 object-cover rounded-full border-2 border-white/10 shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-110"
                style={{ boxShadow: '0 0 30px color-mix(in srgb, var(--clr-primary) 30%, transparent)' }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[12px] text-gray-500 uppercase tracking-[0.3em] font-medium leading-none mb-1">Rs</span>
              <h1 className="text-5xl font-sans font-black tracking-tighter animate-text-reveal">TOP TEAM</h1>
            </div>
          </button>
          <p className="mt-3 text-gray-400 text-sm font-light uppercase tracking-[0.2em] opacity-40">Gestão Esportiva de Alto Nível</p>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] flex items-center justify-center pointer-events-none z-0">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px] opacity-40 scale-110" />
            <img src="/logo.webp" alt="" className="w-[320px] h-[320px] object-contain rounded-full opacity-[0.05] grayscale brightness-50 p-8" />
          </div>

          <div className="bg-[#121212]/80 border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-3xl overflow-hidden animate-entrance">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] -mr-16 -mt-16 pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {isLocked ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs leading-relaxed text-center flex flex-col items-center gap-2 animate-pulse">
                  <AlertTriangle size={24} className="text-amber-400" />
                  <span className="font-bold uppercase tracking-wider">Acesso Temporariamente Bloqueado</span>
                  <p className="opacity-90">Por razões de segurança contra tentativas repetidas, o login está pausado.</p>
                  <div className="mt-1 px-4 py-1.5 rounded-lg bg-black/50 border border-amber-500/40 text-amber-300 font-mono text-sm font-bold">
                    Liberando em: {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
                  </div>
                </div>
              ) : error ? (
                <div className="p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] leading-relaxed text-center animate-shake">
                  {error}
                </div>
              ) : null}

              {success && (
                <div className="p-3 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] leading-relaxed text-center">
                  {success}
                </div>
              )}

              {/* E-mail */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold ml-1">Seu E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    autoComplete="username"
                    disabled={isLocked || loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3.5 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Digite seu e-mail"
                    required
                  />
                </div>
              </div>

              {/* PIN — label muda conforme modo */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className={`text-[10px] uppercase tracking-[0.2em] font-bold ${isAdminMode ? 'text-primary' : 'text-gray-500'}`}>
                    {isAdminMode ? 'PIN de Administrador' : 'PIN de Acesso (6 Dígitos)'}
                  </label>
                  {!isAdminMode && (
                    <button
                      type="button"
                      disabled={isLocked || loading}
                      onClick={handleForgotPin}
                      className="text-[10px] text-primary hover:text-primary-dark transition-colors uppercase font-bold tracking-tighter disabled:opacity-50"
                    >
                      Esqueci meu PIN
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={6}
                    disabled={isLocked || loading}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className={`block w-full pl-10 pr-12 py-3.5 bg-black border rounded-xl text-white text-sm focus:outline-none transition-all placeholder:text-gray-800 font-sans tabular-nums tracking-[0.8em] placeholder:font-inter placeholder:tracking-normal disabled:opacity-50 disabled:cursor-not-allowed
                      ${isAdminMode ? 'border-primary/40 bg-primary/5 focus:border-primary/60' : 'border-white/10 focus:border-primary/50'}`}
                    placeholder="000000"
                    required
                  />
                  <button
                    type="button"
                    disabled={isLocked || loading}
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-lg uppercase tracking-widest transition-all active:scale-[0.98] bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <><LogIn size={20} /> {isAdminMode ? 'Entrar como Admin' : 'LOGIN'}</>
                }
              </button>
            </form>

            
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-600 uppercase tracking-[0.4em] font-medium opacity-50">
          2026 | R.S Top Team | Powered by @Mad.exe
        </p>
      </div>
    </div>
  )
}

