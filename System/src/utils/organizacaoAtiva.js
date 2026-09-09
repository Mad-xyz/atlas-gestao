/**
 * STORE SINGLETON DA ORGANIZAÇÃO ATIVA
 *
 * Permite que funções standalone (services, logs, utilitários) descubram a
 * organização ativa sem depender de hooks React. O OrganizacaoContext atualiza
 * este store sempre que a organização ativa muda.
 *
 * Uso:
 *   import { obterOrganizacaoAtiva } from '../utils/organizacaoAtiva'
 *   const orgId = obterOrganizacaoAtiva()
 */

let _organizacaoAtivaId = null

export function definirOrganizacaoAtiva(orgId) {
  _organizacaoAtivaId = orgId || null
}

export function obterOrganizacaoAtiva() {
  return _organizacaoAtivaId
}

/**
 * Helper de caminho tenant-scoped para código standalone.
 * Retorna uma referência de coleção dentro de organizations/{orgId}.
 */
import { collection, doc } from 'firebase/firestore'
import { ROOT_COLLECTIONS } from '../firebase/collections'

export const orgCollection = (db, orgId, colecao) => {
  if (!orgId) throw new Error('Nenhuma organização ativa')
  return collection(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, colecao)
}

export const orgDoc = (db, orgId, colecao, documentoId) => {
  if (!orgId) throw new Error('Nenhuma organização ativa')
  return doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, colecao, documentoId)
}

/**
 * Resolve a organização ativa a partir de uma opção explícita ou do store.
 * Usado pelas funções standalone para manter compatibilidade com call sites
 * que ainda passam o orgId por parâmetro.
 */
export const resolverOrganizacao = (orgIdExplicito) => {
  return orgIdExplicito || _organizacaoAtivaId || null
}
