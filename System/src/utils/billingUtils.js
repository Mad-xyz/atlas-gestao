export const normalizeText = (text) => {
  if (text === null || text === undefined) return '';
  // Garante que o input seja tratado como string antes de chamar toLowerCase
  const str = typeof text === 'string' ? text : String(text);
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export function calculateModalityValue(aluno, modalities) {
  if (!aluno || !modalities) return 0;
  
  // 1. Pular se o aluno for marcado globalmente como isento
  if (aluno.isPaymentExempt) return 0;

  // 2. Se o modo for manual, usa o valor fixo definido no perfil
  if (aluno.billingMode === 'manual') {
    return Number(aluno.manualPlanValue || aluno.planValue) || 0;
  } 

  const normalizedCat = normalizeText(aluno.ageCategory || 'Adulto');
  
  // Garante o uso robusto extraindo as modalidades do aluno, mesmo em chaves legadas
  const rawModalities = aluno.modalidades || aluno.modalities || aluno.modality;
  const modsAluno = Array.isArray(rawModalities) 
    ? rawModalities 
    : (rawModalities ? [rawModalities] : []);

  let total = 0;
  let foundValidModality = false;

  modsAluno.forEach(modItem => {
    // Se o item for um objeto (comum em dados legados ou estruturas ricas), extraímos o identificador
    const modIdentifier = (typeof modItem === 'object' && modItem !== null)
      ? (modItem.id || modItem.name || modItem.slug || '')
      : modItem;

    const normalizedSearch = normalizeText(modIdentifier);
    
    // Busca robusta na configuração da modalidade
    const modConfig = modalities.find(m => 
      normalizeText(m.name) === normalizedSearch || 
      normalizeText(m.id) === normalizedSearch ||
      normalizeText(m.slug) === normalizedSearch
    );

    if (modConfig && modConfig.pricing) {
      foundValidModality = true;
      // Busca robusta da chave de preço (ex: 'kids' ou 'Kids')
      const pricingKey = Object.keys(modConfig.pricing).find(k => normalizeText(k) === normalizedCat);
      
      if (pricingKey) {
        const rule = modConfig.pricing[pricingKey];
        if (rule.enabled) {
          total += Number(rule.price) || 0;
        }
      }
    }
  });

  // Fallback: se NÃO encontrou NENHUMA modalidade válida configurada no aluno, 
  // mas ele tem um planValue legado, usa o legado.
  // Se encontrou a modalidade (ex: Jiu Jitsu) e o valor dela for realmente R$ 0, 
  // o fallback NÃO deve substituir o valor 0 por um planValue legado aleatório.
  if (!foundValidModality && total === 0 && aluno.planValue) {
    total = Number(aluno.planValue) || 0;
  }

  return total;
}