// RESUMO: Shell principal da aplicação RS Top Team.
// Gerencia o roteamento, provedores de contexto (Auth, Theme, App),
// barra lateral, navegação mobile e proteção de rotas por perfis de acesso.
import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Menu, CalendarDays, Banknote } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppProvider, useApp } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StudentsProvider } from './context/StudentsContext'
import Sidebar from './components/sidebar/Sidebar'
import MobileNav from './components/navigation/MobileNav'
import SiteFooter from './components/shared/SiteFooter'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { useSystemUsers } from './hooks/useSystemUsers'
import { useNotificacoesPush } from './hooks/useNotificacoesPush'
import { useNotificacoesApp } from './hooks/useNotificacoesApp'
import { Toaster } from 'react-hot-toast'
import NotificationCenter from './components/notifications/NotificationCenter'
import NetworkStatusIndicator from './components/navigation/NetworkStatusIndicator'

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
// Each route gets its own chunk — only loaded when navigated to.
// This cuts the initial bundle by ~80% (800KB → ~150KB).
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'))
const AttendancePage = lazy(() => import('./modules/attendance/AttendancePage'))
const StudentsPage = lazy(() => import('./modules/students/StudentsPage'))
const CollaboratorsPage = lazy(() => import('./modules/collaborators/CollaboratorsPage'))
const EventsPage = lazy(() => import('./modules/events/EventsPage'))
const ProfilePage = lazy(() => import('./modules/profile/ProfilePage'))
const ReviewAttendancePage = lazy(() => import('./modules/attendance/ReviewAttendancePage'))
const LoginPage = lazy(() => import('./modules/auth/LoginPage'))
const ResetPasswordPage = lazy(() => import('./modules/auth/ResetPasswordPage'))
const ContractsPage = lazy(() => import('./modules/contracts/ContractsPage'))
const ModuleUnderDevelopment = lazy(() => import('./components/shared/ModuleUnderDevelopment'))
const LogsPagina = lazy(() => import('./modules/profile/paginas/logs_pagina'))
const ErrosPagina = lazy(() => import('./modules/profile/paginas/erros_pagina'))
const ModalitiesPage = lazy(() => import('./modules/modalities/ModalitiesPage'))
// Módulo Financeiro — 3 páginas independentes com responsabilidade única
const BillingPage = lazy(() => import('./modules/finance/BillingPage'))   // Cobrança
const ExpensesPage = lazy(() => import('./modules/finance/ExpensesPage'))  // Despesas
const ReportsPage = lazy(() => import('./modules/finance/ReportsPage'))   // Relatórios Financeiros
const RSAdminRegister = lazy(() => import('./modules/auth/RSAdminRegister'))
// ─── ScrollToTop Helper ───────────────────────────────────────────────────────
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    // Se estivermos tentando ir para uma notificação específica, não reseta o scroll para o topo
    if (search.includes('noticeId=')) return

    const content = document.querySelector('.main-content')
    if (content) content.scrollTo(0, 0)
    else window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

// ─── Route-level skeleton (ultra-lightweight fallback) ───────────────────────
// ─── Transição de Página ─────────────────────────────────────────────────────
// Mobile: apenas opacity (sem y translation) — evita reflows e jank em
// dispositivos com GPU limitada. Desktop: slide-up suave completo.
const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768

function AnimatedPage({ children }) {
  return (
    <motion.div
      // Em mobile, animar apenas opacity (propriedade GPU-accelerated).
      // Em desktop, manter o slide-up premium sem comprometer performance.
      initial={isMobileDevice ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={isMobileDevice ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: isMobileDevice ? 0.2 : 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: 'opacity, transform' }}
      className="flex-1 w-full flex flex-col origin-top max-md:pb-[140px]"
    >
      {children}
    </motion.div>
  )
}

function PageSkeleton() {
  return (
    <div className="p-8 flex flex-col gap-6 w-full max-w-7xl mx-auto animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white/5 rounded-3xl" />
        ))}
      </div>
      <div className="h-64 bg-white/5 rounded-3xl" />
    </div>
  )
}


function AppContent() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobileNavHidden } = useApp()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const location = useLocation()

  // Listener para detectar mudanças no tamanho da janela e ajustar layout mobile
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { user, userData, isSetupMode, loading: authLoading } = useAuth()

  // Registra o device no FCM (token salvo no Firestore para notificações futuras)
  useNotificacoesPush({ userId: user?.uid })

  // Escuta avisos, horários e chamadas do Firestore e dispara notificações locais
  useNotificacoesApp({
    alunoId: user?.uid,
    role: userData?.role || userData?.papel
  })

  // 1. PÁGINAS PÚBLICAS: Telas de autenticação que não requerem login.
  const isAuthPage = ['/login', '/rsadmin'].includes(location.pathname)

  // 0. CARREGAMENTO: Enquanto verifica auth/setup, evitamos tela preta e redirects precipitados.
  if (authLoading) {
    return <PageSkeleton />
  }

  // 1. MODO SETUP: (Desativado o redirecionamento forçado por solicitação)

  // 2. REDIRECIONAMENTO: Se o usuário já estiver logado, admite acesso às telas de login/registro.
  if (user && isAuthPage) {
    return <Navigate to="/" replace />
  }

  // 3. ROTAS PÚBLICAS (AUTENTICAÇÃO)
  const isPublicAuthPage = isAuthPage || location.pathname === '/recuperar-senha'

  if (isPublicAuthPage) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-senha" element={<ResetPasswordPage />} />
          <Route path="/rsadmin" element={<RSAdminRegister />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <ErrorBoundary>
      {/* Layout Principal com Sidebar e Área de Conteúdo */}
      <div className="flex h-dvh overflow-hidden w-full" style={{ background: 'var(--clr-bg)' }}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Área de Conteúdo Dinâmico */}
        <div className="main-content flex flex-col flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden transition-all relative">

          <div className="flex-1 flex flex-col relative w-full min-h-0">
            {/* Wrapper Centralizado para as Páginas e Rodapé */}
            <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col">
              <Toaster position="top-right" />
              <NotificationCenter />
              <NetworkStatusIndicator />
              <ScrollToTop />
              <Suspense fallback={<PageSkeleton />}>
                <AnimatePresence mode="wait" initial={false}>
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<ProtectedRoute><AnimatedPage><DashboardPage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/inicio" element={<ProtectedRoute><AnimatedPage><DashboardPage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/chamadas" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']} requiredPermission="manageClasses"><AnimatedPage><AttendancePage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/alunos" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']} requiredPermission="viewStudents"><AnimatedPage><StudentsPage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/equipe" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']} requiredPermission="manageUsers"><AnimatedPage><CollaboratorsPage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/eventos" element={<ProtectedRoute requiredPermission="manageEvents"><AnimatedPage><EventsPage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/perfil" element={<ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/perfil/:aba" element={<ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/logs" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']}><AnimatedPage><LogsPagina /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/erros" element={<ProtectedRoute allowedRoles={['admin']}><AnimatedPage><ErrosPagina /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/chamadas/revisao/:sessionId" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']}><AnimatedPage><ReviewAttendancePage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/contratos" element={<ProtectedRoute allowedRoles={['admin', 'gestor']}><AnimatedPage><ContractsPage /></AnimatedPage></ProtectedRoute>} />

                    <Route path="/financeiro" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']} requiredPermission="viewBillingTab"><AnimatedPage><BillingPage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/despesas" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']} requiredPermission="viewExpensesTab"><AnimatedPage><ExpensesPage /></AnimatedPage></ProtectedRoute>} />
                    <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['admin', 'gestor', 'professor']} requiredPermission="viewFinance"><AnimatedPage><ReportsPage /></AnimatedPage></ProtectedRoute>} />
                    
                    {/* Redirecionamentos de Rotas Legadas */}
                    <Route path="/billing" element={<Navigate to="/financeiro" replace />} />
                    <Route path="/expenses" element={<Navigate to="/despesas" replace />} />
                    <Route path="/reports" element={<Navigate to="/relatorios" replace />} />
                    <Route path="/finance" element={<Navigate to="/financeiro" replace />} />
                    <Route path="/attendance" element={<Navigate to="/chamadas" replace />} />
                    <Route path="/students" element={<Navigate to="/alunos" replace />} />
                    <Route path="/collaborators" element={<Navigate to="/equipe" replace />} />
                    <Route path="/events" element={<Navigate to="/eventos" replace />} />
                    <Route path="/profile" element={<Navigate to="/perfil" replace />} />
                    <Route path="/contracts" element={<Navigate to="/contratos" replace />} />
                    <Route path="/modalities" element={<Navigate to="/modalidades" replace />} />
                    <Route path="/home" element={<Navigate to="/inicio" replace />} />

                    <Route path="/visitantes" element={<ProtectedRoute><AnimatedPage><StudentsPage defaultTypeFilter="visitante" /></AnimatedPage></ProtectedRoute>} />

                    <Route path="/modalidades" element={<ProtectedRoute requiredPermission="manageSystem"><AnimatedPage><ModalitiesPage /></AnimatedPage></ProtectedRoute>} />

                    <Route path="/planos" element={<ProtectedRoute><AnimatedPage><ModuleUnderDevelopment
                      icon={Banknote} title="Planos"
                      features={['Planos recorrentes', 'Gestão de benefícios', 'Cobrança automática']}
                    /></AnimatedPage></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </Suspense>

              {!isMobile && <SiteFooter />}
            </div>
          </div>
        </div>

        {/* Componente de Navegação Inferior para dispositivos móveis */}
        {isMobile && !isMobileNavHidden && <MobileNav />}
      </div>
    </ErrorBoundary>
  )
}

import { CollaboratorsProvider } from './context/CollaboratorsContext'
import { OrganizacaoProvider } from './context/OrganizacaoContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrganizacaoProvider>
          <StudentsProvider>
            <CollaboratorsProvider>
              <AppProvider>
                <AppContent />
              </AppProvider>
            </CollaboratorsProvider>
          </StudentsProvider>
        </OrganizacaoProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
