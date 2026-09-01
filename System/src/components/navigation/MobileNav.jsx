// COMPONENTE DE NAVEGAÇÃO MOBILE (BOTTOM BAR)
// Fornece uma barra de navegação inferior premium para dispositivos móveis.
// Inclui um botão central flutuante para início rápido de chamada e um menu "Mais".
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import {
  Home,
  Users,
  CheckCircle2,
  Banknote,
  MoreHorizontal,
  X,
  ChevronRight,
  Layers,
  Settings,
  TrendingUp,
  Activity,
  ShieldCheck,
  MessageCircle,
  FileText,
  PieChart,
  GraduationCap,
  ArrowDownRight,
  Clock,
  CalendarRange,
  BellRing
} from 'lucide-react'

// Itens principais da barra inferior (Excluindo o botão central)
const mainNavItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/alunos', icon: Users, label: 'Alunos' },
  { to: '/eventos', icon: BellRing, label: 'Avisos' },
]

// Itens do menu "Mais" (Drawer lateral/inferior)
const drawerItems = [
  { to: '/financeiro', icon: Banknote, label: 'Cobrança', roles: ['admin', 'gestor', 'professor'], subtitle: 'Gestão de mensalidades', reqPerm: 'viewBillingTab' },
  { to: '/despesas', icon: ArrowDownRight, label: 'Despesas', roles: ['admin', 'gestor', 'professor'], subtitle: 'Saídas e custos', reqPerm: 'viewExpensesTab' },
  { to: '/relatorios', icon: PieChart, label: 'Relatórios', roles: ['admin', 'gestor', 'professor'], subtitle: 'Análise financeira', reqPerm: 'viewFinance' },
  { to: '/modalidades', icon: Layers, label: 'Turmas', roles: ['admin', 'gestor', 'professor'], subtitle: 'Modalidades e horários', reqPerm: 'manageSystem' },
  // { to: '/visitantes', icon: Clock, label: 'Visitantes', roles: ['admin', 'gestor', 'professor'], subtitle: 'Aulas experimentais' },
  // { to: '/contratos', icon: FileText, label: 'Contratos', roles: ['admin', 'gestor'], subtitle: 'Documentos e termos' },
  { to: '/equipe', icon: ShieldCheck, label: 'Equipe', roles: ['admin', 'gestor', 'professor'], subtitle: 'Gestão de professores', reqPerm: 'manageUsers' },
  { to: '/perfil', icon: Settings, label: 'Perfil', roles: ['admin', 'gestor', 'professor', 'aluno'], subtitle: 'Minha conta' },
]

// Configuração de animação de mola para suavidade premium
const springConfig = { type: 'spring', damping: 30, stiffness: 400 }

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Fecha o menu "Mais" automaticamente ao mudar de rota
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [location])

  const handleToggleDrawer = (e) => {
    e.preventDefault()
    setIsDrawerOpen(!isDrawerOpen)
  }

  // Verifica se uma aba específica está ativa para aplicar estilos de destaque
  const isTabActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const { isMobileNavHidden, isNavLocked } = useApp()
  const { userData, effectiveRole } = useAuth()

  const isActuallyAdmin = userData?.role === 'admin' || userData?.roles?.admin || effectiveRole === 'admin'
  const hasPerm = (key) => {
    if (!key) return true;
    if (isActuallyAdmin) return true;
    if (!userData?.permissions) return true;
    // Fallback para compatibilidade com permissões antigas
    if (key === 'viewBillingTab') {
      return !!userData.permissions.viewBillingTab || !!userData.permissions.viewFinance;
    }
    if (key === 'viewExpensesTab') {
      return !!userData.permissions.viewExpensesTab || !!userData.permissions.viewFinance;
    }
    if (key === 'viewFinance') {
      return !!userData.permissions.viewFinance || !!userData.permissions.viewOnlyFinance;
    }
    return !!userData.permissions[key];
  }

  // Definição dinâmica dos itens da barra principal baseada no cargo
  const isStudent = effectiveRole === 'aluno'

  const mainTabs = isStudent 
    ? [
        { to: '/', icon: Home, label: 'Início' },
        { to: '/eventos', icon: BellRing, label: 'Avisos' },
        { to: '/perfil', icon: Settings, label: 'Perfil' }
      ]
    : [
        { to: '/', icon: Home, label: 'Início' },
        { to: '/alunos', icon: Users, label: 'Alunos', reqPerm: 'viewStudents' },
        { type: 'fab', to: '/chamadas', icon: CheckCircle2, label: 'Chamada', reqPerm: 'manageClasses' },
        { to: '/eventos', icon: BellRing, label: 'Avisos', reqPerm: 'manageEvents' },
        { type: 'drawer', icon: MoreHorizontal, label: 'Mais' }
      ].filter(t => !t.reqPerm || hasPerm(t.reqPerm))

  // Filtra os itens da gaveta baseado no cargo do usuário
  const filteredDrawerItems = drawerItems.filter(item => 
    (!item.roles || item.roles.includes(effectiveRole)) && hasPerm(item.reqPerm)
  )

  return (
    <>
      {/* Container Principal da Barra Inferior com animação de entrada/saída */}
      <AnimatePresence>
        {!isMobileNavHidden && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[120] px-6 pb-6 select-none"
          >
            {/* Estrutura da Barra com Efeito de Vidro */}
            <div className="relative h-[68px] backdrop-blur-xl border border-white/10 rounded-[32px] flex items-center px-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] group" style={{ background: 'color-mix(in srgb, var(--clr-surface) 60%, transparent)' }}>

              {/* Indicador de Aba Ativa (Linha colorida superior) */}
              <div className="absolute inset-0 pointer-events-none flex items-center px-4">
                {mainTabs.map((tab, idx) => {
                  if (tab.type === 'fab') return <div key={idx} className="w-16 h-full" />

                  const isActive = tab.type === 'drawer' ? isDrawerOpen : isTabActive(tab.to)

                  return (
                    <div key={idx} className="relative flex-1 h-full flex justify-center">
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="active-line-mobile"
                            className="absolute -top-[1px] w-8 h-[3px] rounded-full z-20"
                            style={{ backgroundColor: 'var(--clr-primary)' }}
                            transition={springConfig}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

          {/* Itens de Navegação Dinâmicos */}
          {mainTabs.map((tab, idx) => {
            if (tab.type === 'fab') {
              return (
                <div key={idx} className="relative w-16 h-16 flex items-center justify-center -mt-10">
                  <div className="absolute inset-0 rounded-full blur-2xl transition-all duration-700" style={{ backgroundColor: isTabActive('/chamadas') ? 'color-mix(in srgb, var(--clr-primary) 30%, transparent)' : 'rgba(255,255,255,0.05)' }} />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (!isNavLocked) navigate('/chamadas')
                    }}
                    className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500"
                    style={{ 
                      backgroundColor: isTabActive('/chamadas') ? 'var(--clr-primary)' : 'var(--clr-surface)',
                      color: isTabActive('/chamadas') ? 'white' : 'var(--clr-text-muted)',
                      borderWidth: '6px',
                      borderStyle: 'solid',
                      borderColor: 'var(--clr-bg)',
                      boxShadow: isTabActive('/chamadas') ? '0 10px 20px color-mix(in srgb, var(--clr-primary) 30%, transparent)' : 'none' 
                    }}
                  >
                    <CheckCircle2 size={26} strokeWidth={2.5} />
                  </motion.button>
                  <p 
                    className="absolute -bottom-5 text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-500"
                    style={{ color: isTabActive('/attendance') ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}
                  >
                    Chamada
                  </p>
                </div>
              )
            }

            if (tab.type === 'drawer') {
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    if (isNavLocked) return
                    handleToggleDrawer(e)
                  }}
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all active:scale-95 no-tap-highlight"
                >
                  <div className="transition-all duration-300" style={{ color: isDrawerOpen ? 'var(--clr-primary)' : 'var(--clr-text-muted)', opacity: isDrawerOpen ? 1 : 0.6, transform: isDrawerOpen ? 'scale(1.1)' : 'scale(1)' }}>
                    {isDrawerOpen ? <X size={22} strokeWidth={2.5} /> : <MoreHorizontal size={22} strokeWidth={2} />}
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest transition-colors duration-300" style={{ color: isDrawerOpen ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}>
                    Mais
                  </p>
                </button>
              )
            }

            return (
              <NavItem 
                key={tab.to} 
                to={tab.to} 
                icon={tab.icon} 
                label={tab.label} 
                active={isTabActive(tab.to)} 
                locked={isNavLocked} 
              />
            )
          })}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Drawer (Menu Expansível Inferior) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Overlay de fundo (Escurecimento) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />

            {/* Painel do Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] border-t border-white/10 rounded-t-[32px] z-[80] overflow-hidden flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
              style={{ background: 'var(--clr-surface)' }}
            >
              {/* Alça visual de arraste (apenas estética) */}
              <div className="flex justify-center mt-3">
                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              </div>

              {/* Cabeçalho do Drawer */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white font-black text-xl uppercase tracking-tighter">Explorar</span>
                  <span className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--clr-text-muted)' }}>RS Top Team Academy</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--clr-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Lista Dinâmica de Módulos Complementares */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-32 no-scrollbar px-6">
                {filteredDrawerItems.map(({ to, icon: Icon, label, subtitle }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={(e) => {
                      if (isNavLocked) {
                        e.preventDefault()
                        return
                      }
                      setIsDrawerOpen(false)
                    }}
                    className={({ isActive }) => `
                      flex items-center gap-5 p-4 rounded-2xl transition-all relative overflow-hidden group border
                      ${isActive ? 'bg-white/[0.05] shadow-lg' : 'bg-white/[0.02] border-transparent'}
                    `}
                    style={{ 
                      borderColor: location.pathname === to ? 'color-mix(in srgb, var(--clr-primary) 30%, transparent)' : 'transparent',
                      color: location.pathname === to ? 'var(--clr-primary)' : 'var(--clr-text-muted)'
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-active:scale-90"
                      style={{ color: location.pathname === to ? 'var(--clr-primary)' : 'var(--clr-text-muted)', background: 'var(--clr-surface-2)' }}
                    >
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--clr-text-muted)' }}>{subtitle || 'Acessar módulo'}</span>
                    </div>
                    <ChevronRight size={18} className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" style={{ color: 'var(--clr-text-muted)' }} />
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Sub-componente auxiliar para itens individuais da barra (evita repetição de código)
function NavItem({ to, icon: Icon, label, active, locked }) {
  return (
    <NavLink
      to={to}
      onClick={(e) => {
        if (locked) {
          e.preventDefault()
        }
      }}
      className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all active:scale-95 no-tap-highlight"
    >
      <div 
        className="transition-all duration-300"
        style={{ 
          color: active ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
          opacity: active ? 1 : 0.6,
          transform: active ? 'scale(1.1)' : 'scale(1)'
        }}
      >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      </div>
      <p 
        className="text-[9px] font-black uppercase tracking-widest transition-colors duration-300"
        style={{ color: active ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}
      >
        {label}
      </p>
    </NavLink>
  )
}
