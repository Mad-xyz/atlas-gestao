/**
 * Utilitário de Sanitização e Validação de Entradas do Utilizador
 *
 * Previne XSS (Cross-Site Scripting) e injeção ao escapar HTML
 * e validar formatos antes de enviar dados ao Firestore ou renderizar na UI.
 *
 * Uso: importar as funções necessárias em qualquer componente de formulário.
 */

/**
 * Escapa caracteres HTML especiais para prevenir XSS reflexivo e armazenado.
 * Deve ser usado ao renderizar conteúdo proveniente do utilizador no DOM.
 * @param {string} str — Texto proveniente de input do utilizador
 * @returns {string} — Texto seguro para renderização HTML
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Valida formato de endereço de e-mail.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim().toLowerCase())
}

/**
 * Sanitiza texto livre: remove tags HTML e limita comprimento.
 * Uso: campos de nome, observações, comentários.
 * @param {string} str
 * @param {number} maxLength — Comprimento máximo (padrão 300 caracteres)
 * @returns {string}
 */
export function sanitizeText(str, maxLength = 300) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/<[^>]*>/g, '')       // Remove tags HTML
    .replace(/[<>"'`\\]/g, '')     // Remove caracteres perigosos de injeção
    .trim()
    .slice(0, maxLength)
}

/**
 * Valida número de telemóvel — aceita formatos PT e BR comuns.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(String(phone).trim())
}

/**
 * Sanitiza todos os campos string de um objecto de formulário.
 * Aplica sanitizeText a cada campo, preservando tipos não-string.
 * @param {Object} data — Dados do formulário
 * @param {number} maxLength — Comprimento máximo por campo
 * @returns {Object} — Dados sanitizados
 */
export function sanitizeFormData(data, maxLength = 300) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? sanitizeText(value, maxLength) : value
    ])
  )
}

/**
 * Valida e sanitiza parâmetros de URL para prevenir XSS via query string.
 * Remove parâmetros que contenham scripts ou caracteres maliciosos.
 * @param {string} url — URL a validar
 * @returns {string} — URL limpa, sem parâmetros perigosos
 */
export function sanitizeUrlParam(param) {
  if (typeof param !== 'string') return ''
  // Bloqueia: <script>, javascript:, data:, event handlers, encoded variants
  const dangerous = /<[^>]*>|javascript:|data:/i
  if (dangerous.test(param)) return ''
  return sanitizeText(param, 500)
}

/**
 * Verifica se uma string é um identificador Firestore válido (sem injeção).
 * IDs Firestore só devem conter caracteres alfanuméricos, hífens e underscores.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidFirestoreId(id) {
  if (typeof id !== 'string' || id.length === 0 || id.length > 1500) return false
  return !/[\/\.\[\]#$]/.test(id)  // Caracteres proibidos em IDs Firestore
}
