// RESUMO: Card de representação individual da Modalidade.
// Apresenta resumo de alunos/turmas e lista expansível com horários detalhados.
// Gerencia ações de edição, exclusão e status da modalidade e suas respectivas turmas.
import React from 'react'
import { Edit2, Trash2, ChevronDown, GraduationCap, Users, PlusCircle, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ModalityCard({ 
  modality, 
  isExpanded,
  onToggleExpand,
  onEdit, 
  onDelete,
  onToggleStatus, 
  onAddClass,
  onEditClass,
  onDeleteClass 
}) {
  const activeTurmas = modality.turmas?.filter(t => t.status === 'ativo') || []

  return (
    <div className={`glass-card rounded-[32px] border border-white/5 transition-all relative overflow-hidden group ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}>
      {/* Mobile-First Header / List Item */}
      <div 
        onClick={onToggleExpand}
        className="p-4 md:p-6 flex items-center gap-4 cursor-pointer active:bg-white/[0.03]"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider truncate">{modality.name}</h3>
            <span className={`w-1.5 h-1.5 rounded-full ${modality.status === 'ativo' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}></span>
            {modality.hasBelt && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[8px] font-black uppercase tracking-widest ml-1">
                Faixas
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <GraduationCap size={12} className="text-primary/70" />
              <span>{activeTurmas.length} Turmas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-blue-400/70" />
              <span>{modality.studentCount || 0} Alunos</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chave de Status (Ativo/Inativo) */}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStatus(modality.id, modality.status); }}
            className={`w-10 h-6 rounded-full relative transition-all cursor-pointer z-20 active:scale-95 hover:opacity-80 ${modality.status === 'ativo' ? 'bg-primary/40' : 'bg-white/5'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${modality.status === 'ativo' ? 'right-1 bg-primary shadow-[0_0_8px_rgba(203,255,28,0.5)]' : 'left-1 bg-gray-600'}`} />
          </button>
        </div>
      </div>

      {/* Área de ações Desktop - Visível por padrão para acesso rápido */}
      <div className="hidden md:block px-6 pb-6 pt-0">
        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
          <div className="flex-1 flex items-center gap-2">
            {modality.hasBelt !== false && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.onOpenBeltConfig) window.onOpenBeltConfig(modality);
                }}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-primary transition-all group/config"
                title="Configurar Faixas"
              >
                <Settings size={14} className="group-hover/config:rotate-90 transition-transform duration-500" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(modality) }}
              className="flex-1 flex items-center justify-center gap-2 h-[42px] bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all group"
              title="Editar Modalidade"
            >
              <Edit2 size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Editar</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(modality.id); }}
              className="h-[42px] w-[42px] flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-all"
              title="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Adicionar Nova Turma (Turno) posicionado à direita */}
            <button
              onClick={(e) => { e.stopPropagation(); onAddClass(modality.id); }}
              className="p-2.5 rounded-xl bg-white/5 text-primary border border-white/5 cursor-pointer hover:bg-primary/10 transition-all duration-300"
              title="Adicionar Turma"
            >
              <PlusCircle size={18} strokeWidth={2.5} />
            </button>
            <div 
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className={`p-2.5 rounded-xl bg-white/5 text-gray-500 border border-white/5 cursor-pointer hover:bg-white/10 transition-all duration-300 ${isExpanded ? 'rotate-180 text-primary border-primary/30' : ''}`}
            >
              <ChevronDown size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content - iOS Native style */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-6 pb-6 pt-2 border-t border-white/5 bg-white/[0.01]">
              <div className="md:hidden flex items-center gap-2 mb-6 pt-2">
                <button 
                  onClick={() => onEdit(modality)}
                  className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                  Editar Modalidade
                </button>
                <button 
                  onClick={() => onDelete(modality.id)}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
                {/* Mobile: Botão de Adicionar Nova Turma (Turno) à direita */}
                <button
                  onClick={() => onAddClass(modality.id)}
                  className="p-3 rounded-xl bg-white/5 text-primary border border-white/5 cursor-pointer hover:bg-primary/10 transition-all duration-300"
                  title="Adicionar Turma"
                >
                  <PlusCircle size={18} strokeWidth={2.5} />
                </button>
                {/* Mobile: Seta de expansão também à direita da lixeira */}
                <button 
                  onClick={onToggleExpand}
                  className={`p-3 rounded-xl bg-white/5 text-gray-500 border border-white/5 transition-all duration-300 ${isExpanded ? 'rotate-180 text-primary border-primary/30' : ''}`}
                >
                  <ChevronDown size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Turmas da Modalidade</h4>
                {/* Botão Nova Turma removido do header conforme pedido */}
              </div>

              {!modality.turmas || modality.turmas.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-white/5 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700">Nenhuma turma cadastrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modality.turmas.map(turma => (
                    <div key={turma.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-[#111] border border-white/5 rounded-xl group/item hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className={`w-2 h-2 rounded-full ${turma.status === 'ativo' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`} />
                        <div>
                          <h5 className="text-sm font-bold text-white uppercase">{turma.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              {turma.professors?.length > 0 
                                ? turma.professors.map(p => p.nome).join(' / ')
                                : turma.professor || 'Sem Professor'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {turma.diasSemana?.map(day => (
                              <span key={day} className="px-2 py-0.5 bg-white/5 text-[8px] font-black uppercase tracking-tighter text-gray-500 rounded-md">{day}</span>
                            ))}
                            <span className="ml-2 px-2 py-0.5 border border-white/5 text-[8px] font-black text-primary uppercase rounded-md">{turma.horarioInicio} - {turma.horarioFim}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Capacidade</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-700" 
                                style={{ width: `${Math.min(100, ((turma.totalAlunos || 0) / (turma.capacidade || 1)) * 100)}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{turma.totalAlunos || 0}/{turma.capacidade}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => onEditClass(modality.id, turma)}
                            className="p-2 bg-white/5 text-gray-500 hover:text-white rounded-xl transition-colors border border-white/5"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => onDeleteClass(modality.id, turma.id)}
                            className="p-2 bg-white/5 text-gray-500 hover:text-red-500 rounded-xl transition-colors border border-white/5"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

