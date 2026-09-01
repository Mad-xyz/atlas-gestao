/**
 * Hook para gerenciar as operações de Alunos na arquitetura unificada.
 * Agora todas as mutações são direcionadas para a coleção 'users' com o papel 'aluno'.
 */
import { useState, useCallback } from 'react'
import { db, firebaseConfig } from '../firebase/config'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  deleteField,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { COLLECTIONS, SUB_COLLECTIONS, FIELDS } from '../firebase/collections'
import { useStudentsContext } from '../context/StudentsContext'
import { sanitizeString } from '../utils/security'
import { registrarAtividade, extrairDadosAuth } from './usarLogsSistema'
import { useAuth } from '../context/AuthContext'

// Inicialização Silenciosa de Auth Secundário para Criação de Contas
const getVerifyAuth = () => {
  const apps = getApps()
  const verifyApp = apps.find(a => a.name === 'verify') || initializeApp(firebaseConfig, 'verify')
  const vAuth = getAuth(verifyApp)
  setPersistence(vAuth, inMemoryPersistence)
  return vAuth
}
const vAuth = getVerifyAuth()

/**
 * Gera e-mail técnico para autenticação via PIN.
 */
const getPinAuthEmail = (raw) => {
  const rawId = String(raw || '').toLowerCase().trim()
  if (rawId.includes('@') && !rawId.endsWith('.internal')) return rawId
  return `${rawId.replace(/[^a-z0-9]/g, '_')}@rstopteam.internal`
}

// Nome da coleção unificada
const USERS_COLLECTION = 'usuarios'
const VISITORS_COLLECTION = 'visitantes' // Nova coleção para Leads

/**
 * Normaliza o ID do usuário (E-mail ou Nome sanitizado).
 */
const sanitizeId = (identifier, forceName = false) => {
  if (!identifier) return 'visitante_' + Date.now()

  const idStr = identifier.toString().toLowerCase().trim()

  // Se forçado a usar nome ou não for um e-mail válido, sanitizamos como slug
  const isEmail = idStr.includes('@') && idStr.includes('.')

  if (forceName || !isEmail) {
    return idStr
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  return idStr
}

/**
 * Gera iniciais a partir do nome completo para o avatar visual.
 */
function buildInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const toDateKeyUTC = (date) => {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getReferenceMonthLabelUTC = (date) => {
  const month = date.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' })
  const year = date.getUTCFullYear()
  return `${month} / ${year}`
}

const getNextMonthlyDueDateFromDate = (baseDate) => {
  const day = baseDate.getUTCDate()
  const nextMonthStart = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1, 1, 12, 0, 0))
  const targetYear = nextMonthStart.getUTCFullYear()
  const targetMonth = nextMonthStart.getUTCMonth()
  const maxDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 12, 0, 0)).getUTCDate()
  const normalizedDay = Math.min(day, maxDay)

  return new Date(Date.UTC(targetYear, targetMonth, normalizedDay, 12, 0, 0))
}

export function useStudents() {
  const { students, isLoadingStudents } = useStudentsContext()
  const { userData, effectiveRole } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  // Dados do usuário logado para registrar nos logs
  const dadosLog = extrairDadosAuth(userData, effectiveRole)

  /**
   * Gera um PIN aleatório de 6 dígitos.
   */
  const generatePIN = useCallback(() => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }, [])

  /**
   * Atualiza o status de presença rápida do aluno (Marcando presença no dia).
   */
  const updateStudentStatus = useCallback(async (id, newStatus) => {
    const student = students.find(s => s.id === id)
    const payload = {
      [FIELDS.STATUS]: newStatus ?? null,
      lastStatusAt: serverTimestamp(),
    }

    if (newStatus === 'present') {
      payload.lastAttendanceAt = serverTimestamp()
    }

    // Atualiza o documento na coleção unificada
    const collectionName = student?.isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION
    await updateDoc(doc(db, collectionName, id), payload)

    // Registra no histórico de chamadas
    if (newStatus) {
      await addDoc(collection(db, COLLECTIONS.PRESENCAS_LOG), {
        studentId: id,
        studentName: student?.name || id,
        date: serverTimestamp(),
        status: newStatus,
        modality: student?.modality || 'Jiu Jitsu'
      })
    }
  }, [students])

  /**
   * Altera o status administrativo do aluno (Ativo, Inativo, Suspenso).
   */
  const changeStudentStatus = useCallback(async (id, newStatus, extra = {}) => {
    const student = students.find(s => s.id === id)
    const payload = {
      [FIELDS.STATUS]: newStatus,
      lastStatusAt: serverTimestamp(),
    }
    if (extra.reason !== undefined) payload.statusReason = extra.reason
    if (extra.returnDate !== undefined) payload.statusReturnDate = extra.returnDate

    const collectionName = student?.isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION
    await updateDoc(doc(db, collectionName, id), payload)

    // Log da atividade: status alterado
    const statusAntigo = student?.[FIELDS.STATUS] || student?.status || 'desconhecido'
    registrarAtividade(
      'alterar_status',
      'Alterou status do aluno',
      `${student?.name || id}: ${statusAntigo} → ${newStatus}`,
      {
        ...dadosLog,
        categoria: 'aluno',
        alvoId: id,
        alvoNome: student?.name || id,
        valorAntigo: statusAntigo,
        valorNovo: newStatus
      }
    )
  }, [students, dadosLog])

  /**
   * Realiza o 'Soft Delete' do aluno. 
   * Em vez de remover permanentemente, altera o status para 'Inativo'
   * e registra a data de desativação para auditoria e histórico.
   */
  /**
   * DELETAR ALUNO (Hard Delete)
   * Alterado para exclusão permanente conforme solicitado pelo usuário, 
   * já que o Soft Delete mantinha o registro visível e causava erros de permissão em sub-serviços.
   */
  const deleteStudent = useCallback(async (studentId) => {
    if (!studentId) return

    const target = students.find(s => s.id === studentId)
    if (!target) return

    try {
      const collectionName = target?.isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION
      const userRef = doc(db, collectionName, studentId)

      // 🏆 DECREMENTO DE TURMAS (Limpeza antes de deletar)
      if (!target.isVisitor && target.turmas && target.turmas.length > 0) {
        try {
          const studentEmail = target.email || studentId;
          const turmaPromises = target.turmas.map(async (uniqueId) => {
            const [modId, tId] = uniqueId.includes(':') ? uniqueId.split(':') : [null, uniqueId];
            if (modId && tId) {
              const tRef = doc(db, COLLECTIONS.MODALIDADES, modId, SUB_COLLECTIONS.TURMAS, tId);
              await updateDoc(tRef, {
                totalAlunos: increment(-1),
                alunos: arrayRemove(studentEmail)
              });
            }
          });
          await Promise.all(turmaPromises);
        } catch (err) {
          console.error('❌ Erro ao limpar turmas na deleção:', err);
        }
      }

      // 🏆 LIMPEZA DE SUBCOLEÇÕES (Anotações, Graduações)
      try {
        const notesSnap = await getDocs(collection(userRef, SUB_COLLECTIONS.ANOTACOES))
        await Promise.all(notesSnap.docs.map(d => deleteDoc(d.ref)))
        const gradsSnap = await getDocs(collection(userRef, SUB_COLLECTIONS.GRADUACOES))
        await Promise.all(gradsSnap.docs.map(d => deleteDoc(d.ref)))
      } catch (e) { console.warn('Erro ao limpar subcoleções:', e.message) }

      // Realizamos o Hard Delete (Exclusão Permanente)
      await deleteDoc(userRef)

      console.log(`✅ Aluno ${studentId} removido. Turmas e dados internos limpos. Financeiro preservado.`)

      // Log da atividade: aluno excluído
      registrarAtividade(
        'excluir',
        'Excluiu aluno',
        target?.name || studentId,
        {
          ...dadosLog,
          categoria: 'aluno',
          alvoId: studentId,
          alvoNome: target?.name || studentId
        }
      )
    } catch (e) {
      console.error('Erro ao remover aluno:', e)
      throw e
    }
  }, [students, dadosLog])


  /**
   * ADICIONAR NOVO ALUNO / VISITANTE
   */
  const addStudent = useCallback(async (newStudent, modality, options = {}) => {
    const { isVisitor = false, belt = 'white', stripes = 0 } = options

    // Normalização de modalidades (Deduplicação e Padronização)
    let rawModalities = Array.isArray(modality) ? modality : (modality ? [modality] : [])

    // Filtramos e normalizamos para evitar 'jiu-jitsu' vs 'Jiu Jitsu'
    const finalModalities = Array.from(new Set(rawModalities.map(m => {
      if (typeof m !== 'string') return m
      const trimmed = m.trim()
      // Normalização agressiva para SSoT
      if (trimmed.toLowerCase() === 'jiu-jitsu' || trimmed.toLowerCase() === 'jiu jitsu') return 'Jiu Jitsu'
      if (trimmed.toLowerCase() === 'boxe') return 'Boxe'
      return trimmed
    }))).filter(Boolean)

    // if (finalModalities.length === 0) finalModalities.push('Jiu Jitsu') // Removido para permitir aluno sem modalidade
    const beltFinal = finalModalities.some(m => m.toLowerCase().includes('jiu')) ? (belt || 'white') : 'none'

    const pin = newStudent.pin || generatePIN()

    const payload = {
      [FIELDS.NOME]: sanitizeString(newStudent.name),
      name: sanitizeString(newStudent.name),
      initials: buildInitials(newStudent.name),
      belt: beltFinal,
      [FIELDS.MODALIDADE]: finalModalities[0] || null,
      modality: finalModalities[0] || null,
      [FIELDS.MODALIDADES]: finalModalities,
      modalities: finalModalities,
      stripes: Number(stripes) || 0,
      [FIELDS.STATUS]: 'ativo',
      status: 'ativo',
      isVisitor,
      photo: null,
      [FIELDS.EMAIL]: (newStudent.email || '').toLowerCase().trim(),
      email: (newStudent.email || '').toLowerCase().trim(),
      [FIELDS.TELEFONE]: newStudent.phone || '',
      phone: newStudent.phone || '',
      ddd: newStudent.ddd || '',
      telefone_limpo: newStudent.telefone_limpo || '',
      telefone_completo: newStudent.telefone_completo || '',
      emergency: newStudent.emergency || '',
      medical: newStudent.medical || '',
      ageCategory: newStudent.ageCategory || 'Adulto',
      gender: newStudent.gender || newStudent.genero || 'Masculino',
      genero: newStudent.genero || newStudent.gender || 'Masculino',
      parentName: newStudent.parentName || '',
      parentPhone: newStudent.parentPhone || '',
      isPaymentExempt: newStudent.isPaymentExempt || false,
      planValue: newStudent.planValue || '',
      turmas: newStudent.turmas || [],
      // PIN removido da raiz por segurança (Hardening 007)
      [FIELDS.PAPEIS]: isVisitor ? { visitante: true } : { aluno: true },
      roles: isVisitor ? { visitante: true } : { aluno: true },
      [FIELDS.JORNADA_TECNICA]: {
        [FIELDS.FAIXA_ATUAL]: beltFinal,
        [FIELDS.GRAUS_ATUAIS]: Number(stripes) || 0,
        [FIELDS.AULAS_DESDE_ULTIMA_GRADUACAO]: 0,
        [FIELDS.DATA_ULTIMA_GRADUACAO]: serverTimestamp(),
        [FIELDS.HISTORICO]: [{
          belt: beltFinal,
          date: newStudent.startDate ? new Date(newStudent.startDate + 'T12:00:00') : new Date(),
          reason: 'Ingresso na Academia'
        }]
      },
      [FIELDS.CRIADO_EM]: serverTimestamp(),
      startDate: newStudent.startDate || null,
      [FIELDS.ATUALIZADO_EM]: serverTimestamp(),
      ultima_visita: null,
      total_visitas: 0
    }

    // 🔥 REGRA: Visitantes usam NOME como ID, Alunos usam E-MAIL
    const docId = isVisitor
      ? sanitizeId(newStudent.name, true)
      : sanitizeId(newStudent.email || newStudent.name)

    const emailKey = (newStudent.email || '').toLowerCase().trim()

    const targetCollection = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION
    await setDoc(doc(db, targetCollection, docId), payload, { merge: true })

    // 🔒 SALVAR PIN NA SUBCOLEÇÃO SEGURA (Hardening 007)
    if (!isVisitor) {
      try {
        const segredosRef = doc(db, targetCollection, docId, 'privado', 'segredos');
        await setDoc(segredosRef, { 
          pin: pin,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (e) {
        console.error("❌ Falha ao salvar segredos:", e);
      }
    }

    // 🏆 ATUALIZAÇÃO DE TURMAS (Contabilização)
    if (!isVisitor && payload.turmas && payload.turmas.length > 0) {
      try {
        const studentId = docId; // O ID do aluno (e-mail ou slug)
        const studentEmail = payload.email || docId;

        const turmaPromises = payload.turmas.map(async (uniqueId) => {
          const [mIdRaw, tIdRaw] = uniqueId.includes(':') ? uniqueId.split(':') : [null, uniqueId];
          if (!mIdRaw || !tIdRaw) return;

          const modalityId = mIdRaw.toLowerCase();
          const turmaId = tIdRaw.toLowerCase();

          const turmaRef = doc(db, COLLECTIONS.MODALIDADES, modalityId, SUB_COLLECTIONS.TURMAS, turmaId);
          await updateDoc(turmaRef, {
            totalAlunos: increment(1),
            alunos: arrayUnion(studentEmail)
          });
        });

        await Promise.all(turmaPromises);
        console.log(`✅ Sincronização: ${payload.turmas.length} turmas atualizadas para ${studentEmail}`);
      } catch (err) {
        console.error('❌ Erro CRÍTICO na sincronização de turmas:', err);
      }
    }

    // 🔐 CRIAÇÃO DE AUTH (SSoT): Apenas para Alunos Reais
    if (!isVisitor && emailKey) {
      try {
        const pinAuthEmail = getPinAuthEmail(emailKey)
        const securePIN = pin.length >= 6 ? pin : pin.padEnd(6, '0')
        await createUserWithEmailAndPassword(vAuth, pinAuthEmail, securePIN)
        console.log(`🔐 Academy Auth: Conta criada para ${emailKey} com sucesso.`)
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
          console.warn('⚠️ Aluno já possui conta de autenticação.')
        } else {
          console.error('❌ Erro ao criar Auth Secundário:', e.message)
        }
      }
    }

    // Subcoleções apenas para Alunos
    if (!isVisitor) {
      // ========================================================================
      // FATURAMENTO INICIAL OBRIGATÓRIO: SEMPRE PAGO
      // ========================================================================
      // Garantir que todo novo aluno já nasça com uma cobrança PAGA
      // Evita que o gestor precise criar via "Nova Cobrança"
      try {
        // ========================================================================
        // CÁLCULO DA DATA DE VENCIMENTO: mesmo dia no mês seguinte
        // ========================================================================
        // Exemplo: Entrou dia 10/05 (Pago), vence dia 10/06 (fica Pendente)
        const now = new Date()

        const dueDate = getNextMonthlyDueDateFromDate(now)
        const dueDateStr = toDateKeyUTC(dueDate)
        const referenceMonth = getReferenceMonthLabelUTC(dueDate)
        
        // Extrair primeira modalidade e turma para o relatório
        const initMods = Array.isArray(payload.modalities) ? payload.modalities : payload.modality ? [payload.modality] : []
        const initFirstMod = initMods[0]
        const initModalityName = typeof initFirstMod === 'object' ? (initFirstMod?.name || '') : (initFirstMod || '')
        const initTurmas = Array.isArray(payload.turmas) ? payload.turmas : payload.turma ? [payload.turma] : []
        const initFirstTurma = initTurmas[0]
        const initTurmaName = typeof initFirstTurma === 'object' ? (initFirstTurma?.name || '') : (initFirstTurma || '')

        await addDoc(collection(db, COLLECTIONS.FATURAMENTO), {
          studentId: docId,
          studentName: payload.name,
          amount: Number(payload.planValue) || 0,
          status: 'paid', // SEMPRE PAGO para novos alunos
          dueDate: dueDateStr,
          referenceMonth: referenceMonth,
          modalityName: initModalityName || null,
          turmaName: initTurmaName || null,
          paidAt: serverTimestamp(), // Marcar como pago no momento da criação
          createdAt: serverTimestamp()
        })
        
        console.log(`✅ Faturamento inicial PAGO criado para ${payload.name} - Vencimento: ${dueDateStr}`)
      } catch (err) {
        console.error('❌ Erro ao criar faturamento inicial:', err)
      }
    }

    // Log da atividade: aluno adicionado
    registrarAtividade(
      'criar',
      isVisitor ? 'Adicionou visitante' : 'Adicionou aluno',
      sanitizeString(newStudent.name || 'Novo aluno'),
      {
        ...dadosLog,
        categoria: 'aluno',
        alvoId: docId,
        alvoNome: sanitizeString(newStudent.name || 'Novo aluno')
      }
    )

    return { id: docId, ...payload }
  }, [generatePIN, dadosLog])

  /**
   * ADICIONAR NOVO VISITANTE (Lead)
   * Wrapper especializado para simplificar a criação durante a chamada.
   */
  const addVisitor = useCallback(async (name, modality, responsibleProfessor) => {
    return await addStudent({ name }, modality, { 
      isVisitor: true,
      responsibleProfessor 
    })
  }, [addStudent])

  const CAMPOS_LABEL = {
    name: 'nome',
    email: 'e-mail',
    phone: 'telefone',
    emergency: 'contato de emergência',
    medical: 'informações médicas',
    observacoes: 'observações',
    belt: 'graduação',
    stripes: 'graus',
    modality: 'modalidade',
    type: 'tipo',
    ageCategory: 'faixa etária',
    gender: 'gênero',
    parentName: 'responsável',
    parentPhone: 'tel. do responsável',
    startDate: 'data de início',
    turmas: 'turmas',
    planValue: 'valor do plano',
    address: 'endereço',
    cep: 'CEP',
    bairro: 'bairro',
    cidade: 'cidade',
    estado: 'estado',
    numero: 'número',
    complemento: 'complemento',
  }

  const CAMPOS_TRACKED = Object.keys(CAMPOS_LABEL)

  /**
   * Atualiza dados cadastrais do perfil.
   */
  const updateStudentProfile = useCallback(async (id, updates) => {
    setIsUpdating(true)
    try {
      const student = (students || []).find(s => s.id === id)
      const collectionName = student?.isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION

      const payload = {
        ...updates,
        [FIELDS.ATUALIZADO_EM]: serverTimestamp(),
      }

      if (updates.gender && !updates.genero) {
        payload.genero = updates.gender
      }
      if (updates.genero && !updates.gender) {
        payload.gender = updates.genero
      }
      // Removido override de data de criação antigo



      // 🔥 Sincronização SSoT: Garantir que se modalidades forem alteradas, os campos EN/PT fiquem iguais
      const newModalities = updates[FIELDS.MODALIDADES] || updates.modalities || updates[FIELDS.MODALIDADE] || updates.modality
      if (newModalities) {
        const raw = Array.isArray(newModalities) ? newModalities : [newModalities]
        const normalized = Array.from(new Set(raw.map(m => {
          if (typeof m !== 'string') return m
          const t = m.trim()
          if (t.toLowerCase() === 'jiu-jitsu' || t.toLowerCase() === 'jiu jitsu') return 'Jiu Jitsu'
          return t
        }))).filter(Boolean)

        payload[FIELDS.MODALIDADES] = normalized
        payload.modalities = normalized
        payload[FIELDS.MODALIDADE] = normalized[0] || null
        payload.modality = normalized[0] || null
      }

      if (payload.name) {
        payload[FIELDS.NOME] = sanitizeString(payload.name)
        payload.initials = buildInitials(payload.name)
      }
      if (payload.email) payload[FIELDS.EMAIL] = payload.email.toLowerCase().trim()

      // 🔥 Sincronização de Graus/Stripes
      if (payload.stripes !== undefined) {
        payload.stripes = Number(payload.stripes)
        payload[FIELDS.GRAUS_ATUAIS] = payload.stripes
        if (payload[FIELDS.JORNADA_TECNICA]) {
          payload[FIELDS.JORNADA_TECNICA][FIELDS.GRAUS_ATUAIS] = payload.stripes
        }
      }

      // 🏆 ATUALIZAÇÃO DE TURMAS NO UPDATE (Delta Sync)
      if (!student?.isVisitor && updates.turmas) {
        try {
          const oldTurmas = student.turmas || [];
          const newTurmas = updates.turmas || [];
          const studentEmail = student.email || id;

          // Turmas para ADICIONAR (estão no novo, não estavam no antigo)
          const toAdd = newTurmas.filter(t => !oldTurmas.includes(t));
          // Turmas para REMOVER (estavam no antigo, não estão no novo)
          const toRemove = oldTurmas.filter(t => !newTurmas.includes(t));

          const syncPromises = [];

          toAdd.forEach(uniqueId => {
            const [mIdRaw, tIdRaw] = uniqueId.includes(':') ? uniqueId.split(':') : [null, uniqueId];
            if (mIdRaw && tIdRaw) {
              const mId = mIdRaw.toLowerCase();
              const tId = tIdRaw.toLowerCase();
              const ref = doc(db, COLLECTIONS.MODALIDADES, mId, SUB_COLLECTIONS.TURMAS, tId);
              syncPromises.push(updateDoc(ref, {
                totalAlunos: increment(1),
                alunos: arrayUnion(studentEmail)
              }));
            }
          });

          toRemove.forEach(uniqueId => {
            const [mIdRaw, tIdRaw] = uniqueId.includes(':') ? uniqueId.split(':') : [null, uniqueId];
            if (mIdRaw && tIdRaw) {
              const mId = mIdRaw.toLowerCase();
              const tId = tIdRaw.toLowerCase();
              const ref = doc(db, COLLECTIONS.MODALIDADES, mId, SUB_COLLECTIONS.TURMAS, tId);
              syncPromises.push(updateDoc(ref, {
                totalAlunos: increment(-1),
                alunos: arrayRemove(studentEmail)
              }));
            }
          });

          if (syncPromises.length > 0) {
            await Promise.all(syncPromises);
            console.log(`📊 Sincronização de turmas concluída para ${id}`);
          }
        } catch (err) {
          console.error('❌ Erro ao sincronizar turmas no update:', err);
        }
      }

      await updateDoc(doc(db, collectionName, id), payload)

      const IGNORAR = ['genero', 'ddd', 'telefone_limpo', 'telefone_completo']
      const normalizar = (v) => {
        if (v === undefined || v === null || v === '') return ''
        let s = String(v).trim()
        if (s.length > 3 && /[()\-\s]/.test(s) && /\d{8,}/.test(s)) s = s.replace(/\D/g, '')
        return s
      }

      const alteracoes = []
      for (const campo of CAMPOS_TRACKED) {
        if (IGNORAR.includes(campo)) continue
        if (updates[campo] !== undefined) {
          const de = normalizar(student?.[campo])
          const para = normalizar(updates[campo])
          if (de !== para) {
            alteracoes.push({ campo: CAMPOS_LABEL[campo] || campo, de: student?.[campo] ?? '', para: updates[campo] })
          }
        }
      }
      if (updates.turmas !== undefined) {
        const oldTurmas = student?.turmas || []
        const newTurmas = updates.turmas || []
        const oldStr = JSON.stringify(oldTurmas)
        const newStr = JSON.stringify(newTurmas)
        if (oldStr !== newStr) {
          alteracoes.push({ campo: 'turmas', de: `${oldTurmas.length} turmas`, para: `${newTurmas.length} turmas` })
        }
      }

      // Log da atividade: aluno editado
      registrarAtividade(
        'editar',
        'Editou aluno',
        '',
        {
          ...dadosLog,
          categoria: 'aluno',
          alvoId: id,
          alvoNome: student?.name || id,
          alteracoes
        }
      )
    } catch (err) {
      console.error('Erro ao atualizar:', err)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [students, dadosLog])

  /**
   * Remove um visitante da coleção de leads.
   */
  const deleteVisitor = useCallback(async (visitorId) => {
    try {
      await deleteDoc(doc(db, VISITORS_COLLECTION, visitorId))
      return true
    } catch (err) {
      throw err
    }
  }, [])

  return {
    students,
    isLoadingStudents,
    updateStudentStatus,
    changeStudentStatus,
    deleteStudent,
    deleteVisitor,
    addStudent,
    addVisitor,
    updateStudentProfile,
  }
}
