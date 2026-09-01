import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth, db } from '../../firebase/config'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { COLLECTIONS } from '../../firebase/collections'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const oobCode = searchParams.get('oobCode')
  const mode = searchParams.get('mode')

  const [newPin, setNewPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    async function verify() {
      if (!oobCode || mode !== 'resetPassword') {
        setError('Link de recuperação inválido ou expirado.')
        setVerifying(false)
        return
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode)
        setEmail(userEmail)
      } catch (err) {
        console.error(err)
        setError('Este link já foi utilizado ou expirou. Solicite um novo código.')
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [oobCode, mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPin.length !== 6) {
      setError('O PIN deve ter exatamente 6 dígitos.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // 1. Atualizar no Firebase Auth
      await confirmPasswordReset(auth, oobCode, newPin)

      // 2. Sincronizar com o Firestore para aparecer nas tabelas
      if (email) {
        const usersRef = collection(db, COLLECTIONS.USUARIOS)
        const q = query(usersRef, where('email', '==', email))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          await updateDoc(doc(db, COLLECTIONS.USUARIOS, userDoc.id), {
            pin: newPin // Atualiza o PIN visível no painel
          })
        }
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      console.error(err)
      setError('Erro ao redefinir PIN. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] relative flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface-card border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
          {/* Top Branding Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
              <Lock size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Redefinir PIN</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-[280px]">
              {success 
                ? 'Seu acesso foi atualizado com sucesso!' 
                : email ? `Criando novo PIN para ${email}` : 'Crie um novo PIN de 6 dígitos numéricos'}
            </p>
          </div>

          {success ? (
            <div className="space-y-6 text-center py-4">
              <div className="flex justify-center flex-col items-center">
                 <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                 </div>
                 <p className="text-white font-medium">PIN alterado!</p>
                 <p className="text-gray-500 text-xs mt-1">Redirecionando para o login em instantes...</p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-widest hover:underline mt-4">
                Ir para o Login <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </div>
          ) : error ? (
            <div className="space-y-6 text-center py-4">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex flex-col items-center gap-3">
                <AlertCircle size={24} />
                {error}
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                <ArrowLeft size={14} /> Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold ml-1">Novo PIN de 6 Dígitos</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className={`block w-full pl-10 pr-12 py-3.5 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-800 ${!showPin ? 'tracking-[0.8em]' : ''}`}
                    placeholder="000000"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-white transition-colors"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || newPin.length !== 6}
                className="w-full py-4 bg-primary hover:bg-primary-dark disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'SALVAR NOVO PIN'
                )}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-[10px] text-gray-600 hover:text-white transition-colors uppercase font-bold tracking-widest">
                  Cancelar e voltar
                </Link>
              </div>
            </form>
          )}
        </div>
        
        {/* Footer info */}
        <p className="text-center text-[10px] text-gray-700 mt-8 uppercase tracking-[0.3em] font-bold">
          Rs TOP TEAM &copy; 2026
        </p>
      </motion.div>
    </div>
  )
}
