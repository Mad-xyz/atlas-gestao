import React, { useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DOMPurify from 'dompurify'
import { Bell, X, Flame, Zap, Clock, ChevronRight, BellRing } from 'lucide-react'
import { useNotices } from '../../hooks/useNotices'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { useSystemUsers } from '../../hooks/useSystemUsers'

export default function NotificationCenter() {
    const { user } = useAuth()
    const { notices, loading, markAsViewed, userViews } = useNotices(user?.uid)
    const { users } = useSystemUsers()
    const { noticesOpen, setNoticesOpen, setIsMobileNavHidden } = useApp()
    const navigate = useNavigate()
    const containerRef = useRef(null)

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

    // Block scroll on mobile when open
    useEffect(() => {
        if (noticesOpen && isMobile) {
            document.body.style.overflow = 'hidden'
            setIsMobileNavHidden(true)
        } else {
            document.body.style.overflow = 'unset'
            setIsMobileNavHidden(false)
        }
        return () => {
            document.body.style.overflow = 'unset'
            setIsMobileNavHidden(false)
        }
    }, [noticesOpen, isMobile, setIsMobileNavHidden])

    // ESC key to close
    useEffect(() => {
        if (!noticesOpen) return
        const handleEsc = (e) => {
            if (e.key === 'Escape') setNoticesOpen(false)
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [noticesOpen, setNoticesOpen])

    // Click outside to close (Desktop)
    useEffect(() => {
        if (!noticesOpen || isMobile) return
        const handleClick = (e) => {
            // Don't close if clicking the notification button itself (handled in headers)
            if (e.target.closest('.notification-trigger')) return
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setNoticesOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [noticesOpen, isMobile, setNoticesOpen])

    const handleNoticeClick = (notice) => {
        if (user?.uid && notice.authorId !== user.uid) {
            markAsViewed(notice.id, user.uid)
        }
        setNoticesOpen(false)
        
        // Se já estiver na página de eventos, usa evento para evitar "recarregamento" de rota
        if (window.location.pathname === '/events') {
            window.dispatchEvent(new CustomEvent('academy:open-notice', { detail: notice.id }));
        } else {
            navigate(`/events?noticeId=${notice.id}`)
        }
    }

    const getRelativeTime = (date) => {
        if (!date) return ''
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return 'Agora'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
        return `${Math.floor(diffInSeconds / 86400)}d`
    }

    const sortedNotices = useMemo(() => {
        return [...notices].sort((a, b) => b.createdAt - a.createdAt)
    }, [notices])

    const unreadCount = useMemo(() => {
        if (!user?.uid) return 0
        return notices.filter(n => n.authorId !== user.uid && !userViews.has(n.id)).length
    }, [notices, userViews, user])

    // Optimize user lookup for performance
    const usersMap = useMemo(() => {
        const map = new Map()
        users.forEach(u => map.set(u.id, u))
        return map
    }, [users])

    return createPortal(
        <AnimatePresence>
            {noticesOpen && (
                <>
                    {/* Overlay (Mobile ONLY for backdrop) */}
                    {isMobile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setNoticesOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998]"
                            aria-hidden="true"
                        />
                    )}

                    {/* Drawer/Popover Container */}
                    <motion.div
                        ref={containerRef}
                        role="dialog"
                        aria-label="Central de Notificações"
                        aria-modal={isMobile}
                        initial={isMobile ? { x: '100%' } : { opacity: 0, scale: 0.95, y: -20 }}
                        animate={isMobile ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={isMobile ? { x: '100%' } : { opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed z-[999] bg-[#0A0A0B]/95 backdrop-blur-xl flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5 outline-none
              ${isMobile
                                ? 'inset-y-0 right-0 w-full'
                                : 'top-[75px] right-6 w-[400px] max-h-[600px] rounded-[32px] border'
                            }`}
                    >
                        {/* Header (Mobile ONLY as requested) */}
                        {isMobile && (
                            <div className={`flex items-center justify-between p-6 border-b border-white/5 shrink-0 ${isMobile ? 'pt-8 pb-6' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <BellRing size={20} className="text-primary" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white uppercase tracking-tight">Notificações</h2>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                            {unreadCount > 0 ? `${unreadCount} novas` : 'Sua academia hoje'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNoticesOpen(false)}
                                    aria-label="Fechar notificações"
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-all active:scale-90 focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {/* List */}
                        <div
                            className="flex-1 overflow-y-auto no-scrollbar custom-scrollbar p-4 space-y-3"
                            role="list"
                        >
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center opacity-40 gap-4" aria-busy="true">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Buscando...</p>
                                </div>
                            ) : sortedNotices.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-10 gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                        <Bell size={28} className="text-gray-700" aria-hidden="true" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 italic">Nenhuma notificação por enquanto.</p>
                                </div>
                            ) : (
                                sortedNotices.map((notice) => (
                                    <NotificationItem
                                        key={notice.id}
                                        notice={notice}
                                        user={user}
                                        author={usersMap.get(notice.authorId)}
                                        userViews={userViews}
                                        onClick={handleNoticeClick}
                                        getRelativeTime={getRelativeTime}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 shrink-0 bg-white/[0.02]">
                            <button
                                onClick={() => {
                                    setNoticesOpen(false)
                                    navigate('/events')
                                }}
                                className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98] focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                Ver tudo no mural
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}

/**
 * Performance Optimized Notification Item
 */
const NotificationItem = React.memo(({ notice, user, author, userViews, onClick, getRelativeTime }) => {
    const isUnread = user?.uid && notice.authorId !== user.uid && !userViews.has(notice.id)
    const poster = author

    // Priority indicator
    let priorityColor = null
    let priorityLabel = 'Normal'
    if (notice.priority === 'urgente') {
        priorityColor = 'bg-rose-500 shadow-rose-500/50'
        priorityLabel = 'Urgente'
    } else if (notice.priority === 'alta') {
        priorityColor = 'bg-amber-400 shadow-amber-400/50'
        priorityLabel = 'Alta'
    }

    return (
        <button
            onClick={() => onClick(notice)}
            role="listitem"
            aria-label={`Notificação de ${notice.authorName}: ${notice.title}. Prioridade ${priorityLabel}`}
            className={`w-full text-left p-4 pr-5 rounded-2xl transition-all border group relative focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none flex gap-4
                ${isUnread
                    ? 'bg-white/[0.04] border-primary/20 shadow-lg shadow-black/20'
                    : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                }`}
        >
            {/* UNREAD INDICATOR (Top-left to match reference precisely) */}
            {isUnread && (
                <div className="absolute left-1.5 top-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--clr-primary-rgb),0.6)]" aria-hidden="true" />
            )}

            <div className="flex gap-4 flex-1">
                {/* Poster Avatar with Priority Dot/Badge */}
                <div className="relative shrink-0 h-12">
                    <div className="w-12 h-12 rounded-full border border-white/10 bg-[#151515] overflow-hidden flex items-center justify-center">
                        {poster?.photoURL || poster?.photo ? (
                            <img src={poster?.photoURL || poster?.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-black text-white/40 uppercase">
                                {(notice.authorName || 'S').charAt(0)}
                            </span>
                        )}
                    </div>

                    {/* Badge Icon (Refined style from image) */}
                    {notice.priority !== 'normal' && (
                        <div
                            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#0A0A0B] shadow-lg flex items-center justify-center text-black
                             ${notice.priority === 'urgente' ? 'bg-rose-500' : 'bg-amber-400'}`}
                            title={`Prioridade ${priorityLabel}`}
                        >
                            {notice.priority === 'urgente' ? <Flame size={12} strokeWidth={3} /> : <Zap size={12} strokeWidth={3} />}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-black text-white uppercase tracking-tight truncate">
                            {notice.authorName}
                        </span>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap">
                            {getRelativeTime(notice.createdAt)}
                        </span>
                    </div>

                    <p className="text-sm font-medium text-gray-300 line-clamp-1 group-hover:text-white transition-colors">
                        {notice.title}
                    </p>

                    <div
                        className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.description.replace(/<[^>]*>?/gm, ' ')) }}
                    />
                </div>
            </div>

            {/* Item Footer - Secondary Info */}
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-primary" />
            </div>
        </button>
    )
})

NotificationItem.displayName = 'NotificationItem';
