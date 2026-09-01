import React, { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Clock, X, Award, User as UserIcon, CalendarDays } from 'lucide-react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { COLLECTIONS } from '../../firebase/collections'
import { beltConfig } from '../../data/beltConfig'
import { formatBR } from '../../utils/dateUtils'

// ── Helpers ─────────────────────────────────────────────────────
const STATUS_MAP = {
  present:  { label: 'Presente',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  absent:   { label: 'Ausente',   color: 'text-red-400',     bg: 'bg-red-500/10',     dot: 'bg-red-400'    },
  justified:{ label: 'Justificado', color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
}

const DEFAULT_STATUS = { label: 'Registrado', color: 'text-gray-400', bg: 'bg-white/5', dot: 'bg-gray-400' }

// ── Tab Config ──────────────────────────────────────────────────
const TABS = [
  { id: 'presenca',  label: 'Histórico de Presença',   icon: CalendarDays },
  { id: 'graduacao', label: 'Histórico de Graduação',  icon: Award },
]

// ── Component ──────────────────────────────────────────────────
export default function HistoryDrawer({ userId, userName, userBelt, isOpen, onClose }) {
  useHideMobileNav(isOpen)

  const [activeTab, setActiveTab] = useState('presenca')
  const [presencaData, setPresencaData] = useState([])
  const [graduacaoData, setGraduacaoData] = useState([])
  const [loading, setLoading] = useState({ presenca: true, graduacao: true })

  // ── Load Attendance ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !userId) return
    ;(async () => {
      setLoading(prev => ({ ...prev, presenca: true }))
      try {
        const q = query(
          collection(db, COLLECTIONS.PRESENCAS_LOG),
          where('studentId', '==', userId)
        )
        const snap = await getDocs(q)
        const list = snap.docs.map(d => {
          const data = d.data()

          // Parse date (same pattern as AttendanceHistoryDrawer)
          let parsedDate
          const rawDate = data.data || data.date
          if (rawDate && typeof rawDate === 'string' && rawDate.includes('-')) {
            const parts = rawDate.split('-')
            if (parts.length === 3) {
              parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
            }
          } else if (rawDate?.toDate) {
            parsedDate = rawDate.toDate()
          }
          if (!parsedDate || isNaN(parsedDate)) {
            const ts = data.timestamp
            if (ts?.toDate) parsedDate = ts.toDate()
          }

          return {
            id: d.id,
            date: parsedDate || new Date(0),
            modality: data.modalidade || data.modality || 'Jiu Jitsu',
            status: data.status || 'present',
          }
        })
          .filter(r => r.date && !isNaN(r.date))
          .sort((a, b) => b.date.getTime() - a.date.getTime()) // mais recente primeiro

        setPresencaData(list)
      } catch (err) {
        console.error('Erro ao carregar presenças:', err)
      } finally {
        setLoading(prev => ({ ...prev, presenca: false }))
      }
    })()
  }, [isOpen, userId])

  // ── Load Graduations ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !userId) return
    ;(async () => {
      setLoading(prev => ({ ...prev, graduacao: true }))
      try {
        const ref = collection(db, 'usuarios', userId, 'graduacoes')
        const snap = await getDocs(ref)
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))

        list.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          if (dateB !== dateA) return dateB - dateA
          const creatA = a.createdAt?.seconds || 0
          const creatB = b.createdAt?.seconds || 0
          return creatB - creatA
        })

        setGraduacaoData(list)
      } catch (err) {
        console.error('Erro ao carregar graduações:', err)
      } finally {
        setLoading(prev => ({ ...prev, graduacao: false }))
      }
    })()
  }, [isOpen, userId])

  // ── Render: Attendance Tab ──────────────────────────────────
  const renderPresenca = () => (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {loading.presenca ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : presencaData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <CalendarDays size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-bold text-gray-400">Nenhum registro de presença encontrado.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {presencaData.map(rec => {
            const st = STATUS_MAP[rec.status] || DEFAULT_STATUS
            return (
              <div
                key={rec.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                  <div>
                    <p className="text-sm font-bold text-white">{rec.modality}</p>
                    <p className={`text-[10px] font-bold uppercase mt-0.5 ${st.color}`}>{st.label}</p>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 font-bold tracking-widest bg-black/40 px-3 py-1 rounded-md border border-white/5 shrink-0">
                  {formatBR(rec.date, {}, true)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Render: Graduation Tab ──────────────────────────────────
  const renderGraduacao = () => (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {loading.graduacao ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : graduacaoData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Award size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-bold text-gray-400">Nenhum histórico de graduação encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {graduacaoData.map((rec, idx) => {
            const beltInfo = beltConfig[rec.belt] || beltConfig['white']
            const beltLabel = rec.beltLabel || beltInfo?.label || rec.belt

            return (
              <div
                key={rec.id || idx}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: beltInfo?.color || '#888' }}
                  />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {beltLabel}{rec.stripes ? ` - ${rec.stripes}º Grau` : ''}
                    </p>
                    {rec.professor && (
                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5 flex items-center gap-1">
                        <UserIcon size={10} /> {rec.professor}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 font-bold tracking-widest bg-black/40 px-3 py-1 rounded-md border border-white/5 shrink-0">
                  {rec.date ? formatBR(rec.date, {}, true) : '—'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Render: Tabs ────────────────────────────────────────────
  const renderTabs = () => (
    <div className="flex bg-white/5 p-1 rounded-xl mx-6 mt-4 mb-2 shrink-0">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === tab.id
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>
  )

  if (!isOpen) return null

  return createPortal(
    <motion.div
      key="history-drawer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        // Mobile: bottom sheet; Desktop: right-side drawer
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.5 }}
        onClick={e => e.stopPropagation()}
        className="fixed z-[9991] bg-[#0A0A0A] border border-white/10 shadow-2xl flex flex-col overflow-hidden
                   inset-x-0 bottom-0 h-[93vh] rounded-t-[32px]
                   sm:inset-y-4 sm:right-4 sm:left-auto sm:h-auto sm:max-w-lg sm:w-full sm:rounded-[24px] sm:bottom-auto sm:top-4"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-4 pb-2 shrink-0 sm:hidden">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">Histórico</h2>
              {userName && (
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{userName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        {activeTab === 'presenca' ? renderPresenca() : renderGraduacao()}

        {/* Footer with count */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.01] shrink-0">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            {activeTab === 'presenca'
              ? `${presencaData.length} registro${presencaData.length !== 1 ? 's' : ''}`
              : `${graduacaoData.length} registro${graduacaoData.length !== 1 ? 's' : ''}`
            }
          </span>
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
