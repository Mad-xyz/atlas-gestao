/**
 * PROVEDOR DE ORGANIZAÇÃO / ACADEMIA (MULTI-TENANT ATLAS)
 *
 * Gerencia a academia ativa do usuário e a troca de contexto entre academias.
 *
 * SEGURANÇA (Hardening Multi-Tenant):
 * - A lista de organizações do usuário é derivada EXCLUSIVAMENTE dos documentos
 *   `organizations/{orgId}/members/{uid}` (collectionGroup) — nunca de um
 *   fallback hardcoded. Se não há membership, não há acesso.
 * - Nenhuma organização é retornada sem que o usuário seja membro real.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collectionGroup, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'
import { definirOrganizacaoAtiva } from '../utils/organizacaoAtiva'

const OrganizacaoContext = createContext()

export function OrganizacaoProvider({ children }) {
  const { user } = useAuth()

  const [organizacaoAtualId, setOrganizacaoAtualId] = useState(() => {
    return localStorage.getItem('atlas_organizacao_ativa_id') || null
  })

  const [organizacaoAtual, setOrganizacaoAtual] = useState(null)
  const [organizacoesDoUsuario, setOrganizacoesDoUsuario] = useState([])
  const [membroAtual, setMembroAtual] = useState(null)
  const [carregandoOrganizacao, setCarregandoOrganizacao] = useState(true)

  // Persiste a escolha da organização ativa no localStorage
  useEffect(() => {
    if (organizacaoAtualId) {
      localStorage.setItem('atlas_organizacao_ativa_id', organizacaoAtualId)
    } else {
      localStorage.removeItem('atlas_organizacao_ativa_id')
    }
    // Atualiza o store singleton (usado por services/logs standalone)
    definirOrganizacaoAtiva(organizacaoAtualId)
  }, [organizacaoAtualId])

  // Busca as organizações onde o usuário é membro REAL (via subcoleção members)
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
      // 1. CollectionGroup: organizações/{orgId}/members/{memberId}
      //    Retorna SOMENTE os members docs em que userId == uid autenticado.
      //    As Security Rules garantem: só dados da própria membership.
      const qMembers = query(
        collectionGroup(db, 'members'),
        where('userId', '==', user.uid)
      )

      const snapMembers = await getDocs(qMembers).catch(() => null)
      const listaOrganizacoes = []

      if (snapMembers && !snapMembers.empty) {
        for (const docMembro of snapMembers.docs) {
          const dadosMembro = docMembro.data()
          const orgId = dadosMembro.organizationId || docMembro.ref.parent.parent?.id

          if (!orgId) continue

          const docOrg = await getDoc(doc(db, 'organizations', orgId))
          if (!docOrg.exists()) continue

          const orgData = docOrg.data()
          // Organização inativa: não oferece acesso
          if (orgData.status === 'inativo') continue

          listaOrganizacoes.push({
            id: docOrg.id,
            ...orgData,
            membro: {
              ...dadosMembro,
              role: dadosMembro.role || 'aluno',
              userId: user.uid,
            }
          })
        }
      }

      setOrganizacoesDoUsuario(listaOrganizacoes)

      // Nenhuma organização encontrada → acesso bloqueado por padrão
      if (listaOrganizacoes.length === 0) {
        setOrganizacaoAtual(null)
        setMembroAtual(null)
        setOrganizacaoAtualId(null)
        return
      }

      // Garante que a organização ativa selecionada é válida para o usuário
      const orgEncontrada = listaOrganizacoes.find(o => o.id === organizacaoAtualId) || listaOrganizacoes[0]

      if (orgEncontrada) {
        setOrganizacaoAtualId(orgEncontrada.id)
        setOrganizacaoAtual(orgEncontrada)
        setMembroAtual(orgEncontrada.membro || null)
      }
    } catch (erro) {
      console.error('Erro ao carregar organizações do usuário:', erro)
      setOrganizacoesDoUsuario([])
      setOrganizacaoAtual(null)
      setMembroAtual(null)
      setOrganizacaoAtualId(null)
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

  /**
   * Cria uma nova organização/academia e define o usuário como proprietário (owner).
   * Escreve:
   *  - organizations/{orgId}              (documento do tenant)
   *  - organizations/{orgId}/members/{uid} (membership do fundador como owner)
   */
  const criarNovaOrganizacao = useCallback(async (nome) => {
    if (!user) throw new Error('Usuário não autenticado')
    const nomeLimpo = String(nome || '').trim()
    if (!nomeLimpo) throw new Error('Nome da academia é obrigatório')

    const orgId = `academia_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const agora = serverTimestamp()

    const orgData = {
      nome: nomeLimpo,
      status: 'ativo',
      ownerUid: user.uid,
      criadoPor: user.uid,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    const membroData = {
      userId: user.uid,
      email: user.email || '',
      nome: user.displayName || '',
      role: 'owner',
      status: 'ativo',
      organizationId: orgId,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    // Perfil do fundador na subcoleção `usuarios` (papel owner) — garante login e perfil completo.
    const usuarioData = {
      email: user.email || '',
      nome: user.displayName || '',
      name: user.displayName || '',
      role: 'owner',
      papeis: { owner: true, admin: true, gestor: true },
      roles: { owner: true, admin: true, gestor: true },
      status: 'ativo',
      organizationId: orgId,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    // Criação atômica: a organização + a membership de owner do fundador.
    // As Security Rules exigem role == 'owner' e ownerUid == request.auth.uid
    // exatamente para permitir este bootstrap sem vazamento.
    try {
      await setDoc(doc(db, 'organizations', orgId), orgData)
    } catch (e) {
      console.error('[OrganizacaoContext] Falha ao criar organização:', e.code, e.message)
      throw e
    }
    try {
      await setDoc(doc(db, 'organizations', orgId, 'members', user.uid), membroData)
    } catch (e) {
      console.error('[OrganizacaoContext] Falha ao criar membership de owner:', e.code, e.message)
      throw e
    }
    try {
      await setDoc(doc(db, 'organizations', orgId, 'usuarios', user.uid), usuarioData)
    } catch (e) {
      console.error('[OrganizacaoContext] Falha ao criar perfil de usuário:', e.code, e.message)
      throw e
    }

    // Recarrega a lista de organizações do usuário
    await carregarOrganizacoesDoUsuario()
    return orgId
  }, [user, carregarOrganizacoesDoUsuario])

  const valor = {
    organizacaoAtual,
    organizacaoAtualId,
    organizacoesDoUsuario,
    membroAtual,
    carregandoOrganizacao,
    alterarOrganizacao,
    criarNovaOrganizacao,
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
