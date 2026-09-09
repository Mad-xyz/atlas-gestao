/**
 * Utilitários para formatação e limpeza de números de telefone
 * Seguindo o padrão SSoT da Academia
 */

/**
 * Formata uma string de números para o padrão: 91 12345-6789
 */
export const formatPhoneUI = (v) => {
  if (!v) return ""
  let digits = v.replace(/\D/g, "")
  if (digits.length > 11) digits = digits.slice(0, 11)
  
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Limpa o número para salvar no banco de dados seguindo a estrutura solicitada
 */
export const parsePhoneData = (v) => {
  const digits = v.replace(/\D/g, "")
  if (digits.length < 10) return null // Inválido (Mínimo DDD + 8 dígitos)

  const ddd = digits.slice(0, 2)
  const telefone_limpo = digits.slice(2)
  const telefone_completo = `55${ddd}${telefone_limpo}`

  return {
    ddd,
    telefone_limpo,
    telefone_completo,
    display: formatPhoneUI(digits)
  }
}
