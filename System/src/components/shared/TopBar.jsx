// Resumo: Barra superior (desktop) com seleção de modalidade, status e atalho de chamada.
import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { modalities } from '../../data/modalities'

export default function TopBar() {
  const { isAdminView, setIsAdminView, currentModality, setCurrentModality } = useApp()

  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-3"
      style={{ background: 'linear-gradient(180deg, #000000 0%, rgba(0,0,0,0.95) 100%)' }}>

      {/* Logo + View Toggle */}
      <div className="flex items-center justify-between mb-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/logo.webp" 
            alt="Atlas Academy" 
            className="w-10 h-10 rounded-full object-cover" 
            style={{ 
              boxShadow: '0 0 15px color-mix(in srgb, var(--clr-primary) 45%, transparent)',
              border: '1.5px solid color-mix(in srgb, var(--clr-primary) 20%, transparent)'
            }}
          />
          <div>
            <p className="text-xs text-gray-400 leading-none tracking-widest uppercase">Atlas</p>
            <p className="font-sans text-xl text-white leading-none tracking-wider font-black">ACADEMY</p>
          </div>
        </Link>

        {/* Admin / Student Toggle */}
        <button
          onClick={() => setIsAdminView(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: isAdminView
              ? 'linear-gradient(135deg, var(--clr-primary-dark), var(--clr-primary))'
              : 'rgba(255,255,255,0.07)',
            border: '1px solid color-mix(in srgb, var(--clr-primary-dark) 50%, transparent)',
            boxShadow: isAdminView ? '0 0 12px color-mix(in srgb, var(--clr-primary) 30%, transparent)' : 'none',
          }}
        >
          {isAdminView ? <ShieldCheck size={13} /> : <Users size={13} />}
          {isAdminView ? 'Admin' : 'Aluno'}
        </button>
      </div>

      {/* Modality Selector */}
      <div className="flex gap-2">
        {modalities.map(mod => (
          <button
            key={mod}
            onClick={() => setCurrentModality(mod)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              currentModality === mod
                ? 'modality-active text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            style={currentModality !== mod ? {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            } : {}}
          >
            {mod}
          </button>
        ))}
      </div>
    </div>
  )
}
