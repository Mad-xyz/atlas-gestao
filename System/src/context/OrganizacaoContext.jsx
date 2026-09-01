/**
 * PROVEDOR DE ORGANIZAÇÃO / ACADEMIA (MULTI-TENANT ATLAS)
 * 
 * Gerencia a academia ativa do usuário, as memberships às quais ele pertence,
 * e a troca de contexto entre academias sem vazamento de dados ou memória.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'

const OrganizacaoContext = createContext()

// ID padrão da primeira organização migrada
const ORGANIZACAO_PADRAO_ID = 'rs-top-team'

export function OrganizacaoProvider({ children }) {
  const { user } = useAuth()
  
  const [organizacaoAtualId, setOrganizacaoAtualId] = useState(() => {
    return localStorage.getItem('atlas_organizacao_ativa_id') || ORGANIZACAO_PADRAO_ID
  })
  
  const [organizacaoAtual, setOrganizacaoAtual] = useState(null)
  const [organizacoesDoUsuario, setOrganizacoesDoUsuario] = useState([])
  const [membroAtual, setMembroAtual] = useState(null)
  const [carregandoOrganizacao, setCarregandoOrganizacao] = useState(true)

  // Persiste a escolha da organização ativa no localStorage
  useEffect(() => {
    if (organizacaoAtualId) {
      localStorage.setItem('atlas_organizacao_ativa_id', organizacaoAtualId)
    }
  }, [organizacaoAtualId])

  // Busca todas as organizações/academias que o usuário tem acesso
  const carregarOrganizacoesDoUsuario = useCallback(async () => {
    if (!user) {
      setOrganizacoesDoUsuario([])
      setOrganizacaoAtual(null)
      setMembroAtual(null)
      setCarregandoOrganizacao(false)
      return
    }

    setCarregandoOrganizacao(true)

    try {
      // 1. Busca memberships do usuário nas organizações
      const qMemberships = query(
        collection(db, 'memberships'),
        where('userId', '==', user.uid)
      )
      
      const snapMemberships = await getDocs(qMemberships).catch(() => null)
      const listaOrganizacoes = []

      if (snapMemberships && !snapMemberships.empty) {
        for (const docMembro of snapMemberships.docs) {
          const dadosMembro = docMembro.data()
          const orgId = dadosMembro.organizationId
          
          if (orgId) {
            const docOrg = await getDoc(doc(db, 'organizations', orgId))
            if (docOrg.exists()) {
              listaOrganizacoes.push({
                id: docOrg.id,
                ...docOrg.data(),
                membro: dadosMembro
              })
            }
          }
        }
      }

      // Fallback seguro: se nenhuma membership for localizada ainda (modo inicial),
      // disponibiliza a organização padrão da RS Top Team
      if (listaOrganizacoes.length === 0) {
        listaOrganizacoes.push({
          id: ORGANIZACAO_PADRAO_ID,
          nome: 'RS Top Team',
          slug: 'rs-top-team',
          status: 'ativo',
          membro: {
            role: 'owner',
            userId: user.uid
          }
        })
      }

      setOrganizacoesDoUsuario(listaOrganizacoes)

      // Garante que a organização ativa selecionada é válida para o usuário
      const orgEncontrada = listaOrganizacoes.find(o => o.id === organizacaoAtualId) || listaOrganizacoes[0]
      
      if (orgEncontrada) {
        setOrganizacaoAtualId(orgEncontrada.id)
        setOrganizacaoAtual(orgEncontrada)
        setMembroAtual(orgEncontrada.membro || null)
      }
    } catch (erro) {
      console.error('Erro ao carregar organizações do usuário:', erro)
    } finally {
      setCarregandoOrganizacao(false)
    }
  }, [user, organizacaoAtualId])

  useEffect(() => {
    carregarOrganizacoesDoUsuario()
  }, [carregarOrganizacoesDoUsuario])

  // Função para alternar a academia/organização ativa
  const alterarOrganizacao = useCallback((novaOrganizacaoId) => {
    const orgSelecionada = organizacoesDoUsuario.find(o => o.id === novaOrganizacaoId)
    if (orgSelecionada) {
      setOrganizacaoAtualId(orgSelecionada.id)
      setOrganizacaoAtual(orgSelecionada)
      setMembroAtual(orgSelecionada.membro || null)
      console.log(`🏢 [Atlas Multi-Tenant] Organização alterada para: ${orgSelecionada.nome} (${orgSelecionada.id})`)
    } else {
      console.warn(`⚠️ [Atlas Multi-Tenant] Usuário não possui acesso à organização ${novaOrganizacaoId}`)
    }
  }, [organizacoesDoUsuario])

  const valor = {
    organizacaoAtual,
    organizacaoAtualId,
    organizacoesDoUsuario,
    membroAtual,
    carregandoOrganizacao,
    alterarOrganizacao,
    recarregarOrganizacoes: carregarOrganizacoesDoUsuario
  }

  return (
    <OrganizacaoContext.Provider value={valor}>
      {children}
    </OrganizacaoContext.Provider>
  )
}

export const useOrganizacao = () => {
  const contexto = useContext(OrganizacaoContext)
  if (!contexto) {
    throw new Error('useOrganizacao deve ser usado dentro de um OrganizacaoProvider')
  }
  return contexto
}
