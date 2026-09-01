import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, User, Users, Mail, Shield, Check, Copy,
  AlertCircle, Info, Search, GraduationCap,
  ChevronDown, Landmark, Settings, Save, RefreshCw,
  Lock, PhoneCall, HeartPulse, Smartphone, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// Hooks para integração com Firebase e controle de UI
import { useSystemUsers } from '../../hooks/useSystemUsers'
import { useStudents } from '../../hooks/useStudents'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useModalities } from '../../hooks/useModalities'
import { formatPhoneUI, parsePhoneData } from '../../utils/phoneUtils'

/**
 * Seletor Customizado Premium (Copiado do AddStudentModal para consistência)
 */
function CustomSelect({ label, value, onChange, options, disabled }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
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
        className={`form-input bg-black h-[54px] opacity-100 text-sm px-6 text-gray-300 font-medium text-left flex justify-between items-center w-full disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-2xl transition-all hover:bg-[#080808] focus:ring-1 focus:ring-white/20 ${isOpen ? 'ring-1 ring-primary/50 border-primary/50' : ''}`}
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

/**
 * UserCreationModal - Modal Unificado de Gestão de Usuários
 * 
 * Este componente permite criar novos colaboradores ou promover alunos.
 * Implementa a lógica de Single Source of Truth (SSoT) e RBAC (Múltiplos Cargos).
 */
// ── Utilitários de Segurança ──────────────────────────────────────────────────
/** Converte e-mail comum para o formato administrativo interno */
const toInternalEmail = (email) => {
  if (!email || email.includes('@rstopteam.internal')) return email;
  return email.toLowerCase()
    .trim()
    .replace('@', '_')
    .replace(/\./g, '_') + '@rstopteam.internal';
};

export default function UserCreationModal({ isOpen, onClose, initialData }) {
  // Oculta a navegação mobile para evitar conflitos visuais com o modal
  useHideMobileNav(isOpen)

  const { createNewUser } = useSystemUsers()
  const { students, deleteStudent } = useStudents()
  const { modalities: dbModalities } = useModalities()
  const [showTurmasDropdown, setShowTurmasDropdown] = useState(false);
  const dropdownRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estado inicial do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pin: '', // 🔑 PIN Aluno / Normal
    adminPin: '', // 👑 PIN Administrativo
    roles: [], 
    modalities: [], // 🥋 Modalidades do professor
    belt: 'none',
    stripes: 0,
    startDate: '',
    // --- NOVOS CAMPOS SINCRONIZADOS COM ALUNOS ---
    gender: 'Masculino',
    ageCategory: 'Adulto',
    emergency: '',
    medical: '',
    parentName: '',
    parentPhone: '',
    // ------------------------------------------
    permissions: {
      viewStudents: true,
      editStudents: false,
      deleteStudents: false,
      manageClasses: true,
      manageEvents: false,
      viewFinance: false,
      managePayments: false,
      manageExpenses: false,
      manageUsers: false,
      manageSystem: false,
      viewStaffPins: false,   // 🔐 NOVA
      viewStudentPins: false, // 🔐 NOVA
      all: false,             // 👑 PERMISSÃO GLOBAL
    },
    turmas: [],
    originalEmail: '' // 📧 Referência para reverter ou vincular contas
  })

  // Controla quais categorias de permissão estão abertas (Iniciam fechadas para maior limpeza visual)
  const [expandedCategories, setExpandedCategories] = useState({
    operational: false,
    finance: false,
    system: false,
    security: false,
    modalities: false
  })

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  // Efeito para popular dados em caso de EDIÇÃO
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // 🛡️ Normalização Robusta de Roles: Procura em múltiplos campos e formatos (Array, Objeto ou String)
        const rolesFromRoles = initialData.roles;
        const rolesFromPapeis = initialData.papeis;
        const rolesFromPapeisMap = initialData.papeisMap;
        const rolesFromRole = initialData.role;

        let combinedRoles = [];

        // 1. Processa 'roles' (Array ou Objeto)
        if (Array.isArray(rolesFromRoles)) {
          combinedRoles = [...combinedRoles, ...rolesFromRoles];
        } else if (typeof rolesFromRoles === 'object' && rolesFromRoles !== null) {
          combinedRoles = [...combinedRoles, ...Object.keys(rolesFromRoles).filter(r => rolesFromRoles[r])];
        }

        // 2. Processa 'papeis' (Objeto)
        if (typeof rolesFromPapeis === 'object' && rolesFromPapeis !== null && !Array.isArray(rolesFromPapeis)) {
          combinedRoles = [...combinedRoles, ...Object.keys(rolesFromPapeis).filter(r => rolesFromPapeis[r])];
        }

        // 3. Processa 'papeisMap' (Objeto)
        if (typeof rolesFromPapeisMap === 'object' && rolesFromPapeisMap !== null && !Array.isArray(rolesFromPapeisMap)) {
          combinedRoles = [...combinedRoles, ...Object.keys(rolesFromPapeisMap).filter(r => rolesFromPapeisMap[r])];
        }

        // 4. Processa 'role' singular (String)
        if (rolesFromRole && typeof rolesFromRole === 'string') {
          combinedRoles.push(rolesFromRole);
        }

        // Remove duplicados e filtra valores vazios
        let normRoles = [...new Set(combinedRoles)].filter(Boolean);

        // Fallback para 'aluno' apenas quando criando novo usuário
        if (normRoles.length === 0 && !initialData) {
          normRoles = ['aluno']
        }

        setFormData({
          name: initialData.nome || initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || initialData.telefone || '',
          pin: initialData.pin || '',
          roles: normRoles,
          modalities: initialData.modalities || [],
          belt: initialData.belt || 'none',
          stripes: initialData.stripes || 0,
          // --- NOVOS CAMPOS SINCRONIZADOS ---
          gender: initialData.gender || 'Masculino',
          ageCategory: initialData.ageCategory || 'Adulto',
          emergency: initialData.emergency || '',
          medical: initialData.medical || '',
          parentName: initialData.parentName || '',
          parentPhone: initialData.parentPhone || '',
          turmas: initialData.turmas || [],
          originalEmail: initialData.originalEmail || initialData.email || '',
          adminPin: initialData.adminPin || initialData.admPin || '',
          startDate: initialData.startDate || (initialData.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          // --------------------------------
          // 🛡️ Ao editar, preserva as permissões reais do usuário sem sobrescrever com defaults
          permissions: { ...(initialData.permissions || {}) }
        })
        setSelectedStudentId(initialData.id || null)
      } else {
        // Reset para nova criação
        setFormData({
          name: '', email: '', phone: '', pin: '',
          roles: [],
          modalities: [],
          belt: 'none',
          stripes: 0,
          gender: 'Masculino',
          ageCategory: 'Adulto',
          emergency: '',
          medical: '',
          parentName: '',
          parentPhone: '',
          turmas: [],
          originalEmail: '',
          adminPin: '',
          startDate: new Date().toISOString().split('T')[0],
          permissions: { ...defaultRolePermissions.aluno }
        })
        setSelectedStudentId(null)
      }
      setCreatedPin(null)
      setCountdown(0)

      // 📂 RESET DE SEÇÕES: Garante que as categorias comecem fechadas ao criar novo colaborador
      if (!initialData) {
        setExpandedCategories({
          operational: false,
          finance: false,
          system: false,
          security: false,
          modalities: false
        })
      }
    }
  }, [isOpen, initialData])

  // 🔥 Auto-seleção de turmas para modalidades com apenas uma turma
  React.useEffect(() => {
    if (!dbModalities) return;
    
    setFormData(prev => {
      const currentTurmas = prev.turmas || [];
      const newTurmas = [...currentTurmas];
      let changed = false;

      prev.modalities.forEach(modName => {
        const mod = dbModalities.find(m => 
          m.name.toLowerCase() === modName.toLowerCase() || 
          m.id.toLowerCase() === modName.toLowerCase()
        );
        if (mod && mod.turmas && mod.turmas.length === 1) {
          const uniqueId = `${mod.id}:${mod.turmas[0].id}`;
          if (!newTurmas.includes(uniqueId)) {
            newTurmas.push(uniqueId);
            changed = true;
          }
        }
      });

      if (changed) return { ...prev, turmas: newTurmas };
      return prev;
    });
  }, [formData.modalities, dbModalities]);

  // 🔥 Sincronização Automática de Turmas Únicas
  React.useEffect(() => {
    if (!dbModalities || dbModalities.length === 0) return

    setFormData(prev => {
      const currentTurmas = [...(prev.turmas || [])]
      let changed = false

      prev.modalities.forEach(modName => {
        const mod = dbModalities.find(m => m.name === modName)
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
          const turmaObj = (dbModalities || []).flatMap(m => m.turmas || []).find(t => t.id === tId)
          if (!turmaObj) return false
          const parentMod = dbModalities.find(m => m.id === turmaObj.modalityId)
          return parentMod && prev.modalities.includes(parentMod.name)
        }

        // Se for ID novo (com :), verifica se a modalidade pai ainda está selecionada
        const parentMod = dbModalities.find(m => m.id === modId)
        return parentMod && prev.modalities.includes(parentMod.name)
      })

      if (changed || updatedTurmas.length !== currentTurmas.length) {
        return { ...prev, turmas: updatedTurmas }
      }
      return prev
    })
  }, [formData.modalities, dbModalities])

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

  const [createdPin, setCreatedPin] = useState(null)
  const [countdown, setCountdown] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { setIsNavLocked } = useApp()

  // BLOQUEIO DE NAVEGAÇÃO: Impede sair da aba, voltar ou clicar em links
  const shouldLock = !!createdPin && countdown > 0

  React.useEffect(() => {
    setIsNavLocked(shouldLock)
  }, [shouldLock, setIsNavLocked])

  // Bloqueio de fechamento/refresh do navegador e Scroll Lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none' // Previne rolagem elástica no iOS
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }

    const handleBeforeUnload = (e) => {
      if (shouldLock) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [shouldLock, isOpen])

  // Filtro de busca para promoção de alunos
  const filteredStudents = studentSearch
    ? students.filter(s =>
      (s.nome || s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 5)
    : []

  /** Preenche o formulário ao selecionar um aluno existente */
  const handleSelectStudent = (student) => {
    // Ao selecionar um aluno, importamos os cargos dele (geralmente só 'aluno')
    const rawRoles = student.papeis || student.roles || { aluno: true }
    const studentRoles = Array.isArray(rawRoles)
      ? rawRoles
      : Object.keys(rawRoles).filter(r => rawRoles[r])

     setFormData(prev => ({
       ...prev,
       name: student.nome || student.name,
       email: student.email || '',
       phone: student.phone || '',
       roles: studentRoles,
       modalities: student.modalities || [],
       belt: student.belt || 'none',
       stripes: student.stripes || 0,
       // --- NOVOS CAMPOS SINCRONIZADOS ---
       gender: student.gender || 'Masculino',
       ageCategory: student.ageCategory || 'Adulto',
       emergency: student.emergency || '',
       medical: student.medical || '',
       parentName: student.parentName || '',
       parentPhone: student.parentPhone || '',
       // --------------------------------
       permissions: mergePermissions(studentRoles)
     }))
    setSelectedStudentId(student.id)
    setStudentSearch('')
  }

  /** Alterna o estado de expansão de uma categoria */
  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  /** Alterna uma permissão individual */
  const handleTogglePermission = (key) => {
    setFormData(prev => {
      const isCurrentlyOn = prev.permissions[key];
      const isTurningOff = isCurrentlyOn;

      let newPermissions = { ...prev.permissions, [key]: !isCurrentlyOn };

      // Regras de dependência (desligamento automático)
      if (key === 'viewStudents' && isTurningOff) {
         newPermissions.editStudents = false;
         newPermissions.deleteStudents = false;
      }
      if (key === 'viewFinance' && isTurningOff) {
         newPermissions.managePayments = false;
         newPermissions.manageExpenses = false;
      }
      if (key === 'viewExpensesTab' && isTurningOff) {
         newPermissions.manageExpensesTab = false;
      }
      if (key === 'viewBillingTab' && isTurningOff) {
         newPermissions.manageBillingTab = false;
      }

      return {
        ...prev,
        permissions: newPermissions
      };
    });
  }

  // Mapa de permissões padrão por cargo para preenchimento automático
  const defaultRolePermissions = {
    admin: {
      viewStudents: true, editStudents: true, deleteStudents: true,
      manageClasses: true, manageEvents: true,
      viewFinance: true, managePayments: true, manageExpenses: true,
      viewExpensesTab: true, manageExpensesTab: true,
viewBillingTab: true, manageBillingTab: true,
      visualizar_relatorio_pagamentos: true,
      manageUsers: true, manageSystem: true,
      viewStaffPins: true, viewStudentPins: true
    },
    gestor: {
      viewStudents: true, editStudents: true, deleteStudents: false,
      manageClasses: true, manageEvents: true,
      viewFinance: true, managePayments: true, manageExpenses: true,
      viewExpensesTab: true, manageExpensesTab: true,
viewBillingTab: true, manageBillingTab: true,
      visualizar_relatorio_pagamentos: true,
      manageUsers: false, manageSystem: false,
      viewStaffPins: true, viewStudentPins: true
    },
    professor: {
      viewStudents: true, editStudents: false, deleteStudents: false,
      manageClasses: true, manageEvents: true,
      viewFinance: false, managePayments: false, manageExpenses: false,
      viewExpensesTab: false, manageExpensesTab: false,
      viewBillingTab: false, manageBillingTab: false,
      visualizar_relatorio_pagamentos: false,
      manageUsers: false, manageSystem: false,
      viewStaffPins: false, viewStudentPins: true
    },
    aluno: {
      viewStudents: false, editStudents: false, deleteStudents: false,
      manageClasses: false, manageEvents: false,
      viewFinance: false, managePayments: false, manageExpenses: false,
      viewExpensesTab: false, manageExpensesTab: false,
      viewBillingTab: false, manageBillingTab: false,
      visualizar_relatorio_pagamentos: false,
      manageUsers: false, manageSystem: false,
      viewStaffPins: false, viewStudentPins: false
    }
  }

  /** Mescla permissões de múltiplos cargos selecionados (União de IDs) */
  const mergePermissions = (selectedRoles) => {
    const merged = { ...defaultRolePermissions.aluno }
    selectedRoles.forEach(roleId => {
      const perms = defaultRolePermissions[roleId]
      if (perms) {
        Object.keys(perms).forEach(key => {
          if (perms[key]) merged[key] = true
        })
      }
    })
    return merged
  }

/** Gerencia a adição/remoção de cargos no array */
  const handleRoleToggle = (roleId) => {
    if (!(myRank >= (ROLE_RANK[roleId] || 0) || effectiveRole === 'admin')) return
    setFormData(prev => {
      const isCurrentlySelected = prev.roles.includes(roleId)
      const newRoles = isCurrentlySelected
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]

      // Removida a trava que forçava 'aluno'

      return {
        ...prev,
        roles: newRoles,
        // Só recalcula permissões se o usuário tiver permissão para alterar
        permissions: mergePermissions(newRoles)
      }
    })
  }

  // 🥋 Lógica de Faixas Dinâmicas (Idêntica ao AddStudentModal)
  const getBeltOptions = () => {
    const baseOptions = [['none', 'Sem Faixa']];
    const dynamicBelts = [];
    const currentCategoryName = (formData.ageCategory || 'Adulto').toLowerCase();

    formData.modalities.forEach(modId => {
      const mod = dbModalities?.find(m => m.id === modId || m.name === modId);
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

  /** Envia os dados para o Firebase */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (formData.roles.length === 0) {
      setError('Selecione ao menos um cargo para este usuário.')
      setLoading(false)
      return
    }

    // 🔒 Validação: impede conceder permissões que o usuário não possui
    if (effectiveRole !== 'admin') {
      const notAllowed = Object.keys(formData.permissions).filter(
        k => formData.permissions[k] && !canGrantPermission(k)
      )
      if (notAllowed.length > 0) {
        setError(`Você não tem permissão para conceder: ${notAllowed.join(', ')}.`)
        setLoading(false)
        return
      }
    }

    try {
      // Determina papel principal para exibição legada
      const primaryRole = formData.roles.includes('admin') ? 'admin' :
        formData.roles.includes('gestor') ? 'gestor' :
          formData.roles.includes('professor') ? 'professor' : 'aluno';

      // Converte roles de Array para Objeto (Padrão SSoT / RBAC)
      const rolesMap = formData.roles.reduce((acc, r) => ({ ...acc, [r]: true }), {})

      // 📱 Processamento do Telefone
      const phoneData = parsePhoneData(formData.phone)
      if (!phoneData) {
        setError('Telefone inválido. Use o padrão: 91 99999-9999')
        setLoading(false)
        return
      }

      // 👑 Lógica de Shadow Account para ADMIN
      const finalEmail = formData.email;
      const finalOriginalEmail = formData.originalEmail || formData.email;

      const result = await createNewUser({
        ...formData,
        email: finalEmail,
        originalEmail: finalOriginalEmail,
        adminPin: formData.adminPin,
        phone: phoneData.display,
        ddd: phoneData.ddd,
        telefone_limpo: phoneData.telefone_limpo,
        telefone_completo: phoneData.telefone_completo,
        role: primaryRole,
        roles: rolesMap
      })

      setCreatedPin({ 
        pin: result.pin, 
        adminPin: result.adminPin 
      })
      setCountdown(10) // Reinicia contador de segurança

      // Inicia o timer de 10 segundos
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(`Erro ao processar usuário: ${err.message || 'Falha ao salvar no banco de dados.'}`)
      console.error('Detalhe do erro no modal:', err)
    } finally {
      setLoading(false)
    }
  }

  const { userData, effectiveRole } = useAuth()

  // 👑 HIERARQUIA DE CARGOS (Ranking)
  const ROLE_RANK = { admin: 4, gestor: 3, professor: 2, aluno: 1 }
  const myRank = ROLE_RANK[effectiveRole] || 1

  /** Lista de cargos permitidos para o usuário atual + cargos do usuário sendo editado */
  const baseRoles = [
    { id: 'admin', label: 'Admin', desc: 'Total' },
    { id: 'gestor', label: 'Gestor', desc: 'Gerência' },
    { id: 'professor', label: 'Prof.', desc: 'Aulas' },
    { id: 'aluno', label: 'Aluno', desc: 'Básico' },
  ]
  const availableRoles = baseRoles.filter(r =>
    myRank >= (ROLE_RANK[r.id] || 0) ||
    effectiveRole === 'admin' ||
    formData.roles.includes(r.id)
  )

  /** Verifica se o usuário logado tem uma permissão específica para poder concedê-la */
  const canGrantPermission = (key) => {
    if (effectiveRole === 'admin') return true
    if (userData?.permissions?.all) return true
    // Apenas concede se o usuário possui a permissão ativa (sem fallbacks)
    return !!userData?.permissions?.[key]
  }


  const modalContent = (
    createdPin ? (
      <motion.div 
        key="user-creation-success-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-hidden"
      >
        <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_0_100px_rgba(254,110,0,0.1)] text-center relative overflow-hidden">
          {/* Fundo decorativo de bloqueio */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full" />

          <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mx-auto mb-8 relative border border-primary/20 rotate-3">
            {countdown > 0 ? (
              <div className="flex flex-col items-center">
                <Lock size={20} className="text-primary mb-1 animate-bounce" />
                <span className="text-xl font-black text-primary">{countdown}s</span>
              </div>
            ) : (
              <Check size={40} className="text-primary -rotate-3 transition-transform" strokeWidth={3} />
            )}
          </div>

          <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Segurança Ativada</h2>
          <p className="text-[11px] text-gray-500 mb-10 leading-relaxed uppercase font-bold tracking-[0.1em] px-4">
            {countdown > 0
              ? 'Navegação bloqueada pelo sistema. Anote o PIN antes de continuar.'
              : 'O cofre foi liberado. Agora você pode prosseguir.'}
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-black border border-white/5 rounded-2xl p-5 relative group">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2 text-left">PIN DE ALUNO</p>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-mono font-black text-white tracking-[0.2em]">{createdPin.pin}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(createdPin.pin)}
                  className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {createdPin.adminPin && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 relative group animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-2">
                   <Shield size={10} className="text-primary" />
                   <p className="text-[10px] text-primary/60 uppercase tracking-widest font-black text-left">PIN ADMINISTRATIVO</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-4xl font-mono font-black text-primary tracking-[0.2em]">{createdPin.adminPin}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdPin.adminPin)}
                    className="p-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors text-primary/60 hover:text-primary"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={countdown > 0}
            onClick={() => { setCreatedPin(null); onClose(); }}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all
              ${countdown > 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                : 'bg-primary text-white hover:scale-[1.02] shadow-xl shadow-primary/20 hover:bg-white hover:text-black'}`}
          >
            Finalizar e Sair
          </button>
        </div>
      </motion.div>
    ) : (
      <motion.div 
        key="user-creation-form-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-backdrop z-[1000]" 
        onClick={onClose}
      >
        <motion.div 
          key="user-creation-form-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={e => e.stopPropagation()}
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="modal-content modal-content-bottom-sheet relative max-w-4xl w-full flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden bg-black/80 border border-white/5 shadow-2xl rounded-t-[32px] sm:rounded-[32px]"
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
                  <Shield
                    size={28}
                    strokeWidth={2.5}
                    style={{ color: 'var(--clr-primary)' }}
                  />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                    {initialData ? 'Editar Perfil' : 'Novo Colaborador'}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <span
                      className="w-1 h-1 rounded-full animate-pulse transition-all duration-300"
                      style={{
                        backgroundColor: 'var(--clr-primary)',
                        boxShadow: '0 0 10px var(--clr-primary)'
                      }}
                    />
                    Sincronização Unificada
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* CONTEÚDO COM ROLAGEM */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 space-y-7 custom-scrollbar">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-bold text-center tracking-widest">{error}</div>}

                {/* BUSCA DE ALUNOS */}
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Promover um Aluno Existente</label>
                  <div className="relative group">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-gray-700"
                      placeholder="Pesquisar por nome ou e-mail..."
                    />

                    {filteredStudents.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                        {filteredStudents.map(student => (
                          <button key={student.id} type="button" onClick={() => handleSelectStudent(student)} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left group/item">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-black transition-all">
                              <GraduationCap size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight">{student.nome || student.name}</p>
                              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{student.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Nome Completo *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium" placeholder="Nome do colaborador" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Smartphone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: formatPhoneUI(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium"
                        placeholder="91 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">E-mail (Único) *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium" placeholder="email@exemplo.com" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Data de Início na Academia *</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* --- NOVOS CAMPOS: GÊNERO E CATEGORIA --- */}
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    label="Gênero"
                    value={formData.gender}
                    onChange={v => setFormData({ ...formData, gender: v })}
                    options={[['Masculino', 'Masculino'], ['Feminino', 'Feminino']]}
                  />
                  <CustomSelect
                    label="Categoria de Idade"
                    value={formData.ageCategory}
                    onChange={v => setFormData({ ...formData, ageCategory: v })}
                    options={[['Adulto', 'Adulto'], ['Juvenil', 'Juvenil'], ['Kids', 'Kids']]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">PIN de Aluno (6 Dígitos)</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.pin}
                        onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                        className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/30 transition-all"
                        placeholder="Gerar automático"
                      />
                    </div>
                  </div>

                  {formData.roles.includes('admin') && (
                    <div className="space-y-1.5 animate-in slide-in-from-left-2">
                      <label className="text-[10px] text-primary uppercase tracking-widest font-bold ml-1">PIN Administrativo (Acesso Restrito)</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/50" />
                        <input
                          type="text"
                          maxLength={6}
                          value={formData.adminPin}
                          onChange={e => setFormData({ ...formData, adminPin: e.target.value.replace(/\D/g, '') })}
                          className="w-full pl-10 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm font-mono text-primary focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="Gerar automático"
                        />
                      </div>
                    </div>
                  )}
                </div>

                 {/* SELEÇÃO MÚLTIPLA DE CARGOS */}
                 <div className="space-y-3">
                   <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Atribuição de Cargos</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {availableRoles.map(r => {
                       const isSelected = formData.roles.includes(r.id)
                       const canToggle = myRank >= (ROLE_RANK[r.id] || 0) || effectiveRole === 'admin'
                       return (
                         <button key={r.id} type="button" disabled={!canToggle} onClick={() => handleRoleToggle(r.id)} className={`p-2.5 md:p-3 rounded-xl border text-center transition-all relative overflow-hidden group ${isSelected ? 'bg-primary border-primary shadow-lg shadow-primary/10' : 'bg-white/[0.02] border-white/5 hover:bg-white hover:border-white'} ${!canToggle ? 'opacity-50 cursor-not-allowed' : ''}`}>
                           <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-black'}`}>{r.label}</p>
                           <p className={`text-[8px] uppercase font-black tracking-tighter mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-600 group-hover:text-black/60'}`}>{r.desc}</p>
                         </button>
                       )
                     })}
                   </div>
                 </div>

                {/* MODALIDADES PARA PROFESSOR */}
                {formData.roles.includes('professor') && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 flex items-center gap-2">
                        <GraduationCap size={12} /> Modalidades de Ensino
                    </label>
                    <div className="bg-black border border-white/5 rounded-2xl p-4 grid grid-cols-2 gap-2">
                      {dbModalities.map(mod => (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => {
                            const isSelected = formData.modalities?.includes(mod.name)
                            setFormData(prev => ({
                              ...prev,
                              modalities: isSelected
                                ? prev.modalities.filter(m => m !== mod.name)
                                : [...(prev.modalities || []), mod.name]
                            }))
                          }}
                          className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.modalities?.includes(mod.name) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
                        >
                          {mod.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SELEÇÃO DE TURMAS (Estilo Dropdown ModalityModal) --- */}
                {(() => {
                  const relevantClasses = (dbModalities || [])
                    .filter(m => formData.modalities.some(modName => modName.toLowerCase() === m.name.toLowerCase()))
                    .flatMap(m => (m.turmas || []).map(t => ({
                      ...t,
                      modalityName: m.name,
                      uniqueId: `${m.id}:${t.id}`
                    })));

                  const hasRelevantClasses = (dbModalities || [])
                    .some(m => formData.modalities.some(modName => modName.toLowerCase() === m.name.toLowerCase()) && (m.turmas || []).length > 0);

                  if (!hasRelevantClasses) return null;

                  const selectedCount = (formData.turmas || []).length;

                  return (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 relative z-[100]" ref={dropdownRef}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                        <Users size={12} /> SELECIONAR TURMAS E HORÁRIOS
                      </label>

                      <div className="relative">
                        <div
                          onClick={() => setShowTurmasDropdown(!showTurmasDropdown)}
                          className={`w-full h-[54px] bg-black border text-sm text-gray-300 font-medium flex items-center justify-between cursor-pointer transition-all rounded-2xl px-6 py-4 hover:bg-black ${showTurmasDropdown ? 'ring-1 ring-primary/50 border-primary/50' : 'border-white/10'}`}
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
                              className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0B0B0B] opacity-100 border border-white/10 rounded-2xl z-[600] overflow-y-auto max-h-64 no-scrollbar shadow-2xl py-2"
                            >
                              {relevantClasses.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Nenhuma turma encontrada</p>
                                </div>
                              ) : (
                                relevantClasses.map(turma => {
                                  const isSelected = (formData.turmas || []).includes(turma.uniqueId);
                                  return (
                                    <button
                                      key={turma.uniqueId}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData(prev => {
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

                 {/* GRADUAÇÃO (Somente se houver modalidade com sistema de faixas) */}
                 {dbModalities?.some(m => formData.modalities?.includes(m.name) && m.hasBelt !== false) && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 relative z-[40]">
                    <CustomSelect
                      label="Faixa Atual"
                      value={formData.belt}
                      onChange={v => setFormData({ ...formData, belt: v })}
                      options={getBeltOptions()}
                    />
                    <CustomSelect
                      label="Graus (Stripes)"
                      value={formData.stripes}
                      onChange={v => setFormData({ ...formData, stripes: v })}
                      options={[
                        [0, 'Nenhum Grau'],
                        [1, '1 Grau'],
                        [2, '2 Graus'],
                        [3, '3 Graus'],
                        [4, '4 Graus']
                      ]}
                    />
                  </div>
                )}

                {/* --- NOVOS CAMPOS: SAÚDE E SEGURANÇA --- */}
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
                          value={formData.emergency}
                          onChange={e => setFormData({ ...formData, emergency: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium"
                          placeholder="Nome e Telefone"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Restrições Médicas</label>
                      <div className="relative">
                        <HeartPulse size={14} className="absolute left-3.5 top-4 text-gray-600" />
                        <textarea
                          value={formData.medical}
                          onChange={e => setFormData({ ...formData, medical: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium min-h-[100px] outline-none"
                          placeholder="Ex: Alergias, problemas físicos..."
                        />
                      </div>
                    </div>

                    {(formData.ageCategory === 'Kids' || formData.ageCategory === 'Juvenil') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Responsável Legal</label>
                          <input
                            type="text"
                            value={formData.parentName}
                            onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium"
                            placeholder="Nome do Pai/Mãe"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">WhatsApp Responsável</label>
                          <input
                            type="text"
                            value={formData.parentPhone}
                            onChange={e => setFormData({ ...formData, parentPhone: formatPhoneUI(e.target.value) })}
                            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium"
                            placeholder="91 99999-9999"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PERMISSÕES CATEGORIZADAS (ACCORDIONS) */}
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Configurações de Permissão</label>
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">

                    {/* --- OPERACIONAL --- */}
                    <div className="group/cat">
                      <button type="button" onClick={() => toggleCategory('operational')} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <Users size={14} className={expandedCategories.operational ? 'text-blue-400' : 'text-gray-600'} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${expandedCategories.operational ? 'text-white' : 'text-gray-500'}`}>Operacional & Alunos</span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-600 transition-transform duration-300 ${expandedCategories.operational ? 'rotate-180 text-blue-400' : ''}`} />
                      </button>
                      {expandedCategories.operational && (
                        <div className="px-5 pb-6 pt-2 space-y-4 animate-in fade-in slide-in-from-top-1">
                          {[
                             { k: 'viewStudents', l: 'Visualizar Alunos', d: 'Ver lista e perfis.' },
                             { k: 'editStudents', l: 'Cadastrar/Editar', d: 'Criar e alterar dados.', dep: 'viewStudents' },
                             { k: 'manageClasses', l: 'Gerenciar Chamadas', d: 'Iniciar aulas e treinos.' },
                             { k: 'manageEvents', l: 'Gerenciar Eventos', d: 'Eventos e graduações.' },
                             { k: 'deleteStudents', l: 'Excluir Registros', d: 'Deletar alunos do sistema.', r: true, dep: 'viewStudents' },
                           ].filter(p => canGrantPermission(p.k)).map(p => {
                             const isGhost = p.dep && !formData.permissions[p.dep];
                             return (
                               <div key={p.k} className={`flex items-center justify-between ${isGhost ? 'opacity-30 grayscale' : ''}`}>
                                 <div className="flex-1 pr-6">
                                   <p className={`text-[11px] font-bold uppercase tracking-tight ${p.r ? 'text-red-400' : 'text-gray-200'}`}>{p.l}</p>
                                   <p className="text-[10px] text-gray-500 font-medium leading-tight">{p.d}</p>
                                 </div>
                                 <button type="button" disabled={isGhost} onClick={() => handleTogglePermission(p.k)} className={`w-9 h-5 rounded-full relative transition-all ${formData.permissions[p.k] && !isGhost ? (p.r ? 'bg-red-500' : 'bg-primary') : 'bg-gray-800'} ${isGhost ? 'cursor-not-allowed' : ''}`}>
                                   <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions[p.k] && !isGhost ? 'translate-x-4' : ''}`} />
                                 </button>
                               </div>
                             )
                           })}
                        </div>
                      )}
                    </div>

                    {/* --- FINANCEIRO --- */}
                    <div className="group/cat">
                      <button type="button" onClick={() => toggleCategory('finance')} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <Landmark size={14} className={expandedCategories.finance ? 'text-emerald-400' : 'text-gray-600'} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${expandedCategories.finance ? 'text-white' : 'text-gray-500'}`}>Financeiro</span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-600 transition-transform duration-300 ${expandedCategories.finance ? 'rotate-180 text-emerald-400' : ''}`} />
                      </button>
                      {expandedCategories.finance && (
                        <div className="px-5 pb-6 pt-2 space-y-4 animate-in fade-in slide-in-from-top-1">
                          {[
                            { k: 'viewFinance', l: 'Ver Relatórios', d: 'Acesso a lucros e KPIs.' },
                            { k: 'managePayments', l: 'Processar mensalidades.', d: 'Lançar mensalidades.', dep: 'viewFinance' },
                          ].filter(p => canGrantPermission(p.k)).map(p => {
                            const isStudent = (formData.modalities || []).length > 0;
                            const isGhost = (p.dep && !formData.permissions[p.dep]) || (p.k === 'managePayments' && isStudent && !formData.permissions.managePayments);
                            return (
                              <div key={p.k} className={`flex items-center justify-between ${isGhost ? 'opacity-30 grayscale' : ''}`}>
                                <div className="flex-1 pr-6">
                                  <p className="text-[11px] font-bold uppercase tracking-tight text-gray-200">{p.l}</p>
                                  <p className="text-[10px] text-gray-500 font-medium leading-tight">{p.d}</p>
                                </div>
                                <button type="button" disabled={isGhost} onClick={() => handleTogglePermission(p.k)} className={`w-9 h-5 rounded-full relative transition-all ${formData.permissions[p.k] && !isGhost ? 'bg-primary' : 'bg-gray-800'} ${isGhost ? 'cursor-not-allowed' : ''}`}>
                                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions[p.k] && !isGhost ? 'translate-x-4' : ''}`} />
                                </button>
                              </div>
                            )
                          })}

                          {/* Despesas */}
                          {canGrantPermission('viewExpensesTab') && (
                            <div className="pt-3 border-t border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Despesas</p>
                              {[
                                { k: 'viewExpensesTab', l: 'Ver aba Despesas', d: 'Acessar a aba de despesas.', dep: 'viewFinance' },
                                { k: 'manageExpensesTab', l: 'Gerenciar aba Despesas', d: 'Adicionar/editar despesas.', dep: 'viewExpensesTab' },
                              ].filter(p => canGrantPermission(p.k)).map(p => {
                                const isGhost = p.dep && !formData.permissions[p.dep];
                                return (
                                  <div key={p.k} className={`flex items-center justify-between ${isGhost ? 'opacity-30 grayscale' : ''}`}>
                                    <div className="flex-1 pr-6">
                                      <p className="text-[11px] font-bold uppercase tracking-tight text-gray-200">{p.l}</p>
                                      <p className="text-[10px] text-gray-500 font-medium leading-tight">{p.d}</p>
                                    </div>
                                    <button type="button" disabled={isGhost} onClick={() => handleTogglePermission(p.k)} className={`w-9 h-5 rounded-full relative transition-all ${formData.permissions[p.k] && !isGhost ? 'bg-primary' : 'bg-gray-800'} ${isGhost ? 'cursor-not-allowed' : ''}`}>
                                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions[p.k] && !isGhost ? 'translate-x-4' : ''}`} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Cobrança */}
                          {canGrantPermission('viewBillingTab') && (
                            <div className="pt-3 border-t border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Cobrança</p>
                              {[
{ k: 'viewBillingTab', l: 'Ver aba Cobrança', d: 'Acessar a aba de cobranças.', dep: 'viewFinance' },
                                { k: 'manageBillingTab', l: 'Gerenciar aba Cobrança', d: 'Adicionar/editar cobranças.', dep: 'viewBillingTab' },
                                { k: 'visualizar_relatorio_pagamentos', l: 'Visualizar Relatório', d: 'Gerar relatórios de pagamentos.', dep: 'viewBillingTab' },
                              ].filter(p => canGrantPermission(p.k)).map(p => {
                                const isGhost = p.dep && !formData.permissions[p.dep];
                                return (
                                  <div key={p.k} className={`flex items-center justify-between ${isGhost ? 'opacity-30 grayscale' : ''}`}>
                                    <div className="flex-1 pr-6">
                                      <p className="text-[11px] font-bold uppercase tracking-tight text-gray-200">{p.l}</p>
                                      <p className="text-[10px] text-gray-500 font-medium leading-tight">{p.d}</p>
                                    </div>
                                    <button type="button" disabled={isGhost} onClick={() => handleTogglePermission(p.k)} className={`w-9 h-5 rounded-full relative transition-all ${formData.permissions[p.k] && !isGhost ? 'bg-primary' : 'bg-gray-800'} ${isGhost ? 'cursor-not-allowed' : ''}`}>
                                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions[p.k] && !isGhost ? 'translate-x-4' : ''}`} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* --- GESTÃO --- */}
                    <div className="group/cat">
                      <button type="button" onClick={() => toggleCategory('system')} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <Settings size={14} className={expandedCategories.system ? 'text-purple-400' : 'text-gray-600'} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${expandedCategories.system ? 'text-white' : 'text-gray-500'}`}>Gestão e Sistema</span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-600 transition-transform duration-300 ${expandedCategories.system ? 'rotate-180 text-purple-400' : ''}`} />
                      </button>
                      {expandedCategories.system && (
                        <div className="px-5 pb-6 pt-2 space-y-4 animate-in fade-in slide-in-from-top-1">
                          {[
                             { k: 'manageUsers', l: 'Gerenciar Equipe', d: 'Criar outros colaboradores.' },
                             { k: 'manageSystem', l: 'Configurar Regras', d: 'Modalidades e graduações.' },
                           ].filter(p => canGrantPermission(p.k)).map(p => (
                               <div key={p.k} className="flex items-center justify-between">
                                 <div className="flex-1 pr-6">
                                   <p className="text-[11px] font-bold uppercase tracking-tight text-gray-200">{p.l}</p>
                                   <p className="text-[10px] text-gray-500 font-medium leading-tight">{p.d}</p>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => handleTogglePermission(p.k)}
                                   className={`w-9 h-5 rounded-full relative transition-all ${formData.permissions[p.k] ? 'bg-primary' : 'bg-gray-800'}`}
                                 >
                                   <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions[p.k] ? 'translate-x-4' : ''}`} />
                                 </button>
                               </div>
                           ))}
                        </div>
                      )}
                    </div>

                    {/* --- SEGURANÇA (NOVO) --- */}
                    <div className="group/cat">
                      <button type="button" onClick={() => setExpandedCategories(p => ({ ...p, security: !p.security }))} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <Lock size={14} className={expandedCategories.security ? 'text-orange-400' : 'text-gray-600'} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${expandedCategories.security ? 'text-white' : 'text-gray-500'}`}>Segurança & Privacidade</span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-600 transition-transform duration-300 ${expandedCategories.security ? 'rotate-180 text-orange-400' : ''}`} />
                      </button>
                      {expandedCategories.security && (
                        <div className="px-5 pb-6 pt-2 space-y-4 animate-in fade-in slide-in-from-top-1">
                          {[
                             { k: 'viewStaffPins', l: 'Ver PIN da Equipe', d: 'Acesso a senhas de colaboradores.' },
                             { k: 'viewStudentPins', l: 'Ver PIN de Alunos', d: 'Acesso a senhas de alunos.' },
                             { k: 'all', l: 'Acesso Total (Super Admin)', d: 'Ignora todas as restrições.', r: true },
                           ].filter(p => canGrantPermission(p.k)).map(p => (
                               <div key={p.k} className="flex items-center justify-between">
                                 <div className="flex-1 pr-6">
                                   <p className={`text-[11px] font-bold uppercase tracking-tight ${p.r ? 'text-red-400' : 'text-gray-200'}`}>{p.l}</p>
                                   <p className="text-[10px] text-gray-500 font-medium leading-tight">{p.d}</p>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => handleTogglePermission(p.k)}
                                   className={`w-9 h-5 rounded-full relative transition-all ${formData.permissions[p.k] ? (p.r ? 'bg-red-500' : 'bg-orange-500') : 'bg-gray-800'}`}
                                 >
                                   <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions[p.k] ? 'translate-x-4' : ''}`} />
                                 </button>
                               </div>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <Info size={16} className="text-gray-500 shrink-0" />
                  <p className="text-[9px] text-gray-500 leading-tight uppercase font-black">O sistema gera um PIN aleatório se não for definido manualmente. Este PIN é a chave de acesso do colaborador.</p>
                </div>
              </div>

              {/* RODAPÉ PREMIUM (STICKY) */}
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
                  disabled={loading}
                  className="flex-[2] py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white hover:text-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--clr-primary)',
                    boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                  }}
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                  {loading ? 'Salvando...' : (initialData ? 'Salvar Edição' : 'Confirmar Cadastro')}
                </button>
              </div>
            </form>
        </motion.div>
      </motion.div>
    )
  );

  return createPortal(modalContent, document.body)
}


























