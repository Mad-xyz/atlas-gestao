import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, User, ArrowLeft, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotices } from '../../hooks/useNotices'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const MobileHeader = ({
  title,
  showSearch = false,
  onSearch,
  showBack = false,
  onBack,
  actions,
  showBell = true,
  profileIconClass = "bg-gradient-to-br from-primary/20 to-primary/5",
  profileTextClass = "text-primary"
}) => {
  const { userData, user } = useAuth()
  const navigate = useNavigate()
  const { noticesOpen, setNoticesOpen } = useApp()
  const { notices, userViews } = useNotices(user?.uid)

  const unreadCount = React.useMemo(() => {
    if (!user?.uid) return 0
    return notices.filter(n => n.authorId !== user.uid && !userViews.has(n.id)).length
  }, [notices, userViews, user])

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden flex items-center justify-between px-4 py-4 sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
    >
      <div className="flex items-center gap-3 overflow-hidden mr-2">
        {showBack ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
        ) : (
          <div
            onClick={() => navigate('/profile')}
            className={`w-10 h-10 rounded-xl overflow-hidden border border-white/10 active:scale-90 transition-transform flex items-center justify-center shrink-0 ${profileIconClass}`}
          >
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className={`font-black text-sm uppercase ${profileTextClass}`}>
                {(userData?.name || 'A').charAt(0)}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg font-black text-white leading-tight tracking-tight truncate">{title}</h1>
          <span className={`text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none mt-0.5 truncate ${profileTextClass}`}>
            {userData?.role || 'Membro'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions}

        {showSearch && (
          <button
            onClick={onSearch}
            className="p-2.5 rounded-xl bg-white/5 text-gray-400 active:scale-90 transition-transform"
          >
            <Search size={20} strokeWidth={2.5} />
          </button>
        )}

        {showBell && (
          <button
            onClick={() => setNoticesOpen(!noticesOpen)}
            aria-label="Abrir notificações"
            aria-expanded={noticesOpen}
            aria-haspopup="true"
            className={`p-2.5 rounded-xl active:scale-90 transition-all relative notification-trigger ${noticesOpen ? 'bg-primary text-black' : 'bg-white/5 text-gray-400'}`}
          >
            {noticesOpen ? <X size={20} strokeWidth={2.5} /> : <Bell size={20} strokeWidth={2.5} />}
            {!noticesOpen && unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-black" />
            )}
          </button>
        )}
      </div>
    </motion.header>
  )
}

export default MobileHeader
