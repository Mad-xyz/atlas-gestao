import React, { useState, useMemo, useEffect, useRef } from 'react'
import { 
  Users, GraduationCap, Search, Filter, 
  Calendar, Clock, AlertCircle, CheckCircle2,
  ChevronRight, RefreshCcw, TrendingUp, MoreVertical,
  Plus, FileDown, History, Info, ChevronDown, Award
} from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import MobileHeader from '../../components/navigation/MobileHeader'
import KPICard from '../../components/shared/KPICard'
import { useStudentJourney } from '../../hooks/useStudentJourney'
import { beltConfig } from '../../data/beltConfig'
import GraduationChangeModal from '../../components/shared/GraduationChangeModal'

// Componentes da Jornada Técnica
import ManagementView from './components/ManagementView'
import HistoryView from './components/HistoryView'
import ConfigurationView from './components/ConfigurationView'

/**
 * Componente interno de Dropdown customizado (Sincronizado com StudentsPage)
 */
function CustomSelect({ label, value, onChange, options, disabled }) {
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
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="form-input bg-black text-sm py-2.5 px-4 text-gray-300 font-medium text-left flex justify-between items-center w-full disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-xl transition-all hover:bg-black/60 focus:ring-1 focus:ring-white/20"
      >
        <span className="truncate">{selectedOption ? selectedOption[1] : '...'}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0d0d0d] border border-white/10 rounded-2xl z-[100] overflow-hidden shadow-2xl py-2 animate-fadeSlideUp">
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

/**
 * Módulo de Jornada Técnica (Evolução de Graduações)
 * Orquestra as abas de Gestão, Histórico e Configurações Automáticas.
 */
export default function JourneyPage() {
  const { all, metrics, loading } = useStudentJourney()
  
  // Estados de Filtro e Navegação
  const [activeTab, setActiveTab] = useState('gestao') // 'gestao' | 'historico' | 'configuracao'
  const [searchTerm, setSearchTerm] = useState('')
  const [beltFilter, setBeltFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recente')
  
  // Estado para Modal e Seleção
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Sincroniza tab com seleção de aluno (se houver histórico)
  const handleViewHistory = (student) => {
    setSelectedStudent(student)
    setActiveTab('historico')
  }

  // Filtros combinados
  const filteredStudents = useMemo(() => {
    let list = all
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      list = list.filter(s => (s.name || '').toLowerCase().includes(lower))
    }
    if (beltFilter !== 'all') list = list.filter(s => s.belt === beltFilter)
    if (statusFilter !== 'all') list = list.filter(s => s.graduation.status === statusFilter)
    
    if (sortBy === 'az') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (sortBy === 'za') list = [...list].sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    return list
  }, [all, searchTerm, beltFilter, statusFilter, sortBy])

  // Funções de Ação Básicas
  const openGraduationModal = (student) => {
    setSelectedStudent(student || null)
    setIsModalOpen(true)
  }

  const exportToCSV = () => {
    const headers = ['Nome', 'Faixa Atual', 'Entrada na Faixa', 'Meses na Faixa', 'Próxima Faixa']
    const rows = filteredStudents.map(s => [
      s.name,
      beltConfig[s.belt]?.label || 'Sem faixa',
      s.graduation.lastPromotionDate.toLocaleDateString('pt-BR'),
      s.graduation.monthsInBelt,
      beltConfig[beltConfig[s.belt]?.next]?.label || '---'
    ])
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `graduacoes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const stats = [
    { title: 'Total Graduados', value: metrics.totalGraduated, desc: 'Alunos com faixa', icon: GraduationCap, color: 'text-white' },
    { title: 'Próximas Avaliações', value: metrics.upcomingEvaluations, desc: 'Aptos para exame', icon: TrendingUp, color: 'text-primary' },
    { title: 'Trocas (30 dias)', value: metrics.recentChanges, desc: 'Novas graduações', icon: History, color: 'text-emerald-400' },
  ]

  return (
    <>
      <MobileHeader title="Jornada Técnica" />
      <PageHeader 
        icon={Award}
        title="JORNADA TÉCNICA" 
        subtitle="GESTÃO DE EVOLUÇÃO E REGRAS DE GRADUAÇÃO" 
      />

      <div className="px-4 md:px-8 py-6 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* KPI Cards (Dashboard de Gestão) */}
        {activeTab === 'gestao' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 animate-fade-in">
            {stats.map(s => (
              <KPICard 
                key={s.title}
                title={s.title}
                value={loading ? '...' : s.value}
                description={s.desc}
                icon={s.icon}
                valueColor={s.color}
              />
            ))}
          </div>
        )}

        {/* Tab Navigation (SaaS Premium Style) */}
        <div className="flex gap-1 p-1 bg-black border border-white/5 rounded-2xl w-fit">
          {[
            { id: 'gestao', label: 'Gestão de Alunos', icon: Users },
            { id: 'historico', label: 'Histórico Técnico', icon: History, disabled: !selectedStudent && activeTab !== 'historico' },
            { id: 'configuracao', label: 'Regras da Academia', icon: Filter }
          ].map(tab => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all
                ${activeTab === tab.id 
                  ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Vistas Condicionais */}
        {activeTab === 'gestao' && (
          <ManagementView 
            filteredStudents={filteredStudents}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            beltFilter={beltFilter}
            setBeltFilter={setBeltFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            exportToCSV={exportToCSV}
            openGraduationModal={openGraduationModal}
            handleViewHistory={handleViewHistory}
            CustomSelect={CustomSelect}
          />
        )}

        {activeTab === 'historico' && selectedStudent && (
          <HistoryView 
            student={selectedStudent} 
            onBack={() => {
              setActiveTab('gestao')
              setSelectedStudent(null)
            }} 
          />
        )}

        {activeTab === 'configuracao' && (
          <ConfigurationView />
        )}

      </div>

      {/* Modal de Graduação */}
      {isModalOpen && (
        <GraduationChangeModal 
          student={selectedStudent} 
          onClose={() => {
            setIsModalOpen(false)
            setSelectedStudent(null)
          }}
          onFinish={() => {
            // Recarrega os dados através do hook
          }}
        />
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.15s ease-out forwards; }
      `}</style>
    </>
  )
}
