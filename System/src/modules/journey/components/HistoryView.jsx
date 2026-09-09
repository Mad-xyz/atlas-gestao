import React from 'react'
import { 
  ArrowLeft, Calendar, History, TrendingUp, 
  Award, Clock, ChevronRight, User 
} from 'lucide-react'
import { beltConfig } from '../../../data/beltConfig'

/**
 * Vista de Histórico Detalhado (Linha do Tempo)
 * Projeta a evolução técnica do aluno em um formato vertical premium.
 */
export default function HistoryView({ student, onBack }) {
  if (!student) return null

  // Processa o histórico para exibição cronológica (Mais recente primeiro)
  const history = [...(student.tech_journey?.history || [])].sort((a, b) => {
    const da = a.date?.toDate?.() || new Date(a.date)
    const db = b.date?.toDate?.() || new Date(b.date)
    return db - da
  })

  // Estatísticas Rápidas do Aluno
  const stats = [
    { label: 'Tempo Total', value: `${student.graduation.monthsInBelt} meses`, icon: Clock },
    { label: 'Graduações', value: history.length, icon: Award },
    { label: 'Progressão', value: `${student.graduation.progression}%`, icon: TrendingUp },
  ]

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Cabeçalho de Navegação e Perfil */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
             {student.photo ? (
               <img src={student.photo} alt={student.nome || student.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10 shadow-2xl" />
             ) : (
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black ring-2 ring-white/10 ${beltConfig[student.belt]?.bgClass || 'belt-white'}`}>
                 {student.initials || (student.nome || student.name)?.[0]}
               </div>
             )}
             <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tight">{student.nome || student.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                 <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${beltConfig[student.belt]?.bgClass || 'belt-white'} ${beltConfig[student.belt]?.textColor === '#FFFFFF' ? 'text-white' : 'text-black'}`}>
                   {beltConfig[student.belt]?.label}
                 </span>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">· ID: {student.pin || '---'}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:w-auto">
          {stats.map(s => (
            <div key={s.label} className="bg-black border border-white/5 rounded-2xl p-3 flex flex-col items-center min-w-[100px]">
              <s.icon size={14} className="text-primary mb-1" />
              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest leading-none mb-1">{s.label}</span>
              <span className="text-sm text-white font-black">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Seção da Linha do Tempo (Vertical Timeline) */}
      <div className="relative pl-8 md:pl-12 py-10 max-w-2xl mx-auto">
        
        {/* Linha Central Decorativa */}
        <div className="absolute left-[39px] md:left-[47px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-white/5 to-transparent" />

        {/* Mapeamento do Histórico */}
        <div className="space-y-12">
          {history.length > 0 ? history.map((event, idx) => {
            const eventDate = event.date?.toDate?.() || new Date(event.date)
            const config = beltConfig[event.belt] || { label: 'Desconhecido', bgClass: 'bg-gray-500' }
            
            return (
              <div key={idx} className="relative group animate-fade-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                
                {/* Marcador na Linha (O "Nó") */}
                <div className={`absolute -left-[48px] md:-left-[56px] top-2 w-10 h-10 rounded-2xl ${config.bgClass} border-4 border-[#050505] shadow-xl z-10 flex items-center justify-center transition-transform group-hover:scale-110`}>
                   <Award size={18} className={config.textColor === '#FFFFFF' ? 'text-white' : 'text-black'} strokeWidth={3} />
                </div>

                {/* Card de Detalhe do Evento */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl transition-all group-hover:border-white/10 group-hover:bg-black/80">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                         <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                           <Calendar size={12} /> {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                         </p>
                         <h3 className="text-lg font-black text-white uppercase tracking-tight">
                           Graduação para {config.label}
                         </h3>
                      </div>
                      <div className="flex h-fit">
                         <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-inner ${config.bgClass} ${config.textColor === '#FFFFFF' ? 'text-white' : 'text-black'}`}>
                           {config.label}
                         </span>
                      </div>
                   </div>

                   <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                      <p className="text-sm text-gray-400 font-medium leading-relaxed italic">
                        "{event.reason || 'Promoção técnica baseada em tempo e performance.'}"
                      </p>
                   </div>

                   <div className="mt-4 flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                         <History size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-tight">Registro oficial do sistema</span>
                      </div>
                   </div>
                </div>
              </div>
            )
          }) : (
            <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
               <History size={40} className="mx-auto mb-4 opacity-10" />
               <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Sem histórico registrado de graduações.</p>
            </div>
          )}

          {/* Marco de Entrada na Academia (Nó Final) */}
          <div className="relative">
             <div className="absolute -left-[48px] md:-left-[56px] top-2 w-10 h-10 rounded-2xl bg-white/5 border-4 border-[#050505] shadow-xl z-10 flex items-center justify-center">
                <User size={18} className="text-gray-500" />
             </div>
             <div className="bg-white/5 border border-white/5 rounded-3xl p-6 opacity-60">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2 text-primary">
                   <Calendar size={12} /> {new Date(student.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Início da Jornada</h3>
                <p className="text-[11px] text-gray-500 mt-1 uppercase font-bold">Matrícula confirmada na Atlas Academy</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
