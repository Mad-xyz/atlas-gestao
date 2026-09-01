/**
 * Normaliza uma string removendo acentos, caracteres especiais e espaços, 
 * facilitando a comparação de IDs, nomes e modalidades.
 */
export const normalizeStr = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
};
