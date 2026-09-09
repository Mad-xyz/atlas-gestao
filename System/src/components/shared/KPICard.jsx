// Componente KPICard global e padronizado – usado em todos os módulos do sistema.
// Inclui caixinha de ícone estilizada e efeito de elevação (lift) no hover.
import React from 'react'

export default function KPICard({
  title,
  value,
  desc,
  description,          // alias para desc
  icon: Icon,
  color = 'text-white',
  valueColor,           // alias para color
  iconColor,
  badge,
  onClick,
  active,
  highlight,
}) {
  const displayColor = valueColor || color
  const displayDesc = desc || description

  return (
    <div
      onClick={onClick}
      className={`kpi-card stat-card flex flex-col p-5 rounded-2xl relative overflow-hidden group h-[140px] border border-white/5
        ${onClick ? 'cursor-pointer' : ''}
        ${active || highlight ? 'ring-1 ring-primary/60 bg-primary/5' : ''}
      `}
    >
      {/* Glow sutil ao fundo no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Linha de topo: caixinha de ícone + título + badge */}
      <div className="flex items-center justify-between mb-4 relative z-10 w-full">
        <div className="flex items-center gap-2.5">
          {/* Caixinha padronizada do ícone */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.05] border border-white/[0.08] shrink-0">
            <Icon size={15} className={iconColor || 'text-primary'} />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 leading-tight">
            {title}
          </span>
        </div>
        {badge && (
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${badge.bg} ${badge.color || badge.cls || ''}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Valor + Descrição */}
      <div className="relative z-10 flex flex-col flex-1 justify-end">
        <div className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-1.5 tracking-tight ${displayColor}`}>
          {value}
        </div>
        <p className="text-[10px] lg:text-[11px] text-gray-500 leading-tight font-medium tracking-wide truncate">
          {displayDesc}
        </p>
      </div>
    </div>
  )
}

