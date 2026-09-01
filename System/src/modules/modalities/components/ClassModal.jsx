// RESUMO: Modal de inclusão e edição de Turmas (Horários).
// Define o professor responsável, horários de início e fim, dias da semana e capacidade máxima.
// Vinculado a uma modalidade específica.
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, GraduationCap, Clock, Users, Calendar, Layers, Hash, CircleDot, ChevronDown } from 'lucide-react'
import { useHideMobileNav } from '../../../hooks/useHideMobileNav'
import { useSystemUsers } from '../../../hooks/useSystemUsers'
import { useModalities } from '../../../hooks/useModalities'

const DAYS = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' }
]

export default function ClassModal({ isOpen, onClose, onSave, editingClass = null, modalityId }) {
  useHideMobileNav(isOpen)
  const { users } = useSystemUsers()

  const { modalities } = useModalities()
  
  // Referências para fechar ao clicar fora
  const professorRef = useRef(null)
  const modalityRef = useRef(null)

  const [name, setName] = useState('')
  const [selectedModalityId, setSelectedModalityId] = useState('')
  const [selectedProfessors, setSelectedProfessors] = useState([]) // Array de {id, nome}
  const [diasSemana, setDiasSemana] = useState([])
  const [horarioInicio, setHorarioInicio] = useState('08:00')
  const [horarioFim, setHorarioFim] = useState('09:00')
  const [capacidade, setCapacidade] = useState(20)
  const [status, setStatus] = useState('ativo')
  const [showProfessors, setShowProfessors] = useState(false)
  const [showModalities, setShowModalities] = useState(false)

  // Lógica para fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (professorRef.current && !professorRef.current.contains(event.target)) {
        setShowProfessors(false)
      }
      if (modalityRef.current && !modalityRef.current.contains(event.target)) {
        setShowModalities(false)
      }
    }

    if (showProfessors || showModalities) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfessors, showModalities])

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name || '')
      
      // Carregar professores selecionados (Suporte a legado e multi-select)
      if (editingClass.professors && editingClass.professors.length > 0) {
        setSelectedProfessors(editingClass.professors)
      } else if (editingClass.professorId) {
        setSelectedProfessors([{ 
          id: editingClass.professorId, 
          nome: editingClass.professor || 'Professor' 
        }])
      } else {
        setSelectedProfessors([])
      }

      setDiasSemana(editingClass.diasSemana || [])
      setHorarioInicio(editingClass.horarioInicio || '08:00')
      setHorarioFim(editingClass.horarioFim || '09:00')
      setCapacidade(editingClass.capacidade || 20)
      setStatus(editingClass.status || 'ativo')
    } else {
      setName('')
      setSelectedProfessors([])
      setDiasSemana([])
      setHorarioInicio('08:00')
      setHorarioFim('09:00')
      setCapacidade(20)
      setStatus('ativo')
    }
  }, [editingClass, isOpen, users])

  const toggleProfessor = (p) => {
    const profObj = { id: p.id, nome: p.nome || p.name }
    setSelectedProfessors(prev => {
      const exists = prev.find(item => item.id === p.id)
      if (exists) {
        return prev.filter(item => item.id !== p.id)
      }
      if (prev.length >= 3) {
        alert('Limite de 3 professores por turma atingido.')
        return prev
      }
      return [...prev, profObj]
    })
  }


  const toggleDay = (dayId) => {
    setDiasSemana(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (diasSemana.length === 0) {
      alert('Selecione pelo menos um dia da semana')
      return
    }
    const finalModalityId = modalityId || selectedModalityId
    if (!finalModalityId) {
      alert('Selecione uma modalidade')
      return
    }

    if (selectedProfessors.length === 0) {
      alert('Selecione pelo menos um professor responsável')
      return
    }

    onSave({ 
      name, 
      modalityId: finalModalityId,
      professors: selectedProfessors,
      professor: selectedProfessors[0]?.nome, // Legado: primeiro prof
      professorId: selectedProfessors[0]?.id, // Legado: primeiro prof
      diasSemana, 
      horarioInicio, 
      horarioFim, 
      capacidade: Number(capacidade), 
      status 
    })
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
        className="modal-backdrop z-[210]"
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
          className="modal-content modal-content-bottom-sheet relative max-w-2xl w-full flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
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
              <GraduationCap 
                size={28} 
                strokeWidth={2.5} 
                style={{ color: 'var(--clr-primary)' }}
              />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                {editingClass ? 'Editar Turma' : 'Nova Turma'}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <span 
                  className="w-1 h-1 rounded-full animate-pulse transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--clr-primary)',
                    boxShadow: '0 0 10px var(--clr-primary)'
                  }}
                />
                Configurações de Horário
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10 border border-white/5">
            <X size={24} />
          </button>
        </div>

        {/* Form Body and Footer Wrapper */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 space-y-7 custom-scrollbar no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seleção de Modalidade (apenas se não houver modalityId fixo) */}
              {!modalityId && !editingClass && (
                <div ref={modalityRef} className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                    <Layers size={12} /> MODALIDADE
                  </label>
                  <div 
                    onClick={() => setShowModalities(!showModalities)}
                    className="w-full h-[54px] bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-white flex items-center justify-between cursor-pointer hover:border-white/10 transition-all font-medium"
                  >
                    <span className={`${selectedModalityId ? 'text-white' : 'text-gray-700'} truncate`}>
                      {modalities.find(m => m.id === selectedModalityId)?.name || 'Selecione...'}
                    </span>
                    <ChevronDown size={14} className={`text-gray-600 transition-transform ${showModalities ? 'rotate-180' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {showModalities && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-[#151515] border border-white/10 rounded-xl py-2 shadow-2xl z-[220] max-h-48 overflow-y-auto no-scrollbar"
                      >
                        {modalities.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedModalityId(m.id)
                              setShowModalities(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between"
                          >
                            {m.name}
                            <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'ativo' ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Nome da Turma */}
              <div className={`space-y-2 ${(!modalityId && !editingClass) ? '' : 'md:col-span-1'}`}>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                   <Hash size={12} /> NOME DA TURMA *
                </label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Geral, Avançado..."
                  className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>

              {/* Professor (Multi-Select) */}
              <div ref={professorRef} className="space-y-2 relative md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                  <GraduationCap size={12} /> PROFESSORES RESPONSÁVEIS ({selectedProfessors.length}/3) *
                </label>
                <div 
                  onClick={() => setShowProfessors(!showProfessors)}
                  className="w-full min-h-[54px] bg-[#111] border border-white/5 rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center cursor-pointer hover:border-white/10 transition-all"
                >
                  {selectedProfessors.length === 0 ? (
                    <span className="text-gray-700 text-sm font-medium ml-2">Selecione os professores...</span>
                  ) : (
                    selectedProfessors.map(p => (
                      <span 
                        key={p.id}
                        onClick={(e) => { e.stopPropagation(); toggleProfessor(p) }}
                        className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 group/chip hover:bg-primary/20 transition-all"
                      >
                        {p.nome}
                        <X size={12} className="text-primary/50 group-hover/chip:text-primary" />
                      </span>
                    ))
                  )}
                  <ChevronDown size={14} className={`text-gray-600 ml-auto transition-transform ${showProfessors ? 'rotate-180' : ''}`} />
                </div>
                
                <AnimatePresence>
                  {showProfessors && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 w-full mt-2 bg-[#151515] border border-white/10 rounded-xl py-2 shadow-2xl z-[220] max-h-48 overflow-y-auto no-scrollbar"
                    >
                      {(users || []).filter(u => {
                        const roles = u.papeis || u.roles || {};
                        const roleStr = String(u.role || '').toLowerCase();
                        if (roles.admin || roleStr === 'admin') return false;
                        return roles.professor || roles.gestor || ['professor', 'gestor'].includes(roleStr);
                      }).map(p => {
                        const isSelected = selectedProfessors.some(item => item.id === p.id)
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleProfessor(p)}
                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${isSelected ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-white/5'}`}
                          >
                            <div className="flex flex-col">
                              <span>{p.nome || p.name}</span>
                              <span className="opacity-30 text-[8px] mt-0.5">
                                {p.papeis?.gestor || p.roles?.gestor || p.role === 'gestor' ? 'Gestor' : 'Professor'}
                              </span>
                            </div>
                            {isSelected && <Save size={14} className="text-primary" />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dias da Semana */}
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                  <Calendar size={12} /> DIAS DA SEMANA *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS.map(day => (
                    <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`
                    flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${diasSemana.includes(day.id) 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                      : 'bg-[#111] border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'}
                    border
                  `}
                >
                  <span className={diasSemana.includes(day.id) ? 'text-white' : ''}>{day.label}</span>
                </button>
                  ))}
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                    <Clock size={12} /> INÍCIO *
                  </label>
                  <input 
                    type="time"
                    required
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                    <Clock size={12} /> FIM *
                  </label>
                  <input 
                    type="time"
                    required
                    value={horarioFim}
                    onChange={(e) => setHorarioFim(e.target.value)}
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Capacidade e Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                  <Users size={12} /> LIMITE DE ALUNOS
                </label>
                <input 
                  type="number"
                  required
                  min="1"
                  value={capacidade}
                  onChange={(e) => setCapacidade(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                  <CircleDot size={12} /> STATUS
                </label>
                <div className="flex gap-2">
                  {['ativo', 'inativo'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        status === s 
                        ? 'bg-white border-white text-black shadow-lg shadow-white/10 scale-[1.02]' 
                        : 'bg-[#111] border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                      }`}
                    >
                      {s === 'ativo' ? 'Ativo' : 'Inativo'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BARRA INFERIOR (BOTÕES FIXOS) */}
          <div className="p-6 md:p-8 bg-[#0d0d0d] border-t border-white/5 flex gap-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{
                boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--clr-primary) 30%, transparent)'
              }}
            >
              <Save size={16} /> <span className="text-white">{editingClass ? 'Salvar Turma' : 'Criar Turma'}</span>
            </button>
          </div>
        </form>
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>,
    document.body
  )
}
