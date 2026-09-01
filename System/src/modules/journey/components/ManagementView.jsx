import React from 'react'
import { 
  Search, RefreshCcw, FileDown, GraduationCap, 
  ChevronRight, Plus, MoreVertical 
} from 'lucide-react'
import { beltConfig } from '../../../data/beltConfig'

/**
 * Vista de Gestão de Alunos (Dashboard Principal)
 * Renderiza a busca, filtros e a tabela de conformidade técnica.
 */
export default function ManagementView({ 
  filteredStudents, 
  loading, 
  searchTerm, 
  setSearchTerm,
  beltFilter,
  setBeltFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  exportToCSV,
  openGraduationModal,
  handleViewHistory,
  CustomSelect
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Barra de Pesquisa Elite */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search size={18} strokeWidth={1.9} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors" />
          <input
            className="w-full bg-[#111] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/10 transition-all font-medium"
            placeholder="Buscar aluno por nome técnica..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {(searchTerm !== '' || beltFilter !== 'all' || statusFilter !== 'all') && (
          <button 
            onClick={() => { setSearchTerm(''); setBeltFilter('all'); setStatusFilter('all'); }}
            className="flex items-center justify-center gap-2 px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary/10 text-primary border border-primary/20"
          >
            <RefreshCcw size={18} strokeWidth={1.9} /> Limpar Filtros
          </button>
        )}
      </div>

      {/* Container de Tabela e Filtros */}
      <div className="bg-black backdrop-blur-md rounded-3xl p-5 md:p-6 border border-white/5 shadow-2xl">
        
        {/* Grade de Filtros Seletores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <CustomSelect 
             label="Ordenar por"
             value={sortBy}
             onChange={setSortBy}
             options={[['recente', 'Mais Recente'], ['az', 'A → Z'], ['za', 'Z → A']]}
           />
           <CustomSelect 
             label="Faixa do Aluno"
             value={beltFilter}
             onChange={setBeltFilter}
             options={[['all', 'Todas as Faixas'], ...Object.entries(beltConfig).map(([k, c]) => [k, c.label])]}
           />
           <CustomSelect 
             label="Status Técnico"
             value={statusFilter}
             onChange={setStatusFilter}
             options={[['all', 'Todos os Status'], ['Em progresso', 'Em progresso'], ['Próximo', 'Próximo']]}
           />
           <div className="flex flex-col gap-1.5 justify-end">
              <button 
                onClick={exportToCSV}
                className="w-full h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-2"
              >
                <FileDown size={18} /> Exportar
              </button>
           </div>
        </div>

        {/* Tabela de Listagem */}
        <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <RefreshCcw size={32} className="mx-auto mb-4 animate-spin opacity-20 text-primary" />
              <p className="text-xs font-black uppercase tracking-widest">Sincronizando registros técnicos...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-24 text-gray-600">
              <GraduationCap size={56} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] mb-1">Nenhuma graduação encontrada</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-black text-gray-500 tracking-wider bg-white/5">
                  <th className="py-4 px-5 uppercase">Aluno</th>
                  <th className="py-4 px-5 text-center">Faixa Atual</th>
                  <th className="py-4 px-5 text-center">Tempo na Faixa</th>
                  <th className="py-4 px-5 text-center">Progressão</th>
                  <th className="py-4 px-5 text-center">Próxima Faixa</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 w-12 text-center text-gray-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleViewHistory(s)}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-4">
                         {s.photo ? (
                           <img src={s.photo} alt={s.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/5 group-hover:ring-primary/40 transition-all" />
                         ) : (
                           <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-black ring-2 ring-white/5 group-hover:ring-primary/40 transition-all ${beltConfig[s.belt]?.bgClass || 'belt-white'}`}>
                             {s.initials || s.name?.[0] || 'A'}
                           </div>
                         )}
                         <div>
                           <span className="text-sm text-white font-black group-hover:text-primary transition-colors">{s.name}</span>
                           <p className="text-[11px] text-gray-500 mt-0.5 uppercase font-bold tracking-tight">
                             {beltConfig[s.belt]?.label || 'Sem faixa'}
                             {s.stripes > 0 ? ` · ${s.stripes}g` : ''}
                           </p>
                         </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-white/5 ${beltConfig[s.belt]?.bgClass || 'bg-white/5'} ${beltConfig[s.belt]?.textColor === '#FFFFFF' ? 'text-white' : 'text-black'} shadow-sm inline-block min-w-[90px]`}>
                         {beltConfig[s.belt]?.label}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm text-white font-black tabular-nums">{s.graduation.monthsInBelt} meses</span>
                        <span className="text-[9px] text-gray-600 uppercase font-black tracking-tighter">Início: {s.graduation.joinedAt}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col gap-2 items-center min-w-[140px]">
                         <div className="flex items-center justify-between w-full px-1">
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Ciclo</span>
                            <span className="text-[9px] font-black text-white">{s.graduation.progression}%</span>
                         </div>
                         <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-white/5 p-0.5">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(235,16,51,0.3)]"
                              style={{ width: `${s.graduation.progression}%` }}
                            />
                         </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 group/arrow">
                         <span className="text-sm text-gray-400 font-bold">
                           {beltConfig[beltConfig[s.belt]?.next]?.label || '---'}
                         </span>
                         <ChevronRight size={14} className="text-gray-700 group-hover/arrow:translate-x-1 transition-transform" />
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-white/10 bg-white/5 text-gray-400`}>
                         {s.graduation.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <button 
                           onClick={(e) => { e.stopPropagation(); openGraduationModal(s); }}
                           className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                           title="Registrar Troca de Faixa"
                         >
                           <Plus size={18} />
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleViewHistory(s); }}
                           className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                           title="Ver Histórico Técnico"
                         >
                           <MoreVertical size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
