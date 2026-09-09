/**
 * UTILITÁRIO DE SEGURANÇA E SANITIZAÇÃO
 * 
 * Implementa filtros rigorosos contra XSS, Injeção de Scripts e outros ataques comuns de frontend.
 * Baseado nos controles CIS e diretrizes do NIST.
 */

/**
 * Sanitiza uma string removendo tags HTML e atributos de evento suspeitos.
 * @param {string} input - A string a ser sanitizada.
 * @returns {string} - A string limpa.
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/<[^>]*>?/gm, '') // Remove tags HTML
    .replace(/on\w+="[^"]*"/gm, '') // Remove atributos de evento (ex: onclick, onerror)
    .replace(/javascript:[^"]*/gm, '') // Remove URIs javascript:
    .replace(/expression\([^)]*\)/gm, '') // Remove CSS expressions
    .trim();
};

/**
 * Sanitiza HTML (Permite tags básicas se necessário, mas por segurança remove tudo por enquanto)
 * Alias para sanitizeString para manter compatibilidade.
 */
export const sanitizeHTML = sanitizeString;

/**
 * Filtra apenas texto alfanumérico e caracteres básicos de pontuação.
 * Útil para campos de busca e nomes.
 */
export const filterTextOnly = (input) => {
  if (typeof input !== 'string') return input;
  
  // Permite letras, números, espaços e acentuação comum pt-BR
  return input.replace(/[^a-zA-Z0-9\sÀ-ÿ._-]/g, '').trim();
};

/**
 * Valida se um input contém padrões de script perigosos.
 */
export const isDangerousInput = (input) => {
  if (typeof input !== 'string') return false;
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror/i,
    /onclick/i,
    /onload/i,
    /eval\(/i,
    /setTimeout\(/i,
    /setInterval\(/i,
    /document\.cookie/i,
    /document\.location/i,
    /window\.location/i
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitiza objetos recursivamente.
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
};
