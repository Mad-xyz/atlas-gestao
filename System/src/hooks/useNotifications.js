/**
 * Hook para gerenciar Firebase Cloud Messaging (FCM)
 * Salva o token FCM no perfil do usuário (tenant-scoped) para permitir push notifications
 */
import { useState, useEffect, useCallback } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { messaging, db } from '../firebase/config'
import { ROOT_COLLECTIONS, COLLECTIONS } from '../firebase/collections'
import { useOrganizacao } from '../context/OrganizacaoContext'

export function useNotifications(userId) {
  const { organizacaoAtualId } = useOrganizacao()
  const [token, setToken] = useState(null)
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Salva token FCM no Firestore (organizations/{orgId}/usuarios/{userId})
  const saveTokenToUser = useCallback(async (fcmToken) => {
    if (!userId || !fcmToken || !organizacaoAtualId) return

    try {
      // MULTI-TENANT: perfil do usuário na subcoleção da organização ativa
      const userRef = doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, organizacaoAtualId, COLLECTIONS.USUARIOS, userId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const userData = userSnap.data()
        const tokens = userData.fcmTokens || []
        
        if (!tokens.includes(fcmToken)) {
          await setDoc(userRef, {
            fcmTokens: [...tokens, fcmToken],
            fcmTokenUpdatedAt: new Date()
          }, { merge: true })
          console.log('[FCM] Token salvo no perfil do usuário')
        }
      }
    } catch (err) {
      console.error('[FCM] Erro ao salvar token:', err)
    }
  }, [userId, organizacaoAtualId])

  // Solicita permissão e gera token FCM
  const requestPermissionAndGetToken = useCallback(async () => {
    if (!messaging || !userId) {
      setError('FCM não disponível neste ambiente')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      // Solicita permissão do navegador
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setError('Permissão para notificações negada')
        return null
      }

      // Obtém token FCM (precisa da VAPID key)
      // Nota: VAPID key deve ser configurada no Firebase Console
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY || ''
      })

      if (!currentToken) {
        setError('Não foi possível obter token FCM')
        return null
      }

      setToken(currentToken)
      
      // Salva token no perfil do usuário
      await saveTokenToUser(currentToken)
      
      return currentToken
    } catch (err) {
      console.error('[FCM] Erro ao obter token:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [userId, saveTokenToUser])

  // Listener para mensagens em primeiro plano
  useEffect(() => {
    if (!messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Mensagem recebida em primeiro plano:', payload)
      
      // Exibe notificação do browser se a permissão estiver concedida
      if (Notification.permission === 'granted') {
        const { title, body } = payload.notification || {}
        new Notification(title || 'Nova notificação', {
          body: body || '',
          icon: '/favicon.ico'
        })
      }
    })

    return () => unsubscribe()
  }, [])

  // Inicialização automática se o usuário estiver logado
  useEffect(() => {
    if (userId && messaging && Notification.permission === 'granted') {
      requestPermissionAndGetToken()
    }
  }, [userId, requestPermissionAndGetToken])

  return {
    token,
    permission,
    loading,
    error,
    requestPermissionAndGetToken
  }
}

export default useNotifications
