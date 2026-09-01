/**
 * HOOK E SERVIÇO DE LOGS DE ATIVIDADE DO SISTEMA
 *
 * TUDO EM PORTUGUÊS:
 * - Coleção: logs_sistema
 * - Campos: tipo, nivel, acao, titulo, detalhe, etc.
 *
 * Fornece:
 * 1. Função standalone `registrarAtividade()` — importável de qualquer lugar
 * 2. Hook `useSystemLogs()` — para página de logs com paginação e filtro por role
 *
 * Campos salvos no Firestore:
 * - tipo: 'activity' | 'error'
 * - nivel: 'info' | 'warn' | 'error'
 * - acao: verbo (criar, editar, excluir, pagar, alterar_status, finalizar)
 * - titulo: título curto (ex: "Adicionou aluno")
 * - detalhe: descrição completa
 * - usuarioId: ID de quem fez a ação
 * - usuarioNome: nome de quem fez
 * - usuarioPapel: papel (admin, gestor, professor, sistema)
 * - usuarioAvatar: URL da foto
 * - categoria: aluno, chamada, financeiro, evento, equipe, sistema
 * - alvoId: ID do alvo da ação
 * - alvoNome: nome do alvo
 * - valorAntigo: valor anterior (para edições)
 * - valorNovo: novo valor (para edições)
 * - criadoEm: timestamp do servidor
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, onSnapshot, query, orderBy, addDoc,
  serverTimestamp, limit, startAfter, getDocs, where
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS } from '../firebase/collections'
import { useAuth } from '../context/AuthContext'

const COLECAO = COLLECTIONS.LOGS_SISTEMA
const LIMITE_PAGINA = 20

/**
 * MAPEIA VERBO INFINITIVO → PASSADO (para o título combinado)
 */
const VERBO_PASSADO = {
  criar: 'criou',
  editar: 'editou',
  excluir: 'excluiu',
  pagar: 'pagou',
  alterar_status: 'alterou',
  finalizar: 'finalizou',
}

/**
 * REGISTRA LOG DE ATIVIDADE (Função Standalone)
 *
 * O `titulo` é AUTO-GERADO no formato "{usuarioNome} {verb} {alvoNome}".
 * Ex: "Madson editou Max Pereiraa", "João excluiu Pedro"
 *
 * Uso:
 *   import { registrarAtividade } from '../hooks/usarLogsSistema'
 *   await registrarAtividade('criar', 'Adicionou aluno', 'João Silva', { usuarioNome: 'Madson', ... })
 *
 * @param {string} acao - Verbo (criar, editar, excluir, pagar, alterar_status, finalizar)
 * @param {string} titulo - Título curto (ex: "Adicionou aluno") — usado como fallback
 * @param {string} detalhe - Descrição detalhada
 * @param {object} opcoes - Opções adicionais
 * @param {string} opcoes.usuarioId - ID do usuário
 * @param {string} opcoes.usuarioNome - Nome do usuário
 * @param {string} opcoes.usuarioPapel - Papel do usuário
 * @param {string} opcoes.usuarioAvatar - URL da foto
 * @param {string} opcoes.categoria - Categoria (aluno, chamada, financeiro, evento, equipe, sistema)
 * @param {string} opcoes.alvoId - ID do alvo
 * @param {string} opcoes.alvoNome - Nome do alvo
 * @param {string} opcoes.valorAntigo - Valor anterior (para edições)
 * @param {string} opcoes.valorNovo - Novo valor (para edições)
 */
export async function registrarAtividade(acao, titulo, detalhe = '', opcoes = {}) {
  try {
    const {
      usuarioId = 'sistema',
      usuarioNome = 'Sistema',
      usuarioPapel = 'sistema',
      usuarioAvatar = '',
      categoria = 'sistema',
      alvoId = null,
      alvoNome = null,
      valorAntigo = null,
      valorNovo = null,
      alteracoes = null
    } = opcoes

    // Gera nomeLog automático: "Madson editou Max Pereiraa"
    const verboPassado = VERBO_PASSADO[acao] || acao
    const nomeLog = alvoNome
      ? `${usuarioNome} ${verboPassado} ${alvoNome}`
      : `${usuarioNome} ${verboPassado}`

    // Auto-gera detalhe legível
    let detalheFinal = detalhe
    if (alteracoes?.length) {
      if (alteracoes.length === 1) {
        const { campo, de, para } = alteracoes[0]
        let frase = `Editou ${campo} do ${alvoNome}`
        if (de !== undefined && para !== undefined && String(de) !== String(para)) {
          frase += ` de '${de}' para '${para}'`
        }
        detalheFinal = frase
      } else if (alteracoes.length <= 3) {
        const labels = alteracoes.map(a => a.campo)
        const ultimo = labels.pop()
        detalheFinal = `Editou ${labels.join(', ')} e ${ultimo} do ${alvoNome}`
      } else {
        detalheFinal = `Editou ${alteracoes.length} campos do ${alvoNome}`
      }
    } else if (!detalheFinal && acao === 'criar') {
      detalheFinal = `Adicionou ${categoria} ${alvoNome}`
    } else if (!detalheFinal && acao === 'excluir') {
      detalheFinal = `Excluiu ${categoria} ${alvoNome}`
    } else if (acao === 'alterar_status' && valorAntigo && valorNovo) {
      detalheFinal = `Alterou status do ${alvoNome} de '${valorAntigo}' para '${valorNovo}'`
    }

    await addDoc(collection(db, COLECAO), {
      tipo: 'activity',
      nivel: 'info',
      acao,
      titulo,
      detalhe: detalheFinal,
      nomeLog,
      usuarioId,
      usuarioNome,
      usuarioPapel,
      usuarioAvatar,
      categoria,
      alvoId,
      alvoNome,
      valorAntigo,
      valorNovo,
      criadoEm: serverTimestamp(),
    })

    return true
  } catch (e) {
    console.error('[Logs] Erro ao registrar atividade:', e)
    return false
  }
}

/**
 * REGISTRA LOG DE ERRO (Standalone)
 */
export async function registrarErro(acao, erro, opcoes = {}) {
  try {
    const {
      usuarioId = 'sistema',
      usuarioNome = 'Sistema',
      usuarioPapel = 'sistema',
      usuarioAvatar = ''
    } = opcoes

    await addDoc(collection(db, COLECAO), {
      tipo: 'error',
      nivel: 'error',
      acao,
      titulo: acao,
      detalhe: erro?.message || String(erro),
      usuarioId,
      usuarioNome,
      usuarioPapel,
      usuarioAvatar,
      categoria: 'sistema',
      criadoEm: serverTimestamp(),
    })

    return true
  } catch (e) {
    console.error('[Logs] Erro ao registrar erro:', e)
    return false
  }
}

/**
 * REGISTRA LOG DE AVISO (Standalone)
 */
export async function registrarAviso(acao, titulo, detalhe = '', opcoes = {}) {
  try {
    const {
      usuarioId = 'sistema',
      usuarioNome = 'Sistema',
      usuarioPapel = 'sistema',
      usuarioAvatar = '',
      categoria = 'sistema',
      alvoId = null,
      alvoNome = null
    } = opcoes

    await addDoc(collection(db, COLECAO), {
      tipo: 'activity',
      nivel: 'warn',
      acao,
      titulo,
      detalhe,
      usuarioId,
      usuarioNome,
      usuarioPapel,
      usuarioAvatar,
      categoria,
      alvoId,
      alvoNome,
      criadoEm: serverTimestamp(),
    })

    return true
  } catch (e) {
    console.error('[Logs] Erro ao registrar aviso:', e)
    return false
  }
}

/**
 * MONTA OBJETO DE USUÁRIO PARA LOG
 *
 * Extrai nome, papel e avatar do AuthContext para passar ao registrarAtividade().
 *
 * Exemplo:
 *   const usuarioLogado = extrairDadosAuth(userData, effectiveRole)
 *   await registrarAtividade('criar', 'Adicionou aluno', nome, { ...usuarioLogado, ... })
 *
 * @param {object} userData - Dados do usuário do AuthContext
 * @param {string} effectiveRole - Papel efetivo
 * @returns {{ usuarioId, usuarioNome, usuarioPapel, usuarioAvatar }}
 */
export function extrairDadosAuth(userData, effectiveRole) {
  if (!userData) {
    return {
      usuarioId: 'sistema',
      usuarioNome: 'Sistema',
      usuarioPapel: 'sistema',
      usuarioAvatar: ''
    }
  }

  // Tenta campos de nome (português/inglês legado)
  const nome = userData.nome || userData.name || userData.email?.split('@')[0] || 'Usuário'

  // Tenta campos de avatar
  const avatar = userData.avatarUrl || userData.photoURL || userData.photo || ''

  return {
    usuarioId: userData.id || userData.uid || userData.email || 'desconhecido',
    usuarioNome: nome,
    usuarioPapel: effectiveRole || userData.papel || 'aluno',
    usuarioAvatar: avatar
  }
}

/**
 * HOOK PRINCIPAL: useSystemLogs (usarLogsSistema)
 *
 * Usado na página de Logs (LogsPagina) para buscar com paginação e filtro por role.
 *
 * Regras:
 * - Admin: vê TODOS os logs
 * - Gestor/Professor: vê só logs onde usuarioPapel NÃO é admin
 *
 * @param {string} tipoLog - 'all' | 'activity' | 'error'
 */
export function useSystemLogs(tipoLog = 'all', maxLogs = 100) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [temMais, setTemMais] = useState(true)

  // Ref do último documento (evita stale closure)
  const ultimoDocRef = useRef(null)

  // Papel do usuário logado para filtrar
  const { effectiveRole } = useAuth()

  // Se não for admin, gestor/professor não veem ações de admin
  const filtrarAdmin = effectiveRole && effectiveRole !== 'admin'

  useEffect(() => {
    setLogs([])
    setTemMais(true)
    ultimoDocRef.current = null

    let q
    const ref = collection(db, COLECAO)

    if (filtrarAdmin) {
      // Gestor/Professor: só vê logs que NÃO são de admin
      q = query(
        ref,
        where('usuarioPapel', '!=', 'admin'),
        orderBy('criadoEm', 'desc'),
        limit(LIMITE_PAGINA)
      )
    } else {
      // Admin: vê tudo
      q = query(
        ref,
        orderBy('criadoEm', 'desc'),
        limit(LIMITE_PAGINA)
      )
    }

    const unsub = onSnapshot(q, (snap) => {
      const todos = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        criadoEm: d.data().criadoEm?.toDate?.() || new Date()
      }))

      const filtrados = tipoLog === 'all'
        ? todos
        : todos.filter(l => l.tipo === tipoLog)

      setLogs(filtrados)
      ultimoDocRef.current = snap.docs[snap.docs.length - 1] || null
      setTemMais(snap.docs.length === LIMITE_PAGINA)
      setLoading(false)
    }, () => setLoading(false))

    return unsub
  }, [tipoLog, filtrarAdmin])

  /**
   * CARREGA MAIS LOGS (Scroll Infinito)
   */
  const carregarMais = useCallback(async () => {
    if (carregandoMais || !temMais || !ultimoDocRef.current) return

    setCarregandoMais(true)

    try {
      const ref = collection(db, COLECAO)

      let q
      if (filtrarAdmin) {
        q = query(
          ref,
          where('usuarioPapel', '!=', 'admin'),
          orderBy('criadoEm', 'desc'),
          startAfter(ultimoDocRef.current),
          limit(LIMITE_PAGINA)
        )
      } else {
        q = query(
          ref,
          orderBy('criadoEm', 'desc'),
          startAfter(ultimoDocRef.current),
          limit(LIMITE_PAGINA)
        )
      }

      const snap = await getDocs(q)
      const novos = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        criadoEm: d.data().criadoEm?.toDate?.() || new Date()
      }))

      const filtrados = tipoLog === 'all'
        ? novos
        : novos.filter(l => l.tipo === tipoLog)

      setLogs(prev => [...prev, ...filtrados])
      ultimoDocRef.current = snap.docs[snap.docs.length - 1] || null
      setTemMais(snap.docs.length === LIMITE_PAGINA)
    } catch (e) {
      console.error('[Logs] Erro ao carregar mais:', e)
    } finally {
      setCarregandoMais(false)
    }
  }, [carregandoMais, temMais, tipoLog, filtrarAdmin])

  return {
    logs,
    loading,
    carregandoMais,
    temMais,
    carregarMais
  }
}
