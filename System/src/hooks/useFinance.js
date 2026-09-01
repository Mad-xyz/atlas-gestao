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
import { COLLECTIONS } from '../firebase/collections'
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
    if (!user || !organizacaoAtualId) {
      setCarregandoCobrancas(false)
      setCarregandoDespesas(false)
      return
    }

    setCarregandoCobrancas(true)
    setCarregandoDespesas(true)

    // 1. Escuta cobranças da academia ativa
    const refCobrancasOrg = collection(db, 'organizations', organizacaoAtualId, 'charges')
    const qCobrancas = effectiveRole === 'aluno'
      ? query(refCobrancasOrg, where('studentId', '==', user.uid))
      : refCobrancasOrg

    const unsubCob = onSnapshot(qCobrancas, (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setCobrancas(data)
        setCarregandoCobrancas(false)
      } else {
        // Fallback para faturamento global legado
        const refGlobal = collection(db, COLLECTIONS.FATURAMENTO)
        onSnapshot(refGlobal, (snapG) => {
          setCobrancas(snapG.docs.map(d => ({ id: d.id, ...d.data() })))
          setCarregandoCobrancas(false)
        }, () => setCarregandoCobrancas(false))
      }
    }, (err) => {
      console.warn('⚠️ Erro ao buscar cobranças da organização:', err)
      setCarregandoCobrancas(false)
    })

    // 2. Escuta despesas da academia ativa
    let unsubDesp = () => {}
    if (effectiveRole !== 'aluno' && effectiveRole !== 'professor') {
      const refDespesasOrg = collection(db, 'organizations', organizacaoAtualId, 'expenses')
      unsubDesp = onSnapshot(refDespesasOrg, (snap) => {
        if (!snap.empty) {
          setDespesas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
          setCarregandoDespesas(false)
        } else {
          const refGlobalDesp = collection(db, COLLECTIONS.DESPESAS)
          onSnapshot(refGlobalDesp, (snapG) => {
            setDespesas(snapG.docs.map(d => ({ id: d.id, ...d.data() })))
            setCarregandoDespesas(false)
          }, () => setCarregandoDespesas(false))
        }
      }, () => setCarregandoDespesas(false))
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
  const todayStr = new Date().toISOString().split('T')[0]
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
    const ref = collection(db, 'organizations', organizacaoAtualId, 'charges')
    await addDoc(ref, {
      ...dadosCobranca,
      organizationId: organizacaoAtualId,
      createdAt: serverTimestamp(),
      amount: Number(dadosCobranca.amount)
    })
  }

  async function atualizarStatusCobranca(idCobranca, novoStatus, paidBy = null) {
    const cobrancaRef = doc(db, 'organizations', organizacaoAtualId, 'charges', idCobranca)
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
    await deleteDoc(doc(db, 'organizations', organizacaoAtualId, 'charges', idCobranca))
  }

  async function adicionarDespesa(dadosDespesa) {
    const ref = collection(db, 'organizations', organizacaoAtualId, 'expenses')
    await addDoc(ref, {
      ...dadosDespesa,
      organizationId: organizacaoAtualId,
      createdAt: serverTimestamp(),
      amount: Number(dadosDespesa.amount)
    })
  }

  async function deletarDespesa(idDespesa) {
    await deleteDoc(doc(db, 'organizations', organizacaoAtualId, 'expenses', idDespesa))
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
