/**
 * Provedor de Autenticação e Gestão de Sessão (Arquitetura de Dupla Identidade)
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  getAuth,
  inMemoryPersistence,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { firebaseConfig } from '../firebase/config'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  limit,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { COLLECTIONS } from '../firebase/collections'

const AuthContext = createContext()

const getVerifyAuth = () => {
  const apps = getApps()
  const verifyApp = apps.find(a => a.name === 'verify') || initializeApp(firebaseConfig, 'verify')
  const vAuth = getAuth(verifyApp)
  setPersistence(vAuth, inMemoryPersistence)
  return vAuth
}
const verifyAuth = getVerifyAuth()

const USERS_COLLECTION = COLLECTIONS.USUARIOS
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

function extractSafeProfile(data) {
  return {
    name: data.nome || data.name || '',
    email: data.email || '',
    ...Object.keys(data).reduce((acc, key) => {
      if (!['password', 'nome', 'name', 'email'].includes(key)) {
        acc[key] = data[key];
      }
      return acc;
    }, {})
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [simulatedRole, setSimulatedRole] = useState(() => {
    return localStorage.getItem('rs_simulated_role') || null
  })

  // 🚀 MODO SETUP: Controle de Bootstrap Inicial
  const [hasAdmin, setHasAdmin] = useState(true) // Default true para evitar flash de setup
  const [hasGestor, setHasGestor] = useState(true)
  const [isSetupMode, setIsSetupMode] = useState(false)

  const inactivityTimerRef = useRef(null)
  const sessionPinHashRef = useRef(null)

  useEffect(() => {
    if (simulatedRole) {
      localStorage.setItem('rs_simulated_role', simulatedRole)
    } else {
      localStorage.removeItem('rs_simulated_role')
    }
  }, [simulatedRole])

  const getHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return hash.toString()
  }

  const effectiveRole = (() => {
    if (simulatedRole) return simulatedRole;
    
    // Prioridade 1: Objeto 'papeis' (SSoT Moderno)
    const papeis = userData?.papeis || {}
    if (papeis.admin === true) return 'admin'
    if (papeis.gestor === true) return 'gestor'
    if (papeis.professor === true) return 'professor'

    // Prioridade 2: Objeto 'roles' (Legado)
    const roles = userData?.roles || {}
    if (roles.admin === true) return 'admin'
    if (roles.gestor === true) return 'gestor'
    if (roles.professor === true) return 'professor'

    // Prioridade 3: Campo 'role' (String)
    const roleStr = String(userData?.role || '').toLowerCase()
    if (roleStr === 'admin') return 'admin'
    if (roleStr === 'gestor') return 'gestor'
    if (roleStr === 'professor') return 'professor'
    
    return 'aluno'
  })()

  const isAdmin = effectiveRole === 'admin'
  const isGestor = effectiveRole === 'gestor'

  const getPinAuthEmail = (raw) => {
    const rawId = String(raw || '').toLowerCase().trim()
    
    // Se já for um e-mail válido, retorna ele
    if (rawId.includes('@')) return rawId
    
    // Fallback para IDs sanitizados legados (apenas se necessário)
    if (rawId.endsWith('@rstopteam.internal')) {
      return rawId.split('@')[0].replace(/_/g, '.')
    }

    return rawId
  }



  const logout = useCallback(async () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    setUser(null); setUserData(null); setSimulatedRole(null)
    sessionPinHashRef.current = null
    try {
      await signOut(auth)
    } catch (err) {
      console.warn('[AuthContext] Erro ao fazer signOut:', err)
    }
  }, [])

  // ⏸️ AUTO-LOGOUT POR INATIVIDADE 
  // useEffect(() => {
  //   const resetTimer = () => {
  //     if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
  //     inactivityTimerRef.current = setTimeout(() => logout(), INACTIVITY_TIMEOUT_MS)
  //   }
  //   if (!user) return
  //   const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
  //   events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
  //   resetTimer()
  //   return () => {
  //     events.forEach(e => window.removeEventListener(e, resetTimer))
  //   }
  // }, [user, logout])

  /**
   *Detecta automaticamente o papel pelo PIN.
   * - Se o PIN bater com `pin` → entra como Aluno (mesmo que seja admin)
   * - Se o PIN bater com `adminPin` → entra como Admin com papel completo
   * Mesmo e-mail, PINs diferentes, papéis diferentes.
   */
  const loginSmart = async (identifier, typedPinRaw) => {
    const email = String(identifier || '').toLowerCase().trim().replace(/<[^>]*>?/g, '')
    const typedPin = String(typedPinRaw || '').trim().replace(/\D/g, '').slice(0, 6)
    const securePIN = typedPin.length >= 6 ? typedPin : typedPin.padEnd(6, '0')

    const tryGetDoc = async (col, id) => { try { const d = await getDoc(doc(db, col, id)); return d.exists() ? d : null } catch { return null } }
    const tryQuery = async (col, field, val) => { try { const s = await getDocs(query(collection(db, col), where(field, '==', val), limit(1))); return s.empty ? null : s.docs[0] } catch { return null } }

    const legacyId = `${email.replace(/[@.]/g, '_')}@rstopteam.internal`

    // 1. Localizar documento primário pelo e-mail real
    const targetDoc =
      await tryGetDoc(USERS_COLLECTION, email) ||
      await tryGetDoc(USERS_COLLECTION, legacyId) ||
      await tryQuery(USERS_COLLECTION, 'email', email)

    if (!targetDoc?.exists()) throw new Error('Usuário não localizado no sistema.')

    const dbData = targetDoc.data()
    const profileId = targetDoc.id

    // 2. Busca documento interno para pegar adminPin e papéis adicionais
    const internalDoc = profileId !== legacyId ? await tryGetDoc(USERS_COLLECTION, legacyId) : null
    const internalData = internalDoc?.exists() ? internalDoc.data() : {}

    const realEmail     = dbData.email || (profileId.includes('@') ? profileId : email)
    const internalEmail = `${realEmail.replace(/[@.]/g, '_')}@rstopteam.internal`

    // 3. Autenticação Segura via Firebase Auth
    // Não verificamos o PIN localmente pois ele está isolado na subcoleção privado/segredos
    let authResult = null;
    let usedInternal = false;

    try {
      // 👔 Tenta logar com o e-mail real primeiro (Gestor/Professor/Aluno/Admin simulando)
      authResult = await signInWithEmailAndPassword(auth, realEmail, securePIN)
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
        try {
          // 👑 Fallback: Tenta logar com e-mail interno (Admin usando PIN master real)
          authResult = await signInWithEmailAndPassword(auth, internalEmail, securePIN)
          usedInternal = true;
        } catch (err) {
          // Se falhar em ambos, verifica se o usuário ao menos tem Auth account para o e-mail real.
          // O fallback de createUserWithEmailAndPassword foi removido por segurança (Hardening 007).
          // Contas devem ser geradas pelo hook de criação ou script de migração.
          throw new Error('PIN incorreto ou credencial inválida.');
        }
      } else {
        throw e;
      }
    }

    // 4. Usuário autenticado com sucesso!
    // Agora temos permissão (isAuth() == true) para ler a subcoleção privada e descobrir qual PIN foi digitado.
    let matchesAdminPin = false;
    let dbAdminPin = null;
    
    try {
      const segredosDoc = await getDoc(doc(db, USERS_COLLECTION, profileId, 'privado', 'segredos'));
      if (segredosDoc.exists()) {
        const segredos = segredosDoc.data();
        dbAdminPin = segredos.adminPin ? String(segredos.adminPin).trim() : null;
      }
    } catch (e) {
      console.warn("🔐 Aviso: Falha ao acessar subcoleção de segredos. Verificando fallback raiz.", e);
      // Fallback legado para transição (caso script de migração não tenha rodado)
      dbAdminPin = String(dbData.adminPin || dbData.admPin || internalData.adminPin || internalData.admPin || '').trim();
    }

    matchesAdminPin = dbAdminPin && (typedPin === dbAdminPin || securePIN === dbAdminPin);

    // 5. Detecta papel do usuário no banco (considera ambos os documentos)
    const isMasterAdmin =
      dbData.papeis?.admin === true || dbData.roles?.admin === true || String(dbData.role).toLowerCase() === 'admin' ||
      internalData.papeis?.admin === true || internalData.roles?.admin === true || String(internalData.role).toLowerCase() === 'admin'
    const isGestorUser =
      dbData.papeis?.gestor === true || dbData.roles?.gestor === true || String(dbData.role).toLowerCase() === 'gestor' ||
      internalData.papeis?.gestor === true || internalData.roles?.gestor === true || String(internalData.role).toLowerCase() === 'gestor'
    const isProfUser =
      dbData.papeis?.professor === true || dbData.roles?.professor === true || String(dbData.role).toLowerCase() === 'professor' ||
      internalData.papeis?.professor === true || internalData.roles?.professor === true || String(internalData.role).toLowerCase() === 'professor'
    const isStaff = isMasterAdmin || isGestorUser || isProfUser

    // 6. Define papel da sessão
    if (matchesAdminPin) {
      setSimulatedRole(null) // Usou PIN de admin → papel real, sem simulação
    } else if (isMasterAdmin && !matchesAdminPin) {
      setSimulatedRole('aluno') // Admin usando PIN de aluno → simula visão de aluno
    } else if (isStaff) {
      setSimulatedRole(null) // Gestor/Professor usando PIN normal → entra com papel real
    } else {
      setSimulatedRole('aluno') // Aluno normal
    }

    if (import.meta.env.DEV) {
      console.log('🔍 [loginSmart] Fluxo de login', {
        email, profileId, usouAdminPin: matchesAdminPin, isMasterAdmin, isGestorUser,
        isProfUser, isStaff, useInternal: usedInternal, realEmail, internalEmail
      })
    }

    return authResult;

  // ⚠️ Código removido: bloco inalcançável após o if/else acima (ambos retornam)
  }

  /**
   * LOGIN NORMAL: Só aceita PIN de Aluno.
   * Se for Admin, força o papel 'aluno'.
   */
  const login = async (identifier, password) => {
    let email = String(identifier || '').toLowerCase().trim().replace(/<[^>]*>?/g, '')
    const typedPin = String(password || '').trim().replace(/\D/g, '').slice(0, 6)
    const securePIN = typedPin.length >= 6 ? typedPin : typedPin.padEnd(6, '0')

    try {
      // 1. Tenta localizar o perfil público no Firestore pelo e-mail real
      let targetDoc;
      try {
        targetDoc = await getDoc(doc(db, USERS_COLLECTION, email))
      } catch (e) {
        console.warn("Falha ao ler nova coleção, tentando legado...", e);
      }
      
      // 2. Se não achar, tenta busca por campos na coleção NOVA
      if (!targetDoc || !targetDoc.exists()) {
        const legacyId = `${email.replace(/[@.]/g, '_')}@rstopteam.internal`
        
        try {
          targetDoc = await getDoc(doc(db, USERS_COLLECTION, legacyId))
        } catch (e) {}

        if (!targetDoc?.exists()) {
          try {
            const qEmail = query(collection(db, USERS_COLLECTION), where('email', '==', email), limit(1))
            const qEmailSnap = await getDocs(qEmail)
            if (!qEmailSnap.empty) {
              targetDoc = qEmailSnap.docs[0]
            } else {
              const qNome = query(collection(db, USERS_COLLECTION), where('nome', '==', identifier), limit(1))
              const qNomeSnap = await getDocs(qNome)
              if (!qNomeSnap.empty) {
                targetDoc = qNomeSnap.docs[0]
              } else {
                const qName = query(collection(db, USERS_COLLECTION), where('name', '==', identifier), limit(1))
                const qNameSnap = await getDocs(qName)
                if (!qNameSnap.empty) targetDoc = qNameSnap.docs[0]
              }
            }
          } catch (e) {}
        }
      }

      // 3. RESGATE : Se ainda não achar nada na coleção NOVA, busca na ANTIGA 'users'
      if (!targetDoc || !targetDoc.exists()) {
        const legacyId = `${email.replace(/[@.]/g, '_')}@rstopteam.internal`
        const legacyRef = doc(db, 'users', legacyId)
        const legacySnap = await getDoc(legacyRef)
        
        if (legacySnap.exists()) {
          targetDoc = legacySnap
        } else {
            const q = query(collection(db, 'usuarios'), where('email', '==', email), limit(1))
          const qSnap = await getDocs(q)
          if (!qSnap.empty) targetDoc = qSnap.docs[0]
        }
      }

      if (!targetDoc?.exists()) throw new Error('Usuário não localizado no sistema novo ou legado.')
      const dbData = targetDoc.data()
      const profileId = targetDoc.id

      // Detecta Papéis SSoT
      const isAdm = dbData.papeis?.admin || dbData.roles?.admin || String(dbData.role).toLowerCase() === 'admin'
      const isGestor = dbData.papeis?.gestor || dbData.roles?.gestor || String(dbData.role).toLowerCase() === 'gestor'
      const isProf = dbData.papeis?.professor || dbData.roles?.professor || String(dbData.role).toLowerCase() === 'professor'

      // 🛡️ ACESSO DIRETO: Se for colaborador, entra com papel real (sem simular aluno)
      if (isAdm || isGestor || isProf) {
        setSimulatedRole(null)
      }

      // 4. Autenticação no Firebase Auth (O Auth verifica se o PIN digitado está correto)
      const realEmail = dbData.email || (profileId.includes('@') ? profileId : email)
      const legacyEmail = `${realEmail.replace(/[@.]/g, '_')}@rstopteam.internal`

      try {
        // Tenta primeiro com o e-mail real (Padrão Novo)
        return await signInWithEmailAndPassword(auth, realEmail, securePIN)
      } catch (e) {
        try {
          // Fallback para o legado (.internal)
          return await signInWithEmailAndPassword(auth, legacyEmail, securePIN)
        } catch (e2) {
          // Se falhar em ambos, a senha está incorreta ou o usuário não tem conta no Auth.
          throw new Error('PIN incorreto ou credencial inválida.');
        }
      }
    } catch (err) {
      throw new Error(err.message || 'Usuário ou PIN incorretos.')
    }
  }

  /**
   * LOGIN ADMINISTRADOR: Só aceita PIN Master.
   * Garante acesso total.
   */
  const loginAdmin = async (identifier, adminPin) => {
    let email = String(identifier || '').toLowerCase().trim().replace(/<[^>]*>?/g, '')
    const typedPin = String(adminPin || '').trim().replace(/\D/g, '').slice(0, 6)
    const securePin = typedPin.length >= 6 ? typedPin : typedPin.padEnd(6, '0')

    try {
      // 1. Tenta localizar perfil pelo e-mail real na NOVA coleção
      let snap;
      try {
        snap = await getDoc(doc(db, USERS_COLLECTION, email))
      } catch (e) {
        console.warn("Falha ao ler nova coleção (permissões?), tentando legado...", e);
      }
      
      // 2. Tenta por e-mail ou nome na coleção NOVA e legado
      if (!snap || !snap.exists()) {
        const qEmail = query(collection(db, USERS_COLLECTION), where('email', '==', email), limit(1))
        const qEmailSnap = await getDocs(qEmail)
        if (!qEmailSnap.empty) {
          snap = qEmailSnap.docs[0]
        } else {
          const qNome = query(collection(db, USERS_COLLECTION), where('nome', '==', identifier), limit(1))
          const qNomeSnap = await getDocs(qNome)
          if (!qNomeSnap.empty) snap = qNomeSnap.docs[0]
        }
      }

      // 3. Se falhou total na NOVA, tenta pelo legado TOTAL
      if (!snap || !snap.exists()) {
        const legacyId = `${email.replace(/[@.]/g, '_')}@rstopteam.internal`
        const legacyRef = doc(db, 'users', legacyId);
        const legacySnap = await getDoc(legacyRef);
        
        if (legacySnap.exists()) {
          snap = legacySnap;
        } else {
          const q = query(collection(db, 'usuarios'), where('email', '==', email), limit(1))
          const qSnap = await getDocs(q)
          if (!qSnap.empty) snap = qSnap.docs[0]
        }
      }

      if (!snap?.exists()) throw new Error('Conta não localizada no sistema novo ou legado.')
      const data = snap.data()
      const profileId = snap.id

      const getFieldRobust = (obj, targetKey) => {
        if (!obj) return null
        const normalizedTarget = targetKey.replace(/\s+/g, '').toLowerCase()
        const foundKey = Object.keys(obj).find(k => 
          k.replace(/\s+/g, '').toLowerCase() === normalizedTarget
        )
        return foundKey ? obj[foundKey] : null
      }

      const Papeis = getFieldRobust(data, 'papeis') || data.papeis
      const Roles = getFieldRobust(data, 'roles') || data.roles

      const isAdm = (Papeis?.admin === true) || (Roles?.admin === true) || getFieldRobust(data, 'role')?.toLowerCase() === 'admin'
      const isGestor = (Papeis?.gestor === true) || (Roles?.gestor === true) || getFieldRobust(data, 'role')?.toLowerCase() === 'gestor'
      const isProf = (Papeis?.professor === true) || (Roles?.professor === true) || getFieldRobust(data, 'role')?.toLowerCase() === 'professor'

      if (!isAdm && !isGestor && !isProf) {
        throw new Error('Acesso apenas para Administradores, Gestores ou Professores.')
      }

      // Garante papel real
      setSimulatedRole(null)

      // 4. Autenticação Admin via Auth
      const realEmail = data.email || (profileId.includes('@') ? profileId : email)
      const legacyEmail = profileId.includes('@rstopteam.internal') 
        ? profileId 
        : `${realEmail.replace(/[@.]/g, '_')}@rstopteam.internal`

      try {
        console.log(`[AuthContext] Admin Login para: ${legacyEmail}...`);
        // No modo Admin, SEMPRE usamos o e-mail interno para garantir a verificação do adminPin real
        return await signInWithEmailAndPassword(auth, legacyEmail, securePin)
      } catch (e1) {
        throw new Error('PIN de Acesso incorreto ou credencial inválida.')
      }
    } catch (err) {
      throw new Error(err.message || 'Falha na autenticação administrativa.')
    }
  }

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => { })
    let userUnsub = null
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (userUnsub) userUnsub()
      try {
        if (fbUser) {
          const resolveProfileId = async () => {
            const fbEmail = fbUser.email.toLowerCase()
            console.log(`🔍 [AuthContext] Resolvendo perfil para: ${fbEmail}...`)

            // Se for e-mail interno, tentamos reconstruir o e-mail real para busca direta
            let reconstructedRealEmail = null;
            if (fbEmail.includes('@rstopteam.internal')) {
              const parts = fbEmail.split('@')[0];
              // Tenta reverter o padrão: nome_gmail_com -> nome@gmail.com
              if (parts.includes('_gmail_com')) {
                reconstructedRealEmail = parts.replace('_gmail_com', '@gmail.com').replace(/_/g, '.');
                // Ajuste fino: o replace de pontos pode ser agressivo, mas geralmente emails admin são simples
              }
            }
            
            // 🚀 Busca paralela para máxima performance
            const tasks = [
              // 1. Tenta o ID direto (E-mail real ou UID)
              getDoc(doc(db, USERS_COLLECTION, fbEmail)).then(s => s.exists() ? { id: s.id, col: USERS_COLLECTION } : null),
              // 2. Se for legado, tenta o reconstruído (E-mail real)
              reconstructedRealEmail ? getDoc(doc(db, USERS_COLLECTION, reconstructedRealEmail)).then(s => s.exists() ? { id: s.id, col: USERS_COLLECTION } : null) : Promise.resolve(null),
              // 3. Tenta o mapeamento legado no usuarios
              getDoc(doc(db, USERS_COLLECTION, `${fbEmail.replace(/[@.]/g, '_')}@rstopteam.internal`)).then(s => s.exists() ? { id: s.id, col: USERS_COLLECTION } : null),
              // 4. Tenta o mapeamento legado no users (antigo)
              getDoc(doc(db, 'users', `${fbEmail.replace(/[@.]/g, '_')}@rstopteam.internal`)).then(s => s.exists() ? { id: s.id, col: 'users' } : null)
            ]

            try {
              // Executamos as buscas individualmente com catch para evitar que um Permission Denied trave tudo
              const results = await Promise.all(tasks.map(t => t.catch(err => {
                console.warn(`[AuthContext] Falha silenciada em busca de perfil: ${err.message}`);
                return null;
              })))
              const found = results.find(r => r !== null)
              if (found) {
                console.log(`✅ [AuthContext] Perfil localizado na coleção "${found.col}" com ID "${found.id}"`)
                return found
              }

              // Fallback: Busca por campo email se os IDs diretos falharem
              const q = query(collection(db, USERS_COLLECTION), where('email', '==', fbEmail), limit(1))
              const qSnap = await getDocs(q)
              if (!qSnap.empty) {
                console.log(`✅ [AuthContext] Perfil localizado via busca de campo na coleção "${USERS_COLLECTION}"`)
                return { id: qSnap.docs[0].id, col: USERS_COLLECTION }
              }
            } catch (e) {
              console.error("❌ [AuthContext] Erro ao resolver perfil:", e)
            }

            return null
          }

          const target = await resolveProfileId()
          if (target) {
            userUnsub = onSnapshot(doc(db, target.col, target.id), (snap) => {
              if (snap.exists()) {
                const data = snap.data()
                if (String(data.status || '').toLowerCase() === 'inativo') {
                  console.warn("⚠️ [AuthContext] Usuário inativo detectado. Deslogando...")
                  logout()
                } else {
                  setUser(fbUser)
                   // Garantir permissões para admin apenas
                   const userRole = extractSafeProfile(data);
                   const isAdmin = 
                     userRole.papeis?.admin || 
                     userRole.roles?.admin || 
                     String(userRole.role).toLowerCase() === 'admin';
                   
                   const hasAll = 
                     userRole.permissões?.all === true || 
                     userRole.permissions?.all === true;

                   setUserData({ 
                     ...userRole,
                     ...( (isAdmin || hasAll) && {
                       permissions: {
                         ...userRole.permissions,
                         viewBillingTab: true,
                         manageBillingTab: true,
                         viewExpensesTab: true,
                         manageExpensesTab: true,
                         viewFinance: true,
                         all: hasAll
                       }
                     }),
                     id: snap.id,
                     isLegacyProfile: target.col === 'users'
                   })
                }
              } else { 
                console.warn("❌ [AuthContext] Documento do usuário não encontrado no snapshot.")
                logout() 
              }
              setLoading(false)
            }, (err) => {
              console.error("❌ [AuthContext] Erro no snapshot do perfil:", err)
              setLoading(false)
            })
          } else { 
            console.error("❌ [AuthContext] Nenhum perfil encontrado para:", fbUser.email)
            // Se for uma conta legada sem perfil, forçamos o logout para limpeza
            if (fbUser.email.includes('@rstopteam.internal')) {
              const currentPath = window.location.pathname;
              if (currentPath.includes('/rsadmin')) {
                console.warn(`⚠️ [AuthContext] Ignorando limpeza de sessão na rota ${currentPath} (perfil sendo criado).`)
              } else {
                console.warn("🧹 Limpando sessão legada sem perfil...");
                logout();
              }
            }
            setLoading(false)
          }
        } else {
          setUser(null); setUserData(null); setLoading(false)
        }
      } catch (err) { 
        console.error("❌ [AuthContext] Erro crítico no observer de auth:", err)
        setLoading(false) 
      }
    })

    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("⏱️ [AuthContext] Timeout de carregamento excedido (15s). Forçando liberação da UI...")
        setLoading(false)
      }
    }, 15000)

    return () => { 
      unsubscribe(); 
      if (userUnsub) userUnsub(); 
      clearTimeout(safetyTimeout);
    }
  }, [logout])

  // 🔎 Verificação de Bootstrap (Executa uma vez no início)
  useEffect(() => {
    const checkBootstrap = async () => {
      try {
        const qAdmin = query(collection(db, USERS_COLLECTION), where('papeis.admin', '==', true), limit(1))
        const qGestor = query(collection(db, USERS_COLLECTION), where('papeis.gestor', '==', true), limit(1))
        
        const [snapAdmin, snapGestor] = await Promise.all([
          getDocs(qAdmin),
          getDocs(qGestor)
        ])

        const existsAdmin = !snapAdmin.empty
        const existsGestor = !snapGestor.empty

        setHasAdmin(existsAdmin)
        setHasGestor(existsGestor)
        setIsSetupMode(!existsAdmin || !existsGestor)

        if (!existsAdmin || !existsGestor) {
          console.log(`[AuthContext] 🛠️ Modo Setup Ativo: Admin(${existsAdmin}), Gestor(${existsGestor})`)
        }
      } catch (err) {
        // Se houver erro de permissão, provavelmente o sistema já tem regras ativas e não está em modo setup inicial.
        if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
          console.warn('[AuthContext] Verificação de bootstrap limitada por regras de segurança. Assumindo modo produção.')
          setIsSetupMode(false)
        } else {
          console.error('[AuthContext] Erro ao verificar bootstrap:', err)
        }
      }
    }
    checkBootstrap()
  }, [])

  const sendResetEmail = async (email) => sendPasswordResetEmail(auth, email)

  /**
   * Reautentica o usuário ativo verificando o PIN diretamente com o Firebase Auth.
   * Método "Zero-Trust" que substitui a leitura exposta do PIN no banco.
   */
  const verifyPIN = useCallback(async (pin) => {
    if (!auth.currentUser) return false;
    try {
      const securePIN = pin.length >= 6 ? pin : pin.padEnd(6, '0');
      const credential = EmailAuthProvider.credential(auth.currentUser.email, securePIN);
      await reauthenticateWithCredential(auth.currentUser, credential);
      return true;
    } catch (err) {
      console.warn('[AuthContext] Falha na verificação de PIN (Zero-Trust):', err.message);
      return false;
    }
  }, []);

  const value = {
    user, userData, loading, login, loginAdmin, loginSmart, logout, verifyPIN, effectiveRole,
    isAdmin, isGestor,
    simulatedRole, setSimulatedRole, sendResetEmail,
    isSetupMode, hasAdmin, hasGestor
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
