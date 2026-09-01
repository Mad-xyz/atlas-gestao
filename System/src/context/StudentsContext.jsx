/**
 * PROVEDOR DE ALUNOS (MULTI-TENANT ATLAS)
 * 
 * Mantém uma escuta em tempo real (onSnapshot) de todos os alunos
 * pertencentes à organização/academia ativa selecionada no sistema.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'
import { useOrganizacao } from './OrganizacaoContext'

const StudentsContext = createContext()

function buildInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function parseFirestoreDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([])
  const [rawOrgStudents, setRawOrgStudents] = useState([])
  const [rawUsers, setRawUsers] = useState([])
  const [rawAlunos, setRawAlunos] = useState([])
  const [rawStudents, setRawStudents] = useState([])
  const [rawUsersOld, setRawUsersOld] = useState([])
  const [rawVisitors, setRawVisitors] = useState([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)

  const { user } = useAuth()
  const { organizacaoAtualId } = useOrganizacao()

  useEffect(() => {
    if (!user) {
      setStudents([])
      setIsLoadingStudents(false)
      return
    }

    const mapDoc = (item, collectionName, isVisitorForce = false) => {
      try {
        const data = item.data()
        const rawModalities = data.modalities || data.modalidades || []
        const rawModality = data.modality || data.modalidade || null
        const modalities = Array.isArray(rawModalities) ? rawModalities : (rawModality ? [rawModality] : [])
        if (modalities.length === 0 && rawModality) modalities.push(rawModality)

        let rawName = data.nome || data.name || 'Sem Nome'
        const tech = data.jornada_tecnica || {}
        const roles = data.roles || data.papeis || {}

        return {
          id: item.id,
          name: rawName,
          initials: data.initials || buildInitials(rawName),
          belt: (tech.faixa_atual || data.belt || data.faixa || 'none').toLowerCase(),
          modality: rawModality || modalities[0] || null,
          modalities,
          stripes: Number(tech.graus_atuais || data.stripes || 0),
          pin: data.pin || '',
          status: String(data.status || 'Ativo').toLowerCase(),
          isVisitor: isVisitorForce || Boolean(data.isVisitor) || Boolean(roles.visitante) || Boolean(roles.papeis?.visitante),
          photo: data.photo || null,
          email: data.email || '',
          phone: data.phone || data.telefone || data.whatsapp || '',
          data: data.data || null,
          createdAt: parseFirestoreDate(data.createdAt || data.criadoEm || data.criado_em),
          updatedAt: parseFirestoreDate(data.atualizadoEm || data.updatedAt),
          roles,
          turmas: data.turmas || [],
          gender: data.gender || data.genero || 'Masculino',
          genero: data.genero || data.gender || 'Masculino',
          ageCategory: data.ageCategory || 'Adulto',
          emergency: data.emergency || '',
          medical: data.medical || '',
          parentName: data.parentName || '',
          parentPhone: data.parentPhone || '',
          planValue: data.planValue || '',
          startDate: data.startDate || null,
          jornada_tecnica: tech,
          collectionName
        }
      } catch (e) {
        console.error("❌ Erro ao mapear aluno:", item.id, e)
        return { id: item.id, name: 'Erro no mapeamento', status: 'inativo' }
      }
    }

    // 1. Escuta a subcoleção de alunos da organização ativa
    let unsubOrg = () => {}
    if (organizacaoAtualId) {
      const refOrgAlunos = collection(db, 'organizations', organizacaoAtualId, 'students')
      unsubOrg = onSnapshot(refOrgAlunos, snap => {
        setRawOrgStudents(snap.docs.map(d => mapDoc(d, 'students_org')))
      }, err => console.warn('⚠️ Alunos da organização indisponíveis:', err))
    }

    // 2. Escuta coleções globais para fallback inicial da RS Top Team
    const refs = {
      usuarios: collection(db, 'usuarios'),
      alunos: collection(db, 'alunos'),
      students: collection(db, 'students'),
      users: collection(db, 'users'),
      visitantes: collection(db, 'visitantes')
    }

    const unsub1 = onSnapshot(refs.usuarios, snap => setRawUsers(snap.docs.map(d => mapDoc(d, 'usuarios'))), () => {})
    const unsub2 = onSnapshot(refs.alunos, snap => setRawAlunos(snap.docs.map(d => mapDoc(d, 'alunos'))), () => {})
    const unsub3 = onSnapshot(refs.students, snap => setRawStudents(snap.docs.map(d => mapDoc(d, 'students'))), () => {})
    const unsub4 = onSnapshot(refs.users, snap => setRawUsersOld(snap.docs.map(d => mapDoc(d, 'users'))), () => {})
    const unsub5 = onSnapshot(refs.visitantes, snap => setRawVisitors(snap.docs.map(d => mapDoc(d, 'visitantes', true))), () => {})

    return () => {
      unsubOrg(); unsub1(); unsub2(); unsub3(); unsub4(); unsub5();
    }
  }, [user, organizacaoAtualId])

  useEffect(() => {
    const combined = [...rawOrgStudents, ...rawUsers, ...rawAlunos, ...rawStudents, ...rawUsersOld, ...rawVisitors]
    const uniqueMap = new Map()
    combined.forEach(s => {
      if (s.id && !uniqueMap.has(s.id)) uniqueMap.set(s.id, s)
    })

    const finalData = Array.from(uniqueMap.values())
    const sorted = finalData.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    setStudents(sorted)
    setIsLoadingStudents(false)
  }, [rawOrgStudents, rawUsers, rawAlunos, rawStudents, rawUsersOld, rawVisitors])

  return (
    <StudentsContext.Provider value={{ students, isLoadingStudents }}>
      {children}
    </StudentsContext.Provider>
  )
}

export const useStudentsContext = () => {
  const context = useContext(StudentsContext)
  if (!context) {
    throw new Error('useStudentsContext deve ser usado dentro de um StudentsProvider')
  }
  return context
}
