import { useEffect, useState } from 'react'
import {
  collectionGroup,
  onSnapshot,
  query,
  where
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { SUB_COLLECTIONS } from '../firebase/collections'
import { useOrganizacao } from '../context/OrganizacaoContext'

/**
 * Histórico de presenças agregado por dia da semana.
 * MULTI-TENANT: consulta a subcoleção `presencas` (collectionGroup) filtrando
 * pela organização ativa. A agregação é feita no cliente (sem índices compostos).
 */
export function useAttendanceHistory(days = 7) {
  const { organizacaoAtualId } = useOrganizacao()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizacaoAtualId) {
      setHistory([])
      setLoading(false)
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate start date based on 'days' requested
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)

    // MULTI-TENANT: collectionGroup 'presencas' filtrado pela organização ativa
    const q = query(
      collectionGroup(db, SUB_COLLECTIONS.PRESENCAS),
      where('organizationId', '==', organizacaoAtualId)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data()
        const dateRaw = data.date || data.data
        return {
          id: doc.id,
          ...data,
          date: dateRaw?.toDate?.() || new Date(dateRaw) || new Date()
        }
      }).filter(l => l.date instanceof Date && !isNaN(l.date.getTime()))

      // Aggregate by day of week for the chart
      const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
      const aggregation = {}
      
      // Initialize aggregation with 0 for each day in range
      for (let i = 0; i <= days; i++) {
        const d = new Date(startDate)
        d.setDate(startDate.getDate() + i)
        const label = daysOfWeek[d.getDay()]
        aggregation[label] = 0
      }

      logs.forEach(log => {
        const label = daysOfWeek[log.date.getDay()]
        if (log.status === 'present') {
          aggregation[label] = (aggregation[label] || 0) + 1
        }
      })

      const chartData = Object.entries(aggregation).map(([name, actual]) => ({
        name,
        actual,
        previsao: Math.max(actual, 10) + Math.floor(Math.random() * 5) // Simple dynamic mock for prediction
      }))

      setHistory(chartData)
      setLoading(loading => false)
    }, (error) => {
      console.error("Error fetching attendance history:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [days, organizacaoAtualId])

  return { history, loading }
}
