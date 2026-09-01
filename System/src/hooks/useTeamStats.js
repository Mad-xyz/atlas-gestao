/**
 * Hook dedicado para estatísticas da equipe (total, ativos, por cargo).
 * 
 * MOTIVAÇÃO DE SEPARAÇÃO:
 * O useDashboardStats.js executava um collectionGroup('membros') sem filtro
 * a cada re-render do dashboard, baixando todos os membros desnecessariamente.
 * Este hook usa cache agressivo (5 minutos) pois dados de equipe mudam raramente.
 */
import { useState, useEffect, useRef } from 'react'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS } from '../firebase/collections'

const CACHE_TTL_MS = 5 * 60_000 // 5 minutos — dados de equipe não mudam com frequência

let _cache = null
let _cacheTime = 0
let _pendingFetch = null // Evita fetches duplicados simultâneos

async function fetchTeamStats() {
  const now = Date.now()

  // Retorna cache se ainda válido
  if (_cache && now - _cacheTime < CACHE_TTL_MS) {
    return _cache
  }

  // Deduplicação: se já há um fetch em andamento, aguarda o mesmo
  if (_pendingFetch) return _pendingFetch

  _pendingFetch = (async () => {
    try {
      // O sistema moderno usa a coleção unificada 'usuarios'
      const snap = await getDocs(query(collection(db, COLLECTIONS.USUARIOS)))
      let total = 0, active = 0
      const byRole = {}

      snap.forEach(doc => {
        const d = doc.data()
        // Filtramos apenas quem tem papéis de equipe (Professor, Gestor, Admin)
        const isTeam = d.roles?.professor || d.roles?.gestor || d.roles?.admin
        if (!isTeam) return

        total++
        if (d.status?.toLowerCase() === 'ativo') active++
        
        // Mapeia o papel principal para o gráfico
        const r = d.roles?.admin ? 'admin' : (d.roles?.gestor ? 'gestor' : 'professor')
        byRole[r] = (byRole[r] || 0) + 1
      })

      const result = { total, active, byRole }
      _cache = result
      _cacheTime = Date.now()
      return result
    } finally {
      _pendingFetch = null
    }
  })()

  return _pendingFetch
}

export function useTeamStats() {
  const [stats, setStats] = useState(_cache || { total: 0, active: 0, byRole: {} })
  const [loading, setLoading] = useState(!_cache)

  useEffect(() => {
    let cancelled = false
    fetchTeamStats()
      .then(result => { if (!cancelled) { setStats(result); setLoading(false) } })
      .catch(err => { console.error('Erro ao carregar estatísticas da equipe:', err); setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { stats, loading }
}
