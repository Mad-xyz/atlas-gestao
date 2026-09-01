// RESUMO: Modal de configuração dinâmica de sistemas de graduação (Hub Global) com Navegação em Lista.
// Permite selecionar qualquer modalidade habilitada através de uma lista mestre e configurar suas faixas.
// Design focado em escalabilidade para academias com múltiplas modalidades.

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Settings, GraduationCap, Palette, CheckCircle2, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { useHideMobileNav } from '../../../hooks/useHideMobileNav'

const DEFAULT_CATEGORIES = [
  { id: 'cat_kids', name: 'Kids', belts: [] },
  { id: 'cat_juvenil', name: 'Juvenil', belts: [] },
  { id: 'cat_adulto', name: 'Adulto', belts: [] }
];

export default function BeltConfigModal({ isOpen, onClose, modalities, onSave, initialModality }) {
  useHideMobileNav(isOpen)
  
  const [view, setView] = useState('list') // 'list' | 'config'
  const [selectedModality, setSelectedModality] = useState(null)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [activeTab, setActiveTab] = useState('cat_adulto')
  const [searchTerm, setSearchTerm] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Filtra modalidades habilitadas
  const beltEnabledModalities = modalities?.filter(m => m.hasBelt !== false) || []

  // Controla o estado inicial e navegação externa
  useEffect(() => {
    if (isOpen) {
      if (initialModality) {
        handleEnterConfig(initialModality)
      } else {
        setView('list')
        setSelectedModality(null)
      }
    }
  }, [initialModality, isOpen])

  // Lógica de entrada na configuração de uma modalidade
  const handleEnterConfig = (modality) => {
    setIsExpanded(false)
    setSelectedModality(modality)
    setView('config')
    
    // Carrega dados existentes do banco
    if (modality?.beltSystem?.categories) {
      const existing = modality.beltSystem.categories;
      const combined = DEFAULT_CATEGORIES.map(def => {
        const found = existing.find(e => e.id === def.id || e.name.toLowerCase() === def.name.toLowerCase());
        return found ? found : def;
      });
      setCategories(combined);
    } else {
      // Se não houver configuração, inicia com as categorias padrão vazias (limpo)
      setCategories(DEFAULT_CATEGORIES)
    }
  }

  const addBelt = (catId) => {
    const newBelt = { id: 'belt_' + Date.now() + Math.random(), name: '', color: '#ffffff' }
    setCategories(prev => prev.map(cat => cat.id === catId ? { ...cat, belts: [...cat.belts, newBelt] } : cat));
  }

  const updateBelt = (catId, beltId, field, value) => {
    setCategories(prev => prev.map(cat => 
      cat.id === catId 
        ? { ...cat, belts: cat.belts.map(b => b.id === beltId ? { ...b, [field]: value } : b) }
        : cat
    ));
  }

  const removeBelt = (catId, beltId) => {
    setCategories(prev => prev.map(cat => 
      cat.id === catId ? { ...cat, belts: cat.belts.filter(b => b.id !== beltId) } : cat
    ));
  }

  const handleSave = () => {
    if (!selectedModality) return;
    onSave({
      ...selectedModality,
      beltSystem: { categories, updatedAt: new Date().toISOString() },
      hasBelt: true
    })
    setView('list')
    setSelectedModality(null)
    setIsExpanded(false)
  }

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    
    // Aumentamos a margem (Histerese) para evitar o loop de feedback onde o modal sobe/desce sozinho
    if (scrollTop > 80 && !isExpanded) {
      setIsExpanded(true);
    } else if (scrollTop < 20 && isExpanded) {
      setIsExpanded(false);
    }
  }

  if (!isOpen) return null

  const filteredModalities = beltEnabledModalities.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentCategory = categories.find(c => c.id === activeTab);

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-6 transition-all duration-500">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all" onClick={onClose} />
      
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (info.offset.y > 150) onClose();
        }}
        initial={{ y: "100%" }}
        animate={{ 
          y: 0,
          height: (view === 'config' || isExpanded) ? '92vh' : '60vh'
        }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 40, stiffness: 200 }}
        className="relative w-full max-w-4xl bg-[#0a0a0a] border-t border-white/10 md:border md:rounded-[40px] rounded-t-[32px] overflow-hidden shadow-[0_-10px_50px_-12px_rgba(0,0,0,0.5)] md:h-auto flex flex-col"
      >
        {/* BARRA DE ARRASTE (MOBILE) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        {/* HEADER DINÂMICO */}
        <div className="flex items-center justify-between p-6 md:p-8 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex items-center gap-4">
            {view === 'config' && (
              <button 
                onClick={() => setView('list')}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-primary"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="p-3 bg-primary/10 text-primary rounded-[18px]">
              {view === 'list' ? <Settings size={24} /> : <GraduationCap size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                {view === 'list' ? 'Graduações' : selectedModality?.name}
              </h2>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1.5 line-clamp-1">
                {view === 'list' ? 'Hub Global de Modalidades' : 'Ajustar faixas e níveis'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* CONTEÚDO DINÂMICO */}
        <div 
          onScroll={handleScroll}
          className="flex-1 p-6 md:p-8 pt-0 overflow-y-auto no-scrollbar scroll-smooth"
        >
          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div 
                key="list-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* BUSCADOR */}
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-primary" size={18} />
                  <input 
                    type="text"
                    placeholder="BUSCAR MODALIDADE..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-5 py-5 text-xs font-black tracking-widest text-white outline-none focus:border-primary/30 transition-all placeholder:text-gray-700"
                  />
                </div>

                {/* LISTA VERTICAL */}
                <div className="grid gap-3">
                  {filteredModalities.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => handleEnterConfig(mod)}
                      className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-[24px] group hover:bg-white/5 hover:border-primary/30 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                          <GraduationCap size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block text-sm font-black text-white uppercase tracking-tight">{mod.name}</span>
                          <span className="block text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Configurar Sistema</span>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-700 group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                    </button>
                  ))}
                  {filteredModalities.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                      <Search size={48} className="mx-auto mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">Nenhuma modalidade encontrada</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="config-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* ABAS DE CATEGORIA */}
                <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        activeTab === cat.id 
                        ? 'bg-primary text-black shadow-lg shadow-primary/10' 
                        : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* EDITOR DE FAIXAS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <Palette size={14} /> FAIXAS EM {currentCategory?.name}
                    </h3>
                    <button 
                      onClick={() => addBelt(activeTab)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                    >
                      <Plus size={16} /> ADICIONAR
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {currentCategory?.belts.map((belt, bIdx) => (
                      <div 
                        key={belt.id}
                        className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-[20px] transition-all hover:bg-white/[0.05] border-l-[6px]"
                        style={{ borderLeftColor: belt.color || '#fff' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0">
                          {bIdx + 1}
                        </div>
                        <input 
                          type="text"
                          placeholder="NOME DA FAIXA..."
                          value={belt.name}
                          onChange={(e) => updateBelt(activeTab, belt.id, 'name', e.target.value.toUpperCase())}
                          className="flex-1 bg-transparent border-none text-sm text-white font-black uppercase tracking-widest outline-none placeholder:text-gray-800"
                        />
                        <div className="flex items-center gap-3">
                          <input 
                            type="color"
                            value={belt.color || '#ffffff'}
                            onChange={(e) => updateBelt(activeTab, belt.id, 'color', e.target.value)}
                            className="bg-transparent border-none p-0 w-8 h-8 cursor-pointer rounded-full overflow-hidden shrink-0"
                          />
                          <button 
                            onClick={() => removeBelt(activeTab, belt.id)}
                            className="p-2 text-gray-700 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {currentCategory?.belts.length === 0 && (
                      <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[24px] opacity-10">
                        <Palette size={32} className="mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma faixa nesta categoria</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER - SÓ APARECE EM MODO CONFIG */}
        {view === 'config' && (
          <div className="p-6 pb-10 md:p-8 border-t border-white/10 bg-[#111111] shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
            <button 
              onClick={handleSave} 
              className="w-full py-5 bg-primary text-black rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              <CheckCircle2 size={20} /> SALVAR GRADUAÇÃO
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  )
}
