import { useState, useEffect, useRef, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS, SUB_COLLECTIONS } from '../firebase/collections'
import { sanitizeHTML } from '../utils/security'
import { registrarAtividade } from './usarLogsSistema'

const LS_KEY = 'academy_notice_views'

// Lê o Set de IDs vistos do localStorage
function loadViewsFromLS(userId) {
  try {
    const raw = localStorage.getItem(`${LS_KEY}_${userId}`)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch { return new Set() }
}

// Salva o Set no localStorage
function saveViewsToLS(userId, set) {
  try {
    localStorage.setItem(`${LS_KEY}_${userId}`, JSON.stringify([...set]))
  } catch {}
}

/**
 * Hook para gerenciar Avisos e Eventos.
 * userViews é mantido em localStorage para evitar flicker causado por
 * erros de permissão no collectionGroup do Firestore.
 */
export function useNotices(userId = null) {
  const [notices, setNotices] = useState([])
  const [userViews, setUserViews] = useState(() =>
    userId ? loadViewsFromLS(userId) : new Set()
  )
  const [loading, setLoading] = useState(true)
  const knownIds = useRef(null)

  // Sincroniza userViews quando userId muda
  useEffect(() => {
    setUserViews(userId ? loadViewsFromLS(userId) : new Set())
  }, [userId])

  // ── Listener de Avisos + notificação ao postar novo ──
  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.EVENTOS))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : null,
        }
      })
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

      // Notificação nativa ao detectar novo aviso postado
      if (knownIds.current !== null) {
        data.forEach(notice => {
          if (!knownIds.current.has(notice.id)) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`📢 ${notice.title || 'Novo Aviso'}`, {
                body: notice.content || notice.description || 'Novo aviso publicado.',
                icon: '/favicon.ico',
                tag: `notice_new_${notice.id}`,
              })
            }
          }
        })
      }
      knownIds.current = new Set(data.map(n => n.id))

      setNotices(data)
      setLoading(false)
    }, (error) => {
      console.error('Erro ao buscar avisos:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Solicitar permissão de notificação uma vez
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Função auxiliar para extrair tipo de post
  const getTipoPost = (noticeData) => {
    if (noticeData.types?.includes('evento')) return 'evento'
    if (noticeData.types?.includes('aviso')) return 'aviso'
    return 'aviso'
  }

  // ── Adicionar ──
  async function addNotice(noticeData, usuario) {
    const tipo = getTipoPost(noticeData)
    const payload = {
      ...noticeData,
      description: sanitizeHTML(noticeData.description || ''),
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(db, COLLECTIONS.EVENTOS), payload)

    // Log da atividade
    if (usuario) {
      const titulo = noticeData.title || 'Sem título'
      await registrarAtividade(
        'criar',
        tipo === 'evento' ? 'Criou evento' : 'Criou aviso',
        titulo,
        {
          usuarioId: usuario.uid,
          usuarioNome: usuario.nome || usuario.name || usuario.email?.split('@')[0] || 'Usuário',
          usuarioPapel: usuario.papel || usuario.effectiveRole || 'professor',
          usuarioAvatar: usuario.avatarUrl || usuario.photoURL || '',
          categoria: 'evento',
          alvoId: docRef.id,
          alvoNome: titulo
        }
      )
    }

    return docRef.id
  }

  // ── Atualizar ──
  async function updateNotice(id, updates, usuario) {
    const cleanUpdates = { ...updates }
    if (cleanUpdates.description) {
      cleanUpdates.description = sanitizeHTML(cleanUpdates.description)
    }
    await updateDoc(doc(db, COLLECTIONS.EVENTOS, id), {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    })

    // Log da atividade
    if (usuario) {
      await registrarAtividade(
        'editar',
        'Editou evento/aviso',
        updates.title || 'Post atualizado',
        {
          usuarioId: usuario.uid,
          usuarioNome: usuario.nome || usuario.name || usuario.email?.split('@')[0] || 'Usuário',
          usuarioPapel: usuario.papel || usuario.effectiveRole || 'professor',
          usuarioAvatar: usuario.avatarUrl || usuario.photoURL || '',
          categoria: 'evento',
          alvoId: id,
          alvoNome: updates.title || 'Post atualizado'
        }
      )
    }
  }

  // ── Deletar ──
  async function deleteNotice(id, usuario) {
    // Buscar título antes de deletar para o log
    const docSnap = await getDoc(doc(db, COLLECTIONS.EVENTOS, id))
    const titulo = docSnap.exists() ? docSnap.data().title : 'Post deletado'

    await deleteDoc(doc(db, COLLECTIONS.EVENTOS, id))

    // Log da atividade
    if (usuario) {
      await registrarAtividade(
        'excluir',
        'Excluiu evento/aviso',
        titulo,
        {
          usuarioId: usuario.uid,
          usuarioNome: usuario.nome || usuario.name || usuario.email?.split('@')[0] || 'Usuário',
          usuarioPapel: usuario.papel || usuario.effectiveRole || 'professor',
          usuarioAvatar: usuario.avatarUrl || usuario.photoURL || '',
          categoria: 'evento',
          alvoId: id,
          alvoNome: titulo
        }
      )
    }
  }

  // ── Marcar como Visto ──
  // Atualiza localStorage imediatamente (sem flicker) e persiste no Firestore em background
  const markAsViewed = useCallback(async (noticeId, viewerUserId) => {
    if (!noticeId || !viewerUserId) return

    // 1. Atualiza estado local imediatamente (evita o flicker)
    setUserViews(prev => {
      if (prev.has(noticeId)) return prev
      const next = new Set(prev)
      next.add(noticeId)
      saveViewsToLS(viewerUserId, next)
      return next
    })

    // 2. Persiste no Firestore em background (idempotente)
    try {
      const viewRef = doc(
        db,
        COLLECTIONS.EVENTOS,
        noticeId,
        SUB_COLLECTIONS.VISUALIZACOES,
        viewerUserId
      )
      const viewSnap = await getDoc(viewRef)
      if (viewSnap.exists()) return // já registrado

      await setDoc(viewRef, {
        noticeId,
        userId: viewerUserId,
        viewedAt: serverTimestamp()
      })

      await updateDoc(doc(db, COLLECTIONS.EVENTOS, noticeId), {
        views: increment(1)
      })
    } catch (err) {
      console.warn('markAsViewed: erro ao persistir no Firestore:', err.message)
    }
  }, [])

  return {
    notices,
    loading,
    addNotice,
    updateNotice,
    deleteNotice,
    markAsViewed,
    userViews
  }
}
