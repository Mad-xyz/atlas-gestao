import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * usePushNotifications
 * 
 * Hook que inicializa o plugin @capacitor/push-notifications,
 * solicita permissão ao usuário e salva o FCM token no Firestore
 * para que o backend possa enviar notificações direcionadas.
 * 
 * IMPORTANTE:
 * - Funciona apenas em builds nativos (Android/iOS).
 * - No PWA web, o Firebase Messaging SDK deve ser usado separadamente.
 * - O envio das notificações DEVE ser feito no backend (Cloud Functions, etc.)
 */
export function useNotificacoesPush({ userId, onNotificationReceived } = {}) {
  const listenersRegistered = useRef(false)

  useEffect(() => {
    // Só executa em ambiente nativo (APK instalado no celular/emulador)
    if (!Capacitor.isNativePlatform()) return

    let PushNotifications

    async function initPush() {
      // Importação dinâmica — evita erros no ambiente web (PWA)
      const mod = await import('@capacitor/push-notifications')
      PushNotifications = mod.PushNotifications

      // 1. Solicita permissão ao usuário
      const { receive } = await PushNotifications.requestPermissions()

      if (receive !== 'granted') {
        console.warn('[Push] Permissão negada pelo usuário.')
        return
      }

      // 2. Registra o device no FCM para obter o token
      await PushNotifications.register()

      if (listenersRegistered.current) return
      listenersRegistered.current = true

      // 3. Recebe o FCM Token — salva no Firestore para poder enviar depois
      await PushNotifications.addListener('registration', async (token) => {
        console.log('[Push] FCM Token:', token.value)

        // Salva o token no Firestore vinculado ao usuário logado
        if (userId) {
          const { doc, setDoc, getFirestore, serverTimestamp } = await import('firebase/firestore')
          const { app } = await import('../firebase/config')
          const db = getFirestore(app)

          await setDoc(
            doc(db, 'usuarios', userId),
            { fcmToken: token.value, tokenAtualizadoEm: serverTimestamp() },
            { merge: true }
          )
        }
      })

      // 4. Notificação recebida com app ABERTO (foreground)
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Notificação recebida (foreground):', notification)
        if (onNotificationReceived) onNotificationReceived(notification)
      })

      // 5. Usuário TOCOU na notificação (app em background ou fechado)
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Usuário tocou na notificação:', action.notification)
      })

      // 6. Erro de registro
      await PushNotifications.addListener('registrationError', (err) => {
        console.error('[Push] Erro ao registrar no FCM:', err)
      })
    }

    initPush()

    // Cleanup — remove todos os listeners ao desmontar o componente
    return () => {
      if (PushNotifications) {
        PushNotifications.removeAllListeners()
        listenersRegistered.current = false
      }
    }
  }, [userId, onNotificationReceived])
}
