/**
 * PROVEDOR DE COLABORADORES DA EQUIPE (MULTI-TENANT ATLAS)
 * 
 * Sincroniza a lista de colaboradores e professores pertencentes à academia ativa.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { useOrganizacao } from './OrganizacaoContext'

const CollaboratorsContext = createContext()

export function CollaboratorsProvider({ children }) {
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(true)
  const { organizacaoAtualId } = useOrganizacao()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (userAutenticado) => {
      // SuperAdmin ou usuário sem organização ativa não deve tentar escutar subcoleções de academias
      if (userAutenticado && organizacaoAtualId && organizacaoAtualId !== 'undefined') {
        console.log(`📡 [CollaboratorsContext] Sincronizando equipe da academia: ${organizacaoAtualId}`)

        // ══════════════════════════════════════════════════════════════════
        // MULTI-TENANT: escuta SOMENTE a subcoleção `members` da organização.
        // Coleção global `usuarios` foi BLOQUEADA nas Security Rules —
        // nenhum fallback global é permitido.
        // ══════════════════════════════════════════════════════════════════
        const refMembrosOrg = collection(db, 'organizations', organizacaoAtualId, 'members')

        const unsubscribeMembros = onSnapshot(refMembrosOrg, (snapshot) => {
          const listaMembros = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }))
          setCollaborators(listaMembros)
          setLoading(false)
        }, (erro) => {
          console.warn('⚠️ [CollaboratorsContext] Erro ao escutar members da organização:', erro)
          setCollaborators([])
          setLoading(false)
        })

        return () => unsubscribeMembros()
      } else {
        setCollaborators([])
        setLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [organizacaoAtualId])

  return (
    <CollaboratorsContext.Provider value={{ collaborators, isLoadingCollaborators: loading }}>
      {children}
    </CollaboratorsContext.Provider>
  )
}

export const useCollaboratorsContext = () => {
  const context = useContext(CollaboratorsContext)
  if (!context) {
    throw new Error('useCollaboratorsContext deve ser usado dentro de um CollaboratorsProvider')
  }
  return context
}
