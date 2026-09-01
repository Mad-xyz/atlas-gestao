import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  collection, query, orderBy, limit,
  onSnapshot, where, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS, FIELDS } from '../firebase/collections'

// ID único incremental para cada notificação local
let _notifId = 1
const nextId = () => _notifId++

// Salva os IDs dos últimos documentos já notificados para evitar duplicatas
const _jaNoficados = new Set()

/**
 * Formata uma data Firestore (Timestamp ou Date) para string legível
 */
function formatarData(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/**
 * Dispara uma notificação local no device (funciona offline, sem servidor)
 */
async function dispararNotificacao({ titulo, corpo, extra = {} }) {
  if (!Capacitor.isNativePlatform()) return

  const { LocalNotifications } = await import('@capacitor/local-notifications')

  const { display } = await LocalNotifications.checkPermissions()
  if (display !== 'granted') {
    const { display: novo } = await LocalNotifications.requestPermissions()
    if (novo !== 'granted') return
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: nextId(),
        title: titulo,
        body: corpo,
        extra,
        channelId: 'rstopteam_default',
        smallIcon: 'ic_launcher',
        iconColor: '#6D001A', // Cor do tema da academia
        sound: 'default',
      }
    ]
  })
}

/**
 * useNotificacoesApp
 *
 * Escuta 3 fontes do Firestore em tempo real e dispara notificações locais:
 *  1. Novos AVISOS / ANÚNCIOS (coleção `eventos`)
 *  2. Novo HORÁRIO de aula adicionado (coleção `eventos` com tipo horario)
 *  3. CHAMADA FINALIZADA com status do aluno (coleção `chamadas` + sub `presencas`)
 *
 * @param {object} params
 * @param {string} params.alunoId   - UID do aluno logado (para filtrar a chamada dele)
 * @param {string} params.role      - papel do usuário ('aluno', 'professor', 'admin', etc.)
 */
export function useNotificacoesApp({ alunoId, role } = {}) {
  const unsubscribers = useRef([])

  useEffect(() => {
    // Inicializa o canal de notificação no Android (necessário para Android 8+)
    async function criarCanal() {
      if (!Capacitor.isNativePlatform()) return
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.createChannel({
        id: 'rstopteam_default',
        name: 'RS Top Team',
        description: 'Notificações da academia',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
        visibility: 1,
      })
    }
    criarCanal()

    // ── LISTENER 1: Novos Avisos / Anúncios ──────────────────────────────────
    // Escuta novos documentos em `eventos` criados nos últimos 60 segundos.
    // Assim, ao abrir o app, ele não re-notifica avisos antigos.
    const agora = Timestamp.fromDate(new Date(Date.now() - 60_000))

    const qAvisos = query(
      collection(db, COLLECTIONS.EVENTOS),
      where(FIELDS.CRIADO_EM, '>=', agora),
      orderBy(FIELDS.CRIADO_EM, 'desc'),
      limit(10)
    )

    const unsubAvisos = onSnapshot(qAvisos, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== 'added') return

        const doc = change.doc
        if (_jaNoficados.has(doc.id)) return
        _jaNoficados.add(doc.id)

        const data = doc.data()
        const tipo = data.tipo || data.type || 'aviso'

        if (tipo === 'horario' || tipo === 'schedule') {
          // Notificação de novo horário de aula
          dispararNotificacao({
            titulo: '📅 Novo Horário de Aula',
            corpo: data.titulo || data.title || 'Um novo horário foi adicionado. Confira!',
            extra: { id: doc.id, tipo: 'horario' }
          })
        } else {
          // Notificação de aviso/anúncio geral
          const autor = data.autorNome || data.autor || 'A academia'
          dispararNotificacao({
            titulo: `📢 Novo aviso de ${autor}`,
            corpo: data.titulo || data.descricao || data.body || 'Toque para ver o aviso completo.',
            extra: { id: doc.id, tipo: 'aviso' }
          })
        }
      })
    })

    unsubscribers.current.push(unsubAvisos)

    // ── LISTENER 2: Chamada Finalizada (notifica o aluno) ────────────────────
    // Só escuta se o usuário logado for um aluno com ID conhecido
    if (alunoId) {
      const agoraParaChamada = Timestamp.fromDate(new Date(Date.now() - 60_000))

      const qChamadas = query(
        collection(db, COLLECTIONS.CHAMADAS),
        where(FIELDS.FINALIZADA, '==', true),
        where(FIELDS.CRIADO_EM, '>=', agoraParaChamada),
        orderBy(FIELDS.CRIADO_EM, 'desc'),
        limit(5)
      )

      const unsubChamadas = onSnapshot(qChamadas, (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type !== 'added' && change.type !== 'modified') return

          const chamadaId = change.doc.id
          const notifKey = `chamada_${chamadaId}_${alunoId}`
          if (_jaNoficados.has(notifKey)) return

          // Busca a presença deste aluno específico nesta chamada
          try {
            const { getDocs, collection: col } = await import('firebase/firestore')
            const presSnap = await getDocs(col(db, COLLECTIONS.CHAMADAS, chamadaId, 'presencas'))

            presSnap.forEach((presDoc) => {
              const pres = presDoc.data()

              // Verifica se é o aluno logado e se ainda não foi notificado
              const isEsteAluno =
                pres.alunoId === alunoId ||
                pres.id === alunoId ||
                presDoc.id === alunoId

              if (!isEsteAluno) return
              _jaNoficados.add(notifKey)

              const chamadaData = change.doc.data()
              const dataAula = formatarData(chamadaData.criadoEm || chamadaData.data)
              const presente = pres.presente === true || pres.status === 'presente'

              dispararNotificacao({
                titulo: presente ? '✅ Presença registrada!' : '❌ Falta registrada',
                corpo: presente
                  ? `Sua presença na aula de ${dataAula} foi confirmada. Continue assim! 💪`
                  : `Você foi marcado como ausente na aula de ${dataAula}.`,
                extra: { chamadaId, tipo: 'chamada', presente }
              })
            })
          } catch (err) {
            console.warn('[Notificações] Erro ao verificar presença:', err)
          }
        })
      })

      unsubscribers.current.push(unsubChamadas)
    }

    // Cleanup: remove todos os listeners ao desmontar
    return () => {
      unsubscribers.current.forEach((unsub) => unsub())
      unsubscribers.current = []
    }
  }, [alunoId, role])
}
