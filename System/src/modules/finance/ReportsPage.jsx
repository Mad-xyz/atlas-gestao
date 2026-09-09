/**
 * ReportsPage.jsx
 * Página de Relatórios Financeiros — design padronizado com a aba Alunos.
 * Rota: /reports
 */

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart3, ArrowUpCircle, ArrowDownCircle,
  Wallet, TrendingUp, PieChart as PieChartIcon,
  AlertCircle, Activity, ChevronDown, RefreshCcw,
  Info
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip as ReTooltip } from 'recharts'

import PageHeader from '../../components/shared/PageHeader'
import MobileHeader from '../../components/navigation/MobileHeader'
import KPICard from '../../components/shared/KPICard'
import { useFinance } from '../../hooks/useFinance'
import { useStudents } from '../../hooks/useStudents'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const R$ = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const PIE_COLORS = ['B794F4', 'F687B3', '4FD1C5', 'F6AD55', 'FC8181', '63B3ED', 'A0AEC0']

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="none"
      style={{ filter: `drop-shadow(0 0 12px ${fill}55)` }}
    />
  )
}

function Section({ title, icon: Icon, color = 'text-gray-400', children }) {
  return (
    <div className="bg-[#0B0B0D]/80 backdrop-blur-md rounded-[24px] border border-white/5 overflow-hidden shadow-2xl relative flex flex-col min-h-[120px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.015] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
            <Icon size={16} className={color} />
          </div>
          <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{title}</h4>
        </div>
      </div>
      <div className="p-6 md:p-8 flex flex-col">{children}</div>
    </div>
  )
}

function Row({ label, value, vc = 'text-white', note }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors -mx-4 px-4 rounded-lg">
      <div className="min-w-0">
        <span className="text-sm font-bold text-gray-300 block truncate">{label}</span>
        {note && <p className="text-[10px] text-gray-500 mt-0.5 truncate uppercase tracking-widest">{note}</p>}
      </div>
      <span className={`text-base font-black shrink-0 ml-4 ${vc}`}>{value}</span>
    </div>
  )
}


export default function ReportsPage() {
  const { bills, expenses } = useFinance()
  const { students } = useStudents()
  const [activePieIndex, setActivePieIndex] = useState(-1)

  const d = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const parseDate = (item, preferPaidAt = false) => {
      if (preferPaidAt && item?.paidAt?.seconds) return new Date(item.paidAt.seconds * 1000)
      if (item?.dueDate) return new Date(`${item.dueDate}T00:00:00`)
      if (item?.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000)
      return null
    }
    const inMonth = (date) => !!date && date.getMonth() === currentMonth && date.getFullYear() === currentYear

    const monthBills = bills.filter((b) => inMonth(parseDate(b)))
    const monthBillsPaid = bills.filter((b) => b.status === 'paid' && inMonth(parseDate(b, true)))
    const monthExpenses = expenses.filter((e) => inMonth(parseDate(e)))
    const monthExpensesPaid = expenses.filter((e) => e.status === 'paid' && inMonth(parseDate(e, true)))

    // Receita/despesa realizada = competência de pagamento (paidAt)
    const receitaRealizada = monthBillsPaid.reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const receitaPendente = monthBills.filter(b => b.status === 'pending').reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const receitaVencida = monthBills.filter(b => b.status === 'overdue').reduce((s, b) => s + (Number(b.amount) || 0), 0)
    const despesasPagas = monthExpensesPaid.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const despesasPendentes = monthExpenses.filter(e => e.status === 'pending').reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const lucroLiquido = receitaRealizada - despesasPagas
    const alunosAtivos = students.filter(s => {
      const status = String(s.status || '').toLowerCase()
      const papeis = s.roles || s.papeis || {}
      return (status === 'ativo' || status === 'active') && (papeis.aluno === true || (!papeis.admin && !papeis.gestor && !papeis.professor))
    })
    const inadimplentes = new Set(monthBills.filter(b => b.status === 'overdue').map(b => b.studentId)).size
    const totalReceita = receitaRealizada + receitaPendente + receitaVencida
    const totalDespesa = despesasPagas + despesasPendentes
    const maxBar = Math.max(totalReceita, totalDespesa, 1)

    const porCategoria = monthExpenses.reduce((acc, e) => {
      const cat = e.category || 'Outros'
      acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0)
      return acc
    }, {})
    const totalCat = Object.values(porCategoria).reduce((s, v) => s + v, 0)
    const categoriasRanked = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val]) => ({ cat, val }))

    const margemLucro = receitaRealizada > 0 ? (lucroLiquido / receitaRealizada) * 100 : null
    const custoPorAluno = alunosAtivos.length > 0 ? despesasPagas / alunosAtivos.length : 0

    return {
      receitaRealizada, despesasPagas, lucroLiquido, totalReceita, totalDespesa, maxBar,
      alunosAtivos: alunosAtivos.length,
      taxaInad: (inadimplentes / (alunosAtivos.length || 1)) * 100,
      inadimplentes, categoriasRanked,
      margemLucro,
      custoPorAluno,
    }
  }, [bills, expenses, students])


  const history = useMemo(() => {
    const months = []
    const now = new Date()
    const parseDate = (item, preferPaidAt = false) => {
      if (preferPaidAt && item?.paidAt?.seconds) return new Date(item.paidAt.seconds * 1000)
      if (item?.dueDate) return new Date(`${item.dueDate}T00:00:00`)
      if (item?.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000)
      return null
    }
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      const label = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')
      
      const filterMonth = (item, preferPaidAt = false) => {
        const itemDate = parseDate(item, preferPaidAt)
        return itemDate && itemDate.getMonth() === m && itemDate.getFullYear() === y
      }
      
      const b = bills.filter(filterMonth)
      const e = expenses.filter(filterMonth)
      
      const rev = bills.filter(x => x.status === 'paid' && filterMonth(x, true)).reduce((s, x) => s + (Number(x.amount) || 0), 0)
      const exp = expenses.filter(x => x.status === 'paid' && filterMonth(x, true)).reduce((s, x) => s + (Number(x.amount) || 0), 0)
      
      months.push({ label, rev, exp })
    }
    
    // Cálculo de crescimento médio
    let totalGrowth = 0
    let count = 0
    for (let i = 1; i < months.length; i++) {
      if (months[i-1].rev > 0) {
        totalGrowth += (months[i].rev - months[i-1].rev) / months[i-1].rev
        count++
      }
    }
    const avgGrowth = count > 0 ? (totalGrowth / count) * 100 : 0
    
    return { months, avgGrowth }
  }, [bills, expenses])

  return (
    <>
      <MobileHeader title="Relatórios" />
      <PageHeader icon={BarChart3} title="RELATÓRIOS FINANCEIROS" subtitle="DADOS CONSOLIDADOS · GESTÃO TÉCNICA" />
 
      <div className="px-4 md:px-8 py-6 pb-32 fade-slide-up space-y-8 w-full">
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          <KPICard title="Receita do Mês" value={R$(d.receitaRealizada)} description="Total recebido" icon={ArrowUpCircle} valueColor="text-emerald-400" />
          <KPICard title="Despesas do Mês" value={R$(d.despesasPagas)} description="Saídas confirmadas" icon={ArrowDownCircle} valueColor="text-rose-400" />
          <KPICard title="Lucro Líquido" value={R$(d.lucroLiquido)} description="Receita − Despesas" icon={Wallet} valueColor={d.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'} status={d.lucroLiquido >= 0 ? 'Positivo' : 'Negativo'} />
        </div>
 
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Section title="Eficiência" icon={TrendingUp} color="text-purple-400">
            <div className="space-y-1">
              <Row label="Inadimplência" value={`${d.taxaInad.toFixed(1)}%`} vc="text-rose-400" note={`${d.inadimplentes} em atraso`} />
              <Row label="Custo p/ Aluno" value={R$(d.custoPorAluno)} vc="text-amber-400" note="Média operacional" />
              <Row label="Alunos Ativos" value={d.alunosAtivos} vc="text-blue-400" note="Total na base" />
            </div>
          </Section>
 
          <Section title="Fluxo de Caixa" icon={BarChart3} color="text-blue-400">
            <div className="space-y-6 pt-1">
              <div>
                <div className="flex justify-between text-xs font-black uppercase mb-2"><span className="text-gray-400">Receita Total</span><span className="text-emerald-400 font-black">{R$(d.totalReceita)}</span></div>
                <div className="h-2.5 bg-black rounded-full overflow-hidden border border-white/5"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(d.totalReceita / d.maxBar) * 100}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-black uppercase mb-2"><span className="text-gray-400">Despesa Total</span><span className="text-rose-400 font-black">{R$(d.totalDespesa)}</span></div>
                <div className="h-2.5 bg-black rounded-full overflow-hidden border border-white/5"><div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${(d.totalDespesa / d.maxBar) * 100}%` }} /></div>
              </div>
            </div>
          </Section>
 
          <Section title="Despesas por Categoria" icon={PieChartIcon} color="text-pink-400">
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1 min-h-[160px] relative mt-2 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.categoriasRanked}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={70}
                      paddingAngle={0}
                      dataKey="val"
                      nameKey="cat"
                      stroke="none"
                      strokeWidth={0}
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(-1)}
                      labelLine={false}
                      isAnimationActive={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[12px] font-bold pointer-events-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {d.categoriasRanked.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`#${PIE_COLORS[index % PIE_COLORS.length]}`} />
                      ))}
                    </Pie>
                    <ReTooltip animationDuration={0} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        const percent = (item.value / d.totalDespesa) * 100;
                        return (
                          <div className="bg-[#0A0A0B] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#B794F4] mb-1">{item.name}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-black text-white">{percent.toFixed(1)}%</span>
                              <span className="text-[10px] text-gray-500 font-bold">{R$(item.value)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[100px] overflow-y-auto scrollbar-hidden space-y-2 px-1">
                {d.categoriasRanked.map((item, index) => {
                  const percent = (item.val / d.totalDespesa) * 100;
                  return (
                    <div key={item.cat} className={`flex items-center justify-between transition-all ${activePieIndex === index ? 'opacity-100 translate-x-1' : 'opacity-50 grayscale'}`} onMouseEnter={() => setActivePieIndex(index)}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `#${PIE_COLORS[index % PIE_COLORS.length]}` }} />
                        <span className="text-[10px] font-black text-gray-300 uppercase truncate max-w-[90px]">{item.cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-gray-600 uppercase">{percent.toFixed(0)}%</span>
                        <span className="text-[10px] font-black text-white">{R$(item.val)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>
        </div>
 
        {/* NOVOS GRÁFICOS HISTÓRICOS (Últimos 6 Meses) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Fluxo de Caixa (6 Meses) */}
          <div className="glass-card p-8 border border-white/5 bg-white/[0.01]">
            <h3 className="text-base font-black text-white uppercase tracking-widest mb-8">Fluxo de Caixa (Últimos 6 Meses)</h3>
            <div className="space-y-6">
              {history.months.map((m, idx) => {
                const max = Math.max(...history.months.map(x => Math.max(x.rev, x.exp)), 1)
                const balance = m.rev - m.exp
                return (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="w-20 shrink-0">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{m.label}</span>
                    </div>
                    <div className="w-16 shrink-0 text-left">
                      <p className="text-[11px] font-black text-emerald-400">{R$(m.rev)}</p>
                      <p className="text-[11px] font-black text-rose-400">{R$(m.exp)}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(m.rev/max)*100}%` }} />
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(m.exp/max)*100}%` }} />
                      </div>
                    </div>
                    <div className="w-16 shrink-0 text-right">
                      <span className={`text-[11px] font-black ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{R$(balance)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
 
          {/* Tendência de Receita (6 Meses) */}
          <div className="glass-card p-8 border border-white/5 bg-white/[0.01]">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-base font-black text-white uppercase tracking-widest">Tendência de Receita (Últimos 6 Meses)</h3>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Crescimento Médio</p>
                <p className={`text-2xl font-black ${history.avgGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {history.avgGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {history.months.map((m, idx) => {
                const max = Math.max(...history.months.map(x => x.rev), 1)
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 shrink-0">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{m.label}</span>
                    </div>
                    <div className="w-16 shrink-0 text-left">
                      <p className="text-[11px] font-black text-white">{R$(m.rev)}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(m.rev/max)*100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
 
        </div>
 
        <div className="py-6" />
      </div>
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .fade-slide-up { animation: fadeSlideUp 0.4s ease-out forwards; }
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
        .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}
