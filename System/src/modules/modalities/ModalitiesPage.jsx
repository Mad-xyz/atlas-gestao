// RESUMO: Gestão de Modalidades e Turmas.
// Permite cadastrar modalidades (Jiu Jitsu, Muay Thai, etc.) e vincular turmas (horários, dias, professores).
// Inclui KPIs de ocupação e capacidade para otimização da academia.
import React, { useState, useMemo } from 'react'
import {
  Plus, Search, Layers,
  GraduationCap, Users, TrendingUp, X, Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useModalities } from '../../hooks/useModalities'
import ModalityCard from './components/ModalityCard'
import ModalityModal from './components/ModalityModal'
import ClassModal from './components/ClassModal'
import BeltConfigModal from './components/BeltConfigModal'
import PageHeader from '../../components/shared/PageHeader'
import MobileHeader from '../../components/navigation/MobileHeader'
import KPICard from '../../components/shared/KPICard'

export default function ModalitiesPage() {
  const {
    modalities, loading, kpis,
    addModality, updateModality, toggleModalityStatus, deleteModality,
    addClass, updateClass, deleteClass
  } = useModalities()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalityModalOpen, setIsModalityModalOpen] = useState(false)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [editingModality, setEditingModality] = useState(null)
  const [editingClass, setEditingClass] = useState(null)
  const [activeModalityId, setActiveModalityId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [isBeltConfigModalOpen, setIsBeltConfigModalOpen] = useState(false)
  const [modalityForConfig, setModalityForConfig] = useState(null)

  const handleToggleExpand = (id) => {
    const stringId = String(id)
    setExpandedId(prev => prev === stringId ? null : stringId)
  }

  const handleAddModality = () => {
    setEditingModality(null)
    setIsModalityModalOpen(true)
  }

  const handleEditModality = (modality) => {
    setEditingModality(modality)
    setIsModalityModalOpen(true)
  }

  const handleSaveModality = async (data) => {
    try {
      const shouldOpenConfig = data._openConfig
      delete data._openConfig

      let savedModalityId = editingModality?.id
      if (editingModality) {
        await updateModality(editingModality.id, data)
      } else {
        const newModalityId = await addModality(data)
        savedModalityId = newModalityId
      }

      setIsModalityModalOpen(false)

      if (shouldOpenConfig && savedModalityId) {
        // Pequeno delay para suavidade na transição de modais
        setTimeout(() => {
          const mod = modalities.find(m => m.id === savedModalityId) || { ...data, id: savedModalityId }
          setModalityForConfig(mod)
          setIsBeltConfigModalOpen(true)
        }, 300)
      }
    } catch (err) {
      alert(`Erro ao salvar modalidade: ${err.message}`)
    }
  }

  const handleOpenBeltConfig = (modality) => {
    setModalityForConfig(modality)
    setIsBeltConfigModalOpen(true)
  }

  // Registra no window para acesso via componentes filhos sem prop drilling excessivo
  React.useEffect(() => {
    window.onOpenBeltConfig = handleOpenBeltConfig;
    return () => { delete window.onOpenBeltConfig; };
  }, [modalities]);

  const handleSaveBeltSystem = async (updatedModality) => {
    await updateModality(updatedModality.id, updatedModality)
  }

  const handleDeleteModality = async (id) => {
    if (confirm('Deseja realmente excluir esta modalidade?')) {
      try {
        await deleteModality(id)
      } catch (err) {
        alert(`Erro ao excluir: ${err.message}`)
      }
    }
  }

  const handleAddClass = (modalityId) => {
    setActiveModalityId(modalityId)
    setEditingClass(null)
    setIsClassModalOpen(true)
  }

  const handleEditClass = (modalityId, turma) => {
    setActiveModalityId(modalityId)
    setEditingClass(turma)
    setIsClassModalOpen(true)
  }

  const handleSaveClass = async (data) => {
    try {
      if (editingClass) await updateClass(activeModalityId, editingClass.id, data)
      else await addClass(activeModalityId, data)
      setIsClassModalOpen(false)
    } catch (err) {
      alert(`Erro ao salvar turma: ${err.message}`)
    }
  }

  const handleDeleteClass = async (modalityId, classId) => {
    if (confirm('Deseja realmente excluir esta turma?')) await deleteClass(modalityId, classId)
  }

  const filteredModalities = useMemo(() =>
    modalities.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [modalities, searchTerm]
  )

  const currentEditingModality = useMemo(() => {
    if (!editingModality) return null
    return modalities.find(m => m.id === editingModality.id) || editingModality
  }, [modalities, editingModality])

  return (
    <>
      <MobileHeader
        title="Modalidades"
      />

      <PageHeader
        icon={Layers}
        title="MODALIDADES E TURMAS"
        subtitle="Gestão Operacional"
        extra={null}

      />

      <main className="flex-1 px-4 md:px-6 py-6 space-y-6 w-full pb-20">

        {/* Mobile Search Expandable */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden">
              <div className="relative mb-4">
                <input
                  autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar modalidade..."
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30"><X size={18} /></button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <KPICard title="Modalidades" value={loading ? '...' : kpis.totalModalities} desc="Ativas no sistema" icon={Layers} iconColor="text-primary" />
          <KPICard title="Turmas" value={loading ? '...' : kpis.totalClasses} desc="Horários cadastrados" icon={GraduationCap} iconColor="text-blue-400" />
          <KPICard title="Média" value={loading ? '...' : kpis.avgStudentsPerClass.toFixed(1)} desc="Alunos por turma" icon={Users} iconColor="text-emerald-400" />
          <KPICard title="Ocupação" value={loading ? '...' : `${kpis.avgOccupancy}%`} desc="Capacidade geral" icon={TrendingUp} iconColor="text-amber-400" />
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-[#111] border border-white/5 rounded-xl pl-12 pr-4 h-[48px] text-sm text-white focus:outline-none focus:border-white/10 transition-all font-medium" 
            />
          </div>

          <button
            onClick={() => handleOpenBeltConfig(null)}
            className="flex items-center justify-center w-[48px] sm:w-auto sm:px-6 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 bg-white/5 border border-white/10 text-gray-500 hover:text-primary hover:border-primary/20 hover:bg-primary/5 group"
            title="Configurar Graduações"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="hidden sm:inline ml-2">GRADUAÇÕES</span>
          </button>

          <button
            onClick={handleAddModality}
            className="flex items-center justify-center w-[48px] sm:w-auto sm:px-6 md:px-8 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90" 
          >
            <Plus size={18} strokeWidth={2.5} /> 
            <span className="hidden md:inline ml-2 text-white">NOVA MODALIDADE</span>
          </button>
        </div>

        {/* Categories / Modalidade List */}
        <div className="columns-1 lg:columns-2 gap-4 space-y-4 lg:space-y-0">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-[32px] animate-pulse break-inside-avoid mb-4" />)
          ) : filteredModalities.length === 0 ? (
            <div className="py-20 text-center col-span-full border border-dashed border-white/10 rounded-[32px] opacity-20 break-inside-avoid">
              <Layers size={48} className="mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhuma modalidade disponível</p>
            </div>
          ) : (
            filteredModalities.map(modality => (
              <div key={modality.id} className="break-inside-avoid mb-4">
                <ModalityCard
                  modality={modality}
                  isExpanded={expandedId === String(modality.id)}
                  onToggleExpand={() => handleToggleExpand(modality.id)}
                  onEdit={handleEditModality}
                  onDelete={handleDeleteModality}
                  onToggleStatus={toggleModalityStatus}
                  onAddClass={handleAddClass}
                  onEditClass={handleEditClass}
                  onDeleteClass={handleDeleteClass}
                />
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODALS */}
      <ModalityModal
        isOpen={isModalityModalOpen}
        onClose={() => setIsModalityModalOpen(false)}
        onSave={handleSaveModality}
        editingModality={currentEditingModality}
        onAddClass={handleAddClass}
        onEditClass={handleEditClass}
        onDeleteClass={handleDeleteClass}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        editingClass={editingClass}
        modalityId={activeModalityId}
      />

      <BeltConfigModal 
        isOpen={isBeltConfigModalOpen}
        onClose={() => setIsBeltConfigModalOpen(false)}
        modalities={modalities}
        initialModality={modalityForConfig}
        onSave={handleSaveBeltSystem}
      />
    </>
  )
}
