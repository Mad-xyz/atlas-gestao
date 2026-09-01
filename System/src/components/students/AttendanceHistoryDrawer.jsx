import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { db } from '../../firebase/config'
import { collectionGroup, query, where, getDocs, orderBy, collection as fsCollection, addDoc, serverTimestamp } from 'firebase/firestore'
import {
  CalendarDays, ChevronLeft, ChevronRight, Award, Activity,
  Trophy, FileDown, Target, MessageSquare, Plus, X, Star
} from 'lucide-react'
import { COLLECTIONS, SUB_COLLECTIONS } from '../../firebase/collections'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { formatBR } from '../../utils/dateUtils'

const DAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DAYS_FULL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']


// ── helpers ────────────────────────────────────────────────────
function buildStreak(sortedDatesAsc) {
  if (!sortedDatesAsc.length) return 0
  let streak = 0, prev = null
  for (let i = sortedDatesAsc.length - 1; i >= 0; i--) {
    const d = sortedDatesAsc[i]
    if (!prev) { streak = 1; prev = d; continue }
    const diff = Math.round((prev - d) / 86400000)
    if (diff <= 7) { streak++; prev = d }
    else break
  }
  return streak
}

function daysBetween(a, b) {
  return Math.round(Math.abs(b - a) / 86400000)
}

// ── Custom Tooltip ────────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111] border border-white/10 rounded-xll px-3 py-2 text-xs">
      <p className="text-gray-400 font-bold">{MONTHS_FULL[label] || label}</p>
      <p className="text-white font-black">{payload[0].value} treinos</p>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────
export default function AttendanceHistoryDrawer({ student, isOpen, onClose }) {
  const [records, setRecords] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [activeTab, setActiveTab] = useState('calendar') // 'calendar' | 'notes'
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [selectedDayInfo, setSelectedDayInfo] = useState(null)

  useHideMobileNav(isOpen)

  // ── Load data ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!student?.id) return
    setLoading(true)
    try {
      // All attendance records for this student (using flat log collection to avoid missing indexes)
      const q = query(
        fsCollection(db, COLLECTIONS.PRESENCAS_LOG),
        where('studentId', '==', student.id)
      )
      const snap = await getDocs(q)
      const recs = snap.docs.map(d => {
        const data = d.data()

        // 🔥 FIX TIMEZONE:
        // 'data' e 'date' = string da data da AULA (ex: "2026-05-22") → fonte primária
        // 'timestamp' = serverTimestamp de quando o registro foi GRAVADO → só fallback
        // new Date("2026-05-22") interpreta como UTC meia-noite → usa construtor local para evitar off-by-one
        let parsedDate
        const rawDate = data.data || data.date // data real da aula (string)
        if (rawDate && typeof rawDate === 'string' && rawDate.includes('-')) {
          const parts = rawDate.split('-')
          if (parts.length === 3) {
            // new Date(year, month-1, day) usa horário LOCAL — evita virar dia anterior
            parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          }
        } else if (rawDate?.toDate) {
          parsedDate = rawDate.toDate()
        }

        // Fallback: usa o timestamp do servidor (menos preciso para exibição de dia)
        if (!parsedDate || isNaN(parsedDate)) {
          const ts = data.timestamp
          if (ts?.toDate) parsedDate = ts.toDate()
        }

        return {
          date: parsedDate || new Date(0),
          modality: data.modalidade || data.modality || 'Jiu Jitsu',
          status: data.status || 'present',
          sessionId: data.sessionId || d.ref.parent.parent?.id || '',
        }
      }).filter(r => r.date && !isNaN(r.date)).sort((a, b) => a.date.getTime() - b.date.getTime())
      setRecords(recs)

      // Professor notes
      const notesSnap = await getDocs(fsCollection(db, COLLECTIONS.ALUNOS, student.id, SUB_COLLECTIONS.ANOTACOES))
      const nts = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setNotes(nts)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }, [student?.id])

  useEffect(() => { if (isOpen) loadData() }, [isOpen, loadData])

  // ── Derived data ─────────────────────────────────────────────
  const presentRecords = useMemo(() => records.filter(r => r.status === 'present'), [records])

  const today = new Date()

  const thisMonthCount = useMemo(() => {
    const now = new Date()
    return presentRecords.filter(r => r.date.getFullYear() === now.getFullYear() && r.date.getMonth() === now.getMonth()).length
  }, [presentRecords])

  const streak = useMemo(() => buildStreak(presentRecords.map(r => r.date)), [presentRecords])

  // Map of day→[records] for current month view
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

  // Detect absence runs > 7 days in the viewed month
  const absenceRanges = useMemo(() => {
    const year = viewDate.getFullYear(), month = viewDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const ranges = []
    let gapStart = null

    for (let d = 1; d <= daysInMonth; d++) {
      const hasPres = !!monthPresentMap[d]
      if (!hasPres) {
        if (!gapStart) gapStart = d
      } else {
        if (gapStart && (d - gapStart) > 7) ranges.push({ start: gapStart, end: d - 1 })
        gapStart = null
      }
    }
    if (gapStart && (daysInMonth - gapStart + 1) > 7) ranges.push({ start: gapStart, end: daysInMonth })
    return ranges
  }, [monthPresentMap, viewDate])

  const isAbsenceDay = useCallback((day) =>
    absenceRanges.some(r => day >= r.start && day <= r.end), [absenceRanges])

  // Cores dinâmicas por modalidade
  const modalityColors = useMemo(() => {
    const baseColors = { 'Jiu Jitsu': 'var(--clr-primary)', 'Boxe': '#f59e0b', 'Muay Thai': '#10b981', 'Crossfit': '#ec4899', 'submission': '#8b5cf6' }
    const palette = ['#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6']
    let i = 0
    records.forEach(r => {
      if (r.modality && !baseColors[r.modality]) {
        baseColors[r.modality] = palette[i % palette.length]
        i++
      }
    })
    return baseColors
  }, [records])

  const uniqueModalities = useMemo(() => {
    return [...new Set(records.map(r => r.modality).filter(Boolean))]
  }, [records])

  // Calendar grid
  const calendarGrid = useMemo(() => {
    const year = viewDate.getFullYear(), month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [viewDate])

  // ... (keeping other memos intact, they are above this block usually)
  // Let's ensure we are replacing the correct lines. I will replace from `// Calendar grid` down to the legend closure.
  const monthlyData = useMemo(() => {
    const counts = {}
    presentRecords.forEach(r => {
      const key = r.date.getMonth()
      counts[key] = (counts[key] || 0) + 1
    })
    return Array.from({ length: 12 }, (_, i) => ({ month: i, label: MONTHS[i], count: counts[i] || 0 }))
  }, [presentRecords])

  // ── Modality pie ─────────────────────────────────────────────
  const modalityData = useMemo(() => {
    const counts = {}
    presentRecords.forEach(r => { counts[r.modality] = (counts[r.modality] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [presentRecords])

  // ── Heatmap: day-of-week vs hour ─────────────────────────────
  const heatmapData = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => ({ morning: 0, afternoon: 0, evening: 0 }))
    presentRecords.forEach(r => {
      const dow = r.date.getDay()
      const h = r.date.getHours()
      if (h < 12) grid[dow].morning++
      else if (h < 17) grid[dow].afternoon++
      else grid[dow].evening++
    })
    return grid
  }, [presentRecords])

  const heatMax = useMemo(() => Math.max(1, ...heatmapData.flatMap(r => [r.morning, r.afternoon, r.evening])), [heatmapData])

  // ── Graduation progress ──────────────────────────────────────
  const PROMO_TARGET = 60
  const progressData = useMemo(() => {
    const sorted = [...presentRecords].sort((a, b) => a.date - b.date)
    return sorted.map((_, i) => ({ x: i + 1, y: i + 1 }))
  }, [presentRecords])

  // ── Ranking ──────────────────────────────────────────────────
  const rankBadge = useMemo(() => {
    const n = thisMonthCount
    if (n >= 20) return { label: 'Top Atleta 🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    if (n >= 14) return { label: 'Assíduo 🥈', color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }
    if (n >= 8) return { label: 'Regular 🥉', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
    if (n >= 4) return { label: 'Iniciante', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
    return null
  }, [thisMonthCount])

  // ── Save note ────────────────────────────────────────────────
  async function handleSaveNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      const doc = await addDoc(fsCollection(db, COLLECTIONS.ALUNOS, student.id, SUB_COLLECTIONS.ANOTACOES), {
        text: noteText.trim(),
        author: 'Professor',
        createdAt: serverTimestamp()
      })
      setNotes(prev => [{ id: doc.id, text: noteText.trim(), author: 'Professor', createdAt: { seconds: Date.now() / 1000 } }, ...prev])
      setNoteText('')
      setShowNoteForm(false)
    } finally { setSavingNote(false) }
  }

  // ── Print ────────────────────────────────────────────────────
  function handlePrint() {
    const w = window.open('', '_blank')
    const rows = [...records].reverse().map(r => {
      const isPresence = r.status === 'present'
      const isAbsence = r.status === 'absent'
      const statusIcon = isPresence ? '✅' : isAbsence ? '❌' : 'ℹ️'
      const statusLabel = isPresence ? 'Presente' : isAbsence ? 'Falta' : 'Justificado'

      return `<tr>
        <td>${formatBR(r.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }, true)}</td>
        <td style="font-weight:bold">${r.modality}</td>
        <td>${statusIcon} ${statusLabel}</td>
      </tr>`
    }).join('')
    w.document.write(`
      <html><head><title>Frequência — ${student.nome || student.name}</title><style>
        body{font-family:sans-serif;padding:32px;color:#111}
        h1{font-size:20px;margin-bottom:4px}p{color:#555;font-size:13px;margin:0 0 24px}
        table{width:100%;border-collapse:collapse}th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
        th{background:#f5f5f5;font-weight:bold}
        .kpis{display:flex;gap:16px;margin-bottom:24px}
        .kpi{background:#f5f5f5;border-radius:12px;padding:14px 20px}
        .kpi b{display:block;font-size:24px}
      </style></head><body>
        <h1>Relatório de Frequência</h1>
        <p>${student.nome || student.name} — Gerado em ${formatBR(new Date(), {}, true)}</p>
        <div class="kpis">
          <div class="kpi"><b>${presentRecords.length}</b>Total de Presenças</div>
          <div class="kpi"><b>${thisMonthCount}</b>Presenças este Mês</div>
          <div class="kpi"><b>${streak}</b>Sequência Ativa (sem)</div>
        </div>
        <table><thead><tr><th>Data</th><th>Modalidade</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </body></html>`)
    w.document.close()
    w.print()
  }

  const tabs = [
    { id: 'calendar', label: 'Calendário' },
    { id: 'notes', label: `Notas${notes.length ? ` (${notes.length})` : ''}` },
  ]

  if (!isOpen) return null

  return createPortal(
    <motion.div
      key="attendance-history-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        drag={window.innerWidth < 640 ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose() }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.5 }}
        onClick={e => e.stopPropagation()}
        className="fixed z-[9991] bg-[#0A0A0A] border border-white/10 shadow-2xl flex flex-col overflow-hidden
                   inset-x-0 bottom-0 h-[95vh] rounded-t-[32px]
                   sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-xl sm:w-full sm:h-[90vh] sm:rounded-[32px]"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">Histórico de Presença</h2>
              {student?.name && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{student.name}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* ── KPIs ─────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Activity, color: 'text-emerald-400', label: 'Este Mês', value: loading ? '—' : thisMonthCount },
              { icon: Award, color: 'text-primary', label: 'Total', value: loading ? '—' : presentRecords.length },
              { icon: Star, color: 'text-yellow-400', label: 'Sequência', value: loading ? '—' : `${streak}s` },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
                <Icon size={18} strokeWidth={1.9} className={`${color} mx-auto mb-1`} />
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Ranking badge + Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {rankBadge && (
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${rankBadge.bg} ${rankBadge.border} ${rankBadge.color}`}>
                  <Trophy size={11} className="inline mr-1" />{rankBadge.label}
                </span>
              )}
              {/* Graduation progress */}
              {presentRecords.length > 0 && (
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Target size={11} className="text-purple-400" />
                  {Math.min(presentRecords.length, PROMO_TARGET)}/{PROMO_TARGET} para Promo
                </span>
              )}
            </div>
            <button onClick={handlePrint} title="Exportar PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <FileDown size={13} /> Exportar
            </button>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────── */}
        <div className="flex border-b border-white/10 shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === t.id ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Carregando...</div>
          ) : (
            <>
              {/* ══ CALENDAR TAB ══ */}
              {activeTab === 'calendar' && (
                <>
                {/* Consistência Mensal — movida para cima do calendário */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Consistência Mensal</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={monthlyData} barSize={12}>
                      <XAxis dataKey="label" tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="count" fill="var(--clr-primary)" radius={[5, 5, 0, 0]}
                        label={{ position: 'top', fill: '#6b7280', fontSize: 9, formatter: v => v || '' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-5">
                  <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    {/* Calendar Navigation */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                      <button onClick={() => setViewDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-bold text-white">
                        {MONTHS_FULL[viewDate.getMonth()]} {viewDate.getFullYear()}
                      </span>
                      <button onClick={() => setViewDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="p-4">
                      {/* Day headers */}
                      <div className="grid grid-cols-7 mb-2">
                        {DAYS_FULL.map(d => (
                          <div key={d} className="text-center text-[9px] font-bold text-gray-600 uppercase py-1">{d}</div>
                        ))}
                      </div>

                      {/* Calendar Cells */}
                      <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.map((day, i) => {
                          if (!day) return <div key={`e-${i}`} />

                          const dayRecs = monthPresentMap[day] || []
                          const isToday = viewDate.getFullYear() === today.getFullYear() &&
                            viewDate.getMonth() === today.getMonth() &&
                            day === today.getDate()

                          const hasPresent = dayRecs.some(r => r.status === 'present')
                          const hasJustified = dayRecs.some(r => r.status === 'justified')
                          const hasAbsent = dayRecs.some(r => r.status === 'absent')

                          const details = dayRecs.map(r => {
                            const status = r.status === 'present' ? 'Presente' : r.status === 'absent' ? 'Falta' : 'Justificado'
                            return `${r.modality}: ${status}`
                          }).join(' | ')

                          let cellStyle = 'text-gray-500 bg-white/[0.04] border border-transparent hover:bg-white/10'

                          if (hasPresent) {
                            cellStyle = 'bg-[#10b981]/15 text-[#10b981] border-2 border-[#10b981] shadow-[inset_0_0_12px_rgba(16,185,129,0.5)] cursor-help scale-[1.02]'
                          } else if (hasJustified) {
                            cellStyle = 'bg-[#3b82f6]/15 text-[#3b82f6] border-2 border-[#3b82f6] shadow-[inset_0_0_12px_rgba(59,130,246,0.5)] cursor-help scale-[1.02]'
                          } else if (hasAbsent) {
                            cellStyle = 'bg-[#ef4444]/15 text-[#ef4444] border-2 border-[#ef4444] shadow-[inset_0_0_12px_rgba(239,68,68,0.4)] cursor-help scale-[1.02]'
                          } else if (isToday) {
                            cellStyle = 'bg-white/5 text-white font-black border-2 border-primary/60'
                          }

                          return (
                            <div key={day}
                              title={details}
                              onClick={() => {
                                if (dayRecs.length > 0) {
                                  setSelectedDayInfo(selectedDayInfo?.day === day ? null : { day, details: dayRecs })
                                }
                              }}
                              className={`aspect-square flex items-center justify-center rounded-xl text-[10px] font-bold transition-all relative cursor-pointer ${cellStyle}`}
                            >
                              {day}
                            </div>
                          )
                        })}
                      </div>

                      {/* Selected Day Details Overlay */}
                      {selectedDayInfo && (
                        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Detalhes: Dia {selectedDayInfo.day}</span>
                            <button onClick={() => setSelectedDayInfo(null)} className="text-primary/60 hover:text-primary"><X size={12} /></button>
                          </div>
                          <div className="space-y-1.5">
                            {selectedDayInfo.details.map((d, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="text-white font-medium">{d.modality}</span>
                                <span className={`font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase ${d.status === 'present' ? 'bg-[#10b981]/20 text-[#10b981]' :
                                    d.status === 'absent' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'
                                  }`}>
                                  {d.status === 'present' ? 'Presente' : d.status === 'absent' ? 'Falta' : 'Justificado'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Legend Container */}
                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 mt-4 justify-center bg-black p-2.5 rounded-2xl border border-white/5 shadow-inner">
                        <div className="w-full text-center text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1 opacity-50">Legenda de Status</div>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-sm border-2 border-[#10b981] bg-[#10b981]/10" />
                          <span className="text-[10px] text-gray-400">Presença</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-sm border-2 border-[#ef4444] bg-[#ef4444]/10" />
                          <span className="text-[10px] text-gray-400">Falta</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-sm border-2 border-[#3b82f6] bg-[#3b82f6]/10" />
                          <span className="text-[10px] text-gray-400">Justificado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-sm border-2 border-primary/60 bg-white/5" />
                          <span className="text-[10px] text-gray-400">Hoje</span>
                        </div>

                        <div className="w-full h-px bg-white/5 my-1" />
                        <div className="w-full text-center text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1 opacity-50">Modalidades</div>
                        {uniqueModalities.map(m => (
                          <div key={m} className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-sm border-2" style={{ borderColor: modalityColors[m], backgroundColor: `${modalityColors[m]}20` }} />
                            <span className="text-[10px] text-gray-400">{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed History */}
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Histórico Detalhado</h3>
                    {records.length > 0 ? (
                      <div className="space-y-2 pr-1">
                        {[...records].reverse().slice(0, 15).map((r, i) => {
                          const mColor = modalityColors[r.modality] || 'var(--clr-primary)'
                          const isPresent = r.status === 'present'
                          const isJustified = r.status === 'justified'
                          const isAbsent = r.status === 'absent'

                          return (
                            <div key={i} className={`flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2.5 border border-white/5 ${isAbsent ? 'opacity-70' : ''}`}>
                              {isPresent && <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)] bg-[#10b981]" />}
                              {isAbsent && <div className="w-2 h-2 rounded-full shrink-0 border-2 border-[#ef4444] bg-transparent" />}
                              {isJustified && <div className="w-2 h-2 rounded-full shrink-0 bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.3)]" />}
                              <div className="flex-1">
                                <div className={`text-sm font-medium ${isAbsent ? 'text-gray-400 line-through' : 'text-white'}`}>
                                  {formatBR(r.date, { weekday: 'long', day: '2-digit', month: 'long' }, true)}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold uppercase" style={{ color: mColor }}>{r.modality}</span>
                                  <span className="text-[9px] text-gray-500 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded-lg">
                                    {isPresent ? 'Presente' : isAbsent ? 'Falta' : 'Justificado'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-600">
                        <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Nenhum treino registrado ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
                </>
              )}


              {/* ══ NOTES TAB ══ */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Add note */}
                  {!showNoteForm ? (
                    <button onClick={() => setShowNoteForm(true)}
                      className="w-full flex items-center gap-2 justify-center py-3 rounded-xll bg-white/5 border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/8 text-sm font-medium transition-all">
                      <Plus size={16} /> Adicionar Nota do Professor
                    </button>
                  ) : (
                    <div className="bg-white/5 rounded-xll p-4 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white">Nova Nota</h3>
                        <button onClick={() => setShowNoteForm(false)}><X size={14} className="text-gray-500 hover:text-white" /></button>
                      </div>
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Ex: Evoluiu bem na guarda, precisa melhorar o fôlego no sparring..."
                        rows={3}
                        className="form-input bg-black/30 resize-none text-sm w-full"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowNoteForm(false)} className="flex-1 py-2 rounded-xll text-sm text-gray-400 bg-white/5 border border-white/10">Cancelar</button>
                        <button onClick={handleSaveNote} disabled={!noteText.trim() || savingNote}
                          className="flex-1 btn-primary py-2 rounded-xll text-sm font-bold disabled:opacity-50">
                          {savingNote ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notes list */}
                  {notes.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <MessageSquare size={36} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Nenhuma nota registrada.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map(note => {
                        const d = note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000) : null
                        return (
                          <div key={note.id} className="bg-white/5 rounded-xll p-4 border border-white/8">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                {note.author || 'Professor'}
                              </span>
                              {d && <span className="text-[10px] text-gray-600">{formatBR(d, {}, true)}</span>}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{note.text}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

