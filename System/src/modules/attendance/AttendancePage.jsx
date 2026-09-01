// COMPONENTE DE GERENCIAMENTO DE CHAMADAS (ATTENDANCE)
// Este módulo gerencia o início de sessões de aula, marcação de presença e consulta ao histórico.
import React, { useState, useEffect, useMemo } from 'react'
import {
  ClipboardCheck, Search, Check, X, Plus, Clock, Calendar,
  User, History, Trophy, Eye, Info, AlertTriangle, Clock3, ChevronDown, ChevronUp,
  Edit3, ChevronRight, RefreshCcw, LayoutGrid, List, UserPlus, Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, getDocs, orderBy, limit, doc, addDoc, setDoc, serverTimestamp, increment, where } from 'firebase/firestore'
import { COLLECTIONS, SUB_COLLECTIONS, FIELDS } from '../../firebase/collections'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useStudents } from '../../hooks/useStudents'
import { extrairDadosAuth } from '../../hooks/usarLogsSistema'
import { beltConfig } from '../../data/beltConfig'
import { useModalities } from '../../hooks/useModalities'
import { useSystemUsers } from '../../hooks/useSystemUsers'
import { useAttendanceAlerts } from '../../hooks/useAttendanceAlerts'
import { attendanceService } from '../../services/attendanceService'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import MobileHeader from '../../components/navigation/MobileHeader'
import PageHeader from '../../components/shared/PageHeader'
import AddStudentModal from '../../components/shared/AddStudentModal'
import { normalizeStr } from '../../utils/stringUtils'

import { db } from '../../firebase/config'

// Alerta visual de frequência do aluno (Atenção ou Crítico)
const StudentAttendanceAlert = ({ student }) => {
  // DESATIVADO PARA PERFORMANCE (EVITA N REQUISIÇÕES AO DATABASE AO ABRIR CHAMADA)
  return null;
}

// Formatação auxiliar de data e hora para inputs no fuso de Brasília
function getBrasiliaDate() {
  const now = new Date();
  const spStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(spStr);
}

function formatInputDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureTimeFormat(time) {
  if (!time || typeof time !== 'string') return '20:00'
  const parts = time.split(':')
  const hours = (parts[0] || '20').padStart(2, '0')
  const minutes = (parts[1] || '00').padStart(2, '0')
  return `${hours}:${minutes}`
}

// ── Componente de Seleção Customizado ──────────────────────────────────────────
function CustomSelect({ label, value, onChange, options, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = React.useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o[0] === value) || options[0]

  return (
    <div className={`flex flex-col gap-1.5 relative ${isOpen ? 'z-[500]' : 'z-[10]'}`} ref={ref}>
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="form-input bg-black h-[50px] opacity-100 text-sm px-6 text-gray-300 font-medium text-left flex justify-between items-center w-full disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-2xl transition-all hover:bg-[#080808] focus:ring-1 focus:ring-white/20"
      >
        <span className="truncate font-bold">{selectedOption ? selectedOption[1] : '...'}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <>
            {/* Backdrop invisível para fechar ao clicar fora */}
            <div className="fixed inset-0 z-[998]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0B0B0B] opacity-100 border border-white/10 rounded-2xl z-[600] overflow-hidden shadow-2xl py-2"
            >
              {options.map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => { onChange(v); setIsOpen(false) }}
                  className={`w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider transition-colors hover:bg-white/5 border-b border-white/[0.02] last:border-0 ${value === v ? 'text-primary bg-primary/5' : 'text-gray-400'}`}
                >
                  {l}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AttendancePage() {
  const { currentModality, isAdminView, setCurrentModality, setCollapsed, setIsMobileNavHidden } = useApp()
  const isMobile = window.innerWidth <= 768
  const { students, addStudent } = useStudents()
  const { addVisitor } = useStudents()
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [sessionModality, setSessionModality] = useState('')
  const [sessionDate, setSessionDate] = useState(formatInputDate(getBrasiliaDate()))
  const [sessionTime, setSessionTime] = useState('20:00')
  const [sessionProfessor, setSessionProfessor] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [isSavingSession, setIsSavingSession] = useState(false)
  const [searchActive, setSearchActive] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [isFinishingSession, setIsFinishingSession] = useState(false)
  const [recentSessions, setRecentSessions] = useState([])
  const [sessionAttendance, setSessionAttendance] = useState({})
  const [sessionVisitors, setSessionVisitors] = useState([])
  const [sessionNotes, setSessionNotes] = useState('')
  const { modalities, allTurmas, loading: loadingModalities } = useModalities()
  const { users: staffMembers } = useSystemUsers()
  const { user, userData, effectiveRole } = useAuth()
  const usuarioLog = extrairDadosAuth(userData, effectiveRole)

  const isPowerUser = effectiveRole === 'admin' || effectiveRole === 'gestor'
  const CRIADO_EM = FIELDS.CRIADO_EM || 'criadoEm'
  const INSTRUTOR_ID = FIELDS.INSTRUTOR_ID || 'instrutorId'
  const NOME_INSTRUTOR = FIELDS.NOME_INSTRUTOR || 'nomeInstrutor'
  const MODALIDADE = FIELDS.MODALIDADE || 'modalidade'
  const DATA = FIELDS.DATA || 'data'
  const HORARIO = FIELDS.HORARIO || 'horario'
  const OBSERVACAO = FIELDS.OBSERVACAO || 'observacao'

  // 🥋 Filter modalities for professors (RBAC)
  const availableModalities = useMemo(() => {
    if (loadingModalities) return []
    // 👑 Admin/Gestor see everything
    if (isPowerUser && isAdminView) return modalities
    // 🎓 Professors only see what's assigned to them
    const myModalities = userData?.modalities || []
    return modalities.filter(m => myModalities.includes(m.name))
  }, [modalities, loadingModalities, isAdminView, userData, isPowerUser])

  const getAvailableTurmas = (mod) => {
    const turmas = mod.turmas?.filter(t => t.status === 'ativo') || []
    if (isPowerUser && isAdminView) return turmas

    // Para professores, filtra apenas as turmas em que eles dão aula (case-insensitive e includes)
    return turmas.filter(t => {
      const myName = (userData?.nome || userData?.name || '').toLowerCase().trim()
      const myId = user?.uid

      if (t.professors && Array.isArray(t.professors) && t.professors.length > 0) {
        return t.professors.some(p => {
          const pName = (p.nome || p.name || '').toLowerCase().trim()
          return p.id === myId || (myName && pName.includes(myName)) || (pName && myName.includes(pName))
        })
      }

      const tProfName = (t.professor || '').toLowerCase()
      return t.professorId === myId || (myName && tProfName.includes(myName)) || (tProfName && myName.includes(tProfName))
    })
  }

  const [showMobileConfig, setShowMobileConfig] = useState(false)
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false)
  const [unmarkedAlert, setUnmarkedAlert] = useState(false)
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(8)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [showVisitorModal, setShowVisitorModal] = useState(false)
  const [showObsModal, setShowObsModal] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [obsText, setObsText] = useState('')

  // 🔥 Auto-seleção de modalidade única (UX para Professores)
  useEffect(() => {
    if (loadingModalities || availableModalities.length === 0) return

    // Se já houver uma modalidade selecionada, verifica se ela ainda é válida para este usuário
    if (sessionModality) {
      const isValid = availableModalities.some(m =>
        m.name.toLowerCase() === sessionModality.toLowerCase() ||
        m.id.toLowerCase() === sessionModality.toLowerCase()
      )
      if (!isValid) setSessionModality('')
      return
    }

    // Se houver apenas uma modalidade disponível, seleciona automaticamente
    if (availableModalities.length === 1) {
      const single = availableModalities[0]
      setSessionModality(single.name)

      const turmas = getAvailableTurmas(single)
      if (turmas.length > 0) {
        const time = ensureTimeFormat(turmas[0].horario || turmas[0].horarioInicio)
        setSessionTime(time)
        syncProfessors(single.name, time)
      }
    }
  }, [availableModalities, loadingModalities, sessionModality])

  // 🔥 Inicializar professor responsável com o usuário logado (Apenas uma vez)
  const hasInitializedProfessor = React.useRef(false)
  const wasManuallyEdited = React.useRef(false)
  
  useEffect(() => {
    if (userData && !hasInitializedProfessor.current) {
      const myName = userData.nome || userData.name || ''
      if (myName) {
        setSessionProfessor(myName)
        hasInitializedProfessor.current = true
      }
    }
  }, [userData])

  // ── States dos Filtros de Histórico ──────────────────────────────────────────
  const [historySortBy, setHistorySortBy] = useState('recente')
  const [historyModalityFilter, setHistoryModalityFilter] = useState('todas')
  const [historyProfessorFilter, setHistoryProfessorFilter] = useState('todos')
  const [historyTypeFilter, setHistoryTypeFilter] = useState('todos')
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState('todos')

  useEffect(() => {
    if (activeSession) {
      setIsMobileNavHidden(true)
      return () => setIsMobileNavHidden(false)
    }
  }, [activeSession, setIsMobileNavHidden])

  // Gerenciar visibilidade da navegação inferior
  useHideMobileNav(showMobileConfig || showModal)

  // Busca de registros da sessão no Firestore
  async function fetchAttendanceRecords(sessionId) {
    try {
      const records = await attendanceService.getSessionAttendances(sessionId)
      setSessionAttendance(records)
    } catch (err) {
      console.error('Erro ao buscar registros', err)
    }
  }

  useEffect(() => {
    if (activeSession?.id) fetchAttendanceRecords(activeSession.id)
    else setSessionAttendance({})
  }, [activeSession?.id])

  useEffect(() => {
    fetchRecentSessions()
  }, [user?.uid, isPowerUser])

  const instructorsOnly = useMemo(() => {
    return staffMembers.filter(s => {
      const roles = s.papeis || s.roles || {}
      return roles.gestor || roles.professor
    }).map(s => ({
      ...s,
      name: s.nome || s.name || 'Sem Nome'
    }))
  }, [staffMembers])



  const filteredInstructors = useMemo(() => {
    const search = (sessionProfessor || '').toLowerCase().trim();
    if (!search) return instructorsOnly;
    return instructorsOnly.filter(s => 
      s.name.toLowerCase().includes(search)
    );
  }, [instructorsOnly, sessionProfessor]);

  useEffect(() => {
    if (!currentModality) return
    const isValid = availableModalities.some(m =>
      m.name.toLowerCase() === currentModality.toLowerCase() ||
      m.id.toLowerCase() === currentModality.toLowerCase()
    )
    if (isValid) {
      setSessionModality(currentModality)
    }
  }, [currentModality, availableModalities])

  async function fetchRecentSessions() {
    if (!user?.uid) return

    try {
      let q
      let docs = []

      // 👑 Admin/Gestor veem tudo.
      if (isPowerUser) {
        q = query(collection(db, COLLECTIONS.CHAMADAS), orderBy(CRIADO_EM, 'desc'), limit(50))
        const snap = await getDocs(q)
        docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } else {
        // 🎓 Professor: Busca por instrutorId (Novo padrão PT-BR)
        const qUid = query(
          collection(db, COLLECTIONS.CHAMADAS),
          where(INSTRUTOR_ID, '==', user.uid),
          limit(50)
        )
        const snapUid = await getDocs(qUid)
        docs = snapUid.docs.map(d => ({ id: d.id, ...d.data() }))

        // 🔍 Se não achou nada por UID (PT-BR), tenta pelo instructorId (Legado EN)
        if (docs.length === 0) {
          const qLegacy = query(
            collection(db, COLLECTIONS.CHAMADAS),
            where('instructorId', '==', user.uid),
            limit(50)
          )
          const snapLegacy = await getDocs(qLegacy)
          docs = snapLegacy.docs.map(d => ({ id: d.id, ...d.data() }))
        }

        // 🔍 Se ainda não achou nada, tenta pelo NOME (Professor - Dados muito antigos)
        if (docs.length < 5 && userData?.nome) {
          const qName = query(
            collection(db, COLLECTIONS.CHAMADAS),
            where('professor', '==', userData.nome),
            limit(50)
          )
          const snapName = await getDocs(qName)
          const nameDocs = snapName.docs.map(d => ({ id: d.id, ...d.data() }))

          const existingIds = new Set(docs.map(d => d.id))
          nameDocs.forEach(nd => {
            if (!existingIds.has(nd.id)) docs.push(nd)
          })
        }
      }

      // 🕒 Ordenação manual no cliente para garantir que os mais recentes apareçam primeiro
      docs.sort((a, b) => {
        const dateA = (a[CRIADO_EM]?.seconds || a.createdAt?.seconds || 0)
        const dateB = (b[CRIADO_EM]?.seconds || b.createdAt?.seconds || 0)
        if (dateB !== dateA) return dateB - dateA
        return (b.date || '').localeCompare(a.date || '')
      })

      setRecentSessions(docs.slice(0, 15))
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)

      // 🆘 FALLBACK FINAL: Se ainda não carregou nada (ex: banco vazio), carrega últimas gerais
      if (docs.length === 0) {
        const fallbackQ = query(collection(db, COLLECTIONS.CHAMADAS), limit(20))
        const snap = await getDocs(fallbackQ)
        const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }))

        let filtered = allDocs
        if (!isPowerUser) {
          filtered = allDocs.filter(d =>
            d[INSTRUTOR_ID] === user.uid ||
            d.instructorId === user.uid ||
            d.professor === userData?.name
          )
        }

        filtered.sort((a, b) => (b[CRIADO_EM]?.seconds || b.createdAt?.seconds || 0) - (a[CRIADO_EM]?.seconds || a.createdAt?.seconds || 0))
        setRecentSessions(filtered)

        // Se não houver professor selecionado, tenta pegar o último usado
        if (!sessionProfessor && filtered.length > 0) {
          setSessionProfessor(filtered[0].professor || '')
        }
      }
    }
  }

  // ── Lógica de Filtragem do Histórico ──────────────────────────────────────────
  const filteredRecentSessions = useMemo(() => {
    let list = [...recentSessions]

    // 1. Filtro de Modalidade
    if (historyModalityFilter !== 'todas') {
      list = list.filter(s => s.modality === historyModalityFilter)
    }

    // 2. Filtro de Professor
    if (historyProfessorFilter !== 'todos') {
      list = list.filter(s => s.professor === historyProfessorFilter)
    }

    // 3. Filtro de Tipo (Equipe vs Visitante)
    if (historyTypeFilter !== 'todos') {
      list = list.filter(s => {
        const isStaff = instructorsOnly.some(inst => inst.name === s.professor)
        return historyTypeFilter === 'equipe' ? isStaff : !isStaff
      })
    }

    // 4. Filtro de Período (Novo para Professores)
    if (historyPeriodFilter !== 'todos') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      list = list.filter(s => {
        if (!s.date) return false
        const sessDate = new Date(s.date)
        const sessMonth = sessDate.getMonth()
        const sessYear = sessDate.getFullYear()

        if (historyPeriodFilter === 'este-mes') {
          return sessMonth === currentMonth && sessYear === currentYear
        }
        if (historyPeriodFilter === 'mes-passado') {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return sessMonth === prevMonth && sessYear === prevYear
        }
        return true
      })
    }

    // 5. Ordenação
    if (historySortBy === 'recente') {
      list.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        if (dateB !== dateA) return dateB - dateA
        return (b.date || '').localeCompare(a.date || '')
      })
    } else if (historySortBy === 'antigas') {
      list.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        if (dateB !== dateA) return dateA - dateB
        return (a.date || '').localeCompare(b.date || '')
      })
    } else if (historySortBy === 'az') {
      list.sort((a, b) => (a.modality || '').localeCompare(b.modality || ''))
    }

    return list
  }, [recentSessions, historyModalityFilter, historyProfessorFilter, historyTypeFilter, historyPeriodFilter, historySortBy, instructorsOnly])

  // Lógica de filtragem de alunos para a chamada (Sincronizada com Turmas)
  const activeList = useMemo(() => {
    if (!activeSession) return []

    // 🛡️ Filtro: MOSTRAR APENAS ALUNOS (Visitantes fixos não aparecem mais por padrão)
    let list = students.filter(student => {
      // 1. Mostrar apenas ALUNOS (exclui visitantes permanentes da lista padrão)
      const papeis = student.papeis || student.roles || {};
      if (student.isVisitor || papeis.visitante) return false;


      // Regra 0: Ocultar o próprio professor logado e qualquer um com papel de equipe
      const isSelf = student.id === user?.uid ||
        (student.email && user?.email && student.email.toLowerCase() === user.email.toLowerCase()) ||
        (user?.email && student.id === normalizeStr(user.email));

      const roles = student.papeis || student.roles || {};
      const isStaff = roles.professor || roles.gestor || roles.admin || roles.equipe || roles.colaborador;

      if (isSelf || isStaff) return false;


      // Regra 1: Deve ter a modalidade da sessão
      const studentMods = (student.modalities || [student.modality] || [])
        .filter(Boolean)
        .map(m => normalizeStr(m));

      const sessionModNorm = normalizeStr(activeSession.modality || activeSession[MODALIDADE] || activeSession.modalidade);
      const hasModality = studentMods.includes(sessionModNorm);

      if (!hasModality) return false;

      // Regra 2: Se a sessão está vinculada a uma turma específica (SSoT - Single Source of Truth)
      if (activeSession.turmaId) {
        const targetTurma = allTurmas.find(t => {
          const fullId = `${t.modalityId}:${t.id}`.toLowerCase();
          return fullId === activeSession.turmaId.toLowerCase();
        });

        const officialEmails = (targetTurma?.alunos || []).map(e => String(e).toLowerCase().trim());
        
        if (officialEmails.length > 0) {
          const studentEmail = (student.email || '').toLowerCase().trim();
          const found = officialEmails.includes(studentEmail);
          if (!found) return false;
          return true;
        }

        const studentTurmas = (student.turmas || []).map(t => String(t).toLowerCase());
        if (studentTurmas.length === 0) return true;

        const hasT = studentTurmas.includes(activeSession.turmaId.toLowerCase());
        return hasT;
      }

      // Fallback: Se não houver ID de turma na sessão, mostra todos da modalidade
      return true
    });

    if (searchActive) {
      list = list.filter(s => (s.name || '').toLowerCase().includes(searchActive.toLowerCase()))
    }

    // ➕ Mesclar com os visitantes adicionados manualmente nesta sessão
    const visitorsForList = sessionVisitors.map(v => ({
      ...v,
      isVisitor: true,
      isTemporary: true,
      roles: { visitante: true },
      belt: 'none',
      status: sessionAttendance[v.id] !== undefined ? sessionAttendance[v.id] : 'present'
    }));

    return [...list.map(student => ({
        ...student,
        status: sessionAttendance[student.id] || null
      })), ...visitorsForList]
      .sort((a, b) => {
        const aVis = a.isVisitor ? 1 : 0;
        const bVis = b.isVisitor ? 1 : 0;
        if (aVis !== bVis) return aVis - bVis;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [activeSession, students, searchActive, sessionAttendance, sessionVisitors])

  const stats = useMemo(() => {
    const present = activeList.filter(s => s.status === 'present').length
    const total = activeList.length
    return { present, total, pct: total ? Math.round((present / total) * 100) : 0 }
  }, [activeList])

  // Helper to sync professors when modality/time changes
  const syncProfessors = (modName, timeStr) => {
    // 🛡️ Se o usuário já mexeu no campo manualmente, não sobrescrevemos mais
    if (wasManuallyEdited.current) return;

    // 🥇 Prioridade Absoluta: Usuário logado (Seja Gestor ou Professor)
    const currentName = userData?.name || userData?.nome
    if (currentName) {
      setSessionProfessor(currentName)
      return
    }

    const mod = modalities.find(m => m.name === modName)
    if (mod && mod.turmas) {
      const time = ensureTimeFormat(timeStr)
      const turma = mod.turmas.find(t => ensureTimeFormat(t.horario || t.horarioInicio) === time)
      
      // 🥈 Prioridade 2: Professor(es) vinculado(s) à TURMA (Fallback se o usuário não tiver nome)
      if (turma && turma.professors && turma.professors.length > 0) {
        setSessionProfessor(turma.professors.map(p => p.nome || p.name).join(', '))
        return
      } else if (turma && (turma.professor || turma.professorId)) {
        setSessionProfessor(turma.professor || 'Professor')
        return
      }
    }
  }

  async function handleStartSession() {
    try {
      if (!sessionModality) {
        setToastMessage('Selecione uma modalidade')
        return
      }

      if (!sessionProfessor) {
        setToastMessage('Informe o professor responsável')
        return
      }

      // Busca o ID da Turma para filtragem precisa
      let foundTurmaId = null
      const mod = modalities.find(m => m.name === sessionModality)
      if (mod && mod.turmas) {
        const time = ensureTimeFormat(sessionTime)
        const turma = mod.turmas.find(t => ensureTimeFormat(t.horario || t.horarioInicio) === time)
        if (turma) {
          foundTurmaId = `${mod.id}:${turma.id}`.toLowerCase()
        }
      }

      const tempId = doc(collection(db, COLLECTIONS.CHAMADAS)).id
      const payload = {
        id: tempId,
        [MODALIDADE]: sessionModality,
        turmaId: foundTurmaId, // 🔥 Link direto com a turma para SSoT
        [DATA]: sessionDate,
        [HORARIO]: ensureTimeFormat(sessionTime),
        professor: sessionProfessor,
        [INSTRUTOR_ID]: user?.uid || 'system',
        [NOME_INSTRUTOR]: userData?.nome || user?.displayName || 'Sistema',
        [CRIADO_EM]: new Date().toISOString(),
        [OBSERVACAO]: obsText || null
      }

      // Transição instantânea para a lista (MANTIDO LOCALMENTE ATÉ FINALIZAR)
      setActiveSession(payload)
      setShowMobileConfig(false)
      setToastMessage('Sessão iniciada localmente')
      setObsText('')
      setSessionVisitors([])
    } catch (err) {
      console.error('Erro crítico ao iniciar chamada:', err)
      setToastMessage('Erro interno ao iniciar chamada')
      setIsSavingSession(false)
    }
  }

  const handleOpenDrawer = (modality, time) => {
    setSessionModality(modality)
    const formattedTime = ensureTimeFormat(time)
    setSessionTime(formattedTime)
    setSessionDate(new Date().toISOString().split('T')[0])
    syncProfessors(modality, formattedTime)
    setShowMobileConfig(true)
  }

  const handleAddVisitor = async () => {
    if (!visitorName.trim()) {
      setToastMessage('Informe o nome do visitante')
      return
    }
    if (!sessionModality) {
      setToastMessage('Selecione uma modalidade primeiro')
      return
    }
    try {
      // 🚀 Cria um visitante TEMPORÁRIO apenas para a sessão atual
      const visitorData = {
        id: `temp_vis_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: visitorName.trim(),
        roles: { visitante: true },
        isVisitor: true,
        total_visitas: 1 // Por ser temporário, consideramos 1 visita nesta aula
      };

      setToastMessage(`Visitante ${visitorName} adicionado à chamada!`)
      setSessionVisitors(prev => [...prev, visitorData])
      setVisitorName('')
      setShowVisitorModal(false)
      
      if (activeSession) {
        setSessionAttendance(prev => ({
          ...prev,
          [visitorData.id]: 'present'
        }))
      }
    } catch (err) {
      setToastMessage('Erro ao adicionar visitante à lista')
    }
  }

  const handleRemoveVisitor = (visitorId) => {
    setSessionVisitors(prev => prev.filter(v => v.id !== visitorId))
    setSessionAttendance(prev => {
      const updated = { ...prev }
      delete updated[visitorId]
      return updated
    })
    setToastMessage('Visitante removido da chamada')
  }

  const handleSaveObs = () => {
    if (!obsText.trim()) {
      setToastMessage('Digite uma observação')
      return
    }
    setToastMessage('Observação registrada: ' + obsText.substring(0, 30) + '...')
    setObsText('')
    setShowObsModal(false)
  }

  async function handleDiscardSession() {
    if (!activeSession) return
    if (!window.confirm('Deseja cancelar esta chamada atual?')) return

    // Como agora não salvamos no início, apenas limpamos o estado local
    setActiveSession(null)
    setSessionAttendance({})
    setToastMessage('Chamada cancelada')
  }

  async function handleFinalizeSession() {
    const unmarked = activeList.filter(s => !s.status)
    if (unmarked.length > 0) {
      setUnmarkedAlert(true)
      setToastMessage(`Faltam ${unmarked.length} marcas!`)
      setTimeout(() => setUnmarkedAlert(false), 3000)
      return
    }
    setIsFinishingSession(true)
    try {
      await attendanceService.markAttendanceBatch(activeSession, activeList, usuarioLog)
      const savedSessionId = activeSession.id
      setToastMessage("Chamada finalizada e salva!")
      console.log("✅ Chamada finalizada com ID:", savedSessionId)

      // Limpa estado local antes de ir para a revisão
      setActiveSession(null)
      setSessionAttendance({})

      // Pequeno delay para garantir que o Firestore propagou (UX)
      setTimeout(() => {
        navigate(`/chamadas/revisao/${savedSessionId}`)
      }, 500)
    } catch (err) {
      console.error("❌ ERRO FATAL AO FINALIZAR:", err)
      setToastMessage("Erro ao salvar chamada: " + (err.message || 'Erro desconhecido'))
    } finally {
      setIsFinishingSession(false)
    }
  }

  function handleMark(id, status) {
    setSessionAttendance(prev => ({
      ...prev,
      [id]: prev[id] === status ? null : status
    }))
  }

  return (
    <>
      <MobileHeader
        title={activeSession ? "Chamada Ativa" : "Canais de Chamada"}
        showBack={!!activeSession}
        onBack={() => setActiveSession(null)}
        actions={<div className="flex items-center gap-2">
          {activeSession ? (
            <>
              <button
                onClick={handleDiscardSession}
                className="p-2.5 rounded-xl bg-white/5 text-rose-500 border border-white/5 active:scale-90 transition-all"
                title="Cancelar Chamada"
              >
                <X size={20} strokeWidth={3} />
              </button>
              
              <div className="flex items-center gap-3">
                {activeList.filter(s => !s.status).length > 0 && (
                  <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {activeList.filter(s => !s.status).length} Pendentes
                  </span>
                )}
                <button
                  onClick={handleFinalizeSession}
                  className={`p-2.5 rounded-xl transition-all shadow-lg active:scale-90 ${
                    activeList.filter(s => !s.status).length === 0 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'
                  }`}
                  title="Finalizar Chamada"
                >
                  {isFinishingSession ? <RefreshCcw className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="p-2.5 rounded-xl bg-primary text-white active:scale-90 transition-transform shadow-lg shadow-primary/20"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          )}
        </div>}
      />

      {!isMobile && <PageHeader icon={ClipboardCheck} title="INICIAR CHAMADA" subtitle="NOVA SESSÃO" />}

      <main className="flex-1 px-4 md:px-6 pt-6 pb-0 fade-slide-up space-y-6 animate-in fade-in duration-500">
        {!activeSession ? (
          <>
            {/* DESKTOP HEADER & MODALITIES */}
            {!isMobile && (
              <>
                <div className="flex flex-col items-center justify-center text-center space-y-4 mb-4">
                  <div className="relative">
                    <div className="absolute -inset-16 bg-primary/10 rounded-full blur-[100px]" />
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight relative">
                      INICIAR SESSÃO DE <span className="text-primary">TREINO</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 tracking-[0.2em] uppercase">Configure os detalhes da aula abaixo</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-[25px] mb-8 w-full">
                  {loadingModalities ? [1, 2, 3].map(i => <div key={i} className="h-56 bg-white/5 animate-pulse rounded-[32px] flex-1 min-w-[320px] max-w-[450px]" />) :
                    availableModalities.filter(m => m.status === 'ativo').map(mod => {
                      const turmas = getAvailableTurmas(mod)
                      const isJiu = mod.name?.toLowerCase().includes('jiu')
                      const isSelection = sessionModality === mod.name

                      return (
                        <motion.div
                          key={mod.id}
                          onClick={() => {
                            setSessionModality(mod.name);
                            setCurrentModality(mod.name);
                            if (turmas.length > 0) {
                              const time = ensureTimeFormat(turmas[0].horario || turmas[0].horarioInicio)
                              setSessionTime(time);
                              syncProfessors(mod.name, time)
                            }
                          }}
                          animate={{ scale: isSelection ? 1.03 : 1 }}
                          whileHover={{ y: -8, scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          className={`group relative overflow-hidden stat-card p-6 md:p-8 rounded-[32px] border cursor-pointer flex-1 min-w-[320px] max-w-[450px]
                            ${isSelection
                              ? 'ring-2 ring-primary bg-primary/10 border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]'
                              : 'border-white/5 bg-[#080808]/50 hover:bg-[#0c0c0c] hover:border-white/10 shadow-xl'}`}>

                          {isJiu && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black/80 z-[1]" />
                              <img
                                src="/jiujitsu_bg.png"
                                alt=""
                                className="w-full h-full object-cover object-[center_20%] opacity-[0.08] grayscale group-hover:scale-105 transition-transform duration-[3000ms] ease-out z-[0]"
                              />
                            </div>
                          )}

                          <div className="relative z-[10] flex flex-col items-center w-full">
                            <p className={`text-[8px] font-black uppercase mb-1 tracking-[0.3em] text-center ${isSelection ? 'text-rose-500' : 'text-gray-500'}`}>MODALIDADE</p>
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase mb-4 text-center leading-none tracking-tight">{mod.name}</h3>
                            <div className={`grid gap-2.5 w-full ${turmas.length === 1 ? 'grid-cols-1' : turmas.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {turmas.map(t => {
                                const time = ensureTimeFormat(t.horario || t.horarioInicio)
                                const isSel = sessionTime === time && sessionModality === mod.name
                                return (
                                  <button key={t.id} onClick={(e) => {
                                    e.stopPropagation();
                                    setSessionModality(mod.name);
                                    setSessionTime(time);
                                    syncProfessors(mod.name, time);
                                  }}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black border transition-all duration-300 w-full flex flex-col items-center gap-0.5
                                      ${isSel
                                        ? 'bg-rose-600 border-rose-600 text-white scale-105 shadow-lg shadow-rose-600/20'
                                        : 'border-white/10 text-gray-400 hover:bg-white hover:text-black hover:border-white'}`}>
                                    {t.name && <span className={`text-[8px] font-black uppercase tracking-widest ${isSel ? 'text-white/70' : 'text-gray-600'} truncate w-full text-center`}>{t.name}</span>}
                                    <span>{t.horario || t.horarioInicio}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  }
                </div>
              </>
            )}

            {/* MOBILE VIEW (PREMIUM MODALITY CARDS) */}
            {isMobile && (
              <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Escolha a Aula</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                    <Clock size={12} className="text-primary" />
                    <span className="text-[10px] font-black text-gray-400">HOJE</span>
                  </div>
                </div>

                {loadingModalities ? [1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-[32px] animate-pulse" />) :
                  availableModalities.filter(m => m.status === 'ativo').map(mod => {
                    const turmas = getAvailableTurmas(mod)
                    const isJiu = mod.name?.toLowerCase().includes('jiu')

                    return (
                      <motion.div
                        key={mod.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenDrawer(mod.name, turmas[0]?.horario || turmas[0]?.horarioInicio || '20:00')}
                        className="relative group overflow-hidden rounded-[32px] border border-white/10 bg-[#080808]/80 min-h-[160px] flex flex-col items-center justify-center p-6 shadow-2xl"
                      >
                        {/* Background Image/Glow */}
                        {isJiu && (
                          <div className="absolute inset-0 pointer-events-none">
                            <img
                              src="/jiujitsu_bg.png"
                              alt=""
                              className="w-full h-full object-cover object-[center_20%] opacity-[0.15] grayscale"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                          </div>
                        )}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="relative z-10 w-full text-center">
                          <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 ${sessionModality === mod.name ? 'text-rose-500' : 'text-gray-500'}`}>MODALIDADE</p>
                          <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-6">{mod.name}</h3>

                          <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 w-full">
                            {turmas.map(t => {
                              const time = t.horario || t.horarioInicio
                              const isSel = sessionModality === mod.name && sessionTime === ensureTimeFormat(time)
                              return (
                                <button
                                  key={t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDrawer(mod.name, time);
                                  }}
                                  className={`py-3 rounded-2xl font-black text-[11px] transition-all active:scale-95 border w-full flex flex-col items-center gap-0.5
                                      ${isSel ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                >
                                  {t.name && <span className={`text-[8px] font-black uppercase tracking-widest ${isSel ? 'text-white/70' : 'text-gray-600'} truncate w-full text-center`}>{t.name}</span>}
                                  <span>{time}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                }
              </div>
            )}

            {/* DESKTOP CONFIG PANEL */}
            {!isMobile && (
              <div className="glass-card p-5 rounded-[28px] border border-white/5 space-y-5 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2">Data da Aula</label>
                    <div className="relative group">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-hover:text-primary" />
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={e => setSessionDate(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs text-white font-bold focus:border-primary/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2">Horário</label>
                    <div className="relative group">
                      <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-hover:text-primary" />
                      <input
                        type="time"
                        value={sessionTime}
                        onChange={e => setSessionTime(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs text-white font-bold focus:border-primary/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2">Responsável</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 transition-colors z-20 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Professor ou Visitante"
                        value={sessionProfessor}
                        onChange={(e) => { setSessionProfessor(e.target.value); if (!showProfessorDropdown) setShowProfessorDropdown(true); }}
                        onFocus={() => setShowProfessorDropdown(true)}
                        className="w-full bg-black border border-white/5 rounded-xl py-3 pl-12 pr-10 text-xs text-white font-bold outline-none focus:border-primary/40 transition-all hover:bg-black/60"
                      />
                      <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 transition-transform duration-300 pointer-events-none ${showProfessorDropdown ? "rotate-180" : ""}`} />

                      <AnimatePresence>
                        {showProfessorDropdown && (
                          <>
                            <div className="fixed inset-0 z-[998]" onClick={() => setShowProfessorDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -5, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -5, scale: 0.98 }}
                              className="absolute left-0 right-0 bottom-full mb-2 z-[999] bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                            >
                              <div className="bg-white/5 p-2.5 border-b border-white/5 flex items-center justify-between">
                                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Equipe</p>
                                {filteredInstructors.length === 0 && sessionProfessor && (
                                  <span className="text-[8px] font-black text-rose-500 uppercase px-2 py-0.5 bg-rose-500/10 rounded-full">Visitante</span>
                                )}
                              </div>
                              <div className="max-h-[160px] overflow-y-auto py-1 custom-scrollbar">
                                {filteredInstructors.map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => { setSessionProfessor(s.name); setShowProfessorDropdown(false); }}
                                    className={`w-full text-left px-4 py-2.5 font-bold text-[11px] transition-all hover:bg-white/5 flex items-center justify-between
                                      ${sessionProfessor === s.name ? "text-primary bg-primary/5" : "text-gray-400 hover:text-white"}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${s.roles?.admin || s.roles?.gestor ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                      {s.name}
                                    </div>
                                    {sessionProfessor === s.name && <Check size={12} />}
                                  </button>
                                ))}
                                {filteredInstructors.length === 0 && sessionProfessor && (
                                  <div className="px-4 py-3 text-center">
                                    <p className="text-[10px] text-gray-500 font-medium italic">Nenhum instrutor encontrado.</p>
                                    <p className="text-[10px] text-white font-bold mt-1 uppercase">"{sessionProfessor}"</p>
                                    <p className="text-[8px] text-rose-500 font-black mt-2 tracking-tighter uppercase">Definido como Visitante</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex justify-center gap-3 pt-1">
                  <button
                    onClick={handleStartSession}
                    disabled={isSavingSession || !sessionModality}
                    className={`btn-primary rounded-xl px-10 py-3 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed
                      ${!sessionModality ? 'bg-gray-800 text-gray-500' : 'bg-rose-600 shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    {isSavingSession ? 'INICIANDO...' : 'ABRIR LISTA DE PRESENÇA'}
                  </button>
                </div>
              </div>
            )}

            {/* HISTORY SECTION */}
            <div className="pt-8 border-t border-white/5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10"><History size={18} className="text-primary" /></div>
                  <h4 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">
                    Histórico
                    {visibleHistoryCount > 8 && (
                      <button
                        onClick={() => {
                          setVisibleHistoryCount(8)
                          const element = document.getElementById('history-section')
                          if (element) {
                            window.scrollTo({ top: element.offsetTop - 150, behavior: 'smooth' })
                          }
                        }}
                        className="ml-2 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-primary border border-white/5 active:scale-90"
                        title="Recolher Histórico"
                      >
                        <ChevronUp size={16} strokeWidth={3} />
                      </button>
                    )}
                  </h4>
                </div>
                {visibleHistoryCount <= 8 && filteredRecentSessions.length > 8 && (
                  <button
                    onClick={() => setVisibleHistoryCount(prev => prev + 8)}
                    className="md:hidden text-[9px] font-black uppercase text-primary border-b border-primary/30 pb-0.5 tracking-widest transition-all active:scale-95"
                  >
                    Mostrar Mais
                  </button>
                )}
              </div>

              {/* 🔍 FILTROS ADAPTADOS (RBAC) */}
              <div className="bg-[#0B0B0D]/80 backdrop-blur-md rounded-[24px] p-5 md:p-6 border border-white/5 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-500 z-30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
                <div className={`grid gap-4 ${isPowerUser ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                  <CustomSelect
                    label="Ordenar por"
                    value={historySortBy}
                    onChange={setHistorySortBy}
                    options={[['recente', 'Mais Recente'], ['antigas', 'Antigas'], ['az', 'Modalidade A-Z']]}
                  />

                  <CustomSelect
                    label="Modalidade"
                    value={historyModalityFilter}
                    onChange={setHistoryModalityFilter}
                    options={[['todas', 'Todas'], ...modalities.map(m => [m.name, m.name])]}
                  />

                  {isPowerUser ? (
                    <>
                      <CustomSelect
                        label="Professor"
                        value={historyProfessorFilter}
                        onChange={setHistoryProfessorFilter}
                        options={[['todos', 'Todos'], ...Array.from(new Set(recentSessions.map(s => s.professor).filter(Boolean))).map(p => [p, p])]}
                      />
                      <CustomSelect
                        label="Tipo"
                        value={historyTypeFilter}
                        onChange={setHistoryTypeFilter}
                        options={[['todos', 'Todos'], ['equipe', 'Equipe'], ['visitante', 'Visitante']]}
                      />
                    </>
                  ) : (
                    <CustomSelect
                      label="Período"
                      value={historyPeriodFilter}
                      onChange={setHistoryPeriodFilter}
                      options={[['todos', 'Todo Histórico'], ['este-mes', 'Este Mês'], ['mes-passado', 'Mês Passado']]}
                    />
                  )}
                </div>
              </div>

              <div id="history-section" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 font-black">
                {filteredRecentSessions.slice(0, visibleHistoryCount).map(s => (
                  <div key={s.id} className="stat-card p-4 md:p-5 rounded-[20px] md:rounded-[22px] border border-white/5 flex flex-col items-center text-center gap-3 md:gap-3.5 bg-[#080808]/50 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-full">
                      <h5 className="text-xs md:text-base font-black text-white uppercase tracking-tight leading-tight line-clamp-1">{s.modalidade || s.modality}</h5>
                      <p className="text-[8px] md:text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1 line-clamp-1">
                        {(s.data || s.date)?.split('-').reverse().slice(0, 2).join('/')} · {s.horario || s.time}
                      </p>
                      <p className="text-[7px] md:text-[8px] text-gray-400 uppercase font-bold tracking-widest mt-0.5 line-clamp-1">
                        {s.professor || s.instructorName}
                        {s.professor === userData?.name ? (
                          <span className="text-primary ml-1">(Eu)</span>
                        ) : (
                          !instructorsOnly.some(inst => inst.name.trim().toLowerCase() === s.professor?.trim().toLowerCase()) && (
                            <span className="text-rose-500 ml-1">(Visitante)</span>
                          )
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/chamadas/revisao/${s.id}`)}
                      className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 transition-all font-black"
                    >
                      Revisar
                    </button>
                  </div>
                ))}
              </div>

              {filteredRecentSessions.length > visibleHistoryCount && (
                <div className="flex pt-4">
                  <button
                    onClick={() => setVisibleHistoryCount(prev => prev + 8)}
                    className="w-full py-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 hover:border-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    Carregar Mais 8 Chamadas
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-white uppercase leading-none tracking-tight">{activeSession.modalidade || activeSession.modality}</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{activeSession.professor} · {activeSession.horario || activeSession.time}</p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-right">
                <div><div className="text-4xl font-black text-white tracking-tighter">{stats.present}/{stats.total}</div><p className="text-[9px] font-black uppercase text-gray-500">PRESENTES</p></div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowVisitorModal(true)}
                    className="flex items-center gap-2 bg-white/5 border border-white/5 text-white rounded-xl px-5 py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all shadow-lg shadow-black/20"
                  >
                    <UserPlus size={16} className="text-primary" />
                    VISITANTES
                  </button>
                  <button onClick={handleFinalizeSession} className="btn-primary py-3 px-8 rounded-xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105">Finalizar</button>
                </div>
              </div>
            </div>

            {/* Mobile: Stats + Actions */}
            <div className="md:hidden rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div><div className="text-4xl font-black text-white tracking-tighter">{stats.present}/{stats.total}</div><p className="text-[9px] font-black uppercase text-gray-500">PRESENTES</p></div>
                <button onClick={handleFinalizeSession} className="btn-primary py-3 px-8 rounded-xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105">Finalizar</button>
              </div>
              <button
                onClick={() => setShowVisitorModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/5 text-white rounded-xl py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all shadow-lg shadow-black/20"
              >
                <UserPlus size={16} className="text-primary" />
                VISITANTES
              </button>
            </div>
          </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="BUSCAR ALUNO NA LISTA..."
                value={searchActive}
                onChange={e => setSearchActive(e.target.value)}
                className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs text-white font-black uppercase tracking-widest outline-none focus:border-primary/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeList.map((s, idx) => {
                const isVisitor = s.isVisitor || s.roles?.visitante;
                const showDivider = idx > 0 && isVisitor && !activeList[idx-1].isVisitor;

                // 🎨 BUSCA DE COR DINÂMICA DO BANCO (beltSystem)
                const currentModDoc = modalities.find(m => 
                  normalizeStr(m.name) === normalizeStr(activeSession.modality || activeSession[MODALIDADE] || activeSession.modalidade)
                );
                
                let beltColor = '#1f1f1f'; // Fallback escuro
                let isLight = false;

                if (s.belt && currentModDoc?.beltSystem?.categories) {
                  const studentBeltName = String(s.belt).toUpperCase().trim();
                  
                  // Procura em todas as categorias de faixa da modalidade
                  for (const cat of currentModDoc.beltSystem.categories) {
                    const foundBelt = cat.belts?.find(b => b.name.toUpperCase().trim() === studentBeltName);
                    if (foundBelt) {
                      beltColor = foundBelt.color || beltColor;
                      break;
                    }
                  }
                }

                // 🌓 Lógica de Contraste (Branco/Preto no texto)
                if (beltColor) {
                  const hex = beltColor.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                  isLight = brightness > 155; // Se for claro, texto preto
                }

                return (
                  <React.Fragment key={s.id}>
                    {showDivider && (
                      <div className="col-span-full mt-4 mb-2 flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-white/10" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap">Visitantes</span>
                        <div className="h-[1px] flex-1 bg-white/10" />
                      </div>
                    )}
                    <div className={`p-4 rounded-xl bg-[#0d0d0d] border transition-all shadow-lg flex flex-col gap-3 group
                      ${unmarkedAlert && !s.status ? 'border-rose-500 shadow-rose-500/20 animate-pulse' : 
                      isVisitor ? 'border-primary/20 shadow-primary/10' : 'border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div 
                          style={{ backgroundColor: isVisitor ? 'transparent' : beltColor }}
                          className={`w-10 h-10 flex items-center justify-center font-black text-xs shadow-inner border border-white/10 shrink-0
                            ${isVisitor ? 'rounded-full bg-primary/20 text-primary border-primary/30' : 
                            `rounded-full ${isLight ? 'text-black' : 'text-white'}`}`}>
                          {isVisitor ? <User size={18} strokeWidth={2.5} /> : (s.name ? s.name.trim().charAt(0).toUpperCase() : '?')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black uppercase text-[11px] truncate tracking-tight ${isVisitor ? 'text-primary' : 'text-white'}`}>{s.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[9px] text-gray-500 uppercase font-black">{isVisitor ? 'Visitante' : beltConfig[s.belt]?.label}</p>
                            {!isVisitor && <StudentAttendanceAlert student={s} />}
                          </div>
                        </div>
                        {isVisitor && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveVisitor(s.id); }}
                            className="h-[42px] w-[42px] flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-all shrink-0 ml-auto"
                            title="Remover visitante da chamada"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className={`grid gap-1.5 ${isVisitor ? 'grid-cols-1' : 'grid-cols-3'}`}>
                        <button onClick={() => handleMark(s.id, 'present')} className={`py-2.5 rounded-lg text-[9px] font-black transition-all ${s.status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500/10'}`}>PRESENTE</button>
                        {!isVisitor && (
                          <>
                            <button onClick={() => handleMark(s.id, 'absent')} className={`py-2.5 rounded-lg text-[9px] font-black transition-all ${s.status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-rose-500 hover:bg-rose-500/10'}`}>FALTA</button>
                            <button onClick={() => handleMark(s.id, 'justified')} className={`py-2.5 rounded-lg text-[9px] font-black transition-all ${s.status === 'justified' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-blue-500 hover:bg-blue-500/10'}`}>JUSTIF.</button>
                          </>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* CONFIGURATION DRAWER MOBILE */}
      {showMobileConfig && createPortal(
        <AnimatePresence mode="wait">
          <div className="fixed inset-0 z-[2000]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileConfig(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setShowMobileConfig(false)
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.5 }}
              className="fixed inset-x-0 bottom-0 bg-[#0A0A0A] rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-2xl flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden"
            >
              {/* Mobile Drag Handle */}
              <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              </div>

              {/* HEADER */}
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600/10 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="text-rose-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">Configurar Aula</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Defina os detalhes da sessão</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMobileConfig(false)} 
                  className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM BODY */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar scroll-smooth">
                <div className="space-y-6 mb-10">
                  {/* Professor Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase ml-1">Professor Responsável</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 z-20" size={18} />
                      <input
                        value={sessionProfessor}
                        onChange={(e) => { 
                          setSessionProfessor(e.target.value); 
                          setShowProfessorDropdown(true);
                          wasManuallyEdited.current = true; // 🚩 Trava o auto-preenchimento
                        }}
                        onFocus={() => setShowProfessorDropdown(true)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm text-white font-bold outline-none focus:border-primary/30 transition-all placeholder:text-gray-700"
                        placeholder="Pesquisar instrutor..."
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={18} className={`text-gray-600 transition-transform duration-300 ${showProfessorDropdown ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {showProfessorDropdown && (
                          <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setShowProfessorDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-2 z-[200] bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/5"
                            >
                              <div className="bg-white/[0.02] p-3 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Membros da Equipe</span>
                                {filteredInstructors.length === 0 && sessionProfessor && (
                                  <span className="text-[8px] font-black text-rose-500 uppercase px-2 py-0.5 bg-rose-500/10 rounded-full">Visitante</span>
                                )}
                              </div>
                              <div className="max-h-[240px] overflow-y-auto py-1 custom-scrollbar">
                                {filteredInstructors.map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => { 
                                      setSessionProfessor(s.name); 
                                      setShowProfessorDropdown(false); 
                                      wasManuallyEdited.current = true;
                                    }}
                                    className={`w-full text-left px-5 py-4 transition-all flex items-center gap-4 border-b border-white/[0.02] last:border-0 group/item
                                      ${sessionProfessor === s.name ? "bg-primary/5" : "hover:bg-white/5 active:bg-white/10"}`}
                                  >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg
                                      ${sessionProfessor === s.name ? 'bg-primary text-black' : 'bg-primary/10 text-primary group-hover/item:bg-primary group-hover/item:text-black'}`}>
                                      {s.roles?.admin || s.roles?.gestor ? <Shield size={16} /> : <GraduationCap size={16} />}
                                    </div>
                                    <div className="flex-1">
                                      <p className={`text-xs font-black uppercase tracking-tight ${sessionProfessor === s.name ? 'text-primary' : 'text-white'}`}>
                                        {s.name}
                                      </p>
                                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">
                                        {s.roles?.admin ? 'Administrador' : s.roles?.gestor ? 'Gestor' : 'Professor'}
                                      </p>
                                    </div>
                                    {sessionProfessor === s.name && <Check size={16} className="text-primary" />}
                                  </button>
                                ))}
                                
                                {filteredInstructors.length === 0 && sessionProfessor && (
                                  <div className="p-8 text-center bg-rose-600/[0.02]">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                      <UserPlus size={20} className="text-gray-600" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Nenhum instrutor encontrado</p>
                                    <p className="text-sm text-white font-black mt-1 uppercase tracking-tight">"{sessionProfessor}"</p>
                                    <div className="mt-5 px-4 py-2.5 bg-rose-600/10 rounded-xl border border-rose-600/20 inline-block">
                                      <p className="text-[9px] text-rose-500 font-black tracking-widest uppercase">Será registrado como Visitante</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase ml-1">Modalidade da Aula</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableModalities.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSessionModality(m.name);
                            const turmas = m.turmas?.filter(t => t.status === 'ativo') || [];
                            if (turmas.length > 0) {
                              const firstTime = ensureTimeFormat(turmas[0].horario || turmas[0].horarioInicio);
                              setSessionTime(firstTime);
                              syncProfessors(m.name, firstTime);
                            }
                          }}
                          className={`flex items-center justify-center px-4 py-4 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all
                            ${sessionModality === m.name 
                              ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20 scale-[1.02]' 
                              : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10'}`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Data da Aula — aparece primeiro */}
                  {/* Horário Previsto — aparece primeiro */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase ml-1">Horário Previsto</label>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 w-full">
                      {(availableModalities.find(m => m.name === sessionModality)?.turmas || [])
                        .filter(t => t.status === 'ativo')
                        .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''))
                        .map((t, idx) => {
                          const tTime = ensureTimeFormat(t.horario || t.horarioInicio)
                          const isSelected = ensureTimeFormat(sessionTime) === tTime
                          return (
                            <button
                              key={idx}
                              onClick={() => setSessionTime(tTime)}
                              className={`px-3 py-3 rounded-xl text-[10px] w-full font-black transition-all border flex flex-col items-center gap-0.5
                                ${isSelected
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 active:scale-95'
                                  : 'bg-white/5 border-white/5 text-gray-400 active:scale-95 hover:bg-white/10'}`}
                            >
                              {t.name && <span className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-gray-600'} truncate w-full text-center`}>{t.name}</span>}
                              <span>{t.horario || t.horarioInicio}</span>
                            </button>
                          )
                        })}
                    </div>
                    {/* Input manual com mesmo estilo da data */}
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                      <input
                        type="time"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold outline-none focus:border-primary/30"
                      />
                    </div>
                  </div>

                  {/* Data da Aula — abaixo do horário */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase ml-1">Data da Aula</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold outline-none focus:border-primary/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-6 md:p-8 bg-[#0d0d0d] border-t border-white/5 flex flex-col gap-3 shrink-0">

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMobileConfig(false)}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
                  >
                    Sair
                  </button>
                  <button
                    onClick={handleStartSession}
                    disabled={isSavingSession || !sessionModality}
                    className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale
                      ${!sessionModality ? 'bg-gray-800 text-gray-500' : 'bg-rose-600 text-white shadow-rose-600/30'}`}
                  >
                    {isSavingSession ? 'Iniciando...' : 'Iniciar Chamada'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}



      {showModal && (
        <AddStudentModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          onAdd={async (data, mod, opts) => {
            await addStudent(data, mod, opts)
            setShowModal(false)
          }}
        />
      )}

      {showVisitorModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowVisitorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0B0B0B] border border-white/10 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase">NOVO VISITANTE</h3>
                <button onClick={() => setShowVisitorModal(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do visitante"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-medium"
                  autoFocus
                />
                <input
                  type="text"
                  value={sessionModality}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 font-medium"
                />
                <input
                  type="text"
                  value={sessionProfessor || userData?.nome || 'Sistema'}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 font-medium"
                />
              </div>
              <button
                onClick={handleAddVisitor}
                className="w-full py-3 bg-primary text-white font-bold uppercase rounded-xl shadow-lg shadow-primary/20"
              >
                Cadastrar e Presente
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL DE OBSERVAÇÃO REMOVIDO POR SOLICITAÇÃO DO USUÁRIO EM FAVOR DE VISITANTES */}
    </>
  )
}

