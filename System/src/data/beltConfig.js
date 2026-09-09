// Resumo: tabela de faixas com rótulo, cor de texto e classe de fundo.
// Próxima graduação definida para lógica de progressão automática.
export const beltConfig = {
  none: { label: 'Sem faixa', textColor: '#E5E7EB', bgClass: 'belt-none', next: 'white' },
  white: { label: 'Branca', textColor: '#111111', bgClass: 'belt-white', next: 'blue' },
  grey: { label: 'Cinza', textColor: '#FFFFFF', bgClass: 'belt-grey', next: 'yellow' },
  yellow: { label: 'Amarela', textColor: '#111111', bgClass: 'belt-yellow', next: 'orange' },
  orange: { label: 'Laranja', textColor: '#FFFFFF', bgClass: 'belt-orange', next: 'green' },
  green: { label: 'Verde', textColor: '#FFFFFF', bgClass: 'belt-green', next: 'blue' },
  blue: { label: 'Azul', textColor: '#FFFFFF', bgClass: 'belt-blue', next: 'purple' },
  purple: { label: 'Roxa', textColor: '#FFFFFF', bgClass: 'belt-purple', next: 'brown' },
  brown: { label: 'Marrom', textColor: '#FFFFFF', bgClass: 'belt-brown', next: 'black' },
  black: { label: 'Preta', textColor: '#FFFFFF', bgClass: 'belt-black', next: 'none' },
  // Aliases em Português
  branca: { label: 'Branca', textColor: '#111111', bgClass: 'belt-white' },
  branco: { label: 'Branca', textColor: '#111111', bgClass: 'belt-white' },
  cinza: { label: 'Cinza', textColor: '#FFFFFF', bgClass: 'belt-grey' },
  amarela: { label: 'Amarela', textColor: '#111111', bgClass: 'belt-yellow' },
  laranja: { label: 'Laranja', textColor: '#FFFFFF', bgClass: 'belt-orange' },
  verde: { label: 'Verde', textColor: '#FFFFFF', bgClass: 'belt-green' },
  azul: { label: 'Azul', textColor: '#FFFFFF', bgClass: 'belt-blue' },
  roxa: { label: 'Roxa', textColor: '#FFFFFF', bgClass: 'belt-purple' },
  marrom: { label: 'Marrom', textColor: '#FFFFFF', bgClass: 'belt-brown' },
  preta: { label: 'Preta', textColor: '#FFFFFF', bgClass: 'belt-black' },
}
