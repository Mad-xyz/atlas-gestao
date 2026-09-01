import { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { 
  collection, query, where, onSnapshot, 
  orderBy, addDoc, doc, updateDoc, deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'

export function useContracts() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const contractsRef = collection(db, COLLECTIONS.CONTRATOS)
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
  }, [])

  async function addContract(contractData) {
    const contractsRef = collection(db, COLLECTIONS.CONTRATOS)
    await addDoc(contractsRef, {
      ...contractData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

  async function updateContractStatus(contractId, newStatus) {
    const contractRef = doc(db, COLLECTIONS.CONTRATOS, contractId)
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
