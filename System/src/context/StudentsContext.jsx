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

    // ══════════════════════════════════════════════════════════════════════
    // MULTI-TENANT: escuta SOMENTE a subcoleção `usuarios` da organização ativa.
    // Coleções globais (usuarios, alunos, students, users, visitantes) foram
    // BLOQUEADAS nas Security Rules — nenhum fallback é permitido.
    // ══════════════════════════════════════════════════════════════════════
    let unsubOrg = () => {}
    if (organizacaoAtualId) {
      const refOrgAlunos = collection(db, 'organizations', organizacaoAtualId, 'usuarios')
      unsubOrg = onSnapshot(refOrgAlunos, snap => {
        setRawOrgStudents(snap.docs.map(d => mapDoc(d, 'usuarios')))
        setIsLoadingStudents(false)
      }, err => {
        console.warn('⚠️ Alunos da organização indisponíveis:', err)
        setIsLoadingStudents(false)
      })
    } else {
      setRawOrgStudents([])
      setIsLoadingStudents(false)
    }

    return () => {
      unsubOrg()
    }
  }, [user, organizacaoAtualId])

  useEffect(() => {
    const uniqueMap = new Map()
    rawOrgStudents.forEach(s => {
      if (s.id && !uniqueMap.has(s.id)) uniqueMap.set(s.id, s)
    })

    const sorted = Array.from(uniqueMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    setStudents(sorted)
    setIsLoadingStudents(false)
  }, [rawOrgStudents])

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
