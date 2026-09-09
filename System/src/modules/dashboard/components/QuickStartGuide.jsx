import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, ChevronRight, PlayCircle, 
  Target, Zap, Sparkles, X, LayoutDashboard,
  Users, Layers, Settings, BookOpen, GraduationCap, 
  CheckSquare, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const roleGuides = {
  admin: {
    title: 'Painel do Administrador',
    description: 'Gerencie sua academia com total controle e inteligência.',
    steps: [
      { id: 1, title: 'Migrar Sistema', desc: 'Atualize seu banco de dados para o novo padrão PT-BR.', icon: Zap, actionLabel: 'Migrar Agora' },
      { id: 2, title: 'Modalidades', desc: 'Configure as artes marciais e turmas disponíveis.', icon: Layers, actionLabel: 'Configurar' },
      { id: 3, title: 'Equipe', desc: 'Adicione professores e defina permissões de acesso.', icon: Users, actionLabel: 'Gerenciar Time' },
      { id: 4, title: 'Configurações', desc: 'Ajuste os dados da academia e logo do sistema.', icon: Settings, actionLabel: 'Ajustar Perfil' }
    ]
  },
  gestor: {
    title: 'Gestão da Unidade',
    description: 'Foco em crescimento, retenção e saúde financeira.',
    steps: [
      { id: 1, title: 'Novos Alunos', desc: 'Cadastre e gerencie as matrículas recentes.', icon: Users, actionLabel: 'Ver Alunos' },
      { id: 2, title: 'Cobranças', desc: 'Acompanhe pagamentos e inadimplência em tempo real.', icon: Activity, actionLabel: 'Financeiro' },
      { id: 3, title: 'Chamada Geral', desc: 'Monitore a frequência média das suas turmas.', icon: CheckSquare, actionLabel: 'Ver Frequência' },
      { id: 4, title: 'Relatórios', desc: 'Analise o desempenho mensal da sua academia.', icon: LayoutDashboard, actionLabel: 'Ver BI' }
    ]
  },
  professor: {
    title: 'Guia do Instrutor',
    description: 'Excelência técnica e acompanhamento dos alunos.',
    steps: [
      { id: 1, title: 'Fazer Chamada', desc: 'Registre a presença dos alunos nas aulas de hoje.', icon: CheckSquare, actionLabel: 'Abrir Chamada' },
      { id: 2, title: 'Alunos em Risco', desc: 'Identifique alunos que estão faltando e precisam de atenção.', icon: Target, actionLabel: 'Ver Lista' },
      { id: 3, title: 'Graduações', desc: 'Prepare os alunos que estão próximos da troca de faixa.', icon: GraduationCap, actionLabel: 'Avaliar' },
      { id: 4, title: 'Avisos', desc: 'Envie comunicações importantes para suas turmas.', icon: BookOpen, actionLabel: 'Criar Evento' }
    ]
  },
  aluno: {
    title: 'Minha Jornada',
    description: 'Acompanhe sua evolução e conquistas na academia.',
    steps: [
      { id: 1, title: 'Meu Progresso', desc: 'Veja quantas aulas faltam para sua próxima graduação.', icon: GraduationCap, actionLabel: 'Ver Perfil' },
      { id: 2, title: 'Histórico', desc: 'Confira sua frequência nas últimas semanas.', icon: Activity, actionLabel: 'Minhas Aulas' },
      { id: 3, title: 'Financeiro', desc: 'Acesse seus boletos e status de mensalidade.', icon: Sparkles, actionLabel: 'Ver Faturas' },
      { id: 4, title: 'Eventos', desc: 'Fique por dentro de seminários e competições.', icon: BookOpen, actionLabel: 'Ver Agenda' }
    ]
  }
};

export default function QuickStartGuide({ role }) {
  const guide = roleGuides[role] || roleGuides.gestor;
  const [isOpen, setIsOpen] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);
  
  useEffect(() => {
    const saved = localStorage.getItem(`guide_completed_${role}`);
    if (saved) setCompletedSteps(JSON.parse(saved));
    
    const isHidden = localStorage.getItem(`guide_hidden_${role}`);
    if (isHidden === 'true') setIsOpen(false);
  }, [role]);

  const toggleStep = (id) => {
    const newSteps = completedSteps.includes(id) 
      ? completedSteps.filter(s => s !== id)
      : [...completedSteps, id];
    setCompletedSteps(newSteps);
    localStorage.setItem(`guide_completed_${role}`, JSON.stringify(newSteps));
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(`guide_hidden_${role}`, 'true');
  };

  if (!isOpen) return null;

  const progress = (completedSteps.length / guide.steps.length) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 shadow-2xl mb-8 group/guide"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <PlayCircle className="text-emerald-500" size={20} />
          </div>
          <div>
            <h2 className="text-white font-black uppercase tracking-tight text-lg">{guide.title}</h2>
            <p className="text-gray-500 text-xs font-medium">{guide.description}</p>
          </div>
        </div>
        <button 
          onClick={handleClose}
          className="p-2 hover:bg-white/10 rounded-xl text-gray-600 hover:text-white transition-all active:scale-90"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mb-8 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Progresso do Onboarding</span>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-full">{Math.round(progress)}% Concluído</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {guide.steps.map((step, idx) => {
          const isDone = completedSteps.includes(step.id);
          const Icon = step.icon;
          
          return (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => toggleStep(step.id)}
              className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 ${
                isDone 
                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' 
                : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 hover:-translate-y-1'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl transition-colors ${isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-black/40 text-gray-400 group-hover:text-white group-hover:bg-emerald-500/20 group-hover:text-emerald-500'}`}>
                  <Icon size={18} />
                </div>
                {isDone ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <Circle size={18} className="text-gray-700 group-hover:text-gray-500" />
                )}
              </div>
              
              <div>
                <h4 className={`text-xs font-black uppercase tracking-tight mb-1 transition-colors ${isDone ? 'text-emerald-500' : 'text-white'}`}>
                  {step.title}
                </h4>
                <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tighter">
                  {step.desc}
                </p>
              </div>

              <div className={`flex items-center gap-1 mt-auto pt-2 text-[9px] font-black uppercase tracking-widest transition-all ${isDone ? 'text-emerald-500/40' : 'text-gray-600 group-hover:text-emerald-500'}`}>
                <span>{isDone ? 'Concluído' : step.actionLabel}</span>
                <ChevronRight size={10} className={isDone ? 'hidden' : 'inline'} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
