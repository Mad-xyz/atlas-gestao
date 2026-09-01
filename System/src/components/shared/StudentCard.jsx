// Resumo: Cartão de aluno com status de presença e ação rápida (destaque/admin).
import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { beltConfig } from '../../data/beltConfig'
import { useApp } from '../../context/AppContext'

const statusConfig = {
  present:   { label: 'Presente',   bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  text: '#10B981' },
  absent:    { label: 'Ausente',    bg: 'rgba(244,63,94,0.15)',   border: 'rgba(244,63,94,0.3)', text: '#f43f5e' },
  justified: { label: 'Justif.',    bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)',   text: '#3B82F6' },
}

function BeltBadge({ belt }) {
  const key = belt?.toLowerCase() || 'none'
  const config = beltConfig[key] || beltConfig.none
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${config.bgClass}`}
      style={{ color: config.textColor, letterSpacing: '0.05em' }}
    >
      {config.label.toUpperCase()}
    </span>
  )
}



function StudentAvatar({ student, belt }) {
  const [imageError, setImageError] = useState(false)
  const hasPhoto = Boolean(student.photo) && !imageError
  const beltLower = belt?.toLowerCase() || 'none'
  const isWhite = beltLower === 'white' || beltLower === 'branca' || beltLower === 'branco'

  return (
    <div className="relative flex-shrink-0">
      <div
        className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-1 ring-white/10 shadow-[0_0_18px_color-mix(in_srgb,var(--clr-primary)_20%,transparent)]"
        style={{
          background: isWhite
            ? 'linear-gradient(135deg,#D1D5DB,#9CA3AF)'
            : `linear-gradient(135deg, ${beltColor(beltLower)})`,
        }}
      >
        {hasPhoto ? (
          <img
            src={student.photo}
            alt={`Foto de ${student.nome || student.name}`}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm md:text-base font-bold"
            style={{ color: isWhite ? '#111' : '#fff' }}
          >
            {student.initials || (student.nome || student.name)?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {student.isVisitor && (
        <span className="absolute -top-1 -right-1 bg-primary rounded-full w-4 h-4 flex items-center justify-center shadow-lg shadow-primary/20">
          <Star size={9} color="#000" fill="#000" />
        </span>
      )}
    </div>
  )
}

export default function StudentCard({ student, onClick }) {
  const { name, belt, stripes, status, isVisitor, modality, modalities = [] } = student
  const primaryMod = modality || modalities[0] || 'Jiu Jitsu'
  const secondaryLabel = modalities.length > 1 ? modalities.filter(m => m !== primaryMod).join(' & ') : null
  const numericId = Number.parseInt(student.id, 10)
  const animationDelay = Number.isFinite(numericId) ? `${numericId * 40}ms` : '0ms'

  return (
    <div
      className={`glass-card glass-card-hover rounded-xll p-3.5 fade-slide-up ${onClick ? 'cursor-pointer' : ''}`}
      style={{ animationDelay }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <StudentAvatar student={student} belt={belt} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            {isVisitor && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                VISITANTE
              </span>
            )}
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border border-white/10 text-gray-400"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {primaryMod}
            </span>
            {secondaryLabel && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border border-white/10 text-gray-400/80"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                {secondaryLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <BeltBadge belt={belt} />
            {status && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                style={{
                  background: statusConfig[status].bg,
                  border: `1px solid ${statusConfig[status].border}`,
                  color: statusConfig[status].text,
                }}
              >
                {statusConfig[status].label.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function beltColor(belt) {
  const map = {
    blue:   '#1E40AF, #3B82F6',
    azul:   '#1E40AF, #3B82F6',
    purple: '#7C3AED, #A855F7',
    roxa:   '#7C3AED, #A855F7',
    brown:  '#78350F, #B45309',
    marrom: '#78350F, #B45309',
    black:  '#111111, #374151',
    preta:  '#111111, #374151',
  }
  return map[belt] || 'var(--clr-primary-dark), var(--clr-primary)'
}

