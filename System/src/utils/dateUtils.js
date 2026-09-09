/**
 * UTILITÁRIO DE DATA RESILIENTE (SSoT)
 * 🎯 Resolve o problema: user.createdAt.toDate is not a function
 * 
 * Este utilitário lida com 3 tipos de formatos que o Firebase/JS podem retornar:
 * 1. Timestamp do Firestore (objeto com .toDate())
 * 2. Objeto Date nativo
 * 3. String ISO (após migrações manuais)
 */

export function parseFirestoreDate(value) {
  if (!value) return null
  
  // 1. Se for um Timestamp do Firestore
  if (typeof value.toDate === 'function') {
    return value.toDate()
  }
  
  // 2. Se for uma string ISO ou número (timestamp)
  const parsed = new Date(value)
  
  // 3. Verifica se a data resultante é válida
  if (!isNaN(parsed.getTime())) {
    return parsed
  }
  
  return null
}

/**
 * FORMATAÇÃO DE DATA EM PORTUGUÊS (BR) RESILIENTE
 * @param {Date|Timestamp|string} date 
 * @param {object} options - Opções extras para o toLocaleDateString
 * @param {boolean} forceUTC - Se deve forçar o uso de UTC (útil para datas de calendário sem hora)
 */
export function formatBR(date, options = {}, forceUTC = true) {
  let d = parseFirestoreDate(date)
  if (!d) return 'DATA INDISPONÍVEL'

  // Se for uma string pura (YYYY-MM-DD), normalizamos para meio-dia UTC antes de formatar
  // para evitar que o fuso horário local mude o dia.
  if (forceUTC && typeof date === 'string' && date.length === 10) {
    d = new Date(date + 'T12:00:00Z')
  }

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }

  if (forceUTC) {
    defaultOptions.timeZone = 'UTC'
  }

  return d.toLocaleDateString('pt-BR', { ...defaultOptions, ...options })
}

export function formatLongDate(date) {
  return formatBR(date, { month: 'long' })
}
