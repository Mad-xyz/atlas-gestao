/**
 * Provedor de Autenticação e Gestão de Sessão (Arquitetura de Dupla Identidade)
 * MULTI-TENANT: perfil do usuário resolvido via membership (collectionGroup 'members')
 * dentro de organizations/{orgId}. Nenhuma coleção raiz legada é consultada.
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
  collection,
  collectionGroup,
  query,
  getDocs,
  where,
  limit,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext()

const getVerifyAuth = () => {
  const apps = getApps()
  const verifyApp = apps.find(a => a.name === 'verify') || initializeApp(firebaseConfig, 'verify')
  const vAuth = getAuth(verifyApp)
  setPersistence(vAuth, inMemoryPersistence)
  return vAuth
}
const verifyAuth = getVerifyAuth()

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

  // 🚀 MODO SETUP: desativado por padrão no multi-tenant.
  // O bootstrap de academia agora acontece via `criarNovaOrganizacao` no OrganizacaoContext.
  const [hasAdmin, setHasAdmin] = useState(true)
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
    let realRole = 'aluno'
    
    // Prioridade 0: Super Admin da plataforma (Custom Claim)
    if (userData?.isSuperAdmin === true) {
      realRole = 'superAdmin'
    } else {
      // Prioridade 1: Objeto 'papeis' (SSoT Moderno)
      const papeis = userData?.papeis || {}
      if (papeis.admin === true) realRole = 'admin'
      else if (papeis.gestor === true) realRole = 'gestor'
      else if (papeis.professor === true) realRole = 'professor'
      else {
        // Prioridade 2: Objeto 'roles' (Legado)
        const roles = userData?.roles || {}
        if (roles.admin === true) realRole = 'admin'
        else if (roles.gestor === true) realRole = 'gestor'
        else if (roles.professor === true) realRole = 'professor'
        else {
          // Prioridade 3: Campo 'role' (String)
          const roleStr = String(userData?.role || '').toLowerCase()
          if (roleStr === 'superadmin') realRole = 'superAdmin'
          else if (roleStr === 'admin') realRole = 'admin'
          else if (roleStr === 'gestor') realRole = 'gestor'
          else if (roleStr === 'professor') realRole = 'professor'
        }
      }
    }

    // Apenas Admins e Gestores podem usar a funcionalidade de simular papel (ex: ver como aluno)
    if (simulatedRole && (realRole === 'superAdmin' || realRole === 'admin' || realRole === 'gestor')) {
      return simulatedRole;
    }
    
    return realRole;
  })()

  const isSuperAdmin = effectiveRole === 'superAdmin'
  const isAdmin = isSuperAdmin || effectiveRole === 'admin'
  const isGestor = effectiveRole === 'gestor'

  const getPinAuthEmail = (raw) => {
    const rawId = String(raw || '').toLowerCase().trim()
    
    // Se já for um e-mail válido, retorna ele
    if (rawId.includes('@')) return rawId
    
    // Fallback para IDs sanitizados internos
    if (rawId.endsWith('@atlas.internal') || rawId.endsWith('@rstopteam.internal')) {
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
   * Resolve o perfil do usuário autenticado.
   *
   * Fluxo 1 — Super Admin (dono da plataforma):
   *   Verifica o Custom Claim { admin: true } no token JWT.
   *   Retorna perfil global sem buscar membership em nenhuma organização.
   *   O claim é invisível no Firestore e impossível de forjar.
   *
   * Fluxo 2 — Usuário multi-tenant (academias):
   *   1. collectionGroup('members') onde userId == fbUser.uid → descobre a(s) organização(ões).
   *   2. Lê organizations/{orgId}/usuarios/{emailId} para obter o perfil completo.
   *   3. Fallback: usa os dados do próprio documento de membership.
   */
  const resolverPerfilUsuario = useCallback(async (fbUser) => {
    if (!fbUser) return null
    const fbEmail = (fbUser.email || '').toLowerCase()

    try {
      // ── Verificação prioritária: Super Admin por Custom Claim ──────────────
      // Esta checagem ocorre ANTES de qualquer consulta ao Firestore.
      // Se o token tiver { admin: true }, o usuário é o dono da plataforma.
      const tokenComClaims = await fbUser.getIdTokenResult()
      if (tokenComClaims.claims.admin === true) {
        return {
          id: fbUser.uid,
          email: fbEmail,
          nome: fbUser.displayName || 'Super Admin',
          isSuperAdmin: true,
          organizationId: null,   // Não pertence a nenhuma academia
          papeis: { superAdmin: true },
          role: 'superAdmin',
          status: 'ativo',
        }
      }

      // ── Fluxo normal: resolução via membership multi-tenant ───────────────
      // 1. Localiza as memberships do usuário (única fonte de acesso a tenants)
      const qMembers = query(
        collectionGroup(db, 'members'),
        where('userId', '==', fbUser.uid)
      )
      let snapMembers = null
      try {
        snapMembers = await getDocs(qMembers)
      } catch (e) {
        console.error('[AuthContext] Erro ao buscar memberships no collectionGroup:', e.code || '', e.message)
      }

      // RESGATE: cadastro incompleto pode ter criado a org (com ownerUid) mas sem a membership.
      // Nesse caso, cria a membership de owner (idempotente) e re-busca — NÃO remove a validação.
      if (!snapMembers || snapMembers.empty) {
        try {
          const qOwner = query(collection(db, 'organizations'), where('ownerUid', '==', fbUser.uid), limit(1))
          const snapOwner = await getDocs(qOwner).catch(() => null)
          if (snapOwner && !snapOwner.empty) {
            const orgIdResgate = snapOwner.docs[0].id
            await setDoc(doc(db, 'organizations', orgIdResgate, 'members', fbUser.uid), {
              userId: fbUser.uid,
              email: fbEmail,
              nome: '',
              role: 'owner',
              status: 'ativo',
              organizationId: orgIdResgate,
              criadoEm: serverTimestamp()
            }, { merge: true })
            snapMembers = await getDocs(qMembers).catch(() => null)
          }
        } catch (eR) {
          console.warn('[AuthContext] Resgate de membership falhou:', eR.code || eR.message)
        }
        if (!snapMembers || snapMembers.empty) return null
      }

      const docMembro = snapMembers.docs[0]
      const dadosMembro = docMembro.data()
      const orgId = dadosMembro.organizationId || docMembro.ref.parent.parent?.id
      if (!orgId) return null

      // 2. Tenta o perfil completo na subcoleção `usuarios` da organização
      //    Prioridade: novo (chaveado por UID) → legado (chaveado por e-mail)
      const emailId = (fbEmail.includes('@atlas.internal') || fbEmail.includes('@rstopteam.internal'))
        ? fbEmail.split('@')[0].replace(/_/g, '.')
        : fbEmail

      const [perfilUidSnap, perfilEmailSnap] = await Promise.all([
        getDoc(doc(db, 'organizations', orgId, 'usuarios', fbUser.uid)).catch(() => null),
        getDoc(doc(db, 'organizations', orgId, 'usuarios', emailId)).catch(() => null),
      ])
      const perfilSnap = (perfilUidSnap && perfilUidSnap.exists()) ? perfilUidSnap : perfilEmailSnap

      if (perfilSnap && perfilSnap.exists()) {
        const dadosPerfil = perfilSnap.data()
        return {
          id: perfilSnap.id,
          email: dadosPerfil.email || fbEmail,
          organizationId: orgId,
          ...dadosPerfil,
          // Membership garante o vínculo mesmo se o perfil não tiver role definido
          memberRole: dadosMembro.role || 'aluno',
        }
      }

      // 3. Fallback: monta o perfil a partir do membership
      return {
        id: docMembro.id,
        email: dadosMembro.email || fbEmail,
        nome: dadosMembro.nome || fbUser.displayName || '',
        name: dadosMembro.nome || fbUser.displayName || '',
        role: dadosMembro.role || 'aluno',
        papeis: { [dadosMembro.role || 'aluno']: true },
        status: dadosMembro.status || 'ativo',
        organizationId: orgId,
        memberRole: dadosMembro.role || 'aluno',
      }
    } catch (e) {
      console.error('❌ [AuthContext] Erro ao resolver perfil multi-tenant:', e)
      return null
    }
  }, [])

  /**
   * LOGIN INTELIGENTE: detecta o papel pelo PIN (admin vs aluno).
   * A autenticação é feita 100% pelo Firebase Auth (zero-trust).
   * O perfil (papéis/segredos) é resolvido pela membership na organização.
   */
  const loginSmart = async (identifier, typedPinRaw) => {
    const email = String(identifier || '').toLowerCase().trim().replace(/<[^>]*>?/g, '')
    const typedPin = String(typedPinRaw || '').trim().replace(/\D/g, '').slice(0, 6)
    const securePIN = typedPin.length >= 6 ? typedPin : typedPin.padEnd(6, '0')

    const internalId = `${email.replace(/[@.]/g, '_')}@atlas.internal`
    const legacyId = `${email.replace(/[@.]/g, '_')}@rstopteam.internal`

    // 1. Autenticação via Firebase Auth (valida o PIN na origem)
    let authResult = null;
    let usedInternal = false;
    try {
      authResult = await signInWithEmailAndPassword(auth, email, securePIN)
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
        try {
          authResult = await signInWithEmailAndPassword(auth, internalId, securePIN)
          usedInternal = true;
        } catch (errInternal) {
          try {
            authResult = await signInWithEmailAndPassword(auth, legacyId, securePIN)
            usedInternal = true;
          } catch (err) {
            throw new Error('PIN incorreto ou credencial inválida.');
          }
        }
      } else {
        throw e;
      }
    }

    // 2. Após autenticar, resolve o perfil dentro da organização via membership
    const fbUser = authResult.user
    const perfil = await resolverPerfilUsuario(fbUser)
    if (!perfil) {
      // Usuário autenticado mas sem membership → bloqueado (sem tenant)
      console.warn('⚠️ [AuthContext] Usuário autenticado sem membership em nenhuma organização.')
      await signOut(auth)
      throw new Error('Conta sem vínculo com nenhuma academia.')
    }

    const dbData = perfil
    const isMasterAdmin =
      dbData.papeis?.admin === true || dbData.roles?.admin === true || String(dbData.role).toLowerCase() === 'admin'
    const isGestorUser =
      dbData.papeis?.gestor === true || dbData.roles?.gestor === true || String(dbData.role).toLowerCase() === 'gestor'
    const isProfUser =
      dbData.papeis?.professor === true || dbData.roles?.professor === true || String(dbData.role).toLowerCase() === 'professor'
    const isStaff = isMasterAdmin || isGestorUser || isProfUser

    // 3. Verifica se o PIN digitado é o PIN administrativo (via subcoleção segredos)
    let matchesAdminPin = false;
    try {
      const segredosDoc = await getDoc(doc(db, 'organizations', perfil.organizationId, 'usuarios', perfil.id, 'privado', 'segredos'))
      if (segredosDoc.exists()) {
        const segredos = segredosDoc.data();
        const dbAdminPin = segredos.adminPin ? String(segredos.adminPin).trim() : null;
        matchesAdminPin = dbAdminPin && (typedPin === dbAdminPin || securePIN === dbAdminPin);
      }
    } catch (e) {
      console.warn('🔐 Aviso: Falha ao acessar subcoleção de segredos.', e)
    }

    // 4. Define papel da sessão
    if (matchesAdminPin) {
      setSimulatedRole(null) // Usou PIN de admin → papel real, sem simulação
    } else if (isMasterAdmin && !matchesAdminPin) {
      setSimulatedRole('aluno') // Admin usando PIN de aluno → simula visão de aluno
    } else if (isStaff) {
      setSimulatedRole(null) // Gestor/Professor usando PIN normal → entra com papel real
    } else {
      setSimulatedRole('aluno') // Aluno normal
    }

    return authResult;
  }

  /**
   * LOGIN NORMAL: Só aceita PIN de Aluno.
   * Se for Admin, força o papel 'aluno'.
   */
  const login = async (identifier, password) => {
    const email = String(identifier || '').toLowerCase().trim().replace(/<[^>]*>?/g, '')
    const typedPin = String(password || '').trim().replace(/\D/g, '').slice(0, 6)
    const securePIN = typedPin.length >= 6 ? typedPin : typedPin.padEnd(6, '0')
    const internalId = `${email.replace(/[@.]/g, '_')}@atlas.internal`
    const legacyId = `${email.replace(/[@.]/g, '_')}@rstopteam.internal`

    try {
      let authResult;
      try {
        authResult = await signInWithEmailAndPassword(auth, email, securePIN)
      } catch (e) {
        try {
          authResult = await signInWithEmailAndPassword(auth, internalId, securePIN)
        } catch (e2) {
          try {
            authResult = await signInWithEmailAndPassword(auth, legacyId, securePIN)
          } catch (e3) {
            throw new Error('PIN incorreto ou credencial inválida.');
          }
        }
      }

      const perfil = await resolverPerfilUsuario(authResult.user)
      if (!perfil) {
        await signOut(auth)
        throw new Error('Conta sem vínculo com nenhuma academia.')
      }

      // Se for colaborador, entra com papel real (sem simular aluno)
      const isAdm = perfil.papeis?.admin || perfil.roles?.admin || String(perfil.role).toLowerCase() === 'admin'
      const isGestor = perfil.papeis?.gestor || perfil.roles?.gestor || String(perfil.role).toLowerCase() === 'gestor'
      const isProf = perfil.papeis?.professor || perfil.roles?.professor || String(perfil.role).toLowerCase() === 'professor'

      if (isAdm || isGestor || isProf) {
        setSimulatedRole(null)
      }

      return authResult;
    } catch (err) {
      throw new Error(err.message || 'Usuário ou PIN incorretos.')
    }
  }

  /**
   * LOGIN ADMINISTRADOR: Só aceita PIN Master.
   * Garante acesso total.
   */
  const loginAdmin = async (identifier, adminPin) => {
    const email = String(identifier || '').toLowerCase().trim().replace(/<[^>]*>?/g, '')
    const typedPin = String(adminPin || '').trim().replace(/\D/g, '').slice(0, 6)
    const securePin = typedPin.length >= 6 ? typedPin : typedPin.padEnd(6, '0')

    const internalId = `${email.replace(/[@.]/g, '_')}@atlas.internal`
    const legacyId = `${email.replace(/[@.]/g, '_')}@rstopteam.internal`

    try {
      // No modo Admin, usamos o e-mail interno com fallback para o legado
      let authResult;
      try {
        authResult = await signInWithEmailAndPassword(auth, internalId, securePin)
      } catch (err) {
        authResult = await signInWithEmailAndPassword(auth, legacyId, securePin)
      }

      const perfil = await resolverPerfilUsuario(authResult.user)
      if (!perfil) {
        await signOut(auth)
        throw new Error('Conta sem vínculo com nenhuma academia.')
      }

      const isAdm = perfil.papeis?.admin || perfil.roles?.admin || String(perfil.role).toLowerCase() === 'admin'
      const isGestor = perfil.papeis?.gestor || perfil.roles?.gestor || String(perfil.role).toLowerCase() === 'gestor'
      const isProf = perfil.papeis?.professor || perfil.roles?.professor || String(perfil.role).toLowerCase() === 'professor'

      if (!isAdm && !isGestor && !isProf) {
        await signOut(auth)
        throw new Error('Acesso apenas para Administradores, Gestores ou Professores.')
      }

      // Garante papel real
      setSimulatedRole(null)

      return authResult;
    } catch (err) {
      throw new Error(err.message || 'Falha na autenticação administrativa.')
    }
  }

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => { })
    let cancelarSnapshotUsuario = null
    const cancelarObserver = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelarSnapshotUsuario) cancelarSnapshotUsuario()
      try {
        if (fbUser) {
          // Resolve o perfil — inclui bypass de Super Admin por Custom Claim
          const perfil = await resolverPerfilUsuario(fbUser)

          if (!perfil) {
            console.error('❌ [AuthContext] Nenhum perfil encontrado para:', fbUser.email)
            setLoading(false)
            return
          }

          // ── Branch exclusivo: Super Admin ────────────────────────────────
          // Não abre snapshot em nenhuma organização — o Super Admin
          // existe fora do escopo multi-tenant.
          if (perfil.isSuperAdmin === true) {
            setUser(fbUser)
            setUserData({
              ...perfil,
              permissions: {
                viewFinance: true,
                viewBillingTab: true,
                manageBillingTab: true,
                viewExpensesTab: true,
                manageExpensesTab: true,
                manageUsers: true,
                manageClasses: true,
                manageEvents: true,
                manageSystem: true,
                all: true,
              },
            })
            setLoading(false)
            return
          }

          // ── Branch normal: usuário de academia (multi-tenant) ────────────
          cancelarSnapshotUsuario = onSnapshot(
            doc(db, 'organizations', perfil.organizationId, 'usuarios', perfil.id),
            (snap) => {
              if (snap.exists()) {
                const dadosUsuario = snap.data()
                if (String(dadosUsuario.status || '').toLowerCase() === 'inativo') {
                  console.warn('⚠️ [AuthContext] Usuário inativo detectado. Deslogando...')
                  logout()
                } else {
                  setUser(fbUser)
                  // Garante permissões completas para admin da academia
                  const perfilLimpo = extractSafeProfile(dadosUsuario)
                  const ehAdminDaAcademia =
                    perfilLimpo.papeis?.admin ||
                    perfilLimpo.roles?.admin ||
                    String(perfilLimpo.role).toLowerCase() === 'admin'
                  const temPermissaoTotal =
                    perfilLimpo.permissões?.all === true ||
                    perfilLimpo.permissions?.all === true

                  setUserData({
                    ...perfilLimpo,
                    ...((ehAdminDaAcademia || temPermissaoTotal) && {
                      permissions: {
                        ...perfilLimpo.permissions,
                        viewBillingTab: true,
                        manageBillingTab: true,
                        viewExpensesTab: true,
                        manageExpensesTab: true,
                        viewFinance: true,
                        all: temPermissaoTotal,
                      },
                    }),
                    id: snap.id,
                    organizationId: perfil.organizationId,
                  })
                }
              } else {
                // Documento de usuário ainda não existe → usa dados do membership
                console.warn('⚠️ [AuthContext] Perfil de usuário não encontrado. Usando membership.')
                setUser(fbUser)
                setUserData({
                  ...perfil,
                  id: perfil.id,
                  organizationId: perfil.organizationId,
                  isLegacyProfile: false,
                })
              }
              setLoading(false)
            },
            (erroSnapshot) => {
              console.error('❌ [AuthContext] Erro no snapshot do perfil:', erroSnapshot)
              // Mantém o usuário logado com dados do membership em caso de erro
              setUser(fbUser)
              setUserData({
                ...perfil,
                id: perfil.id,
                organizationId: perfil.organizationId,
                isLegacyProfile: false,
              })
              setLoading(false)
            }
          )
        } else {
          setUser(null)
          setUserData(null)
          setLoading(false)
        }
      } catch (erro) {
        console.error('❌ [AuthContext] Erro crítico no observer de auth:', erro)
        setLoading(false)
      }
    })

    // Segurança: libera a UI após 15s mesmo se algo travar
    const timeoutSeguranca = setTimeout(() => {
      if (loading) {
        console.warn('⏱️ [AuthContext] Timeout de carregamento excedido (15s). Liberando UI...')
        setLoading(false)
      }
    }, 15000)

    return () => {
      cancelarObserver()
      if (cancelarSnapshotUsuario) cancelarSnapshotUsuario()
      clearTimeout(timeoutSeguranca)
    }
  }, [logout, resolverPerfilUsuario])

  // 🔎 Bootstrap: no multi-tenant o setup é por academia (criarNovaOrganizacao).
  // Nenhuma consulta a coleções raiz é feita — permanece em modo produção.
  useEffect(() => {
    setHasAdmin(true)
    setHasGestor(true)
    setIsSetupMode(false)
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
    isAdmin, isGestor, isSuperAdmin,
    simulatedRole, setSimulatedRole, sendResetEmail,
    isSetupMode, hasAdmin, hasGestor
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
