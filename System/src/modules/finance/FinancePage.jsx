import React, { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, Filter,
  Download, Plus, Search, Trash2, X,
  Zap, MoreVertical, BarChart3, Receipt,
  Calendar, FileText, ArrowUpCircle, ArrowDownCircle,
  ChevronDown, Tag, Building, Loader2, RefreshCcw
} from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import { useStudents } from '../../hooks/useStudents'
import { useFinance } from '../../hooks/useFinance'
import { useModalities } from '../../hooks/useModalities'
import { useAuth } from '../../context/AuthContext'
import KPICard from '../../components/shared/KPICard'
import MobileHeader from '../../components/navigation/MobileHeader'
import PaymentReportModal from '../../components/shared/PaymentReportModal'

// ─── Helpers Locais ───────────────────────────────────────────────────────────

const formatBRL = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

const formatDate = (str) => {
  if (!str) return '--'
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('pt-BR')
}

const statusStyle = {
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-rose-500/10   text-rose-400   border-rose-500/20',
  overdue: 'bg-rose-500/10   text-rose-400   border-rose-500/20',
}
const statusLabel = { paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado' }

const CATEGORIAS_DESPESA = [
  'Aluguel', 'Energia', 'Internet', 'Material', 'Equipamento',
  'Marketing', 'Salários', 'Manutenção', 'Impostos', 'Outros'
]

// ─── Modal: Nova Despesa ───────────────────────────────────────────────────────

function ModalNovaDespesa({ onClose, onSave, loading }) {
  const [form, setForm] = useState({
    description: '',
    category: 'Aluguel',
    amount: '',
    dueDate: '',
    status: 'pending'
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.description || !form.amount || !form.dueDate) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Nova Despesa</h3>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Lançamento de custo operacional</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Descrição</label>
            <input
              required
              type="text"
              placeholder="Ex: Aluguel do mês de Maio"
              className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 transition-all placeholder-gray-600"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Categoria + Status (2 colunas) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoria</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 transition-all pr-8"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                >
                  {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status Inicial</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 transition-all pr-8"
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Valor + Vencimento (2 colunas) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valor (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 transition-all placeholder-gray-600 font-mono"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vencimento</label>
              <input
                required
                type="date"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25 transition-all [color-scheme:dark]"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-black uppercase tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-900/30">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? 'Salvando...' : 'Lançar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Aba: Despesas ─────────────────────────────────────────────────────────────

function TabDespesas({ expenses, loadingExpenses, addExpense, updateExpense, deleteExpense }) {
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return expenses.filter(d => {
      const matchS = d.description?.toLowerCase().includes(search.toLowerCase()) || d.category?.toLowerCase().includes(search.toLowerCase())
      const matchC = catFilter === 'all' || d.category === catFilter
      const matchSt = statusFilter === 'all' || d.status === statusFilter
      return matchS && matchC && matchSt
    })
  }, [expenses, search, catFilter, statusFilter])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      await addExpense({
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        status: form.status
      })
      setShowModal(false)
    } catch (err) {
      console.error('Erro ao salvar despesa:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async (id) => {
    await updateExpense(id, { status: 'paid' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta despesa?')) return
    await deleteExpense(id)
  }

  const totalPago = expenses.filter(d => d.status === 'paid').reduce((s, d) => s + (Number(d.amount) || 0), 0)
  const totalPendente = expenses.filter(d => d.status === 'pending').reduce((s, d) => s + (Number(d.amount) || 0), 0)

  return (
    <>
      {showModal && (
        <ModalNovaDespesa onClose={() => setShowModal(false)} onSave={handleSave} loading={saving} />
      )}

      <div className="p-6 space-y-6">
        {/* KPIs de Despesas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/15 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Pago (Saídas)</p>
              <p className="text-lg font-black text-rose-400 font-mono">{formatBRL(totalPago)}</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/15 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">A Pagar (Pendente)</p>
              <p className="text-lg font-black text-amber-400 font-mono">{formatBRL(totalPendente)}</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-gray-400 shrink-0">
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total de Lançamentos</p>
              <p className="text-lg font-black text-white">{expenses.length}</p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros + Botão */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex flex-1 gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Buscar despesa..."
                className="bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition-all w-52"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none outline-none"
              value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">Todas as categorias</option>
              {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none outline-none"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Todos os status</option>
              <option value="paid">Pagos</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-rose-900/20 shrink-0">
            <Plus size={15} /> Nova Despesa
          </button>
        </div>

        {/* Tabela */}
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <th className="px-5 py-4">Descrição / Categoria</th>
                  <th className="px-5 py-4 text-center hidden sm:table-cell">Vencimento</th>
                  <th className="px-5 py-4 text-right">Valor</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingExpenses ? (
                  <tr><td colSpan="5" className="py-16 text-center text-gray-500 text-sm">Carregando despesas...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <ArrowDownCircle size={36} className="mx-auto text-gray-700 mb-3 opacity-40" />
                      <p className="text-gray-500 text-sm">Nenhuma despesa encontrada</p>
                      <p className="text-[11px] text-gray-600 mt-1">Clique em "Nova Despesa" para lançar um custo</p>
                    </td>
                  </tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.025] transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">{d.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Tag size={10} className="text-gray-600" />
                        <span className="text-[10px] text-gray-500 font-medium">{d.category || 'Sem categoria'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center hidden sm:table-cell font-mono text-xs text-gray-400">
                      {formatDate(d.dueDate)}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-sm text-white font-mono">
                      {formatBRL(d.amount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${statusStyle[d.status] || statusStyle.pending}`}>
                        {statusLabel[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {d.status !== 'paid' && (
                          <button onClick={() => handleMarkPaid(d.id)}
                            title="Marcar como pago"
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(d.id)}
                          title="Excluir"
                          className="p-2 rounded-xl bg-red-500/8 text-red-400 hover:bg-red-500/15 transition-all border border-red-500/10">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Aba: Relatórios ──────────────────────────────────────────────────────────

function TabRelatorios({ bills, expenses, students }) {
  const relatorio = useMemo(() => {
    const receitaTotal = bills.filter(b => b.status === 'paid').reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const receitaPendente = bills.filter(b => b.status === 'pending').reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const receitaVencida = bills.filter(b => b.status === 'overdue').reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const despesaTotal = expenses.filter(d => d.status === 'paid').reduce((s, d) => s + (Number(d.amount) || 0), 0)
    const despesaPendente = expenses.filter(d => d.status === 'pending').reduce((s, d) => s + (Number(d.amount) || 0), 0)
    const saldo = receitaTotal - despesaTotal
    const totalAlunos = students.filter(s => s.roles?.aluno === true).length
    const alunosAtivos = students.filter(s => s.status === 'Ativo' && s.roles?.aluno === true).length
    const alunosIsentos = students.filter(s => s.isPaymentExempt && s.roles?.aluno === true).length
    const inadimplentes = [...new Set(bills.filter(b => b.status === 'overdue').map(b => b.studentId))].length
    const taxaInadimplencia = alunosAtivos > 0 ? ((inadimplentes / alunosAtivos) * 100).toFixed(1) : '0.0'
    return {
      receitaTotal, receitaPendente, receitaVencida,
      despesaTotal, despesaPendente,
      saldo, totalAlunos, alunosAtivos, alunosIsentos,
      inadimplentes, taxaInadimplencia
    }
  }, [bills, expenses, students])

  const SectionTitle = ({ children }) => (
    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3 mb-4">
      {children}
      <div className="h-px flex-1 bg-white/5" />
    </h4>
  )

  const StatRow = ({ label, value, valueClass = 'text-white', note }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <span className="text-sm text-gray-300">{label}</span>
        {note && <p className="text-[10px] text-gray-600 mt-0.5">{note}</p>}
      </div>
      <span className={`text-sm font-black font-mono ${valueClass}`}>{value}</span>
    </div>
  )

  return (
    <div className="p-6 space-y-8">

      {/* Resumo Operacional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${relatorio.saldo >= 0 ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-rose-500/20 bg-rose-500/[0.03]'}`}>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Saldo Realizado</p>
          <p className={`text-2xl font-black font-mono ${relatorio.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatBRL(relatorio.saldo)}
          </p>
          <p className="text-[10px] text-gray-600">Receitas pagas − Despesas pagas</p>
        </div>
        <div className="p-5 rounded-2xl border border-white/8 bg-white/[0.02] flex flex-col gap-1">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Alunos Ativos</p>
          <p className="text-2xl font-black text-white">{relatorio.alunosAtivos}</p>
          <p className="text-[10px] text-gray-600">{relatorio.alunosIsentos} bolsistas / isentos</p>
        </div>
        <div className="p-5 rounded-2xl border border-rose-500/15 bg-rose-500/[0.02] flex flex-col gap-1">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Inadimplência</p>
          <p className="text-2xl font-black text-rose-400">{relatorio.taxaInadimplencia}%</p>
          <p className="text-[10px] text-gray-600">{relatorio.inadimplentes} aluno(s) em atraso</p>
        </div>
        <div className="p-5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.02] flex flex-col gap-1">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">A Receber + A Pagar</p>
          <p className="text-2xl font-black text-amber-400 font-mono">{formatBRL(relatorio.receitaPendente - relatorio.despesaPendente)}</p>
          <p className="text-[10px] text-gray-600">Projeção líquida pendente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demonstrativo de Receitas */}
        <div className="glass-card rounded-2xl border border-white/8 p-6">
          <SectionTitle><ArrowUpCircle size={14} className="text-emerald-400" /> Demonstrativo de Receitas</SectionTitle>
          <StatRow label="Mensalidades Pagas" value={formatBRL(relatorio.receitaTotal)} valueClass="text-emerald-400" />
          <StatRow label="Mensalidades Pendentes" value={formatBRL(relatorio.receitaPendente)} valueClass="text-amber-400" note="Dentro do prazo" />
          <StatRow label="Mensalidades Vencidas" value={formatBRL(relatorio.receitaVencida)} valueClass="text-rose-400" note="Inadimplência" />
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Previsto</span>
            <span className="text-sm font-black text-white font-mono">{formatBRL(relatorio.receitaTotal + relatorio.receitaPendente + relatorio.receitaVencida)}</span>
          </div>
        </div>

        {/* Demonstrativo de Despesas */}
        <div className="glass-card rounded-2xl border border-white/8 p-6">
          <SectionTitle><ArrowDownCircle size={14} className="text-rose-400" /> Demonstrativo de Despesas</SectionTitle>
          <StatRow label="Despesas Pagas" value={formatBRL(relatorio.despesaTotal)} valueClass="text-rose-400" />
          <StatRow label="Despesas Pendentes" value={formatBRL(relatorio.despesaPendente)} valueClass="text-amber-400" note="A vencer" />
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total de Saídas</span>
            <span className="text-sm font-black text-white font-mono">{formatBRL(relatorio.despesaTotal + relatorio.despesaPendente)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown por categoria de despesa */}
      {expenses.length > 0 && (() => {
        const porCategoria = expenses.reduce((acc, d) => {
          const cat = d.category || 'Outros'
          acc[cat] = (acc[cat] || 0) + (Number(d.amount) || 0)
          return acc
        }, {})
        const sorted = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])
        const total = sorted.reduce((s, [, v]) => s + v, 0)
        return (
          <div className="glass-card rounded-2xl border border-white/8 p-6">
            <SectionTitle><Tag size={14} className="text-purple-400" /> Despesas por Categoria</SectionTitle>
            <div className="space-y-3">
              {sorted.map(([cat, val]) => {
                const pct = total > 0 ? (val / total) * 100 : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-300">{cat}</span>
                      <span className="text-gray-400 font-mono">{formatBRL(val)} <span className="text-gray-600 text-[10px]">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-purple-600/80 to-rose-500/80 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      <p className="text-[10px] text-gray-600 text-center font-bold uppercase tracking-widest">
        Dados calculados em tempo real · Fonte: Firebase Firestore
      </p>
    </div>
  )
}

// ─── FinancePage Principal ─────────────────────────────────────────────────────

export default function FinancePage() {
  const { effectiveRole } = useAuth()
  const { students } = useStudents()
  const { modalities } = useModalities()
  const {
    bills, loading,
    updateBillStatus, deleteBill,
    totalOverdue, totalPending, totalPaid,
    expenses, loadingExpenses,
    addExpense, updateExpense, deleteExpense,
    gerarCobrancasEmLote
  } = useFinance()

  const location = useLocation()
  const [activeTab, setActiveTab] = useState('cobranças')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(location.state?.status || 'all')
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)

  const handleBatchBilling = async (mesRef, dataVencimento) => {
    setBatchLoading(true)
    try {
      const criadas = await gerarCobrancasEmLote(students, modalities, mesRef, dataVencimento)
      alert(`${criadas} cobranças geradas com sucesso para o mês ${mesRef}!`)
      setShowBatchModal(false)
    } catch (err) {
      console.error('Erro no faturamento em lote:', err)
      alert(`Falha ao gerar cobranças: ${err.message}`)
    } finally {
      setBatchLoading(false)
    }
  }

  useEffect(() => {
    if (location.state?.status) {
      setStatusFilter(location.state.status)
      setActiveTab('cobranças')
    }
  }, [location.state])

  const stats = useMemo(() => ({
    totalRevenue: formatBRL(totalPaid),
    pendingRevenue: formatBRL(totalPending),
    overdueRevenue: formatBRL(totalOverdue),
    alunosAtivos: students.filter(s => s.status === 'Ativo' && s.roles?.aluno === true).length,
  }), [totalPaid, totalPending, totalOverdue, students])

  const filteredBills = useMemo(() => {
    return (bills || []).filter(b => {
      const matchSearch = b.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || b.type?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = statusFilter === 'all' || b.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [bills, searchTerm, statusFilter])

  // ── Tabs Config ─────────────────────────────────────────────────────────
  const TABS = [
    { id: 'cobranças', label: 'Cobranças', icon: CreditCard },
    { id: 'despesas', label: 'Despesas', icon: TrendingDown },
    { id: 'relatórios', label: 'Relatórios', icon: BarChart3 },
  ]

  return (
    <>
      <MobileHeader
        title="Financeiro"
        actions={
          <button className="p-2.5 rounded-[10px] bg-primary text-black active:scale-90 transition-transform shadow-lg shadow-primary/20">
            <Plus size={20} strokeWidth={3} />
          </button>
        }
      />
      <PageHeader
        icon={CreditCard}
        title="CENTRAL FINANCEIRA"
        subtitle="GESTÃO DE RECEITAS, COBRANÇAS E FLUXO DE CAIXA"
      />

      <div className="px-4 md:px-6 py-6 space-y-6 w-full max-w-[1400px] mx-auto">

        {/* KPI Grid — sempre visível */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Receita Realizada" value={stats.totalRevenue} description="Mensalidades pagas" icon={CheckCircle2} valueColor="text-emerald-400" />
          <KPICard title="A Receber" value={stats.pendingRevenue} description="Previsão pendente" icon={Clock} valueColor="text-rose-400" />
          <KPICard title="Inadimplência" value={stats.overdueRevenue} description="Cobranças vencidas" icon={AlertCircle} valueColor="text-rose-400" />
          <KPICard title="Alunos Ativos" value={stats.alunosAtivos} description="Com matrícula ativa" icon={TrendingUp} valueColor="text-blue-400" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-black rounded-2xl border border-white/5 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeTab === tab.id
                ? 'bg-white/10 text-white shadow-inner border border-white/10'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden min-h-[400px]">

          {/* ── Tab: Cobranças (Receitas) ── */}
          {activeTab === 'cobranças' && (
            <>
              <div className="p-5 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:min-w-[280px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder="Buscar aluno ou cobrança..."
                      className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  {effectiveRole !== 'aluno' && effectiveRole !== 'professor' && (
                    <>
                      <button onClick={() => setShowBatchModal(true)}
                        className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <RefreshCcw size={16} strokeWidth={2.5} />
                        <span className="hidden md:inline">OPERAR LOTE</span>
                      </button>
                      <button onClick={() => setShowReportModal(true)}
                        className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <FileText size={16} strokeWidth={2.5} />
                        <span className="hidden md:inline">RELATÓRIO</span>
                      </button>
                    </>
                  )}
                  <select
                    className="bg-black border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-gray-400 outline-none"
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Todos os Status</option>
                    <option value="paid">Pagos</option>
                    <option value="pending">Pendentes</option>
                    <option value="overdue">Atrasados</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-black border-b border-white/5">
                      <th className="px-6 py-4">Aluno / Referência</th>
                      <th className="px-6 py-4 text-center hidden sm:table-cell">Vencimento</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr><td colSpan="5" className="py-16 text-center text-gray-500">Carregando cobranças...</td></tr>
                    ) : filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-16 text-center">
                          <CreditCard size={36} className="mx-auto text-gray-700 mb-3 opacity-40" />
                          <p className="text-gray-500 text-sm">Nenhuma cobrança encontrada</p>
                        </td>
                      </tr>
                    ) : filteredBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{bill.studentName}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Ref: {bill.referenceMonth || 'Mensalidade'}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-gray-400 hidden sm:table-cell">
                          {formatDate(bill.dueDate)}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-sm text-white font-mono">
                          {formatBRL(bill.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${statusStyle[bill.status] || ''}`}>
                            {statusLabel[bill.status] || bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {bill.status !== 'paid' && (
                              <button onClick={() => updateBillStatus(bill.id, 'paid')}
                                title="Marcar como pago"
                                className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                                <DollarSign size={14} />
                              </button>
                            )}
                            <button onClick={() => deleteBill(bill.id)}
                              className="p-2 rounded-xl bg-red-500/8 text-red-400 hover:bg-red-500/15 transition-all border border-red-500/10">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Tab: Despesas ── */}
          {activeTab === 'despesas' && (
            <TabDespesas
              expenses={expenses}
              loadingExpenses={loadingExpenses}
              addExpense={addExpense}
              updateExpense={updateExpense}
              deleteExpense={deleteExpense}
            />
          )}

          {/* ── Tab: Relatórios ── */}
          {activeTab === 'relatórios' && (
            <TabRelatorios bills={bills} expenses={expenses} students={students} />
          )}

        </div>
      </div>

      {/* ── Modais ── */}
      {showBatchModal && (
        <ModalFaturamentoLote 
          onClose={() => setShowBatchModal(false)} 
          onConfirm={handleBatchBilling} 
          loading={batchLoading} 
        />
      )}
      <PaymentReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </>
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
          <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg"
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
                  <span className="w-1 h-1 rounded-full animate-pulse transition-all duration-300"
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
                <Download size={16} /> {loading ? 'Processando...' : 'Gerar Cobranças'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
