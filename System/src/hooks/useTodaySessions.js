import { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import {
  collection, query, where, onSnapshot
} from 'firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'

/**
 * Escuta em tempo real (onSnapshot) as sessões de HOJE.
 * OTIMIZADO: Não busca subcoleções automaticamente para evitar o erro de Assertion Failed
 * e melhorar a performance do Dashboard.
 */
let sessionsCache = []

export function useTodaySessions(instructorId = null) {
  const [sessions, setSessions] = useState(sessionsCache)
  const [loading, setLoading]   = useState(sessionsCache.length === 0)

  useEffect(() => {
    function getBrasiliaNow() {
      const now = new Date();
      const spStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
      return new Date(spStr);
    }
    const nowBR = getBrasiliaNow();
    const year = nowBR.getFullYear()
    const month = String(nowBR.getMonth() + 1).padStart(2, '0')
    const day = String(nowBR.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    const sessRef = collection(db, COLLECTIONS.CHAMADAS)
    
    // Busca apenas pelo campo 'data' (Novo Padrão)
    let q = query(sessRef, where('data', '==', todayStr))
    if (instructorId) {
      q = query(sessRef, where('data', '==', todayStr), where('instrutorId', '==', instructorId))
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(docSnap => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          classTitle: d.classTitle || d.title || 'Aula',
          modality: d.modalidade || d.modality || '',
          time: d.horario || d.time || '',
          date: d.data || d.date || todayStr,
          presentes: d.presencasCount || 0,
          ausentes: d.faltasCount || 0,
          total: d.totalCount || 0,
          finalizada: d.finalizada || false,
        }
      })

      // Ordena pelo horário
      data.sort((a, b) => a.time.localeCompare(b.time))
      
      sessionsCache = data
      setSessions(data)
      setLoading(false)
    }, (err) => {
      console.error('useTodaySessions error:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [instructorId])

  return { sessions, loading }
}
