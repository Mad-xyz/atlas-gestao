import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Lock, Mail, Eye, EyeOff, User, ShieldCheck } from 'lucide-react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'
import { COLLECTIONS, FIELDS } from '../../firebase/collections'
import { useAuth } from '../../context/AuthContext'
import AmbientBackground from '../../components/shared/AmbientBackground'

const getPinAuthEmail = (raw) => {
  const rawId = String(raw || '').toLowerCase().trim()
  if (rawId.endsWith('@rstopteam.internal')) return rawId
  const safeId = rawId.replace(/[@.]/g, '_').replace(/\s+/g, '_').replace(/_{2,}/g, '_')
  return `${safeId}@rstopteam.internal`
}

export default function RSAdminRegister() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)

  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const q = query(collection(db, COLLECTIONS.USUARIOS), where('papeis.admin', '==', true), limit(1))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          setIsBlocked(true)
        }
      } catch (err) {
        console.error('Erro ao verificar admins:', err)
        // Se houver erro de conexão ou banco não encontrado, NÃO bloqueamos.
        // Isso permite que o usuário tente o registro mesmo se a verificação falhar.
        setIsBlocked(false)
      } finally {
        setIsChecking(false)
      }
    }
    checkAdminExists()
  }, [])

  useEffect(() => {
    if (isBlocked && !isChecking && !success) {
      if (currentUser) {
        navigate('/', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [isBlocked, isChecking, success, currentUser, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const internalEmail = getPinAuthEmail(email)
      
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password)
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.warn('⚠️ Usuário já existe no Auth. Tentando vincular perfil no Firestore...')
          userCredential = await signInWithEmailAndPassword(auth, internalEmail, password)
        } else {
          throw authErr
        }
      }

      const user = userCredential.user
      const trimmedName = name.trim()
      const emailLower = email.toLowerCase()
      const now = new Date()
      
      try {
        await setDoc(doc(db, COLLECTIONS.USUARIOS, internalEmail), {
          [FIELDS.ID]: internalEmail,
          [FIELDS.EMAIL]: emailLower,
          authEmail: internalEmail,
          [FIELDS.NOME]: trimmedName,
          [FIELDS.PAPEIS]: { admin: true },
          [FIELDS.STATUS]: 'Ativo',
          since: now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
          [FIELDS.PIN]: password,
          adminPin: password,
          [FIELDS.CRIADO_EM]: serverTimestamp(),
          [FIELDS.PERMISSOES]: {
            viewFinance: true,
            manageFinance: true,
            manageUsers: true,
            manageClasses: true,
            manageEvents: true,
            manageSystem: true,
            all: true
          }
        })
      } catch (firestoreErr) {
        if (firestoreErr.code === 'permission-denied') {
          throw new Error('Permissão negada no Firestore. Certifique-se de que as regras (Security Rules) foram publicadas no console do Firebase.')
        }
        throw firestoreErr
      }
      
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      
    } catch (err) {
      console.error('Erro ao criar admin:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Se você já criou o admin, tente fazer login.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Este admin já existe mas a senha fornecida está incorreta.')
      } else {
        setError(err.message || 'Falha ao registrar administrador.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isBlocked && !success) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
        <div className="text-center space-y-4 max-w-md w-full bg-[#121212]/80 border border-white/5 rounded-2xl p-8 backdrop-blur-3xl">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Admin Criado!</h2>
          <p className="text-gray-400 text-sm">O administrador mestre foi registrado com sucesso. Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[#050505] overflow-hidden relative">
      <AmbientBackground />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="group relative inline-flex flex-col items-center transition-all">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-100 transition-opacity duration-700" />
              <img
                src="/logo.webp"
                alt="Logo Academy"
                className="w-20 h-20 object-cover rounded-full border-2 border-white/10 shadow-2xl relative z-10"
                style={{ boxShadow: '0 0 30px color-mix(in srgb, var(--clr-primary) 30%, transparent)' }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[12px] text-primary uppercase tracking-[0.3em] font-medium leading-none mb-1">Mestre</span>
              <h1 className="text-4xl font-display font-bold tracking-tighter uppercase">
                Setup Admin
              </h1>
            </div>
          </div>
          <p className="mt-3 text-gray-400 text-xs font-medium uppercase tracking-[0.2em] opacity-60">Criação do Primeiro Acesso</p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] flex items-center justify-center pointer-events-none z-0">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px] opacity-40 scale-110" />
            <img
              src="/logo.webp"
              alt=""
              className="w-[320px] h-[320px] object-contain rounded-full opacity-[0.05] grayscale brightness-50 p-8"
            />
          </div>

          <div className="bg-[#121212]/80 border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-3xl overflow-hidden animate-entrance">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] -mr-16 -mt-16 pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <div className="p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] leading-relaxed text-center animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3.5 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-800"
                    placeholder="Ex: Mestre Rickson"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold ml-1">E-mail (Usado no @rstopteam.internal)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3.5 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-800"
                    placeholder="Ex: pmadsoonm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold ml-1">PIN Mestre (6 dígitos)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 pr-12 py-3.5 bg-primary/5 border border-primary/30 rounded-xl text-white text-sm focus:outline-none focus:border-primary/60 transition-all font-sans tabular-nums tracking-[0.8em] placeholder:font-inter placeholder:tracking-normal placeholder:text-gray-800"
                    placeholder="000000"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-lg uppercase tracking-widest transition-all active:scale-[0.98] bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 btn-primary"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    REGISTRAR
                    <ShieldCheck size={20} />
                  </>
                )}
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
