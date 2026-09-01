import { useState, useEffect, useMemo } from 'react'
import { collection, collectionGroup, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS, SUB_COLLECTIONS } from '../firebase/collections'

/**
 * Hook de Inteligência de Atividade do Aluno
 * Calcula métricas de frequência, sequências (streaks) e histórico detalhado.
 */
export function useStudentAttendance(studentId) {
  const [attendances, setAttendances] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      return
    }

    // 1. Query na Coleção Raiz (Mais rápida e não requer índice composto)
    const qRoot = query(
      collection(db, COLLECTIONS.PRESENCAS_LOG),
      where('studentId', '==', studentId),
      limit(50)
    )

    // 2. Query em Coleção Group (Para dados legados)
    const qGroup = query(
      collectionGroup(db, SUB_COLLECTIONS.PRESENCAS),
      where('studentId', '==', studentId),
      limit(50)
    )

    const processDocs = (snap) => {
      return snap.docs.map(d => {
        const data = d.data()
        const dateValue = data.data || data.date
        
        let parsedDate
        if (dateValue && typeof dateValue.toDate === 'function') {
          parsedDate = dateValue.toDate()
        } else if (typeof dateValue === 'string') {
          if (dateValue.includes('/') && dateValue.split('/')[0].length === 2) {
            const [d, m, y] = dateValue.split('/')
            parsedDate = new Date(`${y}-${m}-${d}T12:00:00`)
          } else {
            parsedDate = new Date(dateValue + 'T12:00:00')
          }
        } else if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          parsedDate = data.timestamp.toDate()
        } else {
          parsedDate = new Date()
        }

        if (isNaN(parsedDate.getTime())) parsedDate = new Date()

        return {
          id: d.id,
          ...data,
          parsedDate,
          sortDate: typeof dateValue === 'string' && dateValue.includes('/') && dateValue.split('/')[0].length === 2 
            ? dateValue.split('/').reverse().join('-') 
            : (dateValue || parsedDate.toISOString().split('T')[0])
        }
      })
    }

    let rootData = []
    let groupData = []

    const updateState = () => {
      const combined = [...rootData, ...groupData]
      // Remover duplicatas por sessionId ou timestamp aproximado
      const unique = []
      const seen = new Set()
      
      combined.forEach(item => {
        const key = item.sessionId || `${item.studentId}_${item.sortDate}`
        if (!seen.has(key)) {
          seen.add(key)
          unique.push(item)
        }
      })

      unique.sort((a, b) => b.sortDate.localeCompare(a.sortDate))
      setAttendances(unique)
      setLoading(false)
    }

    const unsubRoot = onSnapshot(qRoot, (snap) => {
      rootData = processDocs(snap)
      updateState()
    }, (err) => {
      console.warn('⚠️ [Root Query] Falhou ou vazia:', err)
      updateState()
    })

    const unsubGroup = onSnapshot(qGroup, (snap) => {
      groupData = processDocs(snap)
      updateState()
    }, (err) => {
      console.warn('⚠️ [Group Query] Falhou (provavelmente falta de índice):', err)
      updateState()
    })

    return () => {
      unsubRoot()
      unsubGroup()
    }
  }, [studentId])

  const stats = useMemo(() => {
    if (loading || attendances.length === 0) {
      return {
        total: 0,
        monthly: 0,
        weekly: 0,
        streak: 0,
        recent: []
      }
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Início da semana: Segunda-feira (Padrão Brasil)
    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const diffToMonday = (day + 6) % 7
    weekStart.setDate(now.getDate() - diffToMonday)
    weekStart.setHours(0, 0, 0, 0)

    let monthly = 0
    let weekly = 0
    let total = 0

    const presentDocs = attendances.filter(a => a.status === 'present')
    total = presentDocs.length

    presentDocs.forEach(a => {
      if (a.parsedDate >= monthStart) monthly++
      if (a.parsedDate >= weekStart) weekly++
    })

    // Cálculo da Sequência (Streak)
    const uniqueDates = [...new Set(presentDocs.map(a => a.parsedDate.toDateString()))]
      .sort((a, b) => new Date(b) - new Date(a))
    
    let streak = 0
    if (uniqueDates.length > 0) {
      streak = 1
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = new Date(uniqueDates[i])
        const d2 = new Date(uniqueDates[i+1])
        const diffDays = (d1 - d2) / (1000 * 60 * 60 * 24)
        
        if (diffDays <= 4) { 
          streak++
        } else {
          break
        }
      }
    }

    return {
      total,
      monthly,
      weekly,
      streak,
      recent: attendances // Todos os registros (presenças + faltas) para o gráfico
    }
  }, [attendances, loading])

  return { ...stats, loading }
}
