// RESUMO: Modal de criação e edição de Modalidades.
// Gerencia os dados principais da modalidade e permite a configuração inicial de sua primeira turma.
// Oferece interface lateral para gestão de turmas existentes quando em modo de edição.
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Save, Layers, Plus, Edit2, Trash2, Calendar, Clock, 
  Users as UsersIcon, ChevronDown, GraduationCap, Hash, CircleDot,
  DollarSign, Settings, Check
} from 'lucide-react'
import { useHideMobileNav } from '../../../hooks/useHideMobileNav'
import { useSystemUsers } from '../../../hooks/useSystemUsers'

export default function ModalityModal({ 
  isOpen, onClose, onSave, editingModality = null,
  onAddClass, onEditClass, onDeleteClass
}) {
  useHideMobileNav(isOpen)
  const { users: staffMembers } = useSystemUsers()

  const professorRef = useRef(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('ativo')
  const [hasBelt, setHasBelt] = useState(false)
  const [pricing, setPricing] = useState({
    adulto: { price: 0, enabled: true },
    kids: { price: 0, enabled: true },
    juvenil: { price: 0, enabled: true }
  })

  // Initial Class State
  const [includeClass, setIncludeClass] = useState(false)
  const [className, setClassName] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [professorName, setProfessorName] = useState('')
  const [selectedDays, setSelectedDays] = useState([])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [capacity, setCapacity] = useState(20)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [showProfessors, setShowProfessors] = useState(false)

  // Lógica para fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (professorRef.current && !professorRef.current.contains(event.target)) {
        setShowProfessors(false)
      }
    }

    if (showProfessors) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfessors])

  const days = [
    { id: 'seg', label: 'SEG' },
    { id: 'ter', label: 'TER' },
    { id: 'qua', label: 'QUA' },
    { id: 'qui', label: 'QUI' },
    { id: 'sex', label: 'SEX' },
    { id: 'sab', label: 'SÁB' },
    { id: 'dom', label: 'DOM' },
  ]

  useEffect(() => {
    if (editingModality) {
      setName(editingModality.name || '')
      setDescription(editingModality.description || '')
      setStatus(editingModality.status || 'ativo')
      setHasBelt(editingModality.hasBelt || false)
      setPricing(editingModality.pricing || {
        adulto: { price: 0, enabled: true },
        kids: { price: 0, enabled: true },
        juvenil: { price: 0, enabled: true }
      })
    } else {
      setName('')
      setDescription('')
      setStatus('ativo')
      setHasBelt(false)
      setPricing({
        adulto: { price: 0, enabled: true },
        kids: { price: 0, enabled: true },
        juvenil: { price: 0, enabled: true }
      })
      setIncludeClass(true)
      setClassName('Geral')
      setProfessorId('')
      setProfessorName('')
      setSelectedDays(['seg', 'ter', 'qua', 'qui', 'sex'])
      setStartTime('08:00')
      setEndTime('09:00')
      setCapacity(20)
      setIsUnlimited(false)
    }
  }, [editingModality, isOpen])


  const toggleDay = (dayId) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  const updatePricing = (category, field, value) => {
    setPricing(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const modalityData = { 
      name, 
      description, 
      status, 
      hasBelt,
      pricing: {
        adulto: { ...pricing.adulto, price: Number(pricing.adulto.price) },
        kids: { ...pricing.kids, price: Number(pricing.kids.price) },
        juvenil: { ...pricing.juvenil, price: Number(pricing.juvenil.price) }
      }
    }
    
    if (includeClass && !editingModality) {
      modalityData.initialClass = {
        name: className,
        professorId,
        professor: professorName,
        diasSemana: selectedDays,
        horarioInicio: startTime,
        horarioFim: endTime,
        capacidade: isUnlimited ? null : Number(capacity),
        status: 'ativo'
      }
    }

    onSave(modalityData)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
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
          className="modal-content modal-content-bottom-sheet relative md:!max-w-6xl md:w-[95vw] w-full flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
        >
        {/* Mobile Drag Handle */}
        <div className="md:hidden flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-[#111]/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {editingModality ? 'Editar Modalidade' : 'Nova Modalidade'}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configurações Operacionais</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-hidden flex-1">
          {/* Main Form */}
          <form onSubmit={handleSubmit} className={`${editingModality ? 'md:w-1/2 md:border-r border-white/5' : 'w-full'} flex flex-col overflow-hidden`}>
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                    <Hash size={12} /> NOME DA MODALIDADE
                  </label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Jiu Jitsu, Muay Thai..."
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium placeholder:text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                    <Edit2 size={12} /> DESCRIÇÃO BREVE
                  </label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva os objetivos central desta modalidade..."
                    rows={3}
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium placeholder:text-gray-800 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          className={`flex-1 h-[43px] rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            status === s 
                            ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                            : 'bg-[#111] border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400'
                          }`}
                        >
                          {s === 'ativo' ? 'Ativo' : 'Inativo'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                        <GraduationCap size={12} /> SISTEMA DE FAIXAS
                      </label>
                      <button
                        type="button"
                        onClick={() => setHasBelt(!hasBelt)}
                        className={`w-full h-[43px] flex items-center justify-between px-6 rounded-xl border transition-all ${
                          hasBelt 
                          ? 'bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/5' 
                          : 'bg-[#111] border-white/5 text-gray-600 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${hasBelt ? 'bg-primary' : 'bg-gray-700'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {hasBelt ? 'HABILITADO' : 'SEM GRADUAÇÃO'}
                          </span>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${hasBelt ? 'bg-primary' : 'bg-gray-800'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-all ${hasBelt ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>
                    </div>

                    {hasBelt && editingModality && (
                      <button
                        type="button"
                        onClick={() => onSave({ ...editingModality, name, description, status, hasBelt, _openConfig: true })}
                        className="mt-6 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-primary transition-all group"
                        title="Configurar Categorias e Faixas"
                      >
                        <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Seção de Precificação por Categoria */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                    <DollarSign size={12} /> CONFIGURAÇÃO DE VALORES (POR CATEGORIA)
                  </label>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'adulto', label: 'Adulto', icon: UsersIcon },
                      { id: 'kids', label: 'Kids', icon: CircleDot },
                      { id: 'juvenil', label: 'Juvenil', icon: Layers }
                    ].map(cat => (
                      <div key={cat.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex-1 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${pricing[cat.id].enabled ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-600'}`}>
                            <cat.icon size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white">{cat.label}</p>
                            <p className="text-[9px] text-gray-600 font-bold uppercase">Mensalidade sugerida</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 uppercase">R$</span>
                            <input 
                              type="text"
                              inputMode="numeric"
                              disabled={!pricing[cat.id].enabled}
                              value={
                                (typeof pricing[cat.id].price === 'number' ? pricing[cat.id].price : 0)
                                  .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              }
                              onChange={(e) => {
                                // Máscara monetária: extrai dígitos e trata como centavos
                                const digits = e.target.value.replace(/\D/g, '');
                                const limited = digits.slice(0, 6); // máx 999999 centavos = 9.999,99
                                const cents = parseInt(limited || '0', 10);
                                const num = Math.min(9999, cents / 100);
                                updatePricing(cat.id, 'price', num);
                              }}
                              className="w-32 bg-black border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono disabled:opacity-20"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => updatePricing(cat.id, 'enabled', !pricing[cat.id].enabled)}
                            className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${
                              pricing[cat.id].enabled 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}
                          >
                            {pricing[cat.id].enabled ? 'Pagante' : 'Isento'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase px-1 leading-relaxed font-sans mt-4">
                    * Alunos marcados como as isentos por categoria não gerarão cobrança automática.
                  </p>
                </div>
                
                {!editingModality && (
                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIncludeClass(!includeClass)}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-all ${includeClass ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Configurar Turma</h4>
                          <p className="text-[9px] text-gray-600 font-bold uppercase mt-0.5">Criar primeiro horário agora</p>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors relative ${includeClass ? 'bg-primary' : 'bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${includeClass ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {includeClass && (
                      <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                            <UsersIcon size={12} /> NOME DA TURMA *
                          </label>
                          <input 
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="Ex: Geral, Kids, Noite..."
                            className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium placeholder:text-gray-800"
                          />
                        </div>

                        {/* Seleção de Dias da Semana */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                            <Calendar size={12} /> DIAS DA SEMANA *
                          </label>
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {days.map(day => (
                              <button
                                key={day.id}
                                type="button"
                                onClick={() => toggleDay(day.id)}
                                className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${
                                  selectedDays.includes(day.id)
                                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                  : 'bg-white/5 border-white/5 text-gray-600 hover:border-white/10'
                                }`}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Horários e Professor lado a lado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                                <Clock size={12} /> INÍCIO *
                              </label>
                              <input 
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                                <Clock size={12} /> FIM *
                              </label>
                              <input 
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                              />
                            </div>
                          </div>

                          <div ref={professorRef} className="space-y-2 relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                              <GraduationCap size={12} /> PROFESSOR *
                            </label>
                            <div 
                              onClick={() => setShowProfessors(!showProfessors)}
                              className="w-full h-[54px] bg-black border border-white/5 rounded-xl px-6 py-4 text-sm text-white flex items-center justify-between cursor-pointer hover:border-white/10 transition-all"
                            >
                              <span className={`${professorId ? 'text-white' : 'text-gray-700'} truncate text-[11px] font-bold`}>
                                {professorName || 'Selecione...'}
                              </span>
                              <ChevronDown size={14} className={`text-gray-600 transition-transform ${showProfessors ? 'rotate-180' : ''}`} />
                            </div>
                            {showProfessors && (
                              <div className="absolute bottom-full md:top-full left-0 w-full mb-2 md:mt-2 bg-[#111] border border-white/10 rounded-xl py-2 shadow-2xl z-[60] max-h-48 overflow-y-auto no-scrollbar">
                                {staffMembers?.filter(s => {
                                  const roles = s.papeis || s.roles || {};
                                  const roleStr = String(s.role || '').toLowerCase();
                                  // Exclui Admin da seleção de professor responsável
                                  if (roles.admin || roleStr === 'admin') return false;

                                  return roles.professor || roles.gestor || 
                                         ['professor', 'gestor'].includes(roleStr);
                                }).map(staff => (
                                  <button
                                    key={staff.id}
                                    type="button"
                                    onClick={() => { 
                                      setProfessorId(staff.id); 
                                      setProfessorName(staff.nome || staff.name); 
                                      setShowProfessors(false) 
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between"
                                  >
                                    {staff.nome || staff.name}
                                    <span className="opacity-30 text-[8px] tracking-widest">
                                      {staff.papeis?.gestor || staff.roles?.gestor || staff.role === 'gestor' ? 'Gestor' : 'Professor'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                               <UsersIcon size={12} /> LIMITE DE ALUNOS
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsUnlimited(!isUnlimited)}
                              className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isUnlimited ? 'text-primary' : 'text-gray-600'}`}
                            >
                              {isUnlimited ? 'SEM LIMITE ATIVADO' : 'ATIVAR SEM LIMITE'}
                            </button>
                          </div>
                          
                          {!isUnlimited && (
                            <input 
                              type="number"
                              value={capacity}
                              onChange={(e) => setCapacity(e.target.value)}
                              placeholder="Ex: 20"
                              className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium placeholder:text-gray-800"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Fixed Action Footer */}
            <div className="p-6 border-t border-white/5 bg-[#0d0d0d] flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-white transition-colors bg-white/5 rounded-2xl order-3 sm:order-1"
              >
                Cancelar
              </button>

              {hasBelt && (
                <button
                  type="button"
                  onClick={() => {
                    const pricingData = {
                      adulto: { ...pricing.adulto, price: Number(pricing.adulto.price) },
                      kids: { ...pricing.kids, price: Number(pricing.kids.price) },
                      juvenil: { ...pricing.juvenil, price: Number(pricing.juvenil.price) }
                    }
                    onSave({ name, description, status, hasBelt, pricing: pricingData, _openConfig: true });
                    onClose();
                  }}
                  className="flex-[1.5] flex items-center justify-center gap-2 py-4 bg-white/5 border border-primary/20 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all active:scale-95 group order-1 sm:order-2"
                >
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                  Salvar e Configurar Faixas
                </button>
              )}

              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95 group px-6 order-2 sm:order-3"
              >
                <Save size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                {editingModality ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>

          {editingModality && (
            <div className="hidden md:block md:w-1/2 p-6 md:p-8 bg-black/20 overflow-y-auto no-scrollbar space-y-6 border-t border-white/5 md:border-t-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Turmas Registradas</h3>
                  <p className="text-[9px] text-gray-600 uppercase font-bold mt-1">{editingModality.turmas?.length || 0} Horários ativos</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddClass(editingModality.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 group"
                >
                  <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                  Nova Turma
                </button>
              </div>

              <div className="space-y-3">
                {!editingModality.turmas || editingModality.turmas.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl opacity-30">
                     <Calendar size={32} className="mx-auto mb-4" />
                     <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma turma</p>
                  </div>
                ) : (
                  editingModality.turmas.map(turma => (
                    <div key={turma.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group/class hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${turma.status === 'ativo' ? 'bg-primary text-primary' : 'bg-gray-600 text-gray-600'}`} />
                        <div>
                          <h5 className="text-sm font-black text-white uppercase">{turma.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <GraduationCap size={10} className="text-gray-600" />
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              {turma.professors?.length > 0 
                                ? turma.professors.map(p => p.nome).join(', ')
                                : turma.professor || 'Sem Professor'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {turma.diasSemana?.map(day => (
                              <span key={day} className="px-2 py-0.5 bg-white/5 text-[8px] font-black uppercase tracking-tighter text-gray-400 rounded-md border border-white/5">{day}</span>
                            ))}
                            <span className="ml-1 px-2 py-0.5 bg-primary/10 text-[8px] font-black text-primary uppercase rounded-md border border-primary/10">{turma.horarioInicio} - {turma.horarioFim}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/class:opacity-100 transition-opacity">
                        <button 
                          type="button"
                          onClick={() => onEditClass(editingModality.id, turma)}
                          className="p-2.5 hover:bg-white/5 text-gray-500 hover:text-white rounded-xl transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => onDeleteClass(editingModality.id, turma.id)}
                          className="p-2.5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-xl transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>,
    document.body
  )
}
