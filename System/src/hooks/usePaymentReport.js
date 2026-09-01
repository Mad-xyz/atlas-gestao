import { useState, useEffect, useMemo, useCallback } from 'react'
import { db } from '../firebase/config'
import { collection, query, onSnapshot, orderBy, getDocs } from 'firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { useModalities } from './useModalities'

let _cachedBills = null
let _billListeners = []

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

const toDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCurrentMonthRange = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

const getDateKeyFromAny = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    if (DATE_ONLY_REGEX.test(value)) return value
    const parsed = new Date(value)
    return toDateKey(parsed)
  }

  if (value?.seconds) {
    return toDateKey(new Date(value.seconds * 1000))
  }

  if (value instanceof Date) {
    return toDateKey(value)
  }

  return null
}

function formatDateForReport(value) {
  if (!value) return '-'

  if (typeof value === 'string') {
    if (DATE_ONLY_REGEX.test(value)) {
      const [year, month, day] = value.split('-')
      return `${day}/${month}/${year}`
    }
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    }
    return value
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  return '-'
}

/**
 * Enriquece um bill com dados de modalidade e turma vindos do perfil do aluno.
 * Garante compatibilidade retroativa com cobranças antigas que não têm esses campos.
 */
function enrichBillWithStudentData(bill, studentsMap) {
  const hadOriginalModalityName = !!bill.modalityName

  if (hadOriginalModalityName && bill.turmaName) return bill

  const aluno = studentsMap[bill.studentId]
  if (!aluno) return bill

  const modalities = Array.isArray(aluno.modalities) ? aluno.modalities : 
                     aluno.modality ? [aluno.modality] : []
  
  const firstMod = modalities[0]
  const modalityName = bill.modalityName || 
                       (typeof firstMod === 'object' ? firstMod?.name : firstMod) || 
                       null

  const turmas = Array.isArray(aluno.turmas) ? aluno.turmas : 
                 aluno.turma ? [aluno.turma] : []
  const firstTurma = turmas[0]
  const turmaName = bill.turmaName || 
                    (typeof firstTurma === 'object' ? firstTurma?.name : firstTurma) || 
                    null

  return {
    ...bill,
    modalityName: modalityName || bill.modalityName,
    turmaName: turmaName || bill.turmaName,
    _hasOriginalModalityName: hadOriginalModalityName,
  }
}

export function usePaymentReport() {
  const { modalities } = useModalities()
  const [bills, setBills] = useState(_cachedBills || [])
  const [loading, setLoading] = useState(!_cachedBills)
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const monthRange = useMemo(() => getCurrentMonthRange(), [])

  const [filters, setFilters] = useState({
    periodType: 'payment',
    modalityId: '',
    turmaId: '',
    startDate: monthRange.start,
    endDate: monthRange.end,
    year: '',
    studentName: '',
    status: '',
    paymentType: '',
    earlyPaymentOnly: false,
    paymentDateStart: '',
    paymentDateEnd: '',
  })

  // Busca alunos para enriquecimento retroativo
  useEffect(() => {
    let active = true
    getDocs(collection(db, COLLECTIONS.USUARIOS))
      .then(snap => {
        if (!active) return
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setStudents(data)
        setLoadingStudents(false)
      })
      .catch(err => {
        console.error('Erro ao buscar alunos para relatório:', err)
        setLoadingStudents(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const listener = { setBills, setLoading }
    _billListeners.push(listener)

    if (_cachedBills) {
      _billListeners.forEach(l => l.setBills(_cachedBills))
      _billListeners.forEach(l => l.setLoading(false))
      return
    }

    const q = query(
      collection(db, COLLECTIONS.FATURAMENTO),
      orderBy('dueDate', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      _cachedBills = data
      _billListeners.forEach(l => l.setBills(data))
      _billListeners.forEach(l => l.setLoading(false))
    }, (err) => {
      console.error('Erro ao buscar cobranças para relatório:', err)
      _billListeners.forEach(l => l.setBills([]))
      _billListeners.forEach(l => l.setLoading(false))
    })

    return () => {
      _billListeners = _billListeners.filter(l => l !== listener)
      if (_billListeners.length === 0 && unsub) {
        unsub()
        _cachedBills = null
      }
    }
  }, [])

  const updateFilters = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    const range = getCurrentMonthRange()
    setFilters({
      periodType: 'payment',
      modalityId: '',
      turmaId: '',
      startDate: range.start,
      endDate: range.end,
      year: '',
      studentName: '',
      status: '',
      paymentType: '',
      earlyPaymentOnly: false,
      paymentDateStart: '',
      paymentDateEnd: '',
    })
  }, [])

  // Mapa de alunos por ID para lookup O(1)
  const studentsMap = useMemo(() => {
    const map = {}
    students.forEach(s => { map[s.id] = s })
    return map
  }, [students])

  /**
   * Mapa de turmas: "modId:turmaId" → { modName, turmaDisplayName }
   * Permite resolver nomes legíveis a partir dos uniqueIds salvos nos perfis dos alunos.
   */
  const turmaLookup = useMemo(() => {
    const map = {}
    if (!modalities) return map
    modalities.forEach(mod => {
      (mod.turmas || []).forEach(turma => {
        const key = `${mod.id}:${turma.id}`
        map[key] = {
          modName: mod.name,
          modId: mod.id,
          turmaDisplayName: turma.name,
          turmaId: turma.id,
        }
      })
    })
    return map
  }, [modalities])

  // Bills enriquecidos com dados de modalidade/turma do perfil do aluno
  const enrichedBills = useMemo(() => {
    if (loadingStudents || students.length === 0) return bills
    return bills.map(bill => enrichBillWithStudentData(bill, studentsMap))
  }, [bills, studentsMap, loadingStudents, students.length])

  const filteredBills = useMemo(() => {
    return enrichedBills
      .map(bill => ({
        ...bill,
        reportPaidAt: formatDateForReport(bill.paidAt),
        reportDueDate: formatDateForReport(bill.dueDate),
        paidDateKey: getDateKeyFromAny(bill.paidAt),
        dueDateKey: getDateKeyFromAny(bill.dueDate),
      }))
      .filter(bill => {
      if (filters.modalityId) {
        const matchById = bill.modalityId === filters.modalityId
        const matchByName = (bill.modalityName || '').toLowerCase() === filters.modalityId.toLowerCase()
        if (!matchById && !matchByName) return false
      }
      if (filters.turmaId && bill.turmaId !== filters.turmaId) return false
      if (filters.status && bill.status !== filters.status) return false
      if (filters.studentName && !(bill.studentName || '').toLowerCase().includes(filters.studentName.toLowerCase())) return false

      const periodDateKey = filters.periodType === 'due' ? bill.dueDateKey : bill.paidDateKey
      if ((filters.startDate || filters.endDate) && !periodDateKey) return false
      if (filters.startDate && periodDateKey < filters.startDate) return false
      if (filters.endDate && periodDateKey > filters.endDate) return false

      if (filters.year) {
        const billYear = bill.dueDateKey ? bill.dueDateKey.split('-')[0] : ''
        if (billYear !== filters.year) return false
      }
      if (filters.paymentType && bill.type !== filters.paymentType) return false
      if (filters.earlyPaymentOnly) {
        if (bill.status !== 'paid' || !bill.paidDateKey || !bill.dueDateKey) return false
        if (bill.paidDateKey > bill.dueDateKey) return false
      }
      if (filters.paymentDateStart || filters.paymentDateEnd) {
        const paidStr = bill.paidDateKey
        if (!paidStr) return false
        if (filters.paymentDateStart && paidStr < filters.paymentDateStart) return false
        if (filters.paymentDateEnd && paidStr > filters.paymentDateEnd) return false
      }
      return true
    })
  }, [enrichedBills, filters])

  const groupedData = useMemo(() => {
    const modalityMap = {}
    const normalize = (str) => str?.toLowerCase().trim() || ''

const getAllModalitiesFromStudent = (bill) => {
      const aluno = studentsMap[bill.studentId]
      if (!aluno) return []

      const alunoMods = Array.isArray(aluno.modalities)
        ? aluno.modalities
        : aluno.modality
          ? [aluno.modality]
          : []
      
      if (alunoMods.length === 0) return []

      const alunoTurmas = Array.isArray(aluno.turmas) ? aluno.turmas : []
      
      return alunoMods.map(mod => {
        const modName = typeof mod === 'object' ? mod?.name : mod
        
        let turmaName = 'Geral'
        
        const foundTurma = alunoTurmas.find(t => {
          if (typeof t !== 'string' || !t.includes(':')) return false
          const [foundModId] = t.split(':')
          return foundModId.toLowerCase() === modName.toLowerCase()
        })
        
        if (foundTurma) {
          const [, rawTurmaName] = foundTurma.split(':')
          if (rawTurmaName) {
            turmaName = rawTurmaName.charAt(0).toUpperCase() + rawTurmaName.slice(1)
          }
        }

        return {
          modName: modName || 'Outros',
          turmaName,
        }
      })
    }

/**
     * Retorna TODOS os pares modalidade/turma do aluno.
     * Se o bill tem modalityName original (não enriquecido), retorna apenas 1.
     * Se o bill foi enriquecido (não tinha modalityName original), retorna todas as modalidades do aluno.
     * Se o aluno tem 2 turmas na mesma modalidade, retorna apenas a primeira.
     */
    const getAllModalityTurmaPairs = (bill) => {
      const hasOriginal = bill._hasOriginalModalityName
      
      if (hasOriginal) {
        return [{
          modName: bill.modalityName || 'Outros',
          turmaName: bill.turmaName || 'Geral',
        }]
      }

      const pairs = getAllModalitiesFromStudent(bill)
      if (pairs.length > 0) return pairs
      
      return [{
        modName: 'Outros',
        turmaName: 'Geral',
      }]
    }


    const addBillToGroup = (bill, modName, turmaName) => {
      const modKey = normalize(modName)
      const turmaKey = normalize(turmaName)
      const amount = Number(bill.amount) || 0

      if (!modalityMap[modKey]) {
        modalityMap[modKey] = {
          name: modName,
          turmas: {},
          totalPaid: 0, totalPending: 0, totalOverdue: 0, totalAmount: 0,
        }
      }
      const mod = modalityMap[modKey]

      if (!mod.turmas[turmaKey]) {
        mod.turmas[turmaKey] = {
          name: turmaName,
          bills: [],
          totalPaid: 0, totalPending: 0, totalOverdue: 0, totalAmount: 0,
        }
      }
      const turma = mod.turmas[turmaKey]

      turma.bills.push(bill)
      turma.totalAmount += amount
      mod.totalAmount += amount
      if (bill.status === 'paid') {
        mod.totalPaid += amount; turma.totalPaid += amount
      } else if (bill.status === 'pending') {
        mod.totalPending += amount; turma.totalPending += amount
      } else if (bill.status === 'overdue') {
        mod.totalOverdue += amount; turma.totalOverdue += amount
      }
    }

filteredBills.forEach(bill => {
      const pairs = getAllModalityTurmaPairs(bill)
      pairs.forEach(pair => {
        addBillToGroup(bill, pair.modName, pair.turmaName)
      })
    })

    const modalities_result = Object.values(modalityMap).map(mod => ({
      ...mod,
      turmas: Object.values(mod.turmas),
    })).sort((a, b) => {
      if (a.name === 'Outros') return 1
      if (b.name === 'Outros') return -1
      return a.name.localeCompare(b.name, 'pt-BR')
    })

    // Totais gerais deduplica por ID para não inflar quando o aluno tem múltiplas modalidades
    const seenIds = new Set()
    let totalPaid = 0, totalPending = 0, totalOverdue = 0, totalAmount = 0
    filteredBills.forEach(b => {
      if (seenIds.has(b.id)) return
      seenIds.add(b.id)
      const amt = Number(b.amount) || 0
      totalAmount += amt
      if (b.status === 'paid') totalPaid += amt
      else if (b.status === 'pending') totalPending += amt
      else if (b.status === 'overdue') totalOverdue += amt
    })

    return { modalities: modalities_result, totalPaid, totalPending, totalOverdue, totalAmount, count: filteredBills.length }
  }, [filteredBills, studentsMap, modalities, turmaLookup])

  return {
    bills: filteredBills,
    loading: loading || loadingStudents,
    filters,
    updateFilters,
    resetFilters,
    groupedData,
  }
}
