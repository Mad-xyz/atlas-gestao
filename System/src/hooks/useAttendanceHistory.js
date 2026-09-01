import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS } from '../firebase/collections'

export function useAttendanceHistory(days = 7) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate start date based on 'days' requested
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)

    const attendanceRef = collection(db, COLLECTIONS.PRESENCAS_LOG)
    const q = query(
      attendanceRef,
      where('date', '>=', startDate),
      orderBy('date', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }))

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
  }, [days])

  return { history, loading }
}
