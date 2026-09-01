/**
 * HOOK UTILITÁRIO: useColecaoComTenant (Multi-Tenant Atlas)
 * 
 * Fornece o caminho completo do Firestore escopado pela organização ativa,
 * garantindo o isolamento lógico e prevenindo vazamentos inter-tenant.
 */

import { useMemo } from 'react'
import { collection, doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useOrganizacao } from '../context/OrganizacaoContext'

export function useColecaoComTenant(nomeColecao) {
  const { organizacaoAtualId } = useOrganizacao()

  // Constrói a referência da subcoleção escopada: organizations/{orgId}/{nomeColecao}
  const referenciaColecao = useMemo(() => {
    if (!organizacaoAtualId) return null
    return collection(db, 'organizations', organizacaoAtualId, nomeColecao)
  }, [organizacaoAtualId, nomeColecao])

  // Função auxiliar para obter a referência de um documento específico da subcoleção
  const obterReferenciaDocumento = (documentoId) => {
    if (!organizacaoAtualId || !documentoId) return null
    return doc(db, 'organizations', organizacaoAtualId, nomeColecao, documentoId)
  }

  return {
    organizacaoAtualId,
    referenciaColecao,
    obterReferenciaDocumento
  }
}
