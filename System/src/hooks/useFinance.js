/**
 * HOOK FINANCEIRO MULTI-TENANT ATLAS
 * 
 * Gerencia receitas (faturamento/cobranças) e despesas escopadas pela academia ativa.
 */

import { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { 
  collection, query, where, onSnapshot, 
  orderBy, getDocs, limit, addDoc, doc, 
  updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useOrganizacao } from '../context/OrganizacaoContext'
import { registrarAtividade, extrairDadosAuth } from './usarLogsSistema'
import { calculateModalityValue } from '../utils/billingUtils'

const toDateKeyUTC = (date) => {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const toDateFromAny = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (value?.seconds) return new Date(value.seconds * 1000)
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function useFinance() {
  const { user, userData, effectiveRole } = useAuth()
  const { organizacaoAtualId } = useOrganizacao()

  const [cobrancas, setCobrancas] = useState([])
  const [carregandoCobrancas, setCarregandoCobrancas] = useState(true)
  const [despesas, setDespesas] = useState([])
  const [carregandoDespesas, setCarregandoDespesas] = useState(true)

  const dadosLog = extrairDadosAuth(userData, effectiveRole)

  useEffect(() => {
    // PURGA DE SEGURANÇA MULTI-TENANT
    // Garante que o estado financeiro seja limpo síncronamente na transição de organizações
    setCobrancas([])
    setDespesas([])

    if (!user || !organizacaoAtualId) {
      setCarregandoCobrancas(false)
      setCarregandoDespesas(false)
      return
    }

    setCarregandoCobrancas(true)
    setCarregandoDespesas(true)

    // GUARDA DE ISOLAMENTO MULTI-TENANT
    // Captura o orgId desta execução específica do efeito.
    // Callbacks de snapshots atrasados de tenants anteriores são descartados
    // antes de atualizar o estado, eliminando a condição de corrida A→B→snapshot-de-A.
    const orgEscopada = organizacaoAtualId

    // 1. Escuta cobranças da academia ativa (subcoleção tenant-scoped `faturas`)
    const refCobrancasOrg = collection(db, 'organizations', orgEscopada, 'faturas')
    const qCobrancas = effectiveRole === 'aluno'
      ? query(refCobrancasOrg, where('studentId', '==', user.uid))
      : refCobrancasOrg

    const unsubCob = onSnapshot(qCobrancas, (snap) => {
      // Descarta snapshot caso a organização já tenha mudado desde a criação deste listener
      if (organizacaoAtualId !== orgEscopada) return
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setCobrancas(data)
      setCarregandoCobrancas(false)
    }, (err) => {
      if (organizacaoAtualId !== orgEscopada) return
      console.warn('⚠️ Erro ao buscar cobranças da organização:', err)
      setCobrancas([])
      setCarregandoCobrancas(false)
    })

    // 2. Escuta despesas da academia ativa (subcoleção tenant-scoped `despesas`)
    let unsubDesp = () => {}
    if (effectiveRole !== 'aluno' && effectiveRole !== 'professor') {
      const refDespesasOrg = collection(db, 'organizations', orgEscopada, 'despesas')
      unsubDesp = onSnapshot(refDespesasOrg, (snap) => {
        // Descarta snapshot caso a organização já tenha mudado desde a criação deste listener
        if (organizacaoAtualId !== orgEscopada) return
        setDespesas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setCarregandoDespesas(false)
      }, () => {
        if (organizacaoAtualId !== orgEscopada) return
        setDespesas([])
        setCarregandoDespesas(false)
      })
    } else {
      setDespesas([])
      setCarregandoDespesas(false)
    }

    return () => {
      unsubCob()
      unsubDesp()
    }
  }, [user, organizacaoAtualId, effectiveRole])

  // KPIs de Cobranças
  // TZ-FIX: usa data civil LOCAL (getFullYear/Month/Date) para evitar que UTC-3
  // classifique cobranças do dia como vencidas nas 3h antes da meia-noite local.
  const _hoje = new Date()
  const todayStr = `${_hoje.getFullYear()}-${String(_hoje.getMonth() + 1).padStart(2, '0')}-${String(_hoje.getDate()).padStart(2, '0')}`
  const cobrancasVencidas = cobrancas.filter(b => 
    b.status === 'overdue' || (b.status === 'pending' && b.dueDate < todayStr)
  )
  const cobrancasPendentes = cobrancas.filter(b => b.status === 'pending' && b.dueDate >= todayStr)
  const cobrancasPagas = cobrancas.filter(b => b.status === 'paid')

  const totalVencido = cobrancasVencidas.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  const totalPendente = cobrancasPendentes.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  const totalPago = cobrancasPagas.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

  // KPIs de Despesas
  const despesasPagas = despesas.filter(d => d.status === 'paid')
  const despesasPendentes = despesas.filter(d => d.status === 'pending')

  const totalDespesasPagas = despesasPagas.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const totalDespesasPendentes = despesasPendentes.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

  async function criarCobranca(dadosCobranca) {
    if (effectiveRole === 'aluno') {
      throw new Error('Acesso Negado para criar cobranças.')
    }
    const ref = collection(db, 'organizations', organizacaoAtualId, 'faturas')
    await addDoc(ref, {
      ...dadosCobranca,
      organizationId: organizacaoAtualId,
      createdAt: serverTimestamp(),
      amount: Number(dadosCobranca.amount)
    })
  }

  async function atualizarStatusCobranca(idCobranca, novoStatus, paidBy = null) {
    const cobrancaRef = doc(db, 'organizations', organizacaoAtualId, 'faturas', idCobranca)
    const payload = { 
      status: novoStatus,
      updatedAt: serverTimestamp()
    }
    if (novoStatus === 'paid') {
      payload.paidAt = serverTimestamp()
      if (paidBy) payload.paidBy = paidBy
    }
    await updateDoc(cobrancaRef, payload)
  }

  async function deletarCobranca(idCobranca) {
    await deleteDoc(doc(db, 'organizations', organizacaoAtualId, 'faturas', idCobranca))
  }

  async function adicionarDespesa(dadosDespesa) {
    const ref = collection(db, 'organizations', organizacaoAtualId, 'despesas')
    await addDoc(ref, {
      ...dadosDespesa,
      organizationId: organizacaoAtualId,
      createdAt: serverTimestamp(),
      amount: Number(dadosDespesa.amount)
    })
  }

  async function deletarDespesa(idDespesa) {
    await deleteDoc(doc(db, 'organizations', organizacaoAtualId, 'despesas', idDespesa))
  }

  return {
    bills: cobrancas,
    loading: carregandoCobrancas,
    overdueBills: cobrancasVencidas,
    overdueCount: cobrancasVencidas.length,
    pendingCount: cobrancasPendentes.length,
    totalOverdue: totalVencido,
    totalPending: totalPendente,
    totalPaid: totalPago,
    addBill: criarCobranca,
    updateBillStatus: atualizarStatusCobranca,
    deleteBill: deletarCobranca,
    expenses: despesas,
    loadingExpenses: carregandoDespesas,
    expensesPaidTotal: totalDespesasPagas,
    expensesPendingTotal: totalDespesasPendentes,
    addExpense: adicionarDespesa,
    deleteExpense: deletarDespesa
  }
}
