import React from 'react'
import { Clock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function ModuleUnderDevelopment({ 
  icon: Icon, 
  title, 
  description, 
  features = [],
  label = "O que vem por aí:"
}) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in duration-700 min-h-[60vh]">
      <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 flex items-center justify-center mb-8 relative group shadow-2xl">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <Icon size={48} className="text-gray-500 relative z-10 group-hover:text-primary transition-colors duration-500" strokeWidth={1.5} />
        
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xll bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md">
          <Clock size={20} className="text-yellow-500 animate-pulse" />
        </div>
      </div>

      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Módulo em Desenvolvimento</p>
      <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
        {title || 'Nova Funcionalidade'}
      </h1>
      
      <p className="text-gray-500 text-sm max-w-[450px] leading-relaxed mb-10">
        {description || `Estamos construindo uma experiência incrível para ${title?.toLowerCase() || 'esta seção'}. Esta funcionalidade estará disponível em breve.`}
      </p>

      {features.length > 0 && (
        <div className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-xll p-6 mb-10 text-left">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">{label}</p>
          <ul className="space-y-3">
            {features.map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-75" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300" />
        </div>
      </div>
    </div>
  )
}

