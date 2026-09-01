import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DOMPurify from 'dompurify'
import { useAuth } from '../../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import {
  BellRing,
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Trash2,
  Edit2,
  X,
  MessageSquare,
  Clock,
  RefreshCcw,
  Bell,
  HelpCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  BarChart3,
  ChevronLeft,
  Tag,
  Flame,
  Zap,
  Eye,
  Link as LinkIcon,
  Eraser,
  Type,
  ChevronDown,
  User,
  FileText
} from 'lucide-react'
import { useNotices } from '../../hooks/useNotices'
import { useApp } from '../../context/AppContext'
import PageHeader from '../../components/shared/PageHeader'
import KPICard from '../../components/shared/KPICard'
import MobileHeader from '../../components/navigation/MobileHeader'
import { toast } from 'react-hot-toast'

// ────────────────────────────────────────────────
// UTILS & HOOKS
// ────────────────────────────────────────────────
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

import RichTextEditor from './components/RichTextEditor'
import InlinePostForm from './components/InlinePostForm'
import NoticeActionMenu from './components/NoticeActionMenu'







// ────────────────────────────────────────────────
//  MAIN PAGE
// ────────────────────────────────────────────────
export default function EventsPage() {
  const { user, userData, effectiveRole } = useAuth()
  const { notices, loading, addNotice, updateNotice, deleteNotice, markAsViewed, userViews } = useNotices(user?.uid)
  const { setIsMobileNavHidden } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [menuPosition, setMenuPosition] = useState(null)
  const [activeTab, setActiveTab] = useState('todos') // 'todos', 'eventos', 'avisos'
  const [expandedId, setExpandedId] = useState(null)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [searchParams, setSearchParams] = useSearchParams()
  const notifiedIds = useRef(new Set())

  // 1. Captura e Expande IMEDIATAMENTE quando o ID aparece na URL
  useEffect(() => {
    const id = searchParams.get('noticeId')
    if (id && !loading && notices.length > 0) {
      setSearchTerm('')
      setActiveTab('todos')
      setExpandedId(id)
    }
  }, [searchParams, loading, notices.length])

  // 2. Lógica de Scroll Robusta (Roda quando o expandedId muda e vem da URL)
  useEffect(() => {
    const idFromUrl = searchParams.get('noticeId')
    if (expandedId && expandedId === idFromUrl) {
      let attempts = 0
      const maxAttempts = 30 // 3 segundos de tentativas
      
      const performScroll = () => {
        const element = document.getElementById(`notice-${expandedId}`)
        const container = document.querySelector('.main-content') || window

        if (element) {
          // Tenta centralizar o item
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Limpa o parâmetro da URL após o sucesso para não rolar de novo se o usuário fechar e abrir outro
          const newParams = new URLSearchParams(searchParams)
          newParams.delete('noticeId')
          setSearchParams(newParams, { replace: true })
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(performScroll, 100)
        }
      }

      // Pequeno delay inicial para o AnimatePresence/Layout do Framer Motion
      const initialTimer = setTimeout(performScroll, 200)
      return () => clearTimeout(initialTimer)
    }
  }, [expandedId, searchParams])

  // 3. Listener para Evento Customizado (Evita navegação quando já está na página)
  useEffect(() => {
    const handleOpenNotice = (e) => {
      const id = e.detail
      if (id) {
        setSearchTerm('')
        setActiveTab('todos')
        setExpandedId(id)

        // Scroll com retentativa
        let attempts = 0
        const performScroll = () => {
          const element = document.getElementById(`notice-${id}`)
          if (element) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          } else if (attempts < 20) {
            attempts++
            setTimeout(performScroll, 100)
          }
        }
        performScroll()
      }
    }

    window.addEventListener('academy:open-notice', handleOpenNotice)
    return () => window.removeEventListener('academy:open-notice', handleOpenNotice)
  }, [])

  // Helper para nome curto (ex: João Gustavo)
  const formatDisplayName = (fullName) => {
    if (!fullName) return 'Autor'
    const parts = fullName.trim().split(/\s+/)
    if (parts.length <= 1) return parts[0]
    return `${parts[0]} ${parts[1]}`
  }

  // Helper para tempo relativo (estilo solicitado)
  const getRelativeTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    const diffInDays = Math.floor(diffInSeconds / 86400)

    if (diffInDays < 1) return 'Hoje'
    return `Há ${diffInDays}d`
  }

  // Permissões do usuário
  // canPost: pode postar novos eventos/avisos (admin, gestor, professor)
  const canPost = ['admin', 'gestor', 'professor'].includes(effectiveRole)
  
  // canManageAll: tem permissão específica para gerenciar qualquer evento/aviso do sistema
  // Admin e Gestor têm essa permissão por padrão, mas professores precisam ter a flag 'manageEvents' ativa
  const canManageAll = (() => {
    if (effectiveRole === 'admin' || effectiveRole === 'gestor') return true
    return userData?.permissions?.manageEvents === true
  })()

  // canEditOwn: pode editar/excluir apenas os próprios posts
  const canEditOwn = canPost

  // canEditThis: pode editar/excluir um post específico
  // - Se tem canManageAll, pode editar qualquer um
  // - Se não tem, só pode editar o próprio post
  const canEditThis = (notice) => {
    if (canManageAll) return true
    return notice.authorId === user?.uid
  }

  // ── KPIs ──
  const totalNotices = notices.length
  const highPriority = notices.filter(n => n.priority === 'alta').length
  const urgents = notices.filter(n => n.priority === 'urgente').length
  const totalViews = notices.reduce((acc, n) => acc + (n.views || 0), 0)

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'todos' ||
      (activeTab === 'eventos' && n.types?.includes('evento')) ||
      (activeTab === 'avisos' && n.types?.includes('aviso'))
    return matchesSearch && matchesTab
  })

  // LOCK BODY SCROLL & HIDE MOBILE NAV WHEN MOBILE MENU IS OPEN
  useEffect(() => {
    const isAnyFormOpen = showForm || editingNotice || expandedId || activeDropdown;

    if (isAnyFormOpen && isMobile) {
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
  }, [expandedId, activeDropdown, isMobile, showForm, editingNotice, setIsMobileNavHidden])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    // Check for upcoming events every minute
    const checkUpcoming = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      const now = new Date()
      notices.forEach(notice => {
        if (!notice.id) return

        // Processa tanto eventos quanto avisos que tenham data definida
        if ((notice.types?.includes('evento') || notice.types?.includes('aviso')) && notice.startDate) {
          try {
            const eventDate = new Date(`${notice.startDate}T${notice.startTime || '00:00'}`)
            const diffMinutes = (eventDate - now) / (1000 * 60)

            const notifyValue = parseInt(notice.notification?.value) || 30
            const notifyUnit = notice.notification?.unit || 'minutes'

            let triggerMinutes = 0

            if (notice.isAllDay) {
              // Lógica para Dia Inteiro: Notificar X dias antes no horário específico
              const notifyTime = notice.notification?.time || '09:00'
              const daysBefore = parseInt(notice.notification?.value) || 0

              const notificationTarget = new Date(eventDate)
              notificationTarget.setDate(notificationTarget.getDate() - daysBefore)
              const [h, m] = notifyTime.split(':')
              notificationTarget.setHours(parseInt(h), parseInt(m), 0)

              const diffToNotify = (notificationTarget - now) / (1000 * 60)

              if (diffToNotify <= 0 && diffToNotify > -5) {
                const notificationKey = `${notice.id}_allday_target`
                if (!notifiedIds.current.has(notificationKey)) {
                  new Notification(`Lembrete: ${notice.title}`, {
                    body: `Evento de dia inteiro em ${daysBefore} dia(s).`,
                    icon: '/favicon.ico',
                    tag: notificationKey
                  })
                  notifiedIds.current.add(notificationKey)
                }
              }
            } else {
              // Lógica padrão para eventos com horário
              let triggerMinutes = notifyValue
              if (notifyUnit === 'hours') triggerMinutes *= 60
              if (notifyUnit === 'days') triggerMinutes *= 1440
              if (notifyUnit === 'weeks') triggerMinutes *= 10080 // 7 * 24 * 60

              const notificationKey = `${notice.id}_${eventDate.getTime()}`

              // 1. Upcoming Notification
              if (diffMinutes > 0 && diffMinutes <= triggerMinutes) {
                if (!notifiedIds.current.has(`${notificationKey}_upcoming`)) {
                  new Notification(`Evento Próximo: ${notice.title}`, {
                    body: `Inicia em aproximadamente ${Math.round(diffMinutes)} minutos.`,
                    icon: '/favicon.ico',
                    tag: `${notificationKey}_upcoming`
                  })
                  notifiedIds.current.add(`${notificationKey}_upcoming`)
                }
              }
            }

            // 2. Start Time Notification (exactly now or very recently)
            if (diffMinutes <= 0 && diffMinutes > -5) {
              const notificationKey = `${notice.id}_started`
              if (!notifiedIds.current.has(notificationKey)) {
                new Notification(`Evento Iniciado: ${notice.title}`, {
                  body: `O evento começou às ${notice.startTime || '00:00'}.`,
                  icon: '/favicon.ico',
                  tag: notificationKey
                })
                notifiedIds.current.add(notificationKey)
              }
            }
          } catch (err) {
            console.error('Error processing notification for notice:', notice.id, err)
          }
        }
      })
    }

    checkUpcoming()
    const interval = setInterval(checkUpcoming, 30000)
    return () => clearInterval(interval)
  }, [notices])

  // Marcar como visto ao expandir (se não for o autor)
  useEffect(() => {
    if (expandedId && user?.uid) {
      const notice = notices.find(n => n.id === expandedId)
      if (notice && notice.authorId !== user.uid) {
        markAsViewed(notice.id, user.uid)
      }
    }
  }, [expandedId, user?.uid, notices, markAsViewed])

  const handleSave = async (data) => {
    if (editingNotice) {
      await updateNotice(editingNotice.id, data)
      setEditingNotice(null)
    } else {
      // Tenta pegar o nome de várias fontes para garantir registro do autor
      const authorName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Sistema'

      await addNotice({
        ...data,
        authorName: authorName,
        authorId: user?.uid || 'system'
      })
    }
    setShowForm(false)
  }

  const handleEdit = (notice) => {
    // Verifica se pode editar este post específico
    if (!canEditThis(notice)) return
    setEditingNotice(notice)
    if (isMobile) setExpandedId(notice.id)
    setActiveDropdown(null)
  }

  const handleDelete = async (notice) => {
    // Verifica se pode excluir este post específico
    if (!canEditThis(notice)) return
    if (window.confirm('Apagar este aviso permanentemente?')) {
      await deleteNotice(notice.id)
    }
    setActiveDropdown(null)
  }

  const priorityBadge = {
    alta: { label: 'Alta', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    urgente: { label: 'Urgente', cls: 'bg-primary/10 text-primary border-primary/25' },
  }

  return (
    <>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      <MobileHeader
        title="Avisos & Eventos"
      />

      {/* Header Desktop */}
      <PageHeader
        icon={BellRing}
        title="AVISOS & EVENTOS"
        subtitle="COMUNICADOS OFICIAIS E CALENDÁRIO DA ACADEMIA"
        loading={loading}
      />

      <div className="flex-1 px-4 md:px-6 py-6 w-full pb-32 space-y-8 max-w-[1600px] mx-auto">

        {/* ── KPIs (Visible only for staff) ── */}
        {canPost && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 fade-slide-up">
            <KPICard
              title="Total"
              value={loading ? '...' : totalNotices}
              description="Ativos no sistema"
              icon={BellRing}
            />
            <KPICard
              title="Atenção"
              value={loading ? '...' : highPriority}
              description="Prioridade alta"
              icon={Zap}
              valueColor="text-yellow-400"
            />
            <KPICard
              title="Urgentes"
              value={loading ? '...' : urgents}
              description="Requer ação"
              icon={Flame}
              valueColor="text-primary"
            />
            <KPICard
              title="Engajamento"
              value={loading ? '...' : totalViews}
              description="Visualizações totais"
              icon={BarChart3}
              valueColor="text-blue-400"
            />
          </div>
        )}

        {/* ── ACTION BAR & FILTERS ── */}
        <div className="flex flex-col gap-6 fade-slide-up delay-100 mt-6 mb-8">
          {/* Top Row: Search */}
          <div className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all border border-white/5 focus-within:border-primary/40 bg-[#111]/80 backdrop-blur-xl">
            <Search size={19} strokeWidth={2.2} className="text-gray-600 flex-shrink-0" />
            <input
              type="text"
              placeholder="Pesquisar comunicados..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-white text-sm placeholder-gray-700 w-full font-medium"
            />
          </div>

          {/* Bottom Row: Tabs + Action Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center bg-white/5 p-1 rounded-xl w-full md:w-auto h-11">
              {['todos', 'eventos', 'avisos'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 md:w-24 h-full rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-500 hover:text-white'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {canPost && (
              <button
                onClick={() => { setEditingNotice(null); setShowForm(s => !s) }}
                className={`h-11 px-4 md:px-6 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 border shadow-lg active:scale-95 shrink-0 ${showForm && !editingNotice
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-primary border-primary/20 text-white shadow-primary/20'
                  }`}
              >
                {showForm && !editingNotice ? <X size={18} /> : <Plus size={18} />}
                <span className="hidden md:inline">{showForm && !editingNotice ? 'Cancelar' : 'Novo aviso'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── TOP FORM (INLINE DESKTOP ONLY) ── */}
        <AnimatePresence>
          {!isMobile && showForm && !editingNotice && (
            <InlinePostForm
              forceModal={false}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>

        {/* ── ALERTS LIST STARTS HERE ── */}

        {/* ── LISTA DE AVISOS (Alongada) ── */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando Avisos...</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <BellRing size={32} className="text-gray-700" />
              </div>
              <p className="text-white font-black uppercase tracking-widest text-lg">Nada por aqui</p>
              <p className="text-gray-500 text-xs mt-2 font-medium">Nenhum comunicado encontrado para esta busca.</p>
            </div>
          ) : (
            filteredNotices.map((notice, i) => {

              const badge = priorityBadge[notice.priority]
              const isEvento = notice.types?.includes('evento')
              const isAviso = notice.types?.includes('aviso')
              const relativeTime = getRelativeTime(notice.createdAt)
              const isExpanded = expandedId === notice.id

              const priorityMap = {
                urgente: { label: 'URGENTE', cls: 'bg-primary/20 text-primary border-primary/30', icon: <Flame size={12} /> },
                alta: { label: 'ALTA', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: <Zap size={12} /> },
                normal: { label: 'NORMAL', cls: 'bg-white/5 text-gray-500 border-white/10', icon: <div className="w-1.5 h-1.5 rounded-full bg-gray-500" /> }
              }
              const pCfg = priorityMap[notice.priority] || priorityMap.normal

              // EDITING INLINE (DESKTOP)
              if (!isMobile && editingNotice?.id === notice.id) {
                return (
                  <InlinePostForm
                    key={`edit-${notice.id}`}
                    initialData={notice}
                    forceModal={false}
                    onSave={handleSave}
                    onCancel={() => setEditingNotice(null)}
                  />
                );
              }

              return (
                <motion.div
                  key={notice.id}
                  id={`notice-${notice.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.05,
                    layout: { duration: 0.3, ease: 'easeOut' }
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                  className={`relative group bg-white/[0.03] border transition-all overflow-hidden cursor-pointer ${isExpanded
                    ? 'rounded-[32px] border-primary/30 bg-white/[0.05] shadow-2xl shadow-primary/5 p-8 px-10'
                    : 'rounded-[24px] border-white/5 hover:border-white/10 p-4 px-6 p-5 px-8 hover:bg-white/[0.04]'
                    }`}
                >
                  {/* Visual Decoration for priority bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 transition-colors ${notice.priority === 'urgente' ? 'bg-primary' :
                    notice.priority === 'alta' ? 'bg-yellow-500' : 'bg-transparent'
                    } ${isExpanded ? 'w-2' : ''}`} />

                  {/* UNREAD DOT */}
                  {!isExpanded && user?.uid && notice.authorId !== user.uid && !userViews.has(notice.id) && (
                    <div className="absolute top-2 left-3 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-10 animate-pulse" />
                  )}

                  {/* STAFF CONTROLS (MoreVertical) - só mostra se puder editar este post específico */}
                  {canEditThis(notice) && (
                    <div className="absolute top-6 right-6 z-10 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPosition({
                            top: rect.top + window.scrollY + rect.height + 8,
                            left: rect.left + window.scrollX - 180 + rect.width
                          });
                          setActiveDropdown(notice.id);
                        }}
                        className={`p-2.5 rounded-xl transition-all active:scale-90 border border-transparent ${activeDropdown === notice.id ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                      >
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className={isExpanded ? 'pt-2' : 'pt-2'}></div>

                    <motion.h3
                      layout="position"
                      className={`font-black tracking-tight transition-all ${isExpanded ? 'text-2xl mb-4' : 'text-lg mb-1'}`}
                      style={{ color: '#E4E4E6' }}
                    >
                      {notice.title}
                    </motion.h3>

                    <div className="space-y-1" style={{ color: '#DCDCDF' }}>
                      <motion.div layout="position" className="flex items-center gap-2 overflow-hidden">
                        {!isExpanded && (
                          <>
                            <span className="text-[10px] font-black lowercase opacity-40 whitespace-nowrap shrink-0">
                              {formatDisplayName(notice.authorName)} :
                            </span>
                            <div
                              className="text-sm font-medium opacity-80 line-clamp-1 text-gray-400 flex-1"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.description.replace(/<[^>]*>?/gm, ' ')) }}
                            />
                          </>
                        )}
                      </motion.div>

                      {/* DESKTOP EXPANDED CONTENT - CARREGAMENTO SOB DEMANDA */}
                      <AnimatePresence>
                        {isExpanded && !isMobile && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="py-6 border-y border-white/5 my-6">
                              <div className="prose prose-invert max-w-none text-gray-300 text-base leading-relaxed">
                                <span className="text-[10px] font-black lowercase opacity-40 mr-2 float-left mt-1.5">
                                  {formatDisplayName(notice.authorName)} :
                                </span>
                                <div
                                  className="[&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4"
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.description) }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* UNIFIED INFO BOX (DATE, TIME & BADGES) */}
                    <motion.div
                      layout="position"
                      className={`mt-4 flex flex-wrap items-center justify-center md:justify-start p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 gap-4 ${isExpanded ? 'bg-primary/5 border-primary/10 py-4' : ''}`}
                    >
                      {/* Left Side: Event Details */}
                      {(notice.startDate || notice.startTime) && (
                        <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 flex-wrap">
                          <div className="flex items-center gap-2 px-1 whitespace-nowrap text-[9px] md:text-[10px]">
                            <Calendar size={13} className={`${isExpanded ? 'text-primary' : 'text-primary opacity-60'}`} />
                            <span className={isExpanded ? 'text-gray-300' : ''}>{new Date(notice.startDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {!notice.isAllDay && (
                            <div className="flex items-center gap-2 border-l border-white/5 pl-2 md:pl-4 px-1 whitespace-nowrap text-[9px] md:text-[10px]">
                              <Clock size={13} className={`${isExpanded ? 'text-primary' : 'text-primary opacity-60'}`} />
                              <span className={isExpanded ? 'text-gray-300' : ''}>{notice.startTime} - {notice.endTime}</span>
                            </div>
                          )}

                          {/* VISUALIZAÇÕES */}
                          <div className="flex items-center gap-2 border-l border-white/5 pl-2 md:pl-4 px-1 whitespace-nowrap text-[9px] md:text-[10px]">
                            <Eye size={13} className={`${isExpanded ? 'text-primary' : 'text-primary opacity-60'}`} />
                            <span className={isExpanded ? 'text-gray-300' : ''}>{notice.views || 0}</span>
                          </div>
                          {notice.repeat !== 'none' && (
                            <div className="flex items-center gap-2 text-emerald-500/40 border-l border-white/5 pl-2 md:pl-4 px-1 whitespace-nowrap text-[9px] md:text-[10px]">
                              <RefreshCcw size={12} />
                              <span>Repete</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Spacer to push badges to the right */}
                      <div className="flex-1 hidden md:block" />

                      {/* Right Side: Technical Badges */}
                      <div className="flex items-center gap-3 md:ml-auto">
                        {notice.priority !== 'normal' && (
                          <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${pCfg.cls}`}>
                            {pCfg.icon}
                            {pCfg.label}
                          </div>
                        )}

                        {isEvento && (
                          <div className="px-2.5 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                            EVENTO
                          </div>
                        )}
                        {isAviso && (
                          <div className="px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                            AVISO
                          </div>
                        )}

                        <span className="text-gray-600 text-[9px] font-black bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 whitespace-nowrap">
                          {relativeTime}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* PORTAL PARA MOBILE (APENAS DETALHES DE LEITURA) */}
      {isMobile && createPortal(
        <AnimatePresence>
          {expandedId && (
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end p-0 m-0 overflow-hidden">
              {(() => {
                const notice = notices.find(n => n.id === expandedId);
                if (!notice) return null;

                return (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setExpandedId(null)}
                      className="absolute inset-0 backdrop-blur-md bg-black/20"
                      style={{ willChange: 'opacity' }}
                    />
                    <motion.div
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={0.1}
                      onDragEnd={(e, info) => {
                        if (info.offset.y > 80 || info.velocity.y > 400) setExpandedId(null);
                      }}
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.5 }}
                      className="relative bg-[#0A0A0B] rounded-t-[42px] h-[95vh] flex flex-col w-full shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
                      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                    >
                      {/* Mobile Drag Handle */}
                      <div className="flex justify-center pt-4 pb-2 shrink-0">
                        <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                      </div>

                      <div className="flex flex-col h-full overflow-hidden">
                        {/* HEADER ESTILO NOVA POSTAGEM */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--clr-primary) 15%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                              }}
                            >
                              {notice.types?.includes('evento') ? (
                                <Calendar size={22} className="text-primary" strokeWidth={2.5} style={{ color: 'var(--clr-primary)' }} />
                              ) : (
                                <BellRing size={22} className="text-primary" strokeWidth={2.5} style={{ color: 'var(--clr-primary)' }} />
                              )}
                            </div>
                            <div>
                              <h2 className="text-[16px] font-black text-white uppercase tracking-tight leading-none">
                                {notice.types?.includes('evento') ? 'Detalhes do Evento' : 'Detalhes do Aviso'}
                              </h2>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                Mural de Avisos
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar no-scrollbar">
                          {/* 1. Header Card (Data | Autor) */}
                          <div className="flex items-center p-4 bg-white/[0.03] border border-white/5 rounded-2xl mb-6">
                            <div className="flex-1 flex items-center gap-3 justify-center">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                                {new Date(notice.startDate).toLocaleDateString('pt-BR')} {notice.startTime && `às ${notice.startTime}`}
                              </span>
                            </div>
                            <div className="w-[1px] h-4 bg-white/10 mx-2" />
                            <div className="flex-1 flex items-center gap-3 justify-center">
                              <User className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest truncate max-w-[120px]">
                                <span className="opacity-50">Autor:</span> <span className="text-white">{formatDisplayName(notice.authorName)}</span>
                              </span>
                            </div>
                          </div>

                          {/* 2. Título Box */}
                          <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[32px] mb-6">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 block">TÍTULO</span>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-[1.1]">
                              {notice.title}
                            </h3>
                          </div>

                          {/* 3. Descrição Box */}
                          <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[32px] flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">DESCRIÇÃO</span>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl prose prose-invert max-w-none text-gray-300 text-[15px] leading-relaxed">
                              <div
                                className="[&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-0"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.description) }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                );
              })()}
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* FAB removido para padronização — botão agora está na barra de busca */}


      {/* FORMULÁRIO GLOBAL (MOBILE ONLY + FALLBACK) */}
      <AnimatePresence>
        {(isMobile && (showForm || editingNotice)) && (
          <InlinePostForm
            initialData={editingNotice}
            forceModal={true}
            onSave={(updatedData) => {
              handleSave(updatedData);
              setShowForm(false);
              setEditingNotice(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingNotice(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ACTION MENU GLOBAL */}
      <AnimatePresence>
        {activeDropdown && (
          <NoticeActionMenu
            notice={notices.find(n => n.id === activeDropdown)}
            menuPosition={menuPosition}
            onClose={() => setActiveDropdown(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </>
  )
}
