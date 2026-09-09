/**
 * CENTRALIZAÇÃO DE COLEÇÕES DO FIRESTORE — MULTI-TENANT ATLAS (PORTUGUÊS)
 *
 * ── MODELO DE DADOS (ISOLAMENTO TOTAL POR ACADEMIA) ─────────────────────────
 *
 * organizations/{orgId}
 *   ├── members        → equipe / staff da academia (owner, admin, gestor, professor)
 *   ├── usuarios       → todas as pessoas da academia (alunos + perfis de equipe)
 *   │     ├── anotacoes/{id}
 *   │     ├── graduacoes/{id}
 *   │     └── privado/segredos        → PINs (isolado, somente staff e o dono)
 *   ├── modalidades/{id}
 *   │     └── turmas/{tId}
 *   ├── chamadas/{id}                 → sessões / aulas
 *   │     └── presencas/{pId}         → presença por chamada
 *   ├── presencas/{id}                → histórico agregado de presenças
 *   ├── eventos/{id}
 *   │     └── visualizacoes/{vId}
 *   ├── faturas/{id}                  → cobranças (recebíveis)
 *   ├── pagamentos/{id}               → pagamentos recebidos
 *   ├── despesas/{id}                 → gastos da academia
 *   ├── contratos/{id}
 *   ├── turmas/{id}                   → turmas (visão agregada)
 *   ├── logs/{id}                     → trilha de auditoria da academia
 *   └── configuracoes/{id}
 *
 * Nenhum dado de negócio vive fora de `organizations/{orgId}`.
 * As coleções raiz legadas são apenas para identidade global e são
 * bloqueadas nas Security Rules (acesso somente admin global).
 */

// ── Coleções de Identidade Global (raiz — uso restrito) ─────────────────────
export const ROOT_COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  USUARIOS_GLOBAIS: 'usuarios', // Identity directory global (admin/setup)
  MEMBERSHIPS: 'memberships',   // Legado — apenas migração, sem regras de app
}

// ── Subcoleções Tenant-Scoped (dentro de organizations/{orgId}) ─────────────
export const COLLECTIONS = {
  MEMBROS: 'members',
  USUARIOS: 'usuarios',
  MODALIDADES: 'modalidades',
  CHAMADAS: 'chamadas',
  PRESENCAS: 'presencas',
  EVENTOS: 'eventos',
  FATURAS: 'faturas',
  PAGAMENTOS: 'pagamentos',
  DESPESAS: 'despesas',
  CONTRATOS: 'contratos',
  TURMAS: 'turmas',
  LOGS: 'logs',
  CONFIGURACOES: 'configuracoes',

  // Aliases legados mapeados para os novos nomes (compatibilidade do código)
  STUDENTS: 'usuarios',     // Antigo: 'students' → unificado em 'usuarios'
  SESSIONS: 'chamadas',     // Antigo: 'sessions' → 'chamadas'
  CHARGES: 'faturas',       // Antigo: 'charges' → 'faturas'
  EXPENSES: 'despesas',     // Antigo: 'expenses' → 'despesas'
  NOTICES: 'eventos',       // Antigo: 'events'/'notices' → 'eventos'
}

export const SUB_COLLECTIONS = {
  PRESENCAS: 'presencas',           // dentro de chamadas/{chamadaId}
  ANOTACOES: 'anotacoes',           // dentro de usuarios/{userId}
  GRADUACOES: 'graduacoes',         // dentro de usuarios/{userId}
  TURMAS: 'turmas',                 // dentro de modalidades/{modalidadeId}
  VISUALIZACOES: 'visualizacoes',   // dentro de eventos/{eventoId}
  SEGREDOS: 'privado/segredos',     // PINs dentro de usuarios/{userId}
}

/**
 * MAPEAMENTO DE CAMPOS PARA LOCALIZAÇÃO E MIGRAÇÃO
 */
export const FIELDS = {
  // Gerais
  ID: 'id',
  NOME: 'nome',
  EMAIL: 'email',
  TELEFONE: 'telefone',
  STATUS: 'status',
  CRIADO_EM: 'criadoEm',
  ATUALIZADO_EM: 'atualizadoEm',
  PAPEIS: 'papeis',
  PERMISSOES: 'permissoes',
  PIN: 'pin',
  AVATAR_URL: 'avatarUrl',
  BANNER_URL: 'bannerUrl',
  DDD: 'ddd',
  TELEFONE_LIMPO: 'telefone_limpo',
  TELEFONE_COMPLETO: 'telefone_completo',

  // Alunos / Jornada Técnica
  JORNADA_TECNICA: 'jornada_tecnica',
  FAIXA_ATUAL: 'faixa_atual',
  GRAUS_ATUAIS: 'graus_atuais',
  AULAS_DESDE_ULTIMA_GRADUACAO: 'aulas_desde_ultima_graduacao',
  DATA_ULTIMA_GRADUACAO: 'data_ultima_graduacao',
  HISTORICO: 'historico',
  MODALIDADE: 'modalidade',
  MODALIDADES: 'modalidades',

  // Chamadas
  DATA: 'data',
  HORARIO: 'horario',
  INSTRUTOR_ID: 'instrutorId',
  NOME_INSTRUTOR: 'nomeInstrutor',
  FINALIZADA: 'finalizada',
  OBSERVACAO: 'observacao',

  // Financeiro
  VALOR: 'valor',
  VENCIMENTO: 'vencimento',
  PAGO_EM: 'pagoEm',
  MES_REFERENCIA: 'mesReferencia',
  CATEGORIA: 'categoria',
  METODO: 'metodo',
}

/**
 * ── HELPERS DE REFERÊNCIA TENANT-SCOPED ─────────────────────────────────────
 * Uso: orgCollection(db, orgId, COLLECTIONS.USUARIOS)
 *      orgDoc(db, orgId, COLLECTIONS.FATURAS, 'fatura-1')
 */

import { collection, doc } from 'firebase/firestore'

export const orgPath = (orgId, colecao, documentoId) => {
  const base = [ROOT_COLLECTIONS.ORGANIZATIONS, orgId, colecao]
  if (documentoId) base.push(documentoId)
  return base
}

export const orgCollection = (db, orgId, colecao) => {
  return collection(db, ...orgPath(orgId, colecao))
}

export const orgDoc = (db, orgId, colecao, documentoId) => {
  return doc(db, ...orgPath(orgId, colecao, documentoId))
}
