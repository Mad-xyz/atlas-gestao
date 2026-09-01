/**
 * BillingPage.jsx
 * Página de Cobrança — design padronizado com a aba Alunos.
 * Rota: /billing
 * Responsabilidade: entradas de dinheiro (mensalidades, vínculos com alunos).
 */

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  CreditCard, Plus, Search, Trash2, X,
  CheckCircle2, Clock, AlertCircle, DollarSign, AlertTriangle,
  ChevronDown, Loader2, Users, RefreshCcw, Save, Edit2, FileText, FileUp
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PaymentReportModal from '../../components/shared/PaymentReportModal'
import PageHeader from '../../components/shared/PageHeader'
import MobileHeader from '../../components/navigation/MobileHeader'
import KPICard from '../../components/shared/KPICard'
import { useFinance } from '../../hooks/useFinance'
import { useStudents } from '../../hooks/useStudents'
import { useModalities } from '../../hooks/useModalities'
import { useAuth } from '../../context/AuthContext'
import { beltConfig } from '../../data/beltConfig'
import { calculateModalityValue } from '../../utils/billingUtils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const R$ = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const dataBR = (str) => {
  if (!str) return '--'
  return new Date(str + 'T12:00:00').toLocaleDateString('pt-BR')
}

const STATUS_STYLE = {
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-rose-500/10   text-rose-400   border-rose-500/20',
  overdue: 'bg-rose-500/10   text-rose-400   border-rose-500/20',
}
const STATUS_LABEL = { paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado' }

const isVencimentoAtrasado = (dueDate) => {
  if (!dueDate) return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const vencimento = new Date(dueDate + 'T12:00:00')
  return vencimento <= hoje
}

/**
 * Extrai o primeiro e segundo nome de um nome completo.
 * Ex: "Julio Silva Santos" retorna "Julio Silva"
 * @param {string} fullName - Nome completo do gestor
 * @returns {string} Primeiro e segundo nome
 */
const getFirstTwoNames = (fullName) => {
  if (!fullName) return ''
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1]}`
}

// ─── CustomSelect — mesmo componente da página Alunos ─────────────────────────

function CustomSelect({ label, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o[0] === value) || options[0]

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-input bg-black input-raise text-sm py-2.5 px-4 text-gray-300 font-medium text-left flex justify-between items-center w-full border border-white/10 rounded-2xl transition-all hover:bg-black/60 focus:ring-1 focus:ring-white/20"
      >
        <span className="truncate">{selectedOption ? selectedOption[1] : '...'}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0d0d0d] border border-white/10 rounded-2xl z-[100] overflow-hidden shadow-2xl py-2"
          style={{ animation: 'fadeSlideUp 0.15s ease-out forwards' }}>
          {options.map(([v, l]) => (
            <button
              key={v}
              onClick={() => { onChange(v); setIsOpen(false) }}
              className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-white/5 ${value === v ? 'text-white bg-white/5 font-black' : 'text-gray-400 font-medium'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MultiSelect — Para filtro de modalidades com suporte a seleção múltipla ───

function MultiSelect({ label, value = [], onChange, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (v) => {
    if (value.includes(v)) {
      onChange(value.filter(item => item !== v))
    } else {
      onChange([...value, v])
    }
  }

  // Conta quantas modalidades estão selecionadas
  const selectedCount = value.length

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-input bg-black input-raise text-sm py-2.5 px-4 text-gray-300 font-medium text-left flex justify-between items-center w-full border border-white/10 rounded-2xl transition-all hover:bg-black/60 focus:ring-1 focus:ring-white/20"
      >
        <span className="truncate">
          {selectedCount === 0 ? 'Todas' : `${selectedCount} selecionada(s)`}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0d0d0d] border border-white/10 rounded-2xl z-[100] overflow-hidden shadow-2xl py-2"
          style={{ animation: 'fadeSlideUp 0.15s ease-out forwards' }}>
          {options.map(([v, l]) => {
            const isSelected = value.includes(v)
            return (
              <button
                key={v}
                onClick={() => toggleOption(v)}
                className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-white/5 flex items-center justify-between ${isSelected ? 'text-white bg-white/5 font-black' : 'text-gray-400 font-medium'}`}
              >
                <span>{l}</span>
                {isSelected && <CheckCircle2 size={16} className="text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ─── Modal de Nova Cobrança ───────────────────────────────────────────────────

function ModalNovaCobranca({ students, onClose, onSave, loading }) {
  const [form, setForm] = useState({ studentId: '', amount: '', dueDate: '', referenceMonth: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.studentId || !form.amount || !form.dueDate) return
    const aluno = students.find(s => s.id === form.studentId)
    onSave({ studentId: form.studentId, studentName: aluno?.name || 'Aluno', amount: Number(form.amount), dueDate: form.dueDate, referenceMonth: form.referenceMonth, status: 'pending' })
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="modal-backdrop z-[200]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            }
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="modal-content modal-content-bottom-sheet relative max-w-md w-full flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden"
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          {/* CABEÇALHO PREMIUM FIXO */}
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--clr-primary) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                }}
              >
                <DollarSign
                  size={28}
                  strokeWidth={2.5}
                  style={{ color: 'var(--clr-primary)' }}
                />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                  Nova Cobrança
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <span
                    className="w-1 h-1 rounded-full animate-pulse transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--clr-primary)',
                      boxShadow: '0 0 10px var(--clr-primary)'
                    }}
                  />
                  Vincule ao aluno e defina o valor
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10 border border-white/5">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* CONTEÚDO COM ROLAGEM */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 space-y-7 custom-scrollbar no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Aluno</label>
                <div className="relative">
                  <select required value={form.studentId} onChange={e => set('studentId', e.target.value)}
                    className="w-full appearance-none bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 pr-8">
                    <option value="">Selecione o aluno...</option>
                    {students.filter(s => !s.isPaymentExempt).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valor (R$)</label>
                  <input required type="number" step="0.01" min="0" placeholder="0,00"
                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 font-mono placeholder-gray-600"
                    value={form.amount} onChange={e => set('amount', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vencimento</label>
                  <input required type="date"
                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 [color-scheme:dark]"
                    value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mês de Referência</label>
                <input type="month"
                  className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 [color-scheme:dark]"
                  value={form.referenceMonth} onChange={e => set('referenceMonth', e.target.value)} />
              </div>
            </div>

            {/* BARRA INFERIOR (BOTÕES FIXOS) */}
            <div className="p-6 md:p-8 bg-[#0d0d0d] border-t border-white/5 flex gap-4 shrink-0">
              <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white hover:text-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--clr-primary)',
                  boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                }}
              >
                <DollarSign size={16} /> {loading ? 'Salvando...' : 'Criar Cobrança'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// ─── Modal: Faturamento em Lote ───────────────────────────────────────────────

function ModalFaturamentoLote({ onClose, onConfirm, loading }) {
  const [referenceMonth, setReferenceMonth] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!referenceMonth || !dueDate) return
    const [y, m] = referenceMonth.split('-')
    onConfirm(`${m}/${y}`, dueDate)
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="modal-backdrop z-[200]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            }
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-[#0d0d0d] w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/10"
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          {/* CABEÇALHO PREMIUM FIXO */}
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--clr-primary) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                }}
              >
                <RefreshCcw
                  size={28}
                  strokeWidth={2.5}
                  className={loading ? 'animate-spin' : ''}
                  style={{ color: 'var(--clr-primary)' }}
                />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                  Faturamento Automático
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <span
                    className="w-1 h-1 rounded-full animate-pulse transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--clr-primary)',
                      boxShadow: '0 0 10px var(--clr-primary)'
                    }}
                  />
                  Cálculo em massa
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10 border border-white/5">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* CONTEÚDO COM ROLAGEM */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 space-y-7 custom-scrollbar no-scrollbar">
              <div className="bg-white/5 rounded-2xl p-4 text-[11px] text-gray-400 font-medium">
                O sistema calculará as mensalidades baseadas nas modalidades de cada aluno ativo.
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mês de Referência</label>
                <input required type="month" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 [color-scheme:dark]"
                  value={referenceMonth} onChange={e => setReferenceMonth(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vencimento das Faturas</label>
                <input required type="date" className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 [color-scheme:dark]"
                  value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            {/* BARRA INFERIOR (BOTÕES FIXOS) */}
            <div className="p-6 md:p-8 bg-[#0d0d0d] border-t border-white/5 flex gap-4 shrink-0">
              <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white hover:text-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--clr-primary)',
                  boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                }}
              >
                <FileUp size={16} /> {loading ? 'Processando...' : 'Gerar Cobranças'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// ─── Modal: Editar Cobrança ───────────────────────────────────────────────────

function ModalEditarCobranca({ bill, onClose, onSave, loading }) {
  const [amount, setAmount] = useState(bill?.amount || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount) return
    onSave({ ...bill, amount: Number(amount) })
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="modal-backdrop z-[200]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            }
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-[#0d0d0d] w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/10"
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          {/* CABEÇALHO PREMIUM FIXO */}
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--clr-primary) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                }}
              >
                <DollarSign size={28} strokeWidth={2.5} style={{ color: 'var(--clr-primary)' }} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                  Ajustar Valor
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <span
                    className="w-1 h-1 rounded-full animate-pulse transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--clr-primary)',
                      boxShadow: '0 0 10px var(--clr-primary)'
                    }}
                  />
                  {bill.studentName}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10 border border-white/5">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* CONTEÚDO COM ROLAGEM */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 space-y-7 custom-scrollbar no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Novo Valor (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 font-mono"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* BARRA INFERIOR (BOTÕES FIXOS) */}
            <div className="p-6 md:p-8 bg-[#0d0d0d] border-t border-white/5 flex gap-4 shrink-0">
              <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white hover:text-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--clr-primary)',
                  boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                }}
              >
                <Save size={16} /> {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function BillingPage() {
  const { bills, loading, updateBillStatus, deleteBill, addBill, updateBill, gerarCobrancasEmLote } = useFinance()
  const { students } = useStudents()
  const { modalities } = useModalities()
  const { userData, effectiveRole } = useAuth()

  const canViewBilling = userData?.permissions?.viewBillingTab ?? userData?.permissions?.viewFinance ?? false
  const canManageBilling = userData?.permissions?.manageBillingTab ?? userData?.permissions?.managePayments ?? false

  const [showModal, setShowModal] = useState(false)
  
  const [showReportModal, setShowReportModal] = useState(false)
  const [editingBill, setEditingBill] = useState(null)

  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [sortOrder, setSortOrder] = useState('recente')
  const [modalityFilter, setModalityFilter] = useState([]) // Modificado para array
  const [paidByFilter, setPaidByFilter] = useState('todos')

  const handleUpdate = async (data) => {
    setSaving(true)
    try {
      await updateBill(data.id, { amount: data.amount })
      setEditingBill(null)
    } catch (err) {
      console.error('Erro ao atualizar cobrança:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (data) => {
    setSaving(true)
    try { await addBill(data); setShowModal(false) }
    catch (err) { console.error('Erro ao criar cobrança:', err) }
    finally { setSaving(false) }
  }

  // KPIs
  const kpis = useMemo(() => {
    const recebido = bills.filter(b => b.status === 'paid').reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const aReceber = bills.filter(b => b.status === 'pending').reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const vencido = bills.filter(b => b.status === 'overdue').reduce((s, b) => s + (Number(b.amount) || 0), 0)

    const countPaid = bills.filter(b => b.status === 'paid').length
    const countPending = bills.filter(b => b.status === 'pending').length
    const countOverdue = bills.filter(b => b.status === 'overdue').length

    const inadimplentes = new Set(bills.filter(b => b.status === 'overdue').map(b => b.studentId)).size
    const totalPagantes = students.filter(s => !s.isPaymentExempt).length

    return {
      recebido, aReceber, vencido, inadimplentes,
      total: bills.length, totalPagantes,
      countPaid, countPending, countOverdue
    }
  }, [bills, students])

  const hasFilters = searchTerm || statusFilter !== 'todos' || modalityFilter !== 'todas' || paidByFilter !== 'todos'

  // Lista única de quem confirmou (paidBy)
  const paidByOptions = useMemo(() => {
    const unique = new Set(bills.filter(b => b.paidBy).map(b => b.paidBy))
    return Array.from(unique).sort()
  }, [bills])

  const filtered = useMemo(() => {
    const result = bills.filter(b => {
      const byName = b.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
      const byStatus = statusFilter === 'todos' || b.status === statusFilter
      
      // Filtro por modalidade do aluno
      const student = students.find(s => s.id === b.studentId)
      
      let rawMods = []
      if (student?.modalidades) {
        rawMods = Array.isArray(student.modalidades) ? student.modalidades : [student.modalidades]
      } else if (student?.modalities) {
        rawMods = Array.isArray(student.modalities) ? student.modalities : [student.modalities]
      } else if (student?.modality) {
        rawMods = [student.modality]
      }

      const studentMods = rawMods.map(m => 
        typeof m === 'object' && m !== null ? (m.name || m.id || m.slug || '') : String(m)
      ).filter(Boolean)

      const normalizedFilters = modalityFilter.map(f => String(f).toLowerCase().trim())
      const byModality = modalityFilter.length === 0 || studentMods.some(mod => 
        mod && normalizedFilters.includes(String(mod).toLowerCase().trim())
      )
      
      // Filtro por quem confirmou
      const byPaidBy = paidByFilter === 'todos' || b.paidBy === paidByFilter
      
      return byName && byStatus && byModality && byPaidBy
    })

    // Ordenação
    result.sort((a, b) => {
      if (sortOrder === 'recente') {
        return (b.dueDate || '').localeCompare(a.dueDate || '')
      } else if (sortOrder === 'antigo') {
        return (a.dueDate || '').localeCompare(b.dueDate || '')
      }
      return 0
    })

    return result
  }, [bills, students, searchTerm, statusFilter, sortOrder, modalityFilter, paidByFilter])

  function renderAvatar(student) {
    if (!student) return (
      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <Users size={18} className="text-gray-600" />
      </div>
    )

    const beltKey = String(student.belt || 'none').toLowerCase()
    const belt = beltConfig[beltKey] || beltConfig.none
    const bgClass = belt.bgClass || 'belt-none'
    const initialsColor = belt.textColor || '#FFFFFF'
    const initials = student.initials || (student.nome || student.name)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A'

    return (
      <div className="flex items-center justify-center p-0.5 shrink-0 relative">
        {student.photo ? (
          <img src={student.photo} alt={student.nome || student.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black ring-1 ring-white/10 ${bgClass} shadow-inner relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-40" />
            <span className="relative z-10 drop-shadow-md" style={{ color: initialsColor }}>{initials}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {showModal && (
        <ModalNovaCobranca students={students} onClose={() => setShowModal(false)} onSave={handleSave} loading={saving} />
      )}

      <PaymentReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} />

      {editingBill && (
        <ModalEditarCobranca bill={editingBill} onClose={() => setEditingBill(null)} onSave={handleUpdate} loading={saving} />
      )}

      <MobileHeader
        title="Cobrança"
      />
      <PageHeader
        icon={CreditCard}
        title="COBRANÇA"
        subtitle="GESTÃO DE MENSALIDADES E RECEBIMENTOS"
      />

      <div className="px-4 md:px-6 py-6 pb-12 fade-slide-up space-y-6">

        {/* KPIs — mesmo grid 2/4 cols da página Alunos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <KPICard
            title="Recebido"
            value={R$(kpis.recebido)}
            description="Mensalidades pagas"
            icon={CheckCircle2}
            valueColor="text-emerald-400"
            onClick={() => setStatusFilter(statusFilter === 'paid' ? 'todos' : 'paid')}
            active={statusFilter === 'paid'}
          />
          <KPICard
            title="A Receber"
            value={R$(kpis.aReceber)}
            description="Dentro do prazo"
            icon={Clock}
            valueColor="text-rose-400"
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'todos' : 'pending')}
            active={statusFilter === 'pending'}
          />
          <KPICard
            title="Inadimplência"
            value={R$(kpis.vencido)}
            description={`${kpis.inadimplentes} aluno(s) em atraso`}
            icon={AlertCircle}
            valueColor="text-rose-400"
            onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'todos' : 'overdue')}
            active={statusFilter === 'overdue'}
          />
          <KPICard
            title="Total Cobranças"
            value={kpis.total}
            description="Lançamentos no sistema"
            icon={Users}
            valueColor="text-blue-400"
          />
        </div>

        {/* Search bar — mesma estrutura da página Alunos */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 relative group">
            <Search size={18} strokeWidth={1.9} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors" />
            <input
              className="w-full bg-[#111] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/10 transition-all font-medium"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            
            <button onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <FileText size={16} strokeWidth={2.5} />
              <span className="hidden md:inline">RELATÓRIO</span>
            </button>
            {canManageBilling && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/30"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span className="hidden md:inline">NOVA COBRANÇA</span>
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('todos'); setModalityFilter([]); setPaidByFilter('todos') }}
              className="flex items-center justify-center gap-2 px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            >
              <RefreshCcw size={18} strokeWidth={1.9} /> Limpar Filtros
            </button>
          )}
        </div>

        {/* Container principal — mesmo estilo da página Alunos */}
        <div className="bg-[#0B0B0D]/80 backdrop-blur-md rounded-[24px] p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Linha decorativa de topo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />

          {/* Filtros — grid igual ao da página Alunos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <CustomSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                ['todos', 'Todos'],
                ['paid', 'Pagos'],
                ['pending', 'Pendentes'],
                ['overdue', 'Atrasados'],
              ]}
            />
            <CustomSelect
              label="Ordenar por"
              value={sortOrder}
              onChange={setSortOrder}
              options={[
                ['recente', 'Mais Recente'],
                ['antigo', 'Mais Antigo'],
              ]}
            />
            <MultiSelect
              label="Modalidade"
              value={modalityFilter}
              onChange={setModalityFilter}
              options={modalities.map(m => [m.name, m.name])}
            />
            <CustomSelect
              label="Confirmado por"
              value={paidByFilter}
              onChange={setPaidByFilter}
              options={[
                ['todos', 'Todos'],
                ...paidByOptions.map(p => [p, p]),
              ]}
            />
            <div className="col-span-2 flex items-end">
              <p className="text-[11px] text-gray-600 font-bold ml-1">
                Exibindo <span className="text-gray-400">{filtered.length}</span> de <span className="text-gray-400">{bills.length}</span> cobranças
              </p>
            </div>
          </div>

          {/* Tabela — cabeçalho e linhas iguais à página Alunos */}
          <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
            {loading ? (
              <div className="text-center py-16 text-gray-500">Carregando cobranças...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <CreditCard size={48} strokeWidth={1.5} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">Nenhuma cobrança encontrada.</p>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-2">
                  Exibindo <span className="text-gray-400">{filtered.length}</span> de <span className="text-gray-400">{bills.length}</span> lançamentos
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-black text-gray-500 tracking-wider bg-white/5">
                    <th className="py-3 px-5">Aluno</th>
                    <th className="py-3 px-5 text-center hidden sm:table-cell">Confirmado por</th>
                    <th className="py-3 px-5 text-center hidden sm:table-cell">Vencimento</th>
                    <th className="py-3 px-5 text-right">Valor</th>
                    <th className="py-3 px-5 text-right hidden sm:table-cell">Próximo Pagamento</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    {canManageBilling && <th className="py-3 px-5 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(b => {
                    const student = students.find(s => s.id === b.studentId)
                    return (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            {renderAvatar(student)}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-app font-medium uppercase tracking-tight group-hover:text-primary transition-colors">
                                  {b.studentName}
                                </span>
                                {student && (!student.modalidades && !student.modalities && !student.modality) && (
                                  <div className="relative group/mod flex items-center justify-center cursor-help">
                                    <div className="flex items-center justify-center text-rose-500 bg-rose-500/10 w-5 h-5 rounded border border-rose-500/20">
                                      <AlertTriangle size={12} strokeWidth={2.5} />
                                    </div>
                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/mod:opacity-100 transition-opacity duration-200 pointer-events-none z-50 flex flex-col items-center">
                                      <div className="bg-[#111] border border-white/10 text-white text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
                                        Sem Modalidade
                                      </div>
                                      <div className="w-1.5 h-1.5 bg-[#111] border-b border-r border-white/10 transform rotate-45 -mt-1"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {student ? (
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                  {beltConfig[student.belt]?.label || 'Sem faixa'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">
                                  Aluno Excluído
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center hidden sm:table-cell">
                          {b.paidBy ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-gray-500 uppercase">Confirmado por</span>
                              <span className="text-xs text-emerald-400 font-medium">{b.paidBy}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center font-mono text-xs text-gray-400 hidden sm:table-cell">
                          {dataBR(b.dueDate)}
                        </td>
                        <td className="py-4 px-5 text-right font-black text-sm text-white font-mono">
                          {R$(b.amount)}
                        </td>
                        <td className="py-4 px-5 text-right hidden sm:table-cell">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-400 font-mono">
                              {student ? R$(calculateModalityValue(student, modalities)) : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border inline-flex ${STATUS_STYLE[b.status] || ''}`}>
                            {STATUS_LABEL[b.status] || b.status}
                          </span>
                        </td>
                        {canManageBilling && (
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {b.status !== 'paid' && (
                                <>
                                  <button onClick={() => updateBillStatus(b.id, 'paid', getFirstTwoNames(userData?.nome))} title="Marcar como pago"
                                    className={`p-2 rounded-xl transition-all border ${
                                      isVencimentoAtrasado(b.dueDate)
                                        ? 'bg-amber-500 text-black hover:bg-amber-400 border-amber-500 animate-pulse'
                                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                                    }`}>
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <button onClick={() => setEditingBill(b)} title="Editar valor"
                                    className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all border border-white/10">
                                    <Edit2 size={14} />
                                  </button>
                                </>
                              )}
                              <button onClick={() => deleteBill(b.id)}
                                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Contador de Rodapé quando há dados */}
          {filtered.length > 0 && (
            <div className="mt-6 flex justify-end">
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
                Exibindo <span className="text-gray-400">{filtered.length}</span> de <span className="text-gray-400">{bills.length}</span> lançamentos
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }`}</style>
    </>
  )
}
