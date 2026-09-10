// ─── React e Hooks ─────────────────────────────────────────────
import React, { useState, useMemo } from 'react'

// ─── Ícones ───────────────────────────────────────────────────
import { 
  Trophy, Medal, Target, Calendar, Clock, TrendingUp, 
  ChevronLeft, ChevronRight, Star, Zap, Bell, AlertCircle, History,
  Activity, Sparkles, Check, LayoutDashboard, DollarSign, 
  Wallet, ArrowUpRight, ShieldCheck, CalendarDays, X
} from 'lucide-react'

// ─── Gráficos (Recharts) ─────────────────────────────────────
import { 
  XAxis, YAxis, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

// ─── Hooks e Serviços ─────────────────────────────────────────
import { useModalities } from '../../hooks/useModalities'
import QuickStartGuide from './components/QuickStartGuide'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudentAttendance } from '../../hooks/useStudentAttendance'
import { useNotices } from '../../hooks/useNotices'
import { useTodaySessions } from '../../hooks/useTodaySessions'
import { beltConfig as defaultBelts } from '../../data/beltConfig'
import { attendanceService } from '../../services/attendanceService'

// ─── Componentes Compartilhados ───────────────────────────────
import PageHeader from '../../components/shared/PageHeader'
import MobileHeader from '../../components/navigation/MobileHeader'
import { calculateModalityValue } from '../../utils/billingUtils'

/**
 * DASHBOARD DO ALUNO
 * Visão geral com estatísticas, calendário de presença, agenda semanal, conquistas e grade de horários.
 */

// ─── Constantes ───────────────────────────────────────────────
const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const NUM_TO_DAY = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' }
const DAY_TO_NUM = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 }
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// ─── Componentes Atômicos de UI ───────────────────────────────

// Raio padrão dos cartões
const RADIUS_MAIN = 'rounded-[32px]'
const RADIUS_CARD = 'rounded-[20px]'

// Cartão de estatística genérico com ícone, valor e descrição
const StatCard = ({ title, value, detail, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden glass-card p-5 bg-white/[0.03] border border-white/5 ${RADIUS_CARD} group cursor-default h-full min-h-[140px] flex flex-col`}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none`} style={{ background: color }} />
    
    <div className="relative z-10 flex flex-col h-full uppercase">
      {/* Ícone e Título */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-primary transition-transform group-hover:scale-110 duration-500 shrink-0">
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-black tracking-[0.15em] text-gray-500 leading-tight break-words overflow-hidden">
          {title}
        </span>
      </div>

      {/* Valor centralizado */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <h3 className="text-4xl font-black text-white tracking-tighter leading-none">
          {value}
        </h3>
      </div>

      {/* Texto inferior */}
      <p className="text-[9px] font-bold text-gray-600 tracking-[0.1em] leading-tight opacity-70">
        {detail}
      </p>
    </div>
  </motion.div>
)

// Cartão de pagamento com status (pago/pendente/vencido) e botão de ação
const PaymentStatCard = ({ info, delay = 0 }) => {
  const { amount, status, changeType, dueDate } = info;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const statusConfig = {
    pago: { icon: Check, color: '#10b981', label: 'Pago', desc: 'Mensalidade em dia' },
    pendente: { icon: Clock, color: '#f43f5e', label: 'Pendente', desc: dueDate ? `Vence: ${formatDate(dueDate)}` : 'Fatura atual' },
    vencido: { icon: AlertCircle, color: '#f43f5e', label: 'Atrasado', desc: dueDate ? `Venceu: ${formatDate(dueDate)}` : 'Fatura atual' }
  };

  const current = statusConfig[status] || statusConfig.pago;
  const Icon = current.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden glass-card p-5 bg-white/[0.03] border border-white/5 rounded-[32px] group cursor-default h-full min-h-[140px] flex flex-col`}
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none`} style={{ background: current.color }} />

      <div className="relative z-10 flex flex-col h-full uppercase">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 transition-transform group-hover:scale-110 duration-500 shrink-0" style={{ color: current.color }}>
              <Icon size={18} />
            </div>
            <span className="text-[10px] font-black tracking-[0.15em] text-gray-500 leading-tight break-words overflow-hidden">
              {current.label}
            </span>
          </div>
          
          {changeType !== 'none' && (
            <div className="flex items-center gap-0.5 text-[8px] font-black tracking-tighter px-1.5 py-0.5 rounded-full bg-white/5 shadow-lg shadow-black/50">
               <ArrowUpRight size={8} className={changeType === 'increase' ? 'text-rose-400' : 'text-emerald-400 transform rotate-90'} />
               <span className={changeType === 'increase' ? 'text-rose-400' : 'text-emerald-400'}>
                 {changeType === 'increase' ? 'REAJUSTE' : 'REDUÇÃO'}
               </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center py-2">
          <h3 className="text-4xl font-black text-white tracking-tighter leading-none">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(amount)}
          </h3>
        </div>

        {status === 'pago' ? (
          <p className="text-[9px] font-bold text-gray-600 tracking-[0.1em] leading-tight opacity-70">
            {current.desc}
          </p>
        ) : (
          <button className="mt-auto w-full py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[9px] font-black tracking-[0.15em] transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-2">
            <Wallet size={10} /> Pagar Mensalidade
          </button>
        )}
      </div>
    </motion.div>
  );
};


// Tooltip personalizado para o gráfico de consistência mensal
function CustomBarTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.label}</p>
        <p className="text-sm font-black text-white">{payload[0].value} Treinos</p>
      </div>
    )
  }
  return null
}


// ─── Componente Principal ─────────────────────────────────────
export default function StudentDashboard({ user, cobrancas = [] }) {
  // Hook de frequência ー presenças, faltas, sequência
  const { total: hookTotal, monthly, weekly, streak, recent, loading: loadingAttendance } = useStudentAttendance(user?.id)

  // Sincroniza com dados do documento do usuário (fonte oficial)
  const total = user?.total_visitas || hookTotal || 0

  // Avisos, sessões do dia e modalidades
  const { notices, userViews = new Set(), markAsViewed } = useNotices(user?.id)
  const { loading: loadingSessions } = useTodaySessions()
  const { modalities } = useModalities()

  // Estado de sincronização manual
  const [syncing, setSyncing] = useState(false)

  // Estado da agenda semanal
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0,0,0,0)
    return d
  })

  // Estado do calendário mensal de presença
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDayInfo, setSelectedDayInfo] = useState(null)

  // Converte registros brutos em objetos padronizados com data, modalidade e status
  const records = useMemo(() => {
    if (!recent) return [];
    return recent.map(log => {
      let date = null
      if (log.parsedDate) {
        date = log.parsedDate instanceof Date ? log.parsedDate : new Date(log.parsedDate)
      } else if (log.date) {
        date = new Date(log.date + 'T12:00:00')
      } else if (log.data) {
        date = new Date(log.data + 'T12:00:00')
      }
      return {
        ...log,
        date: date || new Date(0),
        modality: log.modalidade || log.modality || 'Jiu Jitsu',
        status: log.status || 'present'
      }
    }).filter(r => r.date && !isNaN(r.date.getTime())).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [recent])

  // Apenas registros de presença
  const presentRecords = useMemo(() => records.filter(r => r.status === 'present' || r.status === 'presente'), [records])

  // Dados do gráfico de consistência mensal (presenças por mês)
  const monthlyData = useMemo(() => {
    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const counts = {}
    presentRecords.forEach(r => {
      const key = r.date.getMonth()
      counts[key] = (counts[key] || 0) + 1
    })
    return Array.from({ length: 12 }, (_, i) => ({ month: i, label: MONTHS[i], count: counts[i] || 0 }))
  }, [presentRecords])

  // Dias da semana atual para a agenda semanal
  const weeklyCalendarDays = useMemo(() => {
    const today = new Date()
    today.setHours(0,0,0,0)
    const currentDay = today.getDay()
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() + distToMon + (weekOffset * 7))

    const days = []
    for(let i=0; i<7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }, [weekOffset])

  const { allTurmas = [] } = useModalities()

  // Dias da semana com aulas agendadas para o aluno
  const scheduledDays = useMemo(() => {
    const studentModalities = user?.modalities || []
    if (studentModalities.length === 0) return []

    const studentTurmas = allTurmas.filter(t => {
       const mod = modalities.find(m => m.id === t.modalityId)
       return studentModalities.includes(t.modalityId) || 
              (mod && studentModalities.some(m => m.toLowerCase() === mod.name.toLowerCase()))
    })

    const daysSet = new Set()
    const mapDayToNum = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 }
    
    studentTurmas.forEach(t => {
      if (t.diasSemana) {
        t.diasSemana.forEach(d => {
           if (mapDayToNum[d] !== undefined) daysSet.add(mapDayToNum[d])
        })
      }
    })

    return Array.from(daysSet)
  }, [allTurmas, modalities, user])

  // Turmas do dia selecionado na agenda semanal
  const selectedDayClasses = useMemo(() => {
    const dayNum = selectedDate.getDay()
    const mapNumToDay = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' }
    const dayStr = mapNumToDay[dayNum]

    const studentModalities = user?.modalities || []
    if (studentModalities.length === 0) return []

    return allTurmas.filter(t => {
       const mod = modalities.find(m => m.id === t.modalityId)
       const isStudentEnrolled = studentModalities.includes(t.modalityId) || 
              (mod && studentModalities.some(m => m.toLowerCase() === mod.name.toLowerCase()))
       const isOnThisDay = t.diasSemana?.includes(dayStr)
       return isStudentEnrolled && isOnThisDay
    }).map(t => {
       const mod = modalities.find(m => m.id === t.modalityId)
       return {
         ...t,
         modalityName: mod ? mod.name : (t.name || 'Treino')
       }
    })
  }, [allTurmas, modalities, user, selectedDate])

  // Sincronização manual do histórico global de presenças
  const handleSync = async () => {
    if (!window.confirm('Deseja sincronizar o histórico global de presenças? Isso pode levar alguns segundos.')) return
    
    setSyncing(true)
    try {
      const count = await attendanceService.syncAttendanceHistory()
      alert(`✅ Sucesso! ${count} registros de presença foram sincronizados.`)
      window.location.reload()
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      alert('Erro ao sincronizar histórico. Verifique o console.')
    } finally {
      setSyncing(false)
    }
  }

  // Cobranças pendentes ou vencidas
  const pendingBills = useMemo(() => 
    cobrancas.filter(b => b.status === 'pending' || b.status === 'overdue'),
  [cobrancas])

  // Configuração da faixa atual do aluno
  const beltInfo = defaultBelts[user?.belt?.toLowerCase()] || defaultBelts.white
  const beltColor = user?.belt?.toLowerCase() || ''
  const isWhiteBelt = beltColor === 'white' || beltColor === 'branca' || beltColor === 'branco'
  
  // Progresso técnico: meses na faixa atual
  const { technicalProgress, monthsInBelt } = useMemo(() => {
    const jornada = user?.jornada_tecnica || {}
    const lastPromoDate = jornada.data_ultima_graduacao?.toDate?.() || 
                         user?.criadoEm?.toDate?.() || 
                         (user?.criadoEm ? new Date(user.criadoEm) : new Date())
    
    const diffTime = Math.abs(new Date() - lastPromoDate)
    const months = Math.max(Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)), 0)
    
    const minMonthsRequired = beltInfo.minMonths || 6
    const progress = Math.min(Math.round((months / minMonthsRequired) * 100), 100)
    
    return { technicalProgress: progress, monthsInBelt: months }
  }, [user, beltInfo])

  // Histórico de graduações
  const history = user?.jornada_tecnica?.historico || [
    { belt: 'white', date: user?.criadoEm?.toDate?.() || new Date(), reason: 'Início na Academy' }
  ]

  // Avisos ativos (não expirados e não finalizados)
  const activeNotices = useMemo(() => {
    return notices.filter(notice => {
      if (notice.isFinalized) return false
      if (notice.expiresAt?.toDate) {
        return notice.expiresAt.toDate() > new Date()
      }
      return true
    }).slice(0, 3)
  }, [notices])

  // Dias da semana com anúncios ativos (indicador de sino no calendário)
  const noticeDays = useMemo(() => {
    const daysSet = new Set()

    activeNotices.forEach(notice => {
      if (!notice.diasSemana || !notice.startDate) return

      const start = new Date(notice.startDate + 'T00:00:00')
      const end = notice.endDate ? new Date(notice.endDate + 'T23:59:59') : new Date(start)

      weeklyCalendarDays.forEach(date => {
        const dayStr = NUM_TO_DAY[date.getDay()]
        if (!notice.diasSemana.includes(dayStr)) return
        if (date < start) return
        if (date > end) return
        daysSet.add(date.getDay())
      })
    })

    return daysSet
  }, [weeklyCalendarDays, activeNotices])

  // Anúncios específicos do dia selecionado na agenda
  const selectedDayNotices = useMemo(() => {
    const dayNum = selectedDate.getDay()
    const dayStr = NUM_TO_DAY[dayNum]
    const dateStr = selectedDate.toISOString().split('T')[0]

    return activeNotices.filter(notice => {
      if (!notice.diasSemana || !notice.diasSemana.length) return false
      if (!notice.diasSemana.includes(dayStr)) return false
      if (notice.startDate && dateStr < notice.startDate) return false
      if (notice.endDate && dateStr > notice.endDate) return false
      return true
    })
  }, [selectedDate, activeNotices])

  // Lógica de Conquistas Reais baseadas em dados de assiduidade
  const realAchievements = useMemo(() => {
    if (loadingAttendance) return []
    
    return [
      { id: 'consistency', label: 'Assiduidade', desc: '10 aulas no mês', icon: Activity, active: monthly >= 10 },
      { id: 'resilience', label: 'Resiliência', desc: '7 treinos seguidos', icon: Zap, active: streak >= 7 },
      { id: 'discipline', label: 'Disciplina', desc: 'Meta batida!', icon: Target, active: weekly >= 3 },
      { id: 'veteran', label: 'Veterano', desc: '50 treinos totais', icon: Trophy, active: total >= 50 },
      { id: 'star', label: 'Estrela', desc: 'Frequência 100%', icon: Star, active: monthly >= 20 },
    ]
  }, [total, monthly, weekly, streak, loadingAttendance])

  // Cálculo do Próximo Pagamento Baseado nas Cobranças Reais e Regras
  const nextPaymentInfo = useMemo(() => {
    if (!user) return { amount: 0, lastAmount: 0, changed: false, changeType: 'none', status: 'pago', dueDate: null };

    // 1. Encontrar a cobrança mais urgente (vencida primeiro, depois a mais próxima a vencer)
    const pendingAndOverdue = cobrancas.filter(b => b.status === 'pending' || b.status === 'overdue');
    
    // Ordenar por data de vencimento (as mais antigas/vencidas primeiro)
    pendingAndOverdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const currentBill = pendingAndOverdue[0];
    
    let amount = 0;
    let status = 'pago';
    let dueDate = null;

    if (currentBill) {
      amount = Number(currentBill.amount) || 0;
      status = currentBill.status === 'overdue' ? 'vencido' : 'pendente';
      
      // TZ-FIX: usa data civil LOCAL para evitar reclassificação prematura
      // nas 3h antes da meia-noite em UTC-3 (TZ-002)
      const _h = new Date()
      const today = `${_h.getFullYear()}-${String(_h.getMonth() + 1).padStart(2, '0')}-${String(_h.getDate()).padStart(2, '0')}`;
      if (currentBill.status === 'pending' && currentBill.dueDate < today) {
        status = 'vencido';
      }
      
      dueDate = currentBill.dueDate;
    } else {
      // 2. Se não tem fatura aberta, o KPI reflete qual será o valor do próximo vencimento.
      // Isso utiliza as modalidades ativas no perfil (respeitando se a modalidade custa R$ 0).
      amount = calculateModalityValue(user, modalities);
      status = 'pago';
    }

    return { 
      amount, 
      lastAmount: amount, 
      changed: false, 
      changeType: 'none', 
      status,
      dueDate
    };
  }, [user, cobrancas, modalities]);

  const handleNoticeClick = (notice) => {
    // Marcar como visto se não for o autor e se ainda não foi lido
    if (user?.id && notice.authorId !== user.id && !userViews.has(notice.id)) {
      markAsViewed(notice.id, user.id);
    }
    // Navegar para a página de eventos/avisos com o ID expandido
    window.location.href = `/events?noticeId=${notice.id}`;
  };

  // Grade do calendário para o mês atual
  const calendarGrid = useMemo(() => {
    const year = viewDate.getFullYear(), month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [viewDate])

  // Mapa de registros por dia no mês visualizado
  const monthPresentMap = useMemo(() => {
    const map = {}
    records.forEach(r => {
      if (r.date.getFullYear() === viewDate.getFullYear() && r.date.getMonth() === viewDate.getMonth()) {
        const d = r.date.getDate()
        if (!map[d]) map[d] = []
        map[d].push(r)
      }
    })
    return map
  }, [records, viewDate])

  // Medalha de ranking baseada na frequência mensal
  const rankBadge = useMemo(() => {
    const n = monthly
    if (n >= 20) return { label: 'Top Atleta 🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    if (n >= 14) return { label: 'Assíduo 🥈', color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }
    if (n >= 8) return { label: 'Regular 🥉', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
    if (n >= 4) return { label: 'Iniciante', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
    return null
  }, [monthly])

  // ─── Lógica do Card "Minha Grade" ─────────────────────────────

  // Dia de hoje em formato abreviado
  const today = new Date()
  const todayDayStr = NUM_TO_DAY[today.getDay()]
  const todayDayName = DAYS_FULL[today.getDay()].slice(0, 3)

  // Turmas do aluno para o dia de hoje, ordenadas por horário
  const todayClasses = useMemo(() => {
    const studentModalities = user?.modalities || []
    if (studentModalities.length === 0) return []

    return allTurmas.filter(t => {
      const mod = modalities.find(m => m.id === t.modalityId)
      const isStudentEnrolled = studentModalities.includes(t.modalityId) || 
        (mod && studentModalities.some(m => m.toLowerCase() === mod.name.toLowerCase()))
      const isToday = t.diasSemana?.includes(todayDayStr)
      return isStudentEnrolled && isToday
    }).map(t => {
      const mod = modalities.find(m => m.id === t.modalityId)
      return {
        ...t,
        modalityName: mod ? mod.name : (t.name || 'Treino')
      }
    }).sort((a, b) => (a.horarioInicio || '').localeCompare(b.horarioInicio || ''))
  }, [allTurmas, modalities, user, todayDayStr])

  // Índice da próxima aula (primeira que ainda não passou)
  const nextClassIndex = useMemo(() => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    return todayClasses.findIndex(cls => {
      const [h, m] = (cls.horarioInicio || '00:00').split(':').map(Number)
      return h * 60 + m > currentMinutes
    })
  }, [todayClasses])

  // Próxima aula futura (quando todas de hoje já passaram ou não há aulas hoje)
  const nextFutureClass = useMemo(() => {
    const studentModalities = user?.modalities || []
    if (studentModalities.length === 0 || allTurmas.length === 0) return null

    const todayNum = today.getDay()
    const mapNumToDay = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' }
    const mapNumToDayAbbr = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' }

    for (let offset = 1; offset <= 7; offset++) {
      const dayNum = (todayNum + offset) % 7
      const dayStr = mapNumToDay[dayNum]

      const dayTurmas = allTurmas.filter(t => {
        const mod = modalities.find(m => m.id === t.modalityId)
        const isStudentEnrolled = studentModalities.includes(t.modalityId) || 
          (mod && studentModalities.some(m => m.toLowerCase() === mod.name.toLowerCase()))
        return isStudentEnrolled && t.diasSemana?.includes(dayStr)
      }).map(t => {
        const mod = modalities.find(m => m.id === t.modalityId)
        return {
          ...t,
          modalityName: mod ? mod.name : (t.name || 'Treino')
        }
      }).sort((a, b) => (a.horarioInicio || '').localeCompare(b.horarioInicio || ''))

      if (dayTurmas.length > 0) {
        const first = dayTurmas[0]
        return {
          dayName: mapNumToDayAbbr[dayNum],
          horarioInicio: first.horarioInicio,
          modalityName: first.modalityName
        }
      }
    }
    return null
  }, [allTurmas, modalities, user])

  // Rótulo de recorrência semanal
  const recurrenceLabel = useMemo(() => {
    const mapNumToDayAbbr = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' }
    return scheduledDays
      .sort((a, b) => a - b)
      .map(d => mapNumToDayAbbr[d])
      .join(' • ')
  }, [scheduledDays])

  return (
    <>
      {/* Sistema de Cabeçalhos Padronizados (Desktop e Mobile) */}
      <MobileHeader 
        title={`Olá, ${(user?.nome || user?.name || 'Aluno').split(' ')[0]}`} 
        profileIconClass={beltInfo.bgClass || 'bg-primary/20'}
        profileTextClass={isWhiteBelt ? "text-[#111]" : "text-white"}
      />
      
      <PageHeader 
        icon={() => (
          <div className={`w-full h-full flex items-center justify-center ${beltInfo.bgClass || 'bg-primary/10'}`}>
            {user?.photo ? (
              <img src={user.photo}             alt="Foto do perfil" className="w-full h-full object-cover" />
            ) : (
              <span className={`font-black text-sm uppercase ${isWhiteBelt ? 'text-[#111]' : 'text-white'}`}>
                {user?.initials || (user?.nome || user?.name)?.[0]}
              </span>
            )}
          </div>
        )}
        title={`Olá, ${(user?.nome || user?.name || 'Aluno').split(' ')[0]}`}
        subtitle="Sua jornada de evolução técnica e física"
        loading={loadingAttendance}
        showProfile={false}
      />

      <div className="flex-1 px-4 md:px-6 py-6 pb-32 space-y-6 w-full fade-slide-up">
        
        {/* Alerta Financeiro */}
      <AnimatePresence>
        {pendingBills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className={`overflow-hidden bg-rose-500/10 border border-rose-500/20 ${RADIUS_CARD} relative`}
          >
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Pendência Financeira</h4>
                  <p className="text-[10px] font-bold text-rose-300">Existem faturas aguardando pagamento. Verifique com a recepção.</p>
                  {(user?.roles?.admin || user?.papeis?.admin) && (
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all mt-2 ${
                        syncing ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                      }`}
                    >
                      {syncing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <Activity size={14} />
                          Sincronizar Histórico
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <button className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all">
                Ver Faturas
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Grid de Estatísticas Consolidado (3x2 no PC) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <PaymentStatCard info={nextPaymentInfo} delay={0.05} />
            <StatCard 
              title="Tempo de Faixa" 
              value={`${monthsInBelt}m`} 
              detail="Meses na graduação" 
              icon={Clock} 
              color="var(--clr-primary)" 
              delay={0.1}
            />
            <StatCard 
              title="No Mês" 
              value={monthly} 
              detail="Treinos realizados" 
              icon={Activity} 
              color="#0ea5e9" 
              delay={0.2}
            />
            <StatCard 
              title="Meta Semanal" 
              value={`${weekly}/3`} 
              detail="Aulas concluídas" 
              icon={Target} 
              color="#10b981" 
              delay={0.3}
            />
            <StatCard 
              title="Sequência" 
              value={`${streak}d`} 
              detail="Aulas consecutivas" 
              icon={Zap} 
              color="#f59e0b" 
              delay={0.4}
            />
            <StatCard 
              title="Treinos" 
              value={total} 
              detail="Total acumulado" 
              icon={History} 
              color="#8b5cf6" 
              delay={0.5}
            />
          </div>



          {/* Calendário Semanal (MOBILE) */}
          <section className="glass-card rounded-[32px] p-6 border border-white/10 relative overflow-hidden flex lg:hidden flex-col">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-black text-white tracking-wide">Agenda Semanal</h2>
               <div className="flex items-center gap-1">
                 <button onClick={() => setWeekOffset(p => p - 1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                   <ChevronLeft size={16} className="text-gray-400" />
                 </button>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] text-center">
                   {weeklyCalendarDays[0].toLocaleDateString('pt-BR', { month: 'short' })} {weeklyCalendarDays[0].getFullYear()}
                 </span>
                 <button onClick={() => setWeekOffset(p => p + 1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                   <ChevronRight size={16} className="text-gray-400" />
                 </button>
               </div>
             </div>

             <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar snap-x sm:justify-between sm:overflow-visible">
                {weeklyCalendarDays.map((date, i) => {
                  const isSelected = date.getTime() === selectedDate.getTime()
                  const dayOfWeek = date.getDay()
                  const hasClass = scheduledDays.includes(dayOfWeek)
                  const hasNotice = noticeDays.has(dayOfWeek)

                  return (
                    <div key={i}
                         onClick={() => setSelectedDate(date)}
                         className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl cursor-pointer transition-all flex-[0_0_auto] min-w-[64px] sm:flex-1 sm:min-w-0 snap-center
                           ${isSelected
                              ? 'bg-primary border-transparent shadow-[0_0_20px_rgba(var(--clr-primary-rgb),0.3)] scale-[1.05]'
                              : 'bg-white/5 hover:bg-white/10 border border-white/5'
                           }
                         `}
                    >
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>
                        {DAYS_FULL[dayOfWeek].substring(0,3)}
                      </span>
                      <span className={`text-sm sm:text-lg font-black ${isSelected ? 'text-black' : 'text-white'}`}>
                        {date.getDate()}
                      </span>
                      {/* Indicadores: bolinha verde de aula + sino amarelo de comunicado */}
                      <div className="mt-1.5 h-4 flex items-center justify-center gap-1 w-full">
                         {hasClass && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black/40' : 'bg-primary'}`} />}
                       {hasNotice && <Bell size={9} className={isSelected ? 'text-black/60' : 'text-yellow-500/70'} fill="currentColor" fillOpacity={0.3} />}
                       </div>
                     </div>
                   )
                 })}
              </div>

              {/* Card do Dia Selecionado — só aparece quando tem aula ou comunicado */}
              {(scheduledDays.includes(selectedDate.getDay()) || selectedDayNotices.length > 0) && (
              <div className="mt-6 p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                 {scheduledDays.includes(selectedDate.getDay()) && (
                    <div className="flex items-center justify-between relative z-10">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--clr-primary)]" />
                           <span className="text-xs font-bold text-white uppercase tracking-wider">
                             {selectedDayClasses.length > 1 ? `${selectedDayClasses.length} Treinos Agendados` : 'Treino Agendado'}
                           </span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                           {selectedDayClasses.map((cls, idx) => (
                             <p key={idx} className="text-[10px] text-gray-400 font-medium">
                               {cls.modalityName} • {cls.horarioInicio || '?'} - {cls.horarioFim || '?'}
                             </p>
                           ))}
                         </div>
                       </div>
                       <button
                         onClick={() => {
                           if ('Notification' in window) {
                             Notification.requestPermission().then(perm => {
                               if (perm === 'granted') {
                                 new Notification('RS Top Team', {
                                   body: 'Notificações de aula ativadas! (Simulação)',
                                   icon: '/vite.svg'
                                 })
                               }
                             })
                           }
                         }}
                         className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-[10px] font-bold hover:bg-primary/30 transition-colors flex items-center gap-1.5 active:scale-95">
                         <Bell size={12} />
                         Lembrar
                       </button>
                    </div>
                 )}
                 {selectedDayNotices.length > 0 && (
                   <div className={scheduledDays.includes(selectedDate.getDay()) ? 'mt-4 pt-4 border-t border-white/5 relative z-10 space-y-2' : 'relative z-10 space-y-2'}>
                     <span className="text-[9px] font-black text-yellow-500/80 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                       <Bell size={11} /> Comunicados
                     </span>
                     {selectedDayNotices.map((notice, idx) => (
                       <div
                         key={idx}
                         onClick={() => handleNoticeClick(notice)}
                         className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:bg-yellow-500/10 hover:border-yellow-500/20 transition-all cursor-pointer active:scale-[0.98]"
                       >
                         <div className="flex items-center justify-between gap-2 mb-0.5">
                           <h5 className="text-[11px] font-black text-white uppercase tracking-tight truncate">
                             {notice.title}
                           </h5>
                           {/* Data: início → fim */}
                           <span className="text-[8px] font-bold text-yellow-600/60 uppercase tracking-widest shrink-0">
                             {notice.startDate && `${notice.startDate.split('-').reverse().join('/')}${notice.endDate && notice.endDate !== notice.startDate ? ` → ${notice.endDate.split('-').reverse().join('/')}` : ''}`}
                           </span>
                         </div>
                         {/* Resumo do conteúdo */}
                         <p className="text-[9px] text-gray-500 font-medium line-clamp-1">
                           {notice.description?.replace(/<[^>]*>?/gm, ' ') || notice.content || ''}
                         </p>
                       </div>
                     ))}
                   </div>
                 )}
                 {/* Decoração de fundo */}
                 <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              </div>
              )}
            </section>

           {/* Histórico de Presença */}
          <section className="glass-card rounded-[32px] p-6 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-white tracking-wide">Histórico de Presença</h2>
                <p className="text-xs text-gray-500 mt-0.5 tracking-tighter">Calendário de frequência</p>
              </div>
            </div>

            {/* Calendário Mensal */}
            {loadingAttendance ? (
              <div className="h-[300px] bg-white/5 rounded-2xl animate-pulse" />
            ) : (
              <>
                {/* Navegação */}
                <div className="flex items-center justify-between mb-4 bg-white/5 rounded-2xl p-2.5 border border-white/5">
                  <button onClick={() => setViewDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-base font-bold text-white">
                    {MONTHS_FULL[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </span>
                  <button onClick={() => setViewDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Dias da Semana */}
                <div className="grid grid-cols-7 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-center text-[11px] font-bold text-gray-600 uppercase py-1.5">{d}</div>
                  ))}
                </div>

                {/* Células */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarGrid.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="sm:h-16" />

                    const hoje = new Date()
                    const registrosDia = monthPresentMap[day] || []
                    const ehHoje = viewDate.getFullYear() === hoje.getFullYear() &&
                      viewDate.getMonth() === hoje.getMonth() &&
                      day === hoje.getDate()

                    const temPresenca = registrosDia.some(r => r.status === 'present')
                    const temJustificado = registrosDia.some(r => r.status === 'justified')
                    const temFalta = registrosDia.some(r => r.status === 'absent')

                    let estiloCelula = 'text-gray-500 bg-white/[0.04] hover:bg-white/10 border border-transparent'

                    if (temPresenca) {
                      estiloCelula = 'bg-[#10b981]/15 text-[#10b981] border-2 border-[#10b981] shadow-[inset_0_0_12px_rgba(16,185,129,0.5)]'
                    } else if (temJustificado) {
                      estiloCelula = 'bg-[#3b82f6]/15 text-[#3b82f6] border-2 border-[#3b82f6] shadow-[inset_0_0_12px_rgba(59,130,246,0.5)]'
                    } else if (temFalta) {
                      estiloCelula = 'bg-[#ef4444]/15 text-[#ef4444] border-2 border-[#ef4444] shadow-[inset_0_0_12px_rgba(239,68,68,0.4)]'
                    } else if (ehHoje) {
                      estiloCelula = 'bg-white/5 text-white font-black border-2 border-primary/60'
                    }

                    return (
                      <div key={day}
                        onClick={() => {
                          if (registrosDia.length > 0) {
                            setSelectedDayInfo(selectedDayInfo?.day === day ? null : { day, details: registrosDia })
                          }
                        }}
                        className={`max-sm:aspect-square sm:h-16 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all cursor-pointer ${estiloCelula}`}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>

                {/* Detalhes do Dia */}
                {selectedDayInfo && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">Dia {selectedDayInfo.day}</span>
                      <button onClick={() => setSelectedDayInfo(null)} className="text-primary/60 hover:text-primary"><X size={14} /></button>
                    </div>
                    <div className="space-y-2">
                      {selectedDayInfo.details.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium">{d.modality}</span>
                          <span className={`font-bold px-3 py-1 rounded-lg text-[11px] uppercase ${d.status === 'present' ? 'bg-[#10b981]/20 text-[#10b981]' : d.status === 'absent' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'}`}>
                            {d.status === 'present' ? 'Presente' : d.status === 'absent' ? 'Falta' : 'Justificado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </>
            )}
          </section>

          {/* Consistência Mensal */}
          <section className="glass-card rounded-[24px] p-4 md:p-5 border border-white/10 relative overflow-hidden">
            <h2 className="text-base font-black text-white tracking-wide mb-4">Consistência Mensal</h2>
            
            <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={monthlyData} barSize={8}>
                  <XAxis dataKey="label" tick={{ fill: '#4b5563', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" fill="var(--clr-primary)" radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fill: '#6b7280', fontSize: 8, formatter: v => v || '' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:col-span-4 space-y-8">
          
           {/* Calendário Semanal (DESKTOP) */}
           <section className="glass-card rounded-[32px] p-6 border border-white/10 relative overflow-hidden hidden lg:flex flex-col">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-black text-white tracking-wide">Agenda Semanal</h2>
               <div className="flex items-center gap-1">
                 <button onClick={() => setWeekOffset(p => p - 1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                   <ChevronLeft size={16} className="text-gray-400" />
                 </button>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] text-center">
                   {weeklyCalendarDays[0].toLocaleDateString('pt-BR', { month: 'short' })} {weeklyCalendarDays[0].getFullYear()}
                 </span>
                 <button onClick={() => setWeekOffset(p => p + 1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                   <ChevronRight size={16} className="text-gray-400" />
                 </button>
               </div>
             </div>

             <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar snap-x sm:justify-between sm:overflow-visible">
                {weeklyCalendarDays.map((date, i) => {
                  const isSelected = date.getTime() === selectedDate.getTime()
                  const dayOfWeek = date.getDay()
                  const hasClass = scheduledDays.includes(dayOfWeek)
                  const hasNotice = noticeDays.has(dayOfWeek)

                  return (
                    <div key={i}
                         onClick={() => setSelectedDate(date)}
                         className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl cursor-pointer transition-all flex-[0_0_auto] min-w-[64px] sm:flex-1 sm:min-w-0 snap-center
                           ${isSelected
                              ? 'bg-primary border-transparent shadow-[0_0_20px_rgba(var(--clr-primary-rgb),0.3)] scale-[1.05]'
                              : 'bg-white/5 hover:bg-white/10 border border-white/5'
                           }
                         `}
                    >
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>
                        {DAYS_FULL[dayOfWeek].substring(0,3)}
                      </span>
                      <span className={`text-sm sm:text-lg font-black ${isSelected ? 'text-black' : 'text-white'}`}>
                        {date.getDate()}
                      </span>
                      {/* Indicadores: bolinha verde de aula + sino amarelo de comunicado */}
                      <div className="mt-1.5 h-4 flex items-center justify-center gap-1 w-full">
                         {hasClass && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black/40' : 'bg-primary'}`} />}
                         {hasNotice && <Bell size={9} className={isSelected ? 'text-black/60' : 'text-yellow-500/70'} fill="currentColor" fillOpacity={0.3} />}
                      </div>
                    </div>
                  )
                })}
             </div>

              {/* Card do Dia Selecionado — só aparece quando tem aula ou comunicado */}
              {(scheduledDays.includes(selectedDate.getDay()) || selectedDayNotices.length > 0) && (
              <div className="mt-6 p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                 {scheduledDays.includes(selectedDate.getDay()) && (
                    <div className="flex items-center justify-between relative z-10">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--clr-primary)]" />
                           <span className="text-xs font-bold text-white uppercase tracking-wider">
                             {selectedDayClasses.length > 1 ? `${selectedDayClasses.length} Treinos Agendados` : 'Treino Agendado'}
                           </span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                           {selectedDayClasses.map((cls, idx) => (
                             <p key={idx} className="text-[10px] text-gray-400 font-medium">
                               {cls.modalityName} • {cls.horarioInicio || '?'} - {cls.horarioFim || '?'}
                             </p>
                           ))}
                         </div>
                       </div>
                       <button
                         onClick={() => {
                           if ('Notification' in window) {
                             Notification.requestPermission().then(perm => {
                               if (perm === 'granted') {
                                 new Notification('RS Top Team', {
                                   body: 'Notificações de aula ativadas! (Simulação)',
                                   icon: '/vite.svg'
                                 })
                               }
                             })
                           }
                         }}
                         className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-[10px] font-bold hover:bg-primary/30 transition-colors flex items-center gap-1.5 active:scale-95">
                         <Bell size={12} />
                         Lembrar
                       </button>
                    </div>
                 )}
                 {selectedDayNotices.length > 0 && (
                   <div className={scheduledDays.includes(selectedDate.getDay()) ? 'mt-4 pt-4 border-t border-white/5 relative z-10 space-y-2' : 'relative z-10 space-y-2'}>
                     <span className="text-[9px] font-black text-yellow-500/80 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                       <Bell size={11} /> Comunicados
                     </span>
                     {selectedDayNotices.map((notice, idx) => (
                       <div
                         key={idx}
                         onClick={() => handleNoticeClick(notice)}
                         className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:bg-yellow-500/10 hover:border-yellow-500/20 transition-all cursor-pointer active:scale-[0.98]"
                       >
                         <div className="flex items-center justify-between gap-2 mb-0.5">
                           <h5 className="text-[11px] font-black text-white uppercase tracking-tight truncate">
                             {notice.title}
                           </h5>
                           {/* Data: início → fim */}
                           <span className="text-[8px] font-bold text-yellow-600/60 uppercase tracking-widest shrink-0">
                             {notice.startDate && `${notice.startDate.split('-').reverse().join('/')}${notice.endDate && notice.endDate !== notice.startDate ? ` → ${notice.endDate.split('-').reverse().join('/')}` : ''}`}
                           </span>
                         </div>
                         {/* Resumo do conteúdo */}
                         <p className="text-[9px] text-gray-500 font-medium line-clamp-1">
                           {notice.description?.replace(/<[^>]*>?/gm, ' ') || notice.content || ''}
                         </p>
                       </div>
                     ))}
                   </div>
                 )}
                 {/* Decoração de fundo */}
                 <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              </div>
              )}
            </section>

           {/* Conquistas */}
          <section className={`glass-card p-8 bg-surface-app/30 border border-white/5 ${RADIUS_MAIN}`}>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
              <Star size={20} className="text-yellow-500 fill-yellow-500/20" />
              Conquistas
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {realAchievements.length > 0 ? realAchievements.map((ach, idx) => (
                <div key={idx} className={`p-4 rounded-[22px] border flex items-center gap-4 transition-all duration-300 ${ach.active ? 'bg-white/5 border-white/10 scale-[1.02]' : 'bg-white/[0.02] border-white/[0.03] opacity-50'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ach.active ? 'bg-primary shadow-lg shadow-primary/20 text-white' : 'bg-white/5 text-gray-600'}`}>
                    <ach.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{ach.label}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter truncate">{ach.desc}</p>
                  </div>
                  {ach.active && <Check size={16} className="text-primary" />}
                </div>
              )) : (
                <div className="py-8 text-center">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Carregando Conquistas...</p>
                </div>
              )}
            </div>
          </section>

          {/* Grade de Horários */}
          <section className={`glass-card p-8 bg-surface-app/30 border border-white/5 ${RADIUS_MAIN}`}>
             <div className="flex items-center gap-3 mb-1">
                <Clock size={16} className="text-primary" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Minha Grade</h4>
             </div>
             <p className="text-[10px] font-medium text-gray-500 mb-5">Hoje • {todayDayName}</p>

             <div className="space-y-2">
                {loadingSessions ? (
                   [1, 2, 3].map(i => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)
                ) : todayClasses.length > 0 ? (
                  todayClasses.map((cls, i) => {
                    const isNext = i === nextClassIndex
                    return (
                      <div key={i} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isNext
                          ? 'bg-primary/[0.08] border-primary/30 ring-1 ring-primary/20'
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-[13px] font-black tabular-nums shrink-0 ${isNext ? 'text-primary' : 'text-white'}`}>
                            {cls.horarioInicio}
                          </span>
                          <span className={`text-[11px] font-bold uppercase tracking-tight truncate ${isNext ? 'text-white' : 'text-gray-300'}`}>
                            {cls.modalityName}
                          </span>
                        </div>
                        {isNext && (
                          <span className="text-[8px] font-black text-primary bg-primary/20 px-2.5 py-1 rounded-full uppercase tracking-widest whitespace-nowrap shrink-0 ml-2">
                            Próxima aula
                          </span>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="py-6 text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar size={14} className="text-gray-600" />
                      <p className="text-[11px] font-bold text-gray-500">Hoje não há aulas</p>
                    </div>
                    {nextFutureClass && (
                      <p className="text-[10px] text-gray-600 font-medium">
                        Próxima aula: {nextFutureClass.dayName} • {nextFutureClass.horarioInicio} • {nextFutureClass.modalityName}
                      </p>
                    )}
                  </div>
                )}
             </div>

             {recurrenceLabel && todayClasses.length > 0 && (
               <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-5">
                 Aulas recorrentes: {recurrenceLabel}
               </p>
             )}

             {/* Futuro: aba separada de agenda */}
             <button
               disabled
               className="w-full mt-4 p-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold text-gray-600 uppercase tracking-widest opacity-50 cursor-not-allowed"
             >
               Ver agenda
             </button>
          </section>

        </div>
      </div>
    </div>
    </>
  )
}
