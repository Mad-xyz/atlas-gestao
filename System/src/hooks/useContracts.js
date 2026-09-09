import { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { 
  collection, query, onSnapshot, 
  orderBy, addDoc, doc, updateDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { useOrganizacao } from '../context/OrganizacaoContext'

export function useContracts() {
  const { organizacaoAtualId } = useOrganizacao()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizacaoAtualId) {
      setContracts([])
      setLoading(false)
      return
    }
    // Contratos escopados na organização ativa (subcoleção `contratos`)
    const contractsRef = collection(db, 'organizations', organizacaoAtualId, 'contratos')
    const q = query(contractsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setContracts(data)
      setLoading(false)
    }, (err) => {
      console.error('useContracts error:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [organizacaoAtualId])

  async function addContract(contractData) {
    if (!organizacaoAtualId) throw new Error('Nenhuma organização ativa')
    const contractsRef = collection(db, 'organizations', organizacaoAtualId, 'contratos')
    await addDoc(contractsRef, {
      ...contractData,
      organizationId: organizacaoAtualId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

  async function updateContractStatus(contractId, newStatus) {
    if (!organizacaoAtualId) throw new Error('Nenhuma organização ativa')
    const contractRef = doc(db, 'organizations', organizacaoAtualId, 'contratos', contractId)
    await updateDoc(contractRef, { 
      status: newStatus,
      updatedAt: serverTimestamp()
    })
  }

  return {
    contracts,
    loading,
    addContract,
    updateContractStatus
  }
}
