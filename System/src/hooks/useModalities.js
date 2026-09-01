import { useState, useEffect, useMemo } from 'react'
import { db } from '../firebase/config'
import { 
  collection, query, onSnapshot, 
  setDoc, doc, updateDoc, deleteDoc, 
  serverTimestamp, collectionGroup, arrayUnion 
} from 'firebase/firestore'
import { COLLECTIONS, SUB_COLLECTIONS } from '../firebase/collections'
import { useOrganizacao } from '../context/OrganizacaoContext'

let _cachedModalities = null
let _cachedTurmas = null

export function useModalities() {
  const { organizacaoAtualId } = useOrganizacao()

  const [modalities, setModalities] = useState(_cachedModalities || [])
  const [turmas, setTurmas] = useState(_cachedTurmas || [])
  const [loading, setLoading] = useState(!_cachedModalities)

  useEffect(() => {
    if (!organizacaoAtualId) return

    setLoading(true)

    // Referência para modalidades escopadas na organização ativa
    const refModalidades = collection(db, 'organizations', organizacaoAtualId, 'modalities')

    const unsubMods = onSnapshot(refModalidades, (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          _sortKey: d.data().createdAt?.toMillis() || Date.now()
        }))
        data.sort((a, b) => b._sortKey - a._sortKey)
        _cachedModalities = data
        setModalities(data)
        setLoading(false)
      } else {
        // Fallback para coleção global legada
        const qGlobal = collection(db, COLLECTIONS.MODALIDADES)
        onSnapshot(qGlobal, (snapGlobal) => {
          const dataGlobal = snapGlobal.docs.map(d => ({ id: d.id, ...d.data() }))
          setModalities(dataGlobal)
          setLoading(false)
        }, () => setLoading(false))
      }
    }, () => {
      // Fallback em caso de indisponibilidade
      const qGlobal = collection(db, COLLECTIONS.MODALIDADES)
      onSnapshot(qGlobal, (snapGlobal) => {
        const dataGlobal = snapGlobal.docs.map(d => ({ id: d.id, ...d.data() }))
        setModalities(dataGlobal)
        setLoading(false)
      }, () => setLoading(false))
    })

    // Monitor de turmas (collectionGroup ou subcoleção)
    const qTurmas = collectionGroup(db, SUB_COLLECTIONS.TURMAS)
    const unsubTurmas = onSnapshot(qTurmas, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        modalityId: d.ref.parent.parent?.id,
        ...d.data()
      }))
      _cachedTurmas = data
      setTurmas(data)
    }, (err) => {
      console.warn('⚠️ Erro ao monitorar turmas:', err)
    })

    return () => {
      unsubMods()
      unsubTurmas()
    }
  }, [organizacaoAtualId])

  const enrichedModalities = useMemo(() => {
    return modalities.map(mod => {
      const modalityTurmas = turmas.filter(t => t.modalityId === mod.id)
      const studentCount = modalityTurmas.reduce((acc, t) => acc + (t.totalAlunos || 0), 0)
      
      return {
        ...mod,
        turmas: modalityTurmas,
        studentCount
      }
    })
  }, [modalities, turmas])

  const kpis = useMemo(() => {
    const totalModalities = modalities.length
    const totalClasses = turmas.length
    
    const totalStudents = turmas.reduce((acc, t) => {
      const students =
        Number(t.totalAlunos) ||
        Number(t.enrolledCount) ||
        Number(t.studentCount) ||
        0
      return acc + students
    }, 0)
    const avgStudentsPerClass = totalClasses > 0 ? totalStudents / totalClasses : 0
    
    const totalCapacity = turmas.reduce((acc, t) => {
      const capacity = Number(t.capacidade) || Number(t.capacity) || 0
      return acc + capacity
    }, 0)
    const avgOccupancy = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0

    return {
      totalModalities,
      totalClasses,
      avgStudentsPerClass,
      avgOccupancy
    }
  }, [modalities, turmas])

  const addModality = async (modalityData) => {
    const slug = modalityData.name.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
    
    const modRef = doc(db, 'organizations', organizacaoAtualId, 'modalities', slug)
    const capacity = modalityData.capacity === '' || modalityData.capacity === 0 ? null : Number(modalityData.capacity)
    const { initialClass, ...pureData } = modalityData

    await setDoc(modRef, {
      ...pureData,
      id: slug,
      capacity,
      organizationId: organizacaoAtualId,
      status: 'ativo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (initialClass) {
      await addClass(slug, initialClass)
    }

    return slug
  }

  const updateModality = async (id, data) => {
    const modRef = doc(db, 'organizations', organizacaoAtualId, 'modalities', id)
    const capacity = data.capacity === '' || data.capacity === 0 ? null : Number(data.capacity)
    
    await updateDoc(modRef, {
      ...data,
      capacity,
      updatedAt: serverTimestamp()
    })
  }

  const toggleModalityStatus = async (id, currentStatus) => {
    const modRef = doc(db, 'organizations', organizacaoAtualId, 'modalities', id)
    await updateDoc(modRef, {
      status: currentStatus === 'ativo' ? 'inativo' : 'ativo',
      updatedAt: serverTimestamp()
    })
  }

  const deleteModality = async (id) => {
    await deleteDoc(doc(db, 'organizations', organizacaoAtualId, 'modalities', id))
  }

  const addClass = async (modalityId, data) => {
    const slug = data.name.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')

    const classRef = doc(db, 'organizations', organizacaoAtualId, 'modalities', modalityId, SUB_COLLECTIONS.TURMAS, slug)
    
    await setDoc(classRef, {
      ...data,
      id: slug,
      modalityId,
      organizationId: organizacaoAtualId,
      createdAt: serverTimestamp()
    })

    await syncProfessorModalities(data.professors || [], modalityId)
  }

  const updateClass = async (modalityId, classId, data) => {
    const classRef = doc(db, 'organizations', organizacaoAtualId, 'modalities', modalityId, SUB_COLLECTIONS.TURMAS, classId)
    await updateDoc(classRef, {
      ...data,
      updatedAt: serverTimestamp()
    })

    await syncProfessorModalities(data.professors || [], modalityId)
  }

  const syncProfessorModalities = async (professors, modalityId) => {
    if (!professors || professors.length === 0) return

    const modalityDoc = modalities.find(m => m.id === modalityId)
    const modalityName = modalityDoc?.name || modalityId

    try {
      const promises = professors.map(async (p) => {
        if (!p.id) return
        const userRef = doc(db, COLLECTIONS.USUARIOS, p.id)
        
        await updateDoc(userRef, {
          modalities: arrayUnion(modalityName),
          updatedAt: serverTimestamp()
        })
      })

      await Promise.all(promises)
    } catch (err) {
      console.error('❌ Erro ao sincronizar modalidades do professor:', err)
    }
  }

  const deleteClass = async (modalityId, classId) => {
    const classRef = doc(db, 'organizations', organizacaoAtualId, 'modalities', modalityId, SUB_COLLECTIONS.TURMAS, classId)
    await deleteDoc(classRef)
  }

  const getTurmasByModality = (modId) => {
    return turmas.filter(t => t.modalityId === modId)
  }

  return {
    modalities: enrichedModalities,
    allTurmas: turmas,
    getTurmasByModality,
    loading,
    kpis,
    addModality,
    updateModality,
    toggleModalityStatus,
    deleteModality,
    addClass,
    updateClass,
    deleteClass,
    addTurma: addClass,
    updateTurma: updateClass,
    deleteTurma: deleteClass
  }
}
