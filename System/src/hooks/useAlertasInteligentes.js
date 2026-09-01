/**
 * Hook de Alertas Inteligentes para o Dashboard do Gestor
 * 
 * Centraliza o cálculo de alertas exibidos como badges nos KPIs
 * e dispara notificações toast para eventos críticos.
 * 
 * Tudo em português para manter o padrão do sistema.
 */
import { useMemo, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 */
function dataHojeStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

/**
 * Converte valores de data do Firestore para string YYYY-MM-DD
 */
function extrairData(valor) {
  if (!valor) return null
  if (typeof valor === 'string') {
    // Aceita tanto YYYY-MM-DD quanto DD-MM-YYYY
    if (valor.includes('-')) {
      const partes = valor.split('-')
      if (partes[0].length === 4) return valor // já é YYYY-MM-DD
      return `${partes[2]}-${partes[1]}-${partes[0]}` // DD-MM-YYYY → YYYY-MM-DD
    }
    return valor
  }
  if (typeof valor.toDate === 'function') return dataHojeStr() // simplificado
  return null
}

/**
 * useAlertasInteligentes
 * 
 * @param {Object}  dados
 * @param {Array}   dados.alunos          - Lista completa de alunos
 * @param {Array}   dados.sessoesHoje     - Sessões/aulas de hoje
 * @param {Array}   dados.faturas         - Boletos/faturas (bills)
 * @param {Array}   dados.ausentes        - Alunos ausentes >10 dias
 * 
 * @returns {Object} alertas com badges para cada KPI
 */
export function useAlertasInteligentes(dados) {
  const {
    alunos = [],
    sessoesHoje = [],
    faturas = [],
    ausentes = [],
  } = dados || {}

  const alertasNotificados = useRef(new Set())

  // ── Calcula todos os alertas baseado nos dados recebidos ──
  const alertas = useMemo(() => {
    const hoje = dataHojeStr()
    const agora = new Date()

    // 1. Boletos vencendo hoje
    const vencendoHoje = (faturas || []).filter(f => {
      const venc = extrairData(f.dueDate || f.vencimento)
      const pago = (f.status || '').toLowerCase()
      return venc === hoje && pago !== 'paid' && pago !== 'pago'
    })
    const totalVencendo = vencendoHoje.length

    // 2. Nenhuma chamada iniciada hoje
    const nenhumaChamada = !sessoesHoje || sessoesHoje.length === 0

    // 3. Crescimento de alunos nos últimos 15 dias
    const novos15dias = (alunos || []).filter(a => {
      if (a.isVisitor || !a.roles?.aluno) return false
      const criado = a.createdAt || a.criadoEm
      if (!criado) return false
      const data = typeof criado?.toDate === 'function' ? criado.toDate() : new Date(criado)
      if (isNaN(data.getTime())) return false
      const diff = Math.floor((agora.getTime() - data.getTime()) / 86400000)
      return diff <= 15
    }).length
    const badgeCrescimento = novos15dias > 0
      ? { label: `+${novos15dias} em 15 dias`, bg: 'bg-emerald-500/20', color: 'text-emerald-400' }
      : null

    // 4. Visitantes que não voltaram (mais de 7 dias)
    const visitantesAntigos = (alunos || []).filter(a => {
      if (!a.isVisitor) return false
      const ultima = a.lastAttendanceAt || a.ultimaPresenca
      if (!ultima) return true
      const diff = Math.floor((Date.now() - new Date(ultima).getTime()) / 86400000)
      return diff > 7
    }).length

    // 5. Alunos críticos (>30d ausente)
    const criticos = (ausentes || []).filter(a => a.isCritical).length

    // 6. Alunos novos que ainda não pagaram (criados há até 15 dias, sem fatura paga)
    const alunosNovosSemPagamento = (() => {
      const novosIds = new Set((alunos || []).filter(a => {
        if (a.isVisitor || !a.roles?.aluno) return false
        const criado = a.createdAt || a.criadoEm
        if (!criado) return false
        const data = typeof criado?.toDate === 'function' ? criado.toDate() : new Date(criado)
        if (isNaN(data.getTime())) return false
        const diff = Math.floor((agora.getTime() - data.getTime()) / 86400000)
        return diff <= 15
      }).map(a => a.id))

      if (novosIds.size === 0) return 0

      const idsComPagamento = new Set((faturas || [])
        .filter(f => f.status === 'paid' && novosIds.has(f.studentId))
        .map(f => f.studentId))

      return [...novosIds].filter(id => !idsComPagamento.has(id)).length
    })()

    // 7. Total de ausentes (+10d) para alerta
    const totalAusentes10d = (ausentes || []).length

    return {
      // Badges prontos para usar nos KPIs
      badgeVencendoHoje: totalVencendo > 0
        ? { label: `${totalVencendo} vencem hoje`, bg: 'bg-rose-500/20', color: 'text-rose-400' }
        : null,

      badgeNenhumaChamada: nenhumaChamada
        ? { label: 'Nenhuma chamada', bg: 'bg-blue-500/20', color: 'text-blue-400' }
        : null,

      badgeCrescimento,

      badgeVisitantes: visitantesAntigos > 0
        ? { label: `${visitantesAntigos} sem retorno`, bg: 'bg-yellow-500/20', color: 'text-yellow-400' }
        : null,

      // Alertas ativos para exibir no painel de notificações
      alertasAtivos: [
        ...(criticos > 0
          ? [{ tipo: 'ausencia', gravidade: 'alta', cor: 'text-rose-400', bg: 'bg-rose-500/10', mensagem: `${criticos} aluno${criticos > 1 ? 's' : ''} crítico${criticos > 1 ? 's' : ''} (>30d ausente${criticos > 1 ? 's' : ''})` }]
          : []),
        ...(totalAusentes10d > 0
          ? [{ tipo: 'ausencia', gravidade: 'media', cor: 'text-yellow-400', bg: 'bg-yellow-500/10', mensagem: `${totalAusentes10d} aluno${totalAusentes10d > 1 ? 's' : ''} estão há mais de 10 dias sem presença` }]
          : []),
        ...(totalVencendo > 0
          ? [{ tipo: 'pagamento', gravidade: 'alta', cor: 'text-rose-400', bg: 'bg-rose-500/10', mensagem: `${totalVencendo} pagamento${totalVencendo > 1 ? 's' : ''} vence${totalVencendo > 1 ? 'm' : ''} hoje` }]
          : []),
        ...(alunosNovosSemPagamento > 0
          ? [{ tipo: 'pagamento', gravidade: 'media', cor: 'text-yellow-400', bg: 'bg-yellow-500/10', mensagem: `${alunosNovosSemPagamento} aluno novo${alunosNovosSemPagamento > 1 ? 's' : ''} ainda não pagou${alunosNovosSemPagamento > 1 ? 'ram' : ''}` }]
          : []),
        ...(nenhumaChamada
          ? [{ tipo: 'chamada', gravidade: 'media', cor: 'text-blue-400', bg: 'bg-blue-500/10', mensagem: 'Nenhuma chamada foi iniciada hoje' }]
          : []),
        ...(visitantesAntigos > 0
          ? [{ tipo: 'visitante', gravidade: 'baixa', cor: 'text-yellow-400', bg: 'bg-yellow-500/10', mensagem: `${visitantesAntigos} visitante${visitantesAntigos > 1 ? 's' : ''} sem retorno há mais de 7 dias` }]
          : []),
        ...(novos15dias > 0
          ? [{ tipo: 'crescimento', gravidade: 'informativo', cor: 'text-emerald-400', bg: 'bg-emerald-500/10', mensagem: `+${novos15dias} novo${novos15dias > 1 ? 's' : ''} aluno${novos15dias > 1 ? 's' : ''} nos últimos 15 dias` }]
          : []),
      ],
    }
  }, [alunos, sessoesHoje, faturas, ausentes])

  // ── Dispara notificações toast para alertas críticos (uma vez só) ──
  useEffect(() => {
    if (!alertas.alertasAtivos || alertas.alertasAtivos.length === 0) return

    const timeout = setTimeout(() => {
      alertas.alertasAtivos
        .filter(a => a.gravidade === 'alta')
        .forEach(alerta => {
          const chave = `alerta_${alerta.tipo}_${dataHojeStr()}`
          if (alertasNotificados.current.has(chave)) return
          alertasNotificados.current.add(chave)

          toast.error(`🔴 ${alerta.mensagem}`, {
            id: chave,
            duration: 6000,
            position: 'top-right',
          })
        })
    }, 4000) // Espera o dashboard carregar completamente

    return () => clearTimeout(timeout)
  }, [alertas.alertasAtivos])

  return alertas
}
