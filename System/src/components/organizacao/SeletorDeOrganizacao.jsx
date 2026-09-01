/**
 * COMPONENT: SeletorDeOrganizacao (Organization Switcher)
 * 
 * Permite ao usuário alternar suavemente entre as academias/organizações às quais
 * ele possui acesso, disparando o recarregamento dos dados tenant-scoped.
 */

import React, { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganizacao } from '../../context/OrganizacaoContext'

export default function SeletorDeOrganizacao({ recolhido = false }) {
  const {
    organizacaoAtual,
    organizacoesDoUsuario,
    alterarOrganizacao,
    carregandoOrganizacao
  } = useOrganizacao()

  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  // Fecha o menu ao clicar fora do componente
  useEffect(() => {
    function escutarCliqueFora(evento) {
      if (menuRef.current && !menuRef.current.contains(evento.target)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', escutarCliqueFora)
    return () => document.removeEventListener('mousedown', escutarCliqueFora)
  }, [])

  if (carregandoOrganizacao) {
    return (
      <div className="h-10 w-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-xs text-white/40">Carregando...</span>
      </div>
    )
  }

  const nomeAcademia = organizacaoAtual?.nome || 'Academia Selecionada'

  return (
    <div className="relative w-full" ref={menuRef}>
      {/* Botão de Alternância Principal */}
      <button
        type="button"
        onClick={() => setMenuAberto(!menuAberto)}
        aria-expanded={menuAberto}
        aria-label="Selecionar academia ativa"
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left group ${
          recolhido ? 'justify-center px-2' : ''
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Building2 className="w-4 h-4 text-red-400" />
        </div>

        {!recolhido && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider leading-none mb-1">
                Academia Ativa
              </p>
              <p className="text-sm font-semibold text-white truncate leading-none">
                {nomeAcademia}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${menuAberto ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Menu Suspenso de Seleção de Organização */}
      <AnimatePresence>
        {menuAberto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 p-2 rounded-2xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl shadow-2xl min-w-[220px]"
          >
            <p className="px-3 py-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Minhas Academias
            </p>

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {organizacoesDoUsuario.map((org) => {
                const ehAtiva = org.id === organizacaoAtual?.id
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      alterarOrganizacao(org.id)
                      setMenuAberto(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      ehAtiva
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-2 h-2 rounded-full ${ehAtiva ? 'bg-red-500' : 'bg-white/20'}`} />
                      <span className="truncate">{org.nome}</span>
                    </div>
                    {ehAtiva && <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
