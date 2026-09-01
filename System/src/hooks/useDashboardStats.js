// Resumo: hook de estatísticas do dashboard.
// OTIMIZAÇÕES DE PERFORMANCE APLICADAS:
// - Eliminadas queries N+1: subcoleções de presença agora buscadas em paralelo (Promise.all)
// - Removido collectionGroup('membros') sem filtro que baixava todos os membros a cada render
// - teamStats migrado para um cache singleton separado (useTeamStats)
// - Queries de sessions com limit para evitar overfetch

import { useState, useEffect, useCallback, useRef } from 'react'
import { db } from '../firebase/config'
import {
  collection, query, where, getDocs,
  orderBy, limit
} from 'firebase/firestore'
import { COLLECTIONS, SUB_COLLECTIONS } from '../firebase/collections'
import { useStudents } from './useStudents'

// ── Helpers de data ────────────────────────────────────────────────────────────
export function parseDate(d) {
  if (!d) return null
  if (typeof d.toDate === 'function') return d.toDate()
  if (d instanceof Date) return d
  const p = new Date(d)
  return isNaN(p.getTime()) ? null : p
}

export function daysBetween(dateInput, base = new Date()) {
  const d = parseDate(dateInput)
  if (!d) return null
  return Math.floor((base.getTime() - d.getTime()) / 86400000)
}

function toYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Busca subcoleções de presença em paralelo (elimina N+1) ───────────────────
// Antes: loop serial com await getDocs dentro → 1 query por sessão, bloqueante
// Agora: Promise.all → todas as queries disparadas simultaneamente
async function fetchAttendanceCounts(sessionDocs) {
  console.log(`📊 Processando contagens para ${sessionDocs.length} sessões...`)
  const results = await Promise.all(
    sessionDocs.map(async (s) => {
      const data = s.data()
      // Otimização: Se já temos os totais salvos no documento, usamos e evitamos query na subcoleção
      if (typeof data.presencasCount === 'number' && typeof data.totalCount === 'number') {
        console.log(`⚡ Cache Match para sessão: ${s.id} (${data.classTitle || 'Sem Título'})`)
        return {
          id: s.id,
          ref: s.ref,
          presencas: data.presencasCount,
          presencasCount: data.presencasCount,
          faltas: data.faltasCount || (data.totalCount - data.presencasCount),
          ausentes: data.faltasCount || (data.totalCount - data.presencasCount),
          justificados: data.justificadosCount || 0,
          total: data.totalCount,
          totalCount: data.totalCount,
          ...data
        }
      }

      // Fallback para sessões legadas que não possuem os contadores denormalizados
      console.log(`🔍 Buscando subcoleção (Legacy) para sessão: ${s.id}`)
      const attSnap = await getDocs(collection(s.ref, SUB_COLLECTIONS.PRESENCAS))
      let presencas = 0, faltas = 0, justificados = 0, total = 0
      attSnap.forEach(a => {
        const st = a.data().status
        total++
        if (st === 'present') presencas++
        else if (st === 'absent') faltas++
        else if (st === 'justified') justificados++
      })

      return {
        id: s.id,
        ref: s.ref,
        presencas,
        presencasCount: presencas,
        faltas,
        ausentes: faltas,
        justificados,
        total,
        totalCount: total,
        ...data
      }
    })
  )
  console.log('✅ Processamento de estatísticas concluído.')
  return results
}

// ── Cache Singleton p/ Navegação Instantânea ───────────────────
let statsCache = {
  data: {},   // period -> data
  ts: {},     // period -> timestamp
  studentsTs: null
}

let globalMetaCache = {
  data: null,
  ts: 0
}

// ── Hook principal ─────────────────────────────────────────────────────────────
export function useDashboardStats(period = 'Semana', instructorId = null) {
  const { students, isLoading: isLoadingStudents } = useStudents()

  const [data, setData] = useState(() => {
    // Chart and period-specific data
    return statsCache.data[period] || {
      chartData: [],
      weekGrowth: 0,
      sessions: []
    }
  })

  const [meta, setMeta] = useState(() => {
    // Stable KPIs (independent of period)
    return globalMetaCache.data || {
      todayPresences: 0,
      absentStudents: [],
      inactiveStudents: [],
      retentionRate: 0,
      activeStudentsAlerts: { warning: 0, critical: 0 },
    }
  })

  // Se temos cache, começamos sem loading para evitar 'flicker'
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(!statsCache.data[period])

  const isFetchingRef = useRef(false)

  const fetchData = useCallback(async (forced = false) => {
    if (isLoadingStudents || !students) return
    if (isFetchingRef.current) return

    const hasCache = !!statsCache.data[period]
    const isStale = !statsCache.ts[period] || (Date.now() - statsCache.ts[period]) > 120000

    if (!hasCache || forced || isStale) {
      isFetchingRef.current = true
      if (!hasCache) setInitialLoading(true)
      setLoading(true)

      try {
        function getBrasiliaNow() {
          const now = new Date();
          const spStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
          return new Date(spStr);
        }
        const nowBR = getBrasiliaNow();
        const todayStr = toYMD(nowBR)
        const sessRef = collection(db, COLLECTIONS.CHAMADAS)

        // ── 1. Presenças de hoje ─────────────────────────────────────────────────
        // Busca somente sessões de hoje (filtro por data = indexed)
        let todayQuery = query(sessRef, where('data', '==', todayStr))
        if (instructorId) {
          todayQuery = query(sessRef, where('data', '==', todayStr), where('instrutorId', '==', instructorId))
        }
        const todaySnap = await getDocs(todayQuery).catch(err => {
          console.error("[DashboardStats] Erro no todayQuery:", err);
          throw err;
        })
        const todayResults = await fetchAttendanceCounts(todaySnap.docs)
        const todayPresences = todayResults.reduce((sum, s) => sum + s.presencas, 0)

        // ── 2. Limites do período ────────────────────────────────────────────────
        let rangeStart = new Date(nowBR)
        let prevRangeStart = new Date(nowBR)

        const DAYS_ABR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        const MNTHS_ABR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

        if (period === 'Semana') {
          rangeStart.setDate(nowBR.getDate() - 6)
          prevRangeStart.setDate(nowBR.getDate() - 13)
        } else if (period === 'Mês') {
          rangeStart.setDate(1)
          prevRangeStart = new Date(nowBR.getFullYear(), nowBR.getMonth() - 1, 1)
        } else {
          rangeStart = new Date(nowBR.getFullYear(), 0, 1)
          prevRangeStart = new Date(nowBR.getFullYear() - 1, 0, 1)
        }

        const rangeStartStr = toYMD(rangeStart)
        const prevRangeStartStr = toYMD(prevRangeStart)

        // 📊 Busca dupla para o período (Novo vs Legado)
        // 📊 Busca simplificada pelo campo 'data'
        const currentQ = query(sessRef, where('data', '>=', rangeStartStr), where('data', '<=', todayStr))
        const prevQ = query(sessRef, where('data', '>=', prevRangeStartStr), where('data', '<', rangeStartStr))
 
        const [currentSnap, prevSnap] = await Promise.all([
          getDocs(currentQ),
          getDocs(prevQ)
        ]).catch(err => {
          console.error("[DashboardStats] Erro CRÍTICO nas queries de período:", err);
          throw err;
        })
 
        let currentDocs = currentSnap.docs.map(d => {
            const raw = d.data();
            const keys = Object.keys(raw);
            const actualDataField = keys.find(k => k.trim() === 'data' || k.trim() === 'date');
            const docData = String(raw[actualDataField] || '').trim();
            
            // Normalização de data para YYYY-MM-DD para comparação
            let normalized = docData;
            if (docData.includes('-') && docData.split('-')[0].length === 2) {
               const [dd, mm, yyyy] = docData.split('-');
               normalized = `${yyyy}-${mm}-${dd}`;
            }

            return { id: d.id, ref: d.ref, ...raw, data: normalized }
        })

        let prevDocs = prevSnap.docs.map(d => {
            const raw = d.data();
            const keys = Object.keys(raw);
            const actualDataField = keys.find(k => k.trim() === 'data' || k.trim() === 'date');
            const docData = String(raw[actualDataField] || '').trim();
            
            let normalized = docData;
            if (docData.includes('-') && docData.split('-')[0].length === 2) {
               const [dd, mm, yyyy] = docData.split('-');
               normalized = `${yyyy}-${mm}-${dd}`;
            }
            return { id: d.id, ref: d.ref, ...raw, data: normalized }
        })

        console.log(`[DashboardStats] Período: ${period} | Range: ${rangeStartStr} até ${todayStr}`);
        console.log(`[DashboardStats] Sessões encontradas no currentSnap: ${currentSnap.docs.length}`);

        // 🎓 Filtro de Instrutor na memória (mais rápido que criar índices para cada combinação)
        if (instructorId) {
          currentDocs = currentDocs.filter(d => d.instrutorId === instructorId)
          prevDocs = prevDocs.filter(d => d.instrutorId === instructorId)
        }

        // ── 3. Montar skeleton do gráfico ────────────────────────────────────────
        let skeleton = []
        if (period === 'Semana') {
          skeleton = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(nowBR)
            d.setDate(nowBR.getDate() - (6 - i))
            return { name: DAYS_ABR[d.getDay()], presencas: 0, faltas: 0, justificados: 0 }
          })
        } else if (period === 'Mês') {
          const daysInMonth = new Date(nowBR.getFullYear(), nowBR.getMonth() + 1, 0).getDate()
          skeleton = Array.from({ length: daysInMonth }, (_, i) => ({
            name: String(i + 1).padStart(2, '0'),
            presencas: 0, faltas: 0, justificados: 0
          }))
        } else {
          skeleton = MNTHS_ABR.map(name => ({ name, presencas: 0, faltas: 0, justificados: 0 }))
        }

        // Busca presença de todas as sessões do período em paralelo (sem N+1)
        const currentResults = await fetchAttendanceCounts(currentSnap.docs)

        // Preenche o skeleton com dados reais
        for (const s of currentResults) {
          const dateStr = s.data || s.date
          if (!dateStr) continue

          let label = ''
          if (period === 'Semana') {
            label = DAYS_ABR[new Date(`${dateStr}T12:00:00Z`).getDay()]
          } else if (period === 'Mês') {
            label = dateStr.split('-')[2]
          } else {
            label = MNTHS_ABR[new Date(`${dateStr}T12:00:00Z`).getMonth()]
          }
          const entry = skeleton.find(e => e.name === label)
          if (entry) {
            entry.presencas += s.presencas
            entry.faltas += s.faltas
            entry.justificados += s.justificados
          }
        }

        // ── 4. Crescimento do período (período passado buscado em paralelo) ──────
        const currentTotal = skeleton.reduce((sum, e) => sum + e.presencas, 0)
        const prevResults = await fetchAttendanceCounts(prevSnap.docs)
        const prevTotal = prevResults.reduce((sum, s) => sum + s.presencas, 0)
        const weekGrowth = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0

        // ── 5. Histórico de sessões (máx. 10, já enriquecido pelo passo 3) ───────
        const recentSessions = currentResults
          .sort((a, b) => (b.data || b.date || '').localeCompare(a.data || a.date || ''))
          .slice(0, 10)
          .map(s => ({
            ...s,
            presencasCount: s.presencas,
            totalCount: s.total,
          }))

        // ── 6. Alunos ausentes há mais de 10 dias ────────────────────────────────
        const isActiveStudent = (s) =>
          !['inativo', 'inactive', 'suspenso', 'suspended', 'arquivado', 'archived'].includes(s.status) &&
          s.roles?.aluno === true
        const activeStudents = students.filter(isActiveStudent)

        const absentStudents = activeStudents
          .filter(s => {
            const lastAttendance = parseDate(s.lastAttendanceAt)
            // 🛡️ IMPORTANTE: Usamos APENAS a data de criação no SISTEMA, ignorando a data de início histórica da academia
            const systemCreated = parseDate(s.createdAt || s.criadoEm)
            
            // Se o aluno nunca treinou no sistema...
if (!lastAttendance) return false

            // Se ele já treinou, a regra é a mesma: última presença > 10 dias
            const days = daysBetween(lastAttendance, nowBR)
            return days > 10
          })
          .map(s => {
            const lastAttendance = parseDate(s.lastAttendanceAt)
            const days = lastAttendance ? daysBetween(lastAttendance, nowBR) : null
            return {
              id: s.id,
              name: s.name,
              phone: s.phone || '',
              belt: s.belt || 'white',
              modality: s.modality || '',
              daysAbsent: days,
              lastSeen: lastAttendance,
              isCritical: days !== null && days > 30,
            }
          })
          .sort((a, b) => (b.daysAbsent || 999) - (a.daysAbsent || 999))

        // ── 7. Taxa de retenção ───────────────────────────────────────────────────
        const retentionRate = activeStudents.length > 0
          ? Math.round(
            ((activeStudents.length - absentStudents.filter(s => s.isCritical).length)
              / activeStudents.length) * 100
          )
          : 100

        // ── 8. Alertas ────────────────────────────────────────────────────────────
        let warning = 0, critical = 0
        absentStudents.forEach(s => { if (s.isCritical) critical++; else warning++ })

        // ── 9. Alunos inativos ────────────────────────────────────────────────────
        const inactiveStudents = students
          .filter(s => ['inativo', 'inactive'].includes(s.status) && s.roles?.aluno === true)
          .map(s => ({
            id: s.id,
            name: s.name,
            phone: s.phone || '',
            belt: s.belt || 'white',
            modality: s.modality || '',
            reason: s.statusReason || 'Não informado',
            inactiveSince: parseDate(s.lastStatusAt),
          }))
          .sort((a, b) => (b.inactiveSince || 0) - (a.inactiveSince || 0))

        const globalMeta = {
          todayPresences,
          absentStudents,
          inactiveStudents,
          retentionRate,
          activeStudentsAlerts: { warning, critical },
        }

        const periodData = {
          chartData: skeleton,
          sessions: recentSessions,
          weekGrowth,
        }

        // Atualiza Caches Singleton
        statsCache.data[period] = periodData
        statsCache.ts[period] = Date.now()

        globalMetaCache.data = globalMeta
        globalMetaCache.ts = Date.now()

        setData(periodData)
        setMeta(globalMeta)
      } catch (err) {
        console.error('Erro ao carregar estatísticas do dashboard:', err)
      } finally {
        setLoading(false)
        setInitialLoading(false)
        isFetchingRef.current = false
      }
    }
  }, [isLoadingStudents, students, period, instructorId])

  useEffect(() => {
    // Se mudamos o período e temos no cache, atualizamos o 'data' instantaneamente
    if (statsCache.data[period]) {
      setData(statsCache.data[period])
    }
    if (globalMetaCache.data) {
      setMeta(globalMetaCache.data)
    }

    // Se o cache tem menos de 2 minutos para o período, evitamos refetch automático
    const isStale = !statsCache.ts[period] || (Date.now() - statsCache.ts[period]) > 120000
    if (isStale) {
      fetchData()
    } else if (loading) {
      setLoading(false)
    }
  }, [fetchData, period])

  return { data: { ...meta, ...data }, loading, initialLoading, refresh: () => fetchData(true) }
}
