// COMPONENTE DE BARRA LATERAL (SIDEBAR)
// Centraliza a navegação principal da plataforma RS Top Team.
// Implementa suporte a múltiplos papéis (admin, gestor, professor, aluno) 
// e modo de simulação para administradores testarem interfaces.
import React, { useState } from 'react'
import {
  Settings, ChevronLeft, ChevronRight, ShieldCheck, User, ChevronDown,
  Activity, Contact, CheckCircle2, CalendarRange, Clock, Layers, Gauge, Medal,
  Gem, FileDigit, Zap, PiggyBank, ArrowDownRight, PieChart, MessageSquare, Users, BellRing
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import SeletorDeOrganizacao from '../organizacao/SeletorDeOrganizacao'

const navGroups = [
  {
    title: 'Visão Geral',
    items: [
      { to: '/', icon: Activity, label: 'Dashboard', roles: ['admin', 'gestor', 'professor', 'aluno'] },
    ]
  },
  {
    title: 'Operacional',
    items: [
      { to: '/alunos', icon: Contact, label: 'Alunos', roles: ['admin', 'gestor', 'professor'], reqPerm: 'viewStudents' },
      { to: '/equipe', icon: Users, label: 'Equipe & Professores', roles: ['admin', 'gestor', 'professor'], reqPerm: 'manageUsers' },
      { to: '/chamadas', icon: CheckCircle2, label: 'Chamada', roles: ['admin', 'gestor', 'professor'], reqPerm: 'manageClasses' },
      { to: '/eventos', icon: BellRing, label: 'Avisos & Eventos', roles: ['admin', 'gestor', 'professor', 'aluno'] },
      // { to: '/visitantes', icon: Clock, label: 'Visitantes', roles: ['admin', 'gestor', 'professor'] },
      { to: '/modalidades', icon: Layers, label: 'Modalidades e Turmas', roles: ['admin', 'gestor', 'professor'], reqPerm: 'manageSystem' },
    ]
  },
  {
    title: 'Inteligência Financeira',
    items: [
      { to: '/financeiro',  icon: PiggyBank,      label: 'Cobrança',               roles: ['admin', 'gestor', 'professor'], reqPerm: 'viewBillingTab' },
      { to: '/despesas', icon: ArrowDownRight,  label: 'Despesas',               roles: ['admin', 'gestor', 'professor'], reqPerm: 'viewExpensesTab' },
      { to: '/relatorios',  icon: PieChart,        label: 'Relatórios Financeiros', roles: ['admin', 'gestor', 'professor'], reqPerm: 'viewFinance' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { to: '/perfil', icon: Settings, label: 'Configurações', roles: ['admin', 'gestor', 'professor', 'aluno'] },
    ]
  }
]

// Tooltip flutuante para quando a barra está recolhida (Collapsible)
const NavTooltip = ({ content, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, x: -10, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -10, scale: 0.9 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-1.5 border border-white/10 rounded-2xl shadow-2xl z-[100] pointer-events-none whitespace-nowrap"
        style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: 'var(--clr-surface)' }}
      >
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 border-l border-b border-white/10 rotate-45" style={{ background: 'var(--clr-surface)' }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--clr-text)' }}>{content}</span>
      </motion.div>
    )}
  </AnimatePresence>
)

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  // Hook de autenticação para controle de acesso e simulação de roles
  const { userData, effectiveRole, simulatedRole, setSimulatedRole } = useAuth()
  const { isNavLocked } = useApp()
  const [showSimMenu, setShowSimMenu] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)

  const navigate = useNavigate()

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const effectivelyCollapsed = collapsed && !isMobile

  // Filtra itens de navegação baseados no nível de acesso atual e permissões
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

  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(effectiveRole) && hasPerm(item.reqPerm))
  })).filter(group => group.items.length > 0)

  const simulationOptions = [
    { label: 'Admin (Real)', value: null, icon: ShieldCheck },
    { label: 'Visão Gestor', value: 'gestor', icon: ShieldCheck },
    { label: 'Visão Professor', value: 'professor', icon: User },
    { label: 'Visão Aluno', value: 'aluno', icon: User },
  ]

  return (
    <>
      <AnimatePresence>
        {/* Overlay do menu mobile (escurecimento do fundo) - DESATIVADO EM MOBILE */}
        {mobileOpen && !isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay active"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: effectivelyCollapsed ? 68 : 265,
          x: isMobile ? '-100%' : (mobileOpen ? 0 : 0)
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sidebar no-scrollbar flex flex-col relative z-40 backdrop-blur-xl"
        style={{ borderRight: '1px solid rgba(255, 255, 255, 0.05)', background: 'var(--clr-sidebar)' }}
      >
        {/* Logotipo da Academia */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center h-24 border-b border-white/5 ${effectivelyCollapsed ? 'px-[14px]' : 'px-[24px]'} relative overflow-hidden flex-nowrap shrink-0`}
          style={{ background: 'color-mix(in srgb, var(--clr-sidebar) 80%, transparent)' }}
        >
          <div className={`${effectivelyCollapsed ? 'w-10 h-10' : 'w-12 h-12'} flex-shrink-0 relative flex items-center justify-center transition-all duration-500`}>
            <img
              src="/logo.webp"
              alt="RS Top Team"
              className="w-full h-full rounded-full object-cover transition-transform duration-700"
              style={{
                boxShadow: `0 0 20px color-mix(in srgb, var(--clr-primary) 40%, transparent)`,
                border: '2px solid color-mix(in srgb, var(--clr-primary) 30%, transparent)'
              }}
            />
          </div>
          <motion.div
            animate={{
              opacity: effectivelyCollapsed ? 0 : 1,
              width: effectivelyCollapsed ? 0 : 180,
              marginLeft: effectivelyCollapsed ? 0 : 16,
              x: effectivelyCollapsed ? -15 : 0
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col whitespace-nowrap overflow-hidden"
          >
            <p className="text-[11px] leading-none tracking-[0.35em] uppercase font-black text-primary mb-1 pl-1">ATLAS</p>
            <p className="font-sans text-2xl leading-tight tracking-[0.05em] text-white uppercase font-black pl-1">ACADEMY</p>
          </motion.div>
        </Link>

        {/* Seletor de Organização Multi-Tenant */}
        <div className="px-3 py-3 border-b border-white/5 shrink-0">
          <SeletorDeOrganizacao recolhido={effectivelyCollapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-5 px-2">
          {filteredNavGroups.map((group, idx) => (
            <div key={group.title} className="flex flex-col gap-1 items-center md:items-stretch">
              {/* Separator for Collapsed state */}
              {effectivelyCollapsed && idx > 0 && (
                <div className="w-10 h-[1px] bg-white/10 my-2 mx-auto rounded-full" />
              )}
              <motion.p
                animate={{
                  opacity: effectivelyCollapsed ? 0 : 0.4,
                  height: effectivelyCollapsed ? 0 : 'auto',
                  marginBottom: effectivelyCollapsed ? 0 : 8,
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-[9px] font-black uppercase tracking-[0.25em] px-5 whitespace-nowrap overflow-hidden"
                style={{ color: 'var(--clr-text-muted)' }}
              >
                {group.title}
              </motion.p>

              {group.items.map(({ to, icon: Icon, label }) => (
                <div key={to} className="relative flex items-center justify-center w-full">
                  <NavLink
                    to={to}
                    onClick={(e) => {
                      if (isNavLocked) {
                        e.preventDefault()
                        return
                      }
                      // Delay para o usuário ver o estado ativo antes de fechar
                      setTimeout(() => setMobileOpen(false), 180)
                    }}
                    onMouseEnter={() => setHoveredItem(to)}
                    onMouseLeave={() => setHoveredItem(null)}
                    end={to === '/'}
                    className={({ isActive }) => `
                      nav-item transition-all duration-300 relative flex items-center group
                      ${effectivelyCollapsed
                        ? 'w-[44px] h-[44px] justify-center p-0 rounded-2xl mx-auto'
                        : 'px-4 py-2.5 rounded-2xl w-full mx-auto'
                      }
                      ${isActive ? 'active' : 'hover:bg-white/5'}
                    `}
                    style={({ isActive }) => ({
                      maxWidth: effectivelyCollapsed ? '44px' : '235px',
                      background: isActive
                        ? 'color-mix(in srgb, var(--clr-primary) 12%, transparent)'
                        : undefined,
                      color: isActive
                        ? 'var(--clr-primary)'
                        : 'var(--clr-text-muted)',
                    })}
                  >
                    {({ isActive }) => (
                      <div
                        className="flex items-center w-full h-full"
                        style={{
                          borderRadius: 'inherit',
                          justifyContent: effectivelyCollapsed ? 'center' : undefined,
                        }}
                      >
                        {/* Active Indicator Pill */}
                        {/* Active Indicator Pill */}
                        <AnimatePresence>
                          {isActive && effectivelyCollapsed && (
                            <motion.div
                              layoutId="active-pill"
                              initial={{ opacity: 0, x: -5, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: 20 }}
                              exit={{ opacity: 0, x: -5, height: 0 }}
                              className="absolute left-[-12px] w-[3px] rounded-full z-20"
                              style={{ backgroundColor: 'var(--clr-primary)', boxShadow: '0 0 15px color-mix(in srgb, var(--clr-primary) 80%, transparent)' }}
                            />
                          )}
                        </AnimatePresence>

                        <div className={`${effectivelyCollapsed ? 'w-auto' : 'w-7'} flex-shrink-0 flex justify-center items-center relative z-10 transition-all duration-300`}>
                          <Icon
                            size={20}
                            strokeWidth={isActive ? 2.2 : 1.5}
                            className="nav-icon transition-all duration-300 group-hover:scale-110"
                            style={{ color: isActive ? 'var(--clr-primary)' : undefined }}
                          />
                        </div>

                        <motion.span
                          animate={{
                            opacity: effectivelyCollapsed ? 0 : 1,
                            width: effectivelyCollapsed ? 0 : 'auto',
                            marginLeft: effectivelyCollapsed ? 0 : 14,
                            x: effectivelyCollapsed ? -5 : 0
                          }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="text-[13px] font-medium whitespace-nowrap overflow-hidden block flex-1"
                        >
                          {label}
                        </motion.span>
                      </div>
                    )}
                  </NavLink>

                  {effectivelyCollapsed && (
                    <NavTooltip
                      content={label}
                      visible={hoveredItem === to}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer Panel */}
        <div className="p-3 border-t border-white/5 flex flex-col gap-2 shrink-0" style={{ background: 'color-mix(in srgb, var(--clr-sidebar) 80%, transparent)' }}>
          {isActuallyAdmin && (
            <div className="relative">
              <button
                onClick={() => {
                  if (isNavLocked) return
                  setShowSimMenu(!showSimMenu)
                }}
                className="flex items-center rounded-2xl transition-all h-11 px-[20px] w-full flex-nowrap hover:bg-white/5"
                style={{
                  background: simulatedRole ? 'color-mix(in srgb, var(--clr-primary) 12%, transparent)' : undefined,
                  color: simulatedRole ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
                }}
              >
                <div className="w-7 flex-shrink-0 flex justify-center items-center">
                  <ShieldCheck size={19} strokeWidth={2} />
                </div>
                <motion.div
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 160,
                    marginLeft: collapsed ? 0 : 14,
                    x: collapsed ? -10 : 0
                  }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-1 flex items-center gap-2 overflow-hidden flex-nowrap"
                >
                  <span className="text-xs flex-1 text-left font-medium whitespace-nowrap">
                    {simulatedRole ? `Modo: ${simulatedRole}` : 'Admin'}
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-500 ${showSimMenu ? 'rotate-180' : ''}`} />
                </motion.div>
              </button>

              <AnimatePresence>
                {showSimMenu && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 w-full mb-2 border border-white/5 rounded-2xl shadow-2xl overflow-hidden glass-card z-50 p-1"
                  >
                    {simulationOptions.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setSimulatedRole(opt.value)
                          setShowSimMenu(false)
                        }}
                        className="w-full px-3 py-2.5 text-[10px] text-left hover:bg-white/5 transition-colors rounded-lg flex items-center gap-2"
                        style={{ color: simulatedRole === opt.value ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}
                      >
                        <opt.icon size={12} />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={() => setCollapsed(v => !v)}
            onMouseEnter={() => setHoveredItem('collapse-btn')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`nav-item flex items-center hover:bg-white/5 transition-all w-full relative ${effectivelyCollapsed ? 'h-[44px] w-[44px] justify-center p-0 rounded-2xl mx-auto' : 'h-11 px-5 rounded-2xl'}`}
            style={{ color: 'var(--clr-text-muted)' }}
          >
            <div className={`${effectivelyCollapsed ? 'w-auto' : 'w-7'} flex-shrink-0 flex justify-center items-center transition-all duration-300`}>
              {collapsed && !isMobile ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </div>
            <motion.span
              animate={{
                opacity: effectivelyCollapsed ? 0 : 1,
                width: effectivelyCollapsed ? 0 : 'auto',
                marginLeft: effectivelyCollapsed ? 0 : 14,
                x: effectivelyCollapsed ? -10 : 0
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden"
            >
              {collapsed ? "Expandir" : "Recolher"}
            </motion.span>

            {effectivelyCollapsed && (
              <NavTooltip
                content={collapsed ? "Expandir" : "Recolher"}
                visible={hoveredItem === 'collapse-btn'}
              />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar
