/**
 * PROVEDOR DE COLABORADORES DA EQUIPE (MULTI-TENANT ATLAS)
 * 
 * Sincroniza a lista de colaboradores e professores pertencentes à academia ativa.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { COLLECTIONS } from '../firebase/collections'
import { useOrganizacao } from './OrganizacaoContext'

const CollaboratorsContext = createContext()

export function CollaboratorsProvider({ children }) {
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(true)
  const { organizacaoAtualId } = useOrganizacao()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (userAutenticado) => {
      if (userAutenticado && organizacaoAtualId) {
        console.log(`📡 [CollaboratorsContext] Sincronizando equipe da academia: ${organizacaoAtualId}`)
        
        // 1. Tenta escutar na subcoleção escopada da organização
        const refMembrosOrg = collection(db, 'organizations', organizacaoAtualId, 'members')
        
        const unsubscribeMembros = onSnapshot(refMembrosOrg, (snapshot) => {
          if (!snapshot.empty) {
            const listaMembros = snapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
            }))
            setCollaborators(listaMembros)
            setLoading(false)
          } else {
            // 2. Fallback para a coleção global de usuários da RS Top Team
            const qGlobal = query(
              collection(db, COLLECTIONS.USUARIOS),
              where('papeis.professor', '==', true)
            )
            onSnapshot(qGlobal, (snapGlobal) => {
              const listaGlobal = snapGlobal.docs.map(d => ({ id: d.id, ...d.data() }))
              setCollaborators(listaGlobal)
              setLoading(false)
            }, () => setLoading(false))
          }
        }, (erro) => {
          console.warn('⚠️ [CollaboratorsContext] Fallback para usuários globais:', erro)
          // Fallback seguro em caso de permissão de subcoleção pendente
          const qGlobal = query(
            collection(db, COLLECTIONS.USUARIOS),
            where('papeis.professor', '==', true)
          )
          onSnapshot(qGlobal, (snapGlobal) => {
            const listaGlobal = snapGlobal.docs.map(d => ({ id: d.id, ...d.data() }))
            setCollaborators(listaGlobal)
            setLoading(false)
          }, () => setLoading(false))
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
