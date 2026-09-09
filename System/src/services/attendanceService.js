/**
 * Serviço de Gestão de Presenças e Chamadas (Multi-Tenant Atlas)
 * 
 * Responsável por criar sessões de aula e registrar a assiduidade dos usuários
 * no escopo da organização ativa.
 * 
 * MULTI-TENANT: todas as escritas/leituras são escopadas em
 * organizations/{orgId}/chamadas (e presencas por chamada). Nenhuma coleção
 * raiz legada é utilizada.
 */
import { db } from '../firebase/config'
import { 
  collection, doc, writeBatch, serverTimestamp, 
  getDocs, query, orderBy, limit, 
  collectionGroup, where, setDoc, deleteDoc, increment
} from 'firebase/firestore'
import { COLLECTIONS, SUB_COLLECTIONS, FIELDS, ROOT_COLLECTIONS } from '../firebase/collections'
import { registrarAtividade } from '../hooks/usarLogsSistema'
import { obterOrganizacaoAtiva } from '../utils/organizacaoAtiva'

const USERS_COLLECTION = COLLECTIONS.USUARIOS

/** Resolve a organização alvo (explícita > store singleton) */
const resolverOrg = (orgIdExplicito) => orgIdExplicito || obterOrganizacaoAtiva()

export const attendanceService = {
  /**
   * Cria uma nova sessão (aula) na organização ativa.
   */
  async createSession(payload, organizationId = null) {
    const orgId = resolverOrg(organizationId)
    if (!orgId) throw new Error('Nenhuma organização ativa')
    console.log(`📅 Criando nova sessão na organização ${orgId}:`, payload.id, payload.classTitle)
    try {
      const now = new Date()
      const simpleSeqId = `99${now.getMinutes()}${now.getSeconds()}`
      
      const sessionData = {
        ...payload,
        organizationId: orgId,
        seqId: Number(simpleSeqId),
        presencasCount: 0,
        faltasCount: 0,
        totalCount: 0,
        [FIELDS.FINALIZADA]: false,
        [FIELDS.CRIADO_EM]: serverTimestamp(),
      }
      
      // Escopo tenant: organizations/{orgId}/chamadas/{id}
      const refSessao = doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.CHAMADAS, payload.id)
      await setDoc(refSessao, sessionData)

      console.log('✅ Sessão criada com sucesso no Firestore.')
      return sessionData
    } catch (error) {
      console.error('❌ Erro ao criar sessão:', error)
      throw error
    }
  },

  /**
   * REGISTRO DE CHAMADA EM LOTE (Batch Multi-Tenant)
   */
  async markAttendanceBatch(activeSession, activeList, usuarioLog = null, organizationId = null) {
    const orgId = resolverOrg(organizationId)
    if (!orgId) throw new Error('Nenhuma organização ativa')
    console.log(`📝 Registrando presenças em lote para ${activeList.length} alunos...`)
    try {
      const batch = writeBatch(db)
      const sessionRef = doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.CHAMADAS, activeSession.id)

      let presences = 0
      let absents = 0
      let justified = 0
      let visitantes = 0

      activeList.forEach(student => {
        if (student.status) {
          if (student.status === 'present') {
            presences++
            if (student.isVisitor) visitantes++
          }
          else if (student.status === 'absent') absents++
          else if (student.status === 'justified') justified++

          if (!student.id) return
          const recordRef = doc(collection(sessionRef, SUB_COLLECTIONS.PRESENCAS), String(student.id))
          batch.set(recordRef, {
            studentId: student.id,
            studentName: student.name,
            [FIELDS.STATUS]: student.status,
            [FIELDS.MODALIDADE]: activeSession[FIELDS.MODALIDADE] || activeSession.modality || '',
            [FIELDS.DATA]: activeSession[FIELDS.DATA] || activeSession.date || '',
            isVisitor: !!student.isVisitor,
            organizationId: orgId,
            timestamp: serverTimestamp() 
          })

          if (student.status === 'present' && !student.isTemporary) {
            // Escopo tenant: organizations/{orgId}/usuarios/{id}
            const userRef = doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, USERS_COLLECTION, String(student.id))
            const JORNADA = FIELDS.JORNADA_TECNICA || 'jornada_tecnica'
            const AULAS = FIELDS.AULAS_DESDE_ULTIMA_GRADUACAO || 'aulas_desde_ultima_graduacao'
            batch.set(userRef, {
              lastAttendanceAt: serverTimestamp(),
              ultima_visita: serverTimestamp(),
              total_visitas: increment(1),
              [FIELDS.STATUS]: 'Ativo',
              [JORNADA]: { [AULAS]: increment(1) },
              [FIELDS.ATUALIZADO_EM]: serverTimestamp()
            }, { merge: true })
          }
        }
      })

      const now = new Date()
      const simpleSeqId = activeSession.seqId || `99${now.getMinutes()}${now.getSeconds()}`

      batch.set(sessionRef, {
        ...activeSession,
        organizationId: orgId,
        seqId: Number(simpleSeqId),
        presencasCount: presences,
        faltasCount: absents,
        justificadosCount: justified,
        visitantesCount: visitantes,
        totalCount: activeList.length,
        [FIELDS.FINALIZADA]: true,
        [FIELDS.ATUALIZADO_EM]: serverTimestamp()
      }, { merge: true })

      await batch.commit()
      console.log('✅ Chamada multi-tenant registrada com sucesso.')

      if (usuarioLog) {
        registrarAtividade(
          'finalizar',
          'Finalizou chamada',
          `${activeSession.classTitle || 'Chamada'} — ${presences} presenças`,
          {
            ...usuarioLog,
            organizationId: orgId,
            categoria: 'chamada',
            alvoId: activeSession.id
          }
        )
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao salvar chamada:', error)
      throw error
    }
  },

  async getSessionAttendances(sessionId, organizationId = null) {
    const orgId = resolverOrg(organizationId)
    if (!orgId) return {}
    try {
      const attendancesRef = collection(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.CHAMADAS, sessionId, SUB_COLLECTIONS.PRESENCAS)
      const snapshot = await getDocs(attendancesRef)
      const records = {}

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data()
        records[data.studentId] = data.status
      })

      return records
    } catch (error) {
      console.error('Erro ao buscar presenças da sessão:', error)
      return {}
    }
  },

  async getLastAttendance(studentId, organizationId = null) {
    const orgId = resolverOrg(organizationId)
    if (!orgId) return null
    try {
      const q = query(
        collectionGroup(db, SUB_COLLECTIONS.PRESENCAS),
        where('organizationId', '==', orgId),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'desc'),
        limit(1)
      )

      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        return snapshot.docs[0].data()
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar última presença:', error)
      return null
    }
  },

  async deleteSession(sessionId, tituloSessao = null, usuarioLog = null, organizationId = null) {
    const orgId = resolverOrg(organizationId)
    if (!orgId) return false
    try {
      await deleteDoc(doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.CHAMADAS, sessionId))
      return true
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
      throw error
    }
  }
}
