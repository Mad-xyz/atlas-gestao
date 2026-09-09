import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, GraduationCap, Users,
  Mail, Smartphone, Shield, Info,
  ChevronDown, Check, Save, Landmark,
  Settings, User, MapPin, Activity,
  PhoneCall, HeartPulse, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudents } from '../../hooks/useStudents'
import { useModalities } from '../../hooks/useModalities'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { useAuth } from '../../context/AuthContext'
import { formatPhoneUI, parsePhoneData } from '../../utils/phoneUtils'
import { calculateModalityValue } from '../../utils/billingUtils'

/**
 * Seletor Customizado Premium
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
    <div className={`flex flex-col gap-1.5 relative w-full ${isOpen ? 'z-[500]' : 'z-[10]'}`} ref={ref}>
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`form-input bg-black opacity-100 h-[54px] text-sm px-6 text-gray-300 font-medium text-left flex justify-between items-center w-full disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-2xl transition-all hover:bg-[#080808] focus:ring-1 focus:ring-white/20 ${isOpen ? 'ring-1 ring-primary/50 border-primary/50' : ''}`}
      >
        <span className="truncate font-bold">{selectedOption ? selectedOption[1] : '...'}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0B0B0B] opacity-100 border border-white/10 rounded-2xl z-[600] overflow-hidden shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => { onChange(v); setIsOpen(false) }}
              className={`w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider transition-colors hover:bg-white/5 border-b border-white/[0.02] last:border-0 ${value === v ? 'text-primary bg-primary/5' : 'text-gray-400'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AddStudentModal({ isOpen = true, onClose, onAdd, initialModality = 'todas', initialData = null, initialType = 'aluno' }) {
  const { modalities, loading: loadingModalities } = useModalities()
  const activeModalities = (modalities || []).filter(m => m.status === 'ativo')
  const { effectiveRole } = useAuth()
  const [showTurmasDropdown, setShowTurmasDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useHideMobileNav(isOpen)

  // Helper para inicialização segura
  function getSafeModality(mod) {
    if (!mod) return []
    // Usamos activeModalities da closure ou passamos como param se necessário, 
    // mas aqui o activeModalities já está definido no escopo do componente.
    const found = (modalities || []).find(am => am.id === mod || am.name === mod)
    if (found) return [found.name]
    if (mod === 'todas') return []
    return [mod === 'jiu-jitsu' ? 'Jiu Jitsu' : mod]
  }

  const startModArray = initialData ? [] : getSafeModality(initialModality)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    emergency: '',
    medical: '',
    observacoes: '',
    belt: 'none',
    stripes: 0,
    modality: startModArray,
    type: initialType,
    ageCategory: 'Adulto',
    gender: 'Masculino',
    genero: 'Masculino',
    parentName: '',
    parentPhone: '',
    initialPaymentStatus: 'paid',
    planValue: 'R$ 0,00',
    turmas: []
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let normalizedModalities = []
        
        // Combina 'modality' e 'modalities' num único array sem repetições
        const allModsRaw = Array.from(new Set([
          ...(initialData.modality ? (Array.isArray(initialData.modality) ? initialData.modality : [initialData.modality]) : []),
          ...(Array.isArray(initialData.modalities) ? initialData.modalities : (typeof initialData.modalities === 'string' ? initialData.modalities.split(',').map(m=>m.trim()) : []))
        ])).filter(Boolean);

        if (allModsRaw.length === 0 && initialModality) {
          allModsRaw.push(initialModality);
        }

        // 🔥 Normalização Crítica: Mapear IDs para Nomes se necessário e remover duplicatas
        normalizedModalities = Array.from(new Set(allModsRaw.map(m => {
          if (!m) return null
          const found = activeModalities.find(am => am.id === m || am.name === m || am.name.toLowerCase() === m.toLowerCase())
          if (found) return found.name
          if (m.toLowerCase() === 'jiu-jitsu' || m === 'jiu-jitsu-id') return 'Jiu Jitsu'
          return m === 'Jiu-Jitsu' ? 'Jiu Jitsu' : m
        }))).filter(Boolean)

        // Normalização de belt
        let initialBelt = initialData.belt === 'Sem Faixa' || !initialData.belt ? 'none' : initialData.belt;
        if (initialBelt !== 'none') {
          // Find the exact belt name from the modalities config to match case
          const currentCategoryName = (initialData.ageCategory || 'Adulto').toLowerCase();
          for (const modId of normalizedModalities) {
             const mod = activeModalities.find(m => m.id === modId || m.name === modId);
             if (mod?.beltSystem?.categories) {
               const category = mod.beltSystem.categories.find(c => c.name.toLowerCase() === currentCategoryName || c.id?.toLowerCase() === currentCategoryName);
               if (category?.belts) {
                 const exactBelt = category.belts.find(b => b.name.toLowerCase() === initialBelt.toLowerCase());
                 if (exactBelt) {
                   initialBelt = exactBelt.name;
                   break;
                 }
               }
             }
          }
        }

        setForm({
          name: initialData.nome || initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          emergency: initialData.emergency || '',
          medical: initialData.medical || '',
          observacoes: initialData.observacoes || '',
          belt: initialBelt,
          stripes: initialData.stripes || 0,
          modality: normalizedModalities.length > 0 ? normalizedModalities : [],
          type: initialData.isPromoting ? 'aluno' : (initialData.roles?.equipe ? 'equipe' : (initialData.roles?.visitante ? 'visitante' : 'aluno')),
          ageCategory: initialData.ageCategory || 'Adulto',
          gender: initialData.gender || initialData.genero || 'Masculino',
          genero: initialData.genero || initialData.gender || 'Masculino',
          parentName: initialData.parentName || '',
          parentPhone: initialData.parentPhone || '',
          initialPaymentStatus: 'paid',
          startDate: initialData.startDate || (initialData.createdAt instanceof Date ? initialData.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          // 🔥 Carrega turmas salvas — normaliza para o formato uniqueId (modId:turmaId)
          turmas: (() => {
            const savedTurmas = Array.isArray(initialData.turmas) ? initialData.turmas : []
            return savedTurmas.map(t => {
              // Já está no formato correto (modId:turmaId)
              if (typeof t === 'string' && t.includes(':')) return t
              // Formato legado: só o ID da turma — tenta encontrar a modalidade pai
              const turmaObj = (modalities || []).flatMap(m => (m.turmas || []).map(tr => ({ ...tr, modalityId: m.id }))).find(tr => tr.id === t)
              return turmaObj ? `${turmaObj.modalityId}:${turmaObj.id}` : t
            }).filter(Boolean)
          })()
        })
      } else {
        // Se não houver modalidade inicial (ex: filtro 'todas'), começa vazio para evitar seleções fantasmas
        const found = initialModality ? activeModalities.find(am => am.id === initialModality || am.name === initialModality) : null
        const startMod = found ? [found.name] : (initialModality && initialModality !== 'todas' ? [initialModality === 'jiu-jitsu' ? 'Jiu Jitsu' : initialModality] : [])

        setForm({
          name: '', email: '', phone: '', emergency: '', medical: '', observacoes: '',
          belt: 'none', stripes: 0, modality: startMod, type: initialType,
          ageCategory: 'Adulto', gender: 'Masculino', genero: 'Masculino',
          parentName: '', parentPhone: '',
          initialPaymentStatus: 'paid',
          initialPaymentStatus: 'paid',
          planValue: 'R$ 0,00',
          turmas: [],
          startDate: new Date().toISOString().split('T')[0]
        })
      }
      setErrorMsg('')
    }
  }, [isOpen, initialData, initialModality, activeModalities.length])

  // 🔥 Sincronização Automática de Turmas Únicas
  useEffect(() => {
    if (!modalities || modalities.length === 0) return

    setForm(prev => {
      const currentTurmas = [...(prev.turmas || [])]
      let changed = false

      prev.modality.forEach(modName => {
        const mod = modalities.find(m => m.name === modName)
        if (mod && mod.turmas && mod.turmas.length === 1) {
          const uniqueId = `${mod.id}:${mod.turmas[0].id}`
          if (!currentTurmas.includes(uniqueId)) {
            currentTurmas.push(uniqueId)
            changed = true
          }
        }
      })

      // Remover turmas de modalidades que não estão mais selecionadas
      const updatedTurmas = currentTurmas.filter(tUniqueId => {
        const [modId, tId] = tUniqueId.includes(':') ? tUniqueId.split(':') : [null, tUniqueId]

        // Se for ID legado (sem :), tenta encontrar de qualquer forma
        if (!modId) {
          const turmaObj = (modalities || []).flatMap(m => m.turmas || []).find(t => t.id === tId)
          if (!turmaObj) return false
          const parentMod = modalities.find(m => m.id === turmaObj.modalityId)
          return parentMod && prev.modality.includes(parentMod.name)
        }

        // Se for ID novo (com :), verifica se a modalidade pai ainda está selecionada
        const parentMod = modalities.find(m => m.id === modId)
        return parentMod && prev.modality.includes(parentMod.name)
      })

      if (changed || updatedTurmas.length !== currentTurmas.length) {
        return { ...prev, turmas: updatedTurmas }
      }
      return prev
    })
  }, [form.modality, modalities])

  // 🔥 Auto-seleção de turmas para modalidades com apenas uma turma
  useEffect(() => {
    if (!modalities) return;

    setForm(prev => {
      const currentTurmas = prev.turmas || [];
      const newTurmas = [...currentTurmas];
      let changed = false;

      prev.modality.forEach(modName => {
        const mod = modalities.find(m =>
          m.name.toLowerCase() === modName.toLowerCase() ||
          m.id.toLowerCase() === modName.toLowerCase()
        );
        if (mod && mod.turmas && mod.turmas.length === 1) {
          const classId = mod.turmas[0].id;
          const uniqueId = `${mod.id}:${classId}`;
          if (!newTurmas.includes(uniqueId)) {
            newTurmas.push(uniqueId);
            changed = true;
          }
        }
      });

      if (changed) return { ...prev, turmas: newTurmas };
      return prev;
    });
  }, [form.modality, modalities]);

  // Click-away logic for turmas dropdown
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTurmasDropdown(false)
      }
    }
    if (showTurmasDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTurmasDropdown])

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Cálculo automático do valor do plano baseado nas modalidades e categoria de idade
    if (modalities && form.modality.length > 0 && form.type === 'aluno') {
      const total = calculateModalityValue(form, modalities);
      
      // Só atualizamos automaticamente se:
      // 1. For um aluno novo (não tem initialData)
      // 2. OU se for uma edição mas as modalidades/categoria mudaram em relação ao original
      // No entanto, para simplificar e garantir a regra de negócio do usuário:
      // "quando seleciono categoria... vai pegar o valor", vamos atualizar sempre que houver mudança.
      
      const newPlanValue = (total * 100).toString();
      
      // Evita loops infinitos verificando se o valor realmente mudou
      if (form.planValue !== newPlanValue && total > 0) {
        setForm(prev => ({ ...prev, planValue: newPlanValue }));
      }
    }
  }, [form.modality, form.ageCategory, modalities, form.type]);


  // 🥋 Lógica de Faixas Extraída (Evita IIFE no JSX)
  const getBeltOptions = () => {
    const baseOptions = [['none', 'Sem Faixa']];
    const dynamicBelts = [];
    const currentCategoryName = (form.ageCategory || 'Adulto').toLowerCase();

    form.modality.forEach(modId => {
      const mod = modalities?.find(m => m.id === modId || m.name === modId);
      if (mod?.beltSystem?.categories) {
        const category = mod.beltSystem.categories.find(c =>
          c.name.toLowerCase() === currentCategoryName ||
          c.id.toLowerCase() === currentCategoryName
        );

        if (category?.belts) {
          category.belts.forEach(belt => {
            if (!dynamicBelts.find(db => db[0] === belt.name)) {
              dynamicBelts.push([belt.name, belt.name.toUpperCase()]);
            }
          });
        }
      }
    });

    return dynamicBelts.length > 0 ? [...baseOptions, ...dynamicBelts] : baseOptions;
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    if (!form.name.trim()) { setErrorMsg('Nome é obrigatório'); return }

    // Valida turma: se houver modalidades com turmas disponíveis, exige seleção
    if (form.type !== 'visitante' && form.modality.length > 0) {
      const hasAvailableTurmas = (modalities || []).some(m =>
        form.modality.some(modName => modName.toLowerCase() === m.name.toLowerCase()) &&
        (m.turmas || []).length > 0
      )
      if (hasAvailableTurmas && (!form.turmas || form.turmas.length === 0)) {
        setErrorMsg('Selecione pelo menos uma turma antes de salvar.')
        return
      }
    }

    setSaving(true)
    setErrorMsg('')
    try {
      const isVisitor = form.type === 'visitante'
      const isEquipe = form.type === 'equipe'
      // 📱 Processamento do Telefone
      const phoneData = parsePhoneData(form.phone)
      if (!phoneData) {
        setErrorMsg('Telefone inválido. Use o padrão: 91 99999-9999')
        setSaving(false)
        return
      }

      const normalizedForm = {
        ...form,
        phone: phoneData.display,
        ddd: phoneData.ddd,
        telefone_limpo: phoneData.telefone_limpo,
        telefone_completo: phoneData.telefone_completo,
        planValue: form.planValue ? (Number(form.planValue.replace(/\D/g, '')) / 100).toFixed(2) : ''
      }

      if (initialData) {
        delete normalizedForm.initialPaymentStatus;
      }

      await onAdd(normalizedForm, form.modality, {
        isVisitor,
        isEquipe,
        belt: form.belt,
        stripes: form.stripes
      })
      onClose()
    } catch (err) {
      console.error('Erro ao processar aluno:', err)
      setErrorMsg('Erro ao salvar. Verifique se o e-mail já existe.')
    } finally {
      setSaving(false)
    }
  }

  // Se isOpen for explicitamente falso, não renderizamos (para uso sem AnimatePresence externo)
  // Mas se for usado com AnimatePresence externo (como no FloatingActionMenu), o isOpen costuma ser omitido ou true.
  return createPortal(
    <motion.div
      key="add-student-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop"
      onClick={onClose}
    >
      <motion.div
        drag={window.innerWidth < 640 ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose()
        }}
        layout
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.5 }}
        onClick={e => e.stopPropagation()}
        className="fixed z-[1001] bg-[#0A0A0A] border border-white/10 shadow-2xl flex flex-col overflow-hidden
                   inset-x-0 bottom-0 h-[95vh] rounded-t-[32px]
                   sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:w-full sm:h-auto sm:max-h-[90vh] sm:rounded-[32px]"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* CABEÇALHO */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <GraduationCap className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                {initialData?.isPromoting ? 'Promover Aluno' :
                  initialData ? (form.type === 'visitante' ? 'Perfil Visitante' : 'Perfil Aluno') :
                    (form.type === 'visitante' ? 'Novo Visitante' : 'Novo Aluno')}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                {initialData ? 'Edição de cadastro' : 'Cadastro de novo membro'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar scroll-smooth">
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] uppercase font-black text-center tracking-widest animate-pulse">
                {errorMsg}
              </div>
            )}



            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                Informações Básicas
                <div className="h-px flex-1 bg-white/5" />
              </h3>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Nome Completo *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium font-sans"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 font-sans">Telefone / WhatsApp *</label>
                  <div className="relative">
                    <Smartphone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: formatPhoneUI(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium font-sans"
                      placeholder="91 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {form.type === 'aluno' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 font-sans">E-mail de Acesso *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium font-sans"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 font-sans">Data de Início na Academia *</label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                          type="date"
                          required
                          value={form.startDate}
                          onChange={e => setForm({ ...form, startDate: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium font-sans [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <CustomSelect
                      label="Gênero"
                      value={form.genero || form.gender}
                      onChange={v => setForm({ ...form, gender: v, genero: v })}
                      options={[['Masculino', 'Masculino'], ['Feminino', 'Feminino']]}
                    />
                    <CustomSelect
                      label="Categoria de Idade"
                      value={form.ageCategory}
                      onChange={v => setForm({ ...form, ageCategory: v })}
                      options={[['Adulto', 'Adulto'], ['Juvenil', 'Juvenil'], ['Kids', 'Kids']]}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Treino */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                Treino {form.type === 'aluno' && 'e Graduação'}
                <div className="h-px flex-1 bg-white/5" />
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">
                    Modalidades {form.type === 'aluno' ? 'Inscritas' : 'de Interesse'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {loadingModalities ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
                      ))
                    ) : (
                      activeModalities.map(m => {
                        const isSelected = form.modality.includes(m.name);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              const newMods = isSelected ? form.modality.filter(name => name !== m.name) : [...form.modality, m.name];
                              setForm({ ...form, modality: newMods });
                            }}
                            className={`flex items-center justify-center px-3 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${isSelected ? 'bg-primary/20 border-primary text-primary' : 'bg-white/[0.02] border-white/10 text-gray-400'}`}
                          >
                            {m.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* --- SELEÇÃO DE TURMAS (Estilo Dropdown ModalityModal) --- */}
                {(() => {
                  const relevantClasses = modalities
                    .filter(m =>
                      form.modality.some(modName => modName.toLowerCase() === m.name.toLowerCase()) ||
                      form.modality.some(modName => modName.toLowerCase() === m.id.toLowerCase())
                    )
                    .flatMap(m => (m.turmas || []).map(t => ({
                      ...t,
                      modalityName: m.name,
                      uniqueId: `${m.id}:${t.id}`
                    })));

                  const hasRelevantClasses = (modalities || [])
                    .some(m => form.modality.some(modName => modName.toLowerCase() === m.name.toLowerCase()) && (m.turmas || []).length > 0);

                  if (!hasRelevantClasses) return null;

                  const selectedCount = (form.turmas || []).length;

                  return (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 relative z-[100]" ref={dropdownRef}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                        <Users size={12} /> SELECIONAR TURMAS E HORÁRIOS
                      </label>

                      <div className="relative">
                        <div
                          onClick={() => setShowTurmasDropdown(!showTurmasDropdown)}
                          className={`w-full h-[54px] bg-black border text-sm text-gray-300 font-medium flex items-center justify-between cursor-pointer transition-all rounded-2xl px-6 py-4 hover:bg-[#080808] ${showTurmasDropdown ? 'ring-1 ring-primary/50 border-primary/50' : 'border-white/10'}`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedCount > 0 ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-600'}`}>
                              <Clock size={14} />
                            </div>
                            <span className={`${selectedCount > 0 ? 'text-white' : 'text-gray-500'} truncate text-[11px] font-bold uppercase tracking-tight`}>
                              {selectedCount > 0
                                ? `${selectedCount} ${selectedCount === 1 ? 'turma selecionada' : 'turmas selecionadas'}`
                                : 'Escolha os horários...'}
                            </span>
                          </div>
                          <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showTurmasDropdown ? 'rotate-180 text-primary' : ''}`} />
                        </div>

                        <AnimatePresence>
                          {showTurmasDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0B0B0B] opacity-100 border border-white/10 rounded-2xl z-[600] overflow-y-auto max-h-64 no-scrollbar shadow-2xl py-2"
                            >
                              {relevantClasses.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Nenhuma turma encontrada</p>
                                </div>
                              ) : (
                                relevantClasses.map(turma => {
                                  const isSelected = (form.turmas || []).includes(turma.uniqueId);
                                  return (
                                    <button
                                      key={turma.uniqueId}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setForm(prev => {
                                          const currentTurmas = prev.turmas || [];
                                          const exists = currentTurmas.includes(turma.uniqueId);
                                          return {
                                            ...prev,
                                            turmas: exists
                                              ? currentTurmas.filter(id => id !== turma.uniqueId)
                                              : [...currentTurmas, turma.uniqueId]
                                          };
                                        });
                                      }}
                                      className={`w-full text-left px-5 py-3.5 transition-all flex items-center justify-between group border-b border-white/[0.02] last:border-0 ${isSelected ? 'bg-primary/5' : 'hover:bg-white/[0.03]'}`}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white' : 'bg-white/5 text-gray-600 group-hover:text-gray-400'}`}>
                                          {isSelected ? <Check size={12} strokeWidth={3} /> : <Users size={12} />}
                                        </div>
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
                                              {turma.name}
                                            </span>
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/5 text-gray-600 uppercase tracking-widest">
                                              {turma.modalityName}
                                            </span>
                                          </div>
                                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">
                                            {turma.days?.join(', ')} • {turma.startTime} - {turma.endTime}
                                          </p>
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })()}

                {activeModalities.some(m => form.modality.some(modName => modName.toLowerCase() === m.name.toLowerCase()) && m.hasBelt !== false) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelect
                      label="Faixa Atual"
                      value={form.belt}
                      onChange={v => setForm({ ...form, belt: v, stripes: v === 'none' ? 0 : form.stripes })}
                      options={getBeltOptions()}
                    />
                    <CustomSelect
                      label="Graus (Stripes)"
                      value={form.stripes}
                      onChange={v => setForm({ ...form, stripes: v })}
                      disabled={form.belt === 'none'}
                      options={[
                        [0, 'Nenhum Grau'],
                        [1, '1 Grau'],
                        [2, '2 Graus'],
                        [3, '3 Graus'],
                        [4, '4 Graus'],
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Seções Adicionais para Alunos */}
            {form.type === 'aluno' && (
              <>
                {(form.ageCategory === 'Kids' || form.ageCategory === 'Juvenil') && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                      Responsável Legal
                      <div className="h-px flex-1 bg-primary/10" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Nome do Responsável</label>
                        <input
                          type="text"
                          value={form.parentName}
                          onChange={e => setForm({ ...form, parentName: e.target.value })}
                          className="w-full px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/30 transition-all font-medium"
                          placeholder="Nome do pai/mãe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 font-sans">WhatsApp Responsável</label>
                        <input
                          type="text"
                          value={form.parentPhone}
                          onChange={e => setForm({ ...form, parentPhone: e.target.value })}
                          className="w-full px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/30 transition-all font-medium font-sans"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                    Saúde e Segurança
                    <div className="h-px flex-1 bg-primary/5" />
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Contato de Emergência</label>
                      <div className="relative">
                        <PhoneCall size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                          type="text"
                          value={form.emergency}
                          onChange={e => setForm({ ...form, emergency: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium font-sans"
                          placeholder="Nome e Telefone"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Restrições Médicas</label>
                      <div className="relative">
                        <HeartPulse size={14} className="absolute left-3.5 top-4 text-gray-600" />
                        <textarea
                          value={form.medical}
                          onChange={e => setForm({ ...form, medical: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium min-h-[100px] outline-none"
                          placeholder="Ex: Alergias, problemas no joelho..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                    Anotações Internas
                    <div className="h-px flex-1 bg-primary/5" />
                  </h3>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Notas (Visível no Perfil)</label>
                    <div className="relative">
                      <Info size={14} className="absolute left-3.5 top-4 text-gray-600" />
                      <textarea
                        value={form.observacoes}
                        onChange={e => setForm({ ...form, observacoes: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium min-h-[100px] outline-none"
                        placeholder="Ex: Aluno focado, precisa de atenção na base..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}


            {/* Banner Visitante */}
            {form.type === 'visitante' && (
              <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Status: Visitante Experimental</p>
                  <p className="text-[9px] text-primary/70 leading-tight uppercase font-medium">O registro será salvo como lead experimental sem cobranças automáticas.</p>
                </div>
              </div>
            )}
          </div>

          {/* RODAPÉ */}
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
              disabled={saving || (() => {
                // Bloqueia se há modalidades com turmas disponíveis mas nenhuma turma selecionada
                if (form.type === 'visitante') return false
                if (form.modality.length === 0) return false
                const hasAvailableTurmas = (modalities || []).some(m =>
                  form.modality.some(modName => modName.toLowerCase() === m.name.toLowerCase()) &&
                  (m.turmas || []).length > 0
                )
                return hasAvailableTurmas && (!form.turmas || form.turmas.length === 0)
              })()}
              className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale
                ${saving ? 'bg-gray-800 text-gray-500' : 'bg-rose-600 text-white shadow-rose-600/30'}`}
            >
              {saving ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Cadastrar Membro')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  )
}
