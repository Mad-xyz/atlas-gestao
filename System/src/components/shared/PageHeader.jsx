import React from 'react'
import { Bell, RefreshCw, User, Users, Crown, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotices } from '../../hooks/useNotices'
import { useApp } from '../../context/AppContext'

/**
 * PageHeader - Componente padronizado para o topo das páginas do sistema (Desktop).
 * @param {React.ReactNode} icon - O ícone lucide-react a ser exibido no box.
 * @param {string} title - Título principal da página.
 * @param {string} subtitle - Subtítulo da página.
 * @param {() => void} onRefresh - Função opcional para o botão de atualizar.
 * @param {boolean} loading - Se a página está carregando (mostra estado no perfil).
 * @param {React.ReactNode} extra - Elementos extras para exibir entre o título e as notificações.
 */
export default function PageHeader({ icon: Icon, title, subtitle, onRefresh, loading, extra, showProfile = true }) {
  const { userData, effectiveRole: userRole, user } = useAuth()
  const { noticesOpen, setNoticesOpen } = useApp()
  const { notices, userViews } = useNotices(user?.uid)

  const unreadCount = React.useMemo(() => {
    if (!user?.uid) return 0
    return notices.filter(n => n.authorId !== user.uid && !userViews.has(n.id)).length
  }, [notices, userViews, user])

  const roleLabels = {
    admin: { label: 'ADMINISTRADOR', color: 'text-purple-400' },
    gestor: { label: 'GESTOR', color: 'text-emerald-400' },
    professor: { label: 'PROFESSOR', color: 'text-primary' },
    aluno: { label: 'ALUNO', color: 'text-blue-400' },
    desenvolvedor: { label: 'DESENVOLVEDOR', color: 'text-purple-400' },
  }

  const role = roleLabels[userRole] || roleLabels.aluno
  
  const isWhiteBelt = React.useMemo(() => {
    const b = userData?.belt?.toLowerCase()
    return b === 'white' || b === 'branca' || b === 'branco'
  }, [userData?.belt])

  return (
    <header className="content-header hidden md:flex items-center justify-between px-4 md:px-6 py-5 z-20 sticky top-0 backdrop-blur-md border-b" style={{ background: 'var(--clr-bg)', opacity: 0.9, borderColor: 'var(--clr-card-border)' }}>
      {/* Left side: Icon + Title */}
      <div className="flex items-center gap-4">
        {/* Icon Box - Premium Squircle Style */}
        <div className="w-11 h-11 rounded-xl bg-[#111] border border-white/5 flex items-center justify-center shrink-0 shadow-lg shadow-black/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon size={20} strokeWidth={2.2} style={{ color: 'var(--clr-primary)' }} className="relative z-10" />
        </div>

        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-app tracking-tight leading-none">{title}</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mt-1">{subtitle}</p>
        </div>

        {onRefresh && (
          <button onClick={onRefresh} className="p-2 ml-2 text-gray-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xll border border-white/5 active:scale-95 group">
            <RefreshCw size={18} strokeWidth={1.9} className={loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
        )}
      </div>

      {/* Center/Extra area */}
      <div className="flex-1 flex justify-center">
        {extra}
      </div>

      {/* Right side: Actions + Profile */}
      <div className="flex items-center gap-6">
        {/* Bell Icon (Unificado com Mobile) */}
        <button
          onClick={() => setNoticesOpen(!noticesOpen)}
          aria-label="Abrir notificações"
          aria-expanded={noticesOpen}
          aria-haspopup="true"
          className={`p-2.5 rounded-xl transition-all active:scale-95 relative border notification-trigger ${noticesOpen ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'}`}
        >
          {noticesOpen ? <X size={20} strokeWidth={2.5} /> : <Bell size={20} strokeWidth={2.5} />}
          {!noticesOpen && unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-black" />
          )}
        </button>

        {showProfile && (
          <>
            {/* Vertical Separator */}
            <div className="w-px h-8 bg-white/10" />

            {/* Profile Group */}
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => (window.location.href = '/profile')}>
              <div className="flex flex-col items-end overflow-hidden max-w-[150px]">
                <span className="text-sm font-bold text-app leading-none truncate w-full text-right group-hover:text-primary transition-colors">{userData?.name || 'Anon'}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${role.color}`}>
                  {role.label}
                </span>
              </div>

              {/* Profile Icon with Belt Logic */}
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden shrink-0 transition-all active:scale-90 shadow-lg shadow-primary/10 group-hover:border-primary/30">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span 
                    className={`text-sm font-black w-full h-full flex items-center justify-center ${
                      isWhiteBelt
                        ? 'bg-gradient-to-br from-white to-gray-200 text-[#111]' 
                        : 'text-white'
                    }`}
                    style={
                      !isWhiteBelt
                        ? { background: 'linear-gradient(135deg, var(--clr-primary-dark), var(--clr-primary))' }
                        : {}
                    }
                  >
                    {(userData?.name || 'A').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
