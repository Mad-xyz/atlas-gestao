/**
 * CENTRALIZAÇÃO DE COLEÇÕES DO FIRESTORE (PORTUGUÊS)
 * 
 * Este arquivo define os nomes oficiais das coleções no banco de dados.
 * Todas as referências no código devem usar estas constantes.
 */

export const COLLECTIONS = {
  USUARIOS: 'usuarios',           // Antigo: 'users'
  ALUNOS: 'alunos',               // Antigo: 'students'
  EQUIPE: 'equipe',               // Antigo: 'collaborators'
  CHAMADAS: 'chamadas',           // Antigo: 'sessions'
  MODALIDADES: 'modalidades',     // Antigo: 'modalities'
  EVENTOS: 'eventos',             // Antigo: 'notices'
  FATURAMENTO: 'faturamento',     // Antigo: 'billing'
  DESPESAS: 'despesas',           // Antigo: 'expenses'
  CONTRATOS: 'contratos',         // Antigo: 'contracts'
  COFRE_PINS: 'cofre_pins',       // Antigo: 'vault'
  PROFESSORES: 'professores',     // Antigo: 'teachers'
  PRESENCAS_LOG: 'presencas_log', // Antigo: 'attendance'
  CONFIGURACOES_JORNADA: 'configuracoes_jornada', // Antigo: 'tech_journey_configs'
  PLANOS: 'planos',               // Antigo: 'plans'
  LOGS_SISTEMA: 'logs_sistema',   // Antigo: 'systemLogs'
}

export const SUB_COLLECTIONS = {
  PRESENCAS: 'presencas',         // Antigo: 'attendances'
  ANOTACOES: 'anotacoes',         // Antigo: 'notes'
  GRADUACOES: 'graduacoes',       // Antigo: 'graduations'
  TURMAS: 'turmas',               // Antigo: 'turmas'
  MEMBROS: 'membros',             // Antigo: 'membros'
  VISUALIZACOES: 'visualizacoes', // Nova hierarquia dentro de eventos
}

/**
 * MAPEAMENTO DE CAMPOS PARA LOCALIZAÇÃO E MIGRAÇÃO
 * Use estas chaves para garantir que o código aponte para o campo correto no Firestore.
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
