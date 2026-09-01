import React from 'react'
import { X } from 'lucide-react'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'

export default function SlideOver({ isOpen, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  // Bloqueia scroll do body e esconde navegação mobile enquanto a gaveta está aberta
  useHideMobileNav(isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Painel */}
      <div
        className={`relative h-full ${width} w-full bg-[#0d0d0d] border-l border-white/10 flex flex-col shadow-[-24px_0_80px_rgba(0,0,0,0.8)]`}
        style={{ animation: 'slideFromRight 0.28s cubic-bezier(0.32,0.72,0,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xll hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}

