import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import AmbientBackground from '../../components/shared/AmbientBackground'

/**
 * Componente: EntradaAdmin (AdminEntry)
 * ──────────────────────────────────────────────────────────────
 * Tela de acesso restrito e seguro para o Super Administrador
 * (Dono da Plataforma Atlas Academy).
 *
 * Realiza autenticação direta via Firebase Auth (E-mail e Senha)
 * e redireciona automaticamente ao Painel Super Admin ao
 * detectar o Custom Claim { admin: true } no token JWT.
 */
export default function AdminEntry() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [exibirSenha, setExibirSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erroAutenticacao, setErroAutenticacao] = useState(null)

  const { user: usuarioAtual, isSuperAdmin, loading: carregandoSessao } = useAuth()
  const navigate = useNavigate()

  // Se o usuário logado for SuperAdmin, redireciona diretamente ao painel administrativo
  useEffect(() => {
    if (!carregandoSessao && usuarioAtual) {
      if (isSuperAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [isSuperAdmin, usuarioAtual, carregandoSessao, navigate])

  /**
   * Converte a entrada para e-mail válido se digitado sem domínio
   */
  const normalizarEmail = (entrada) => {
    const limpo = String(entrada || '').trim().toLowerCase()
    if (limpo.includes('@')) return limpo
    // Se for username interno antigo, converte
    return `${limpo.replace(/[@.]/g, '_')}@atlas.internal`
  }

  /**
   * Processa a tentativa de login do administrador
   */
  const aoSubmeterLogin = async (evento) => {
    evento.preventDefault()
    setCarregando(true)
    setErroAutenticacao(null)

    const emailFinal = normalizarEmail(email)

    try {
      // Autentica diretamente no Firebase Auth
      await signInWithEmailAndPassword(auth, emailFinal, senha)
      // O AuthContext atualizará o token e claims automaticamente.
    } catch (erro) {
      console.error('Falha ao autenticar administrador:', erro)
      if (
        erro.code === 'auth/invalid-credential' ||
        erro.code === 'auth/user-not-found' ||
        erro.code === 'auth/wrong-password' ||
        erro.code === 'auth/invalid-email'
      ) {
        setErroAutenticacao('E-mail ou senha incorretos.')
      } else if (erro.code === 'auth/too-many-requests') {
        setErroAutenticacao('Muitas tentativas sem sucesso. Aguarde alguns instantes.')
      } else {
        setErroAutenticacao('Falha ao acessar o sistema. Verifique suas credenciais.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[#050505] overflow-hidden relative">
      <AmbientBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Cabeçalho Visual com Logo e Identificação */}
        <div className="text-center mb-10">
          <div className="group relative inline-flex flex-col items-center transition-all">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-100 transition-opacity duration-700" />
              <img
                src="/logo.webp"
                alt="Logo Atlas Academy"
                className="w-20 h-20 object-cover rounded-full border-2 border-white/10 shadow-2xl relative z-10"
                style={{ boxShadow: '0 0 30px color-mix(in srgb, var(--clr-primary) 30%, transparent)' }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[12px] text-primary uppercase tracking-[0.3em] font-medium leading-none mb-1">
                Acesso Restrito
              </span>
              <h1 className="text-4xl font-display font-bold tracking-tighter uppercase text-white">
                Super Admin
              </h1>
            </div>
          </div>
          <p className="mt-3 text-gray-400 text-xs font-medium uppercase tracking-[0.2em] opacity-60">
            Painel Central da Plataforma
          </p>
        </div>

        {/* Formulário de Acesso */}
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

            <form onSubmit={aoSubmeterLogin} className="space-y-6 relative z-10">
              {erroAutenticacao && (
                <div className="p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] leading-relaxed text-center animate-shake">
                  {erroAutenticacao}
                </div>
              )}

              {/* Campo E-mail */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold ml-1">
                  E-mail ou Usuário Master
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3.5 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                    placeholder="pmadsonm_gmail_com@atlas.internal"
                    required
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold ml-1">
                  Senha Master
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={exibirSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3.5 bg-primary/5 border border-primary/30 rounded-xl text-white text-sm focus:outline-none focus:border-primary/60 transition-all placeholder:text-gray-700"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setExibirSenha(!exibirSenha)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-white transition-colors"
                  >
                    {exibirSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-base uppercase tracking-widest transition-all active:scale-[0.98] bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    ENTRAR NO PAINEL
                    <ShieldCheck size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-600 uppercase tracking-[0.4em] font-medium opacity-50">
          Atlas Academy | Acesso Restrito
        </p>
      </div>
    </div>
  )
}

