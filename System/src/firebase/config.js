/**
 * Configuração e inicialização do Firebase SDK.
 *
 * OTIMIZAÇÃO DE PERFORMANCE:
 * A persistência offline é activada via IndexedDB usando a API moderna
 * `persistentLocalCache` (substitui `enableIndexedDbPersistence` que foi
 * removida no Firebase SDK v12+).
 * Na segunda visita, dados são servidos do cache local instantaneamente
 * enquanto o Firebase sincroniza em background — sem tela em branco.
 *
 * SEGURANÇA:
 * A chave de API aqui presente é segura de expor no cliente pelo design do
 * Firebase — o acesso real aos dados é controlado pelas Firestore Security Rules.
 * Nunca colocar chaves de service account (firebase-key.json) no cliente.
 */

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: "AIzaSyAW5VzuqbAFRbpoYaOVVbSdMJCL4Fm2dao",
  authDomain: "atlas-os-21356.firebaseapp.com",
  projectId: "atlas-os-21356",
  storageBucket: "atlas-os-21356.firebasestorage.app",
  messagingSenderId: "1070954204252",
  appId: "1:1070954204252:web:0faf12656f5f4de9d36a99",
  measurementId: "G-QMNYWXE3F2"
}

// Inicializa o App (HMR Safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// ─── Firestore Initialization (Ultra-Stable Singleton) ──────────────────────
let dbInstance = null
try {
  if (app) {
    // Usamos MultipleTabManager para permitir que várias abas compartilhem o cache sem erro
    // E explicitamos o databaseId como '(default)' para evitar confusão no SDK
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      })
    })
    console.log('🔥 [Firebase/Config] Firestore inicializado com Persistent Cache (Multi-Tab) no banco (default).')
  }
} catch (error) {
  const errMsg = error.message || ''
  if (errMsg.includes('INTERNAL ASSERTION FAILED') || error.code === 'failed-precondition') {
    console.warn('⚠️ [Firebase/Config] Erro de persistência detectado. Recorrendo ao modo memória...')
  } else {
    console.error('❌ [Firebase/Config] Erro crítico ao inicializar Firestore:', error)
  }
  // Fallback seguro especificando o banco (default)
  dbInstance = getFirestore(app, '(default)')
}

export const db = dbInstance
export const auth = getAuth(app)
export const storage = getStorage(app)

export default app

// 🕵️ Monitor de Bloqueios (Detecta AdBlockers ou Firewalls agressivos)
if (typeof window !== 'undefined') {
  const checkConnectivity = async () => {
    try {
      const response = await fetch('https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel', { method: 'HEAD', mode: 'no-cors' })
      if (response.type === 'opaque') {
        // Sucesso parcial (opaque é esperado com no-cors)
      }
    } catch (e) {
      console.warn('🚨 [CIBERSEGURANÇA] Bloqueio de rede detectado! O navegador ou um AdBlocker está impedindo a comunicação com o Firebase. Isso causará erros de escrita e o dashboard pode não carregar.')
    }
  }
  window.addEventListener('load', () => {
    setTimeout(checkConnectivity, 3000)
  })
}
