import React, { useState, useEffect } from 'react'
import { 
  Plus, Trash2, Save, MoreVertical, 
  Settings, Award, Clock, ChevronRight, 
  Info, AlertCircle, CheckCircle2 
} from 'lucide-react'
import { db } from '../../../firebase/config'
import { collection, query, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../../../firebase/collections'
import { beltConfig as defaultBelts } from '../../../data/beltConfig'

/**
 * Painel de Configuração de Regras de Graduação (Padrão Sênior)
 * Permite definir sequências de faixas e tempos mínimos por Modalidade e Categoria.
 */
export default function ConfigurationView() {
  const [modalities, setModalities] = useState([])
  const [selectedModality, setSelectedModality] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('Adulto')
  const [configs, setConfigs] = useState({}) // { modalityId_category: { belts: [] } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Categorias fixas conforme requisito
  const categories = ['Kids', 'Jovem', 'Adulto']

  // Busca modalidades e configurações existentes no Firestore
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const modSnap = await getDocs(collection(db, COLLECTIONS.MODALIDADES))
        const mods = modSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setModalities(mods)
        if (mods.length > 0) setSelectedModality(mods[0])

        const confSnap = await getDocs(collection(db, COLLECTIONS.CONFIGURACOES_JORNADA))
        const confData = {}
        confSnap.forEach(d => { confData[d.id] = d.data() })
        setConfigs(confData)
      } catch (err) {
        console.error('Erro ao carregar configurações:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Gerencia o estado local das configurações (Edição)
  const currentKey = selectedModality ? `${selectedModality.id}_${selectedCategory}` : ''
  const currentConfig = configs[currentKey] || { belts: [] }

  const handleAddBelt = () => {
    const newBelt = {
      id: `belt_${Date.now()}`,
      label: 'Nova Faixa',
      minMonths: 0,
      stripes: { enabled: false, count: 4, minMonthsPerStripe: 0 },
      color: '#FFFFFF'
    }
    setConfigs(prev => ({
      ...prev,
      [currentKey]: { 
        ...prev[currentKey], 
        belts: [...(prev[currentKey]?.belts || []), newBelt] 
      }
    }))
  }

  const handleUpdateBelt = (beltId, field, value) => {
    const updatedBelts = currentConfig.belts.map(b => 
      b.id === beltId ? { ...b, [field]: value } : b
    )
    setConfigs(prev => ({
      ...prev,
      [currentKey]: { ...prev[currentKey], belts: updatedBelts }
    }))
  }

  const handleRemoveBelt = (beltId) => {
    const updatedBelts = currentConfig.belts.filter(b => b.id !== beltId)
    setConfigs(prev => ({
      ...prev,
      [currentKey]: { ...prev[currentKey], belts: updatedBelts }
    }))
  }

  const saveConfiguration = async () => {
    if (!selectedModality) return
    setSaving(true)
    try {
      await setDoc(doc(db, COLLECTIONS.CONFIGURACOES_JORNADA, currentKey), {
        modalityId: selectedModality.id,
        modalityName: selectedModality.name,
        category: selectedCategory,
        belts: currentConfig.belts,
        updatedAt: serverTimestamp()
      })
      alert(`Configuração de ${selectedModality.name} (${selectedCategory}) salva com sucesso!`)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar as configurações.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-500 animate-pulse">
      <Settings size={40} className="animate-spin mb-4 opacity-10" />
      <p className="text-sm font-black uppercase tracking-widest">Carregando Motor de Regras...</p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in pb-12">
      
      {/* Sidebar: Modalidades e Categorias */}
      <div className="space-y-6">
        <div className="bg-black border border-white/5 rounded-3xl p-6 shadow-xl">
           <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 px-1">Modalidades</h3>
           <div className="space-y-2">
             {modalities.map(m => (
               <button
                 key={m.id}
                 onClick={() => setSelectedModality(m)}
                 className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-black transition-all border
                   ${selectedModality?.id === m.id 
                     ? 'bg-primary text-black border-primary shadow-lg shadow-primary/10' 
                     : 'bg-white/5 text-gray-400 border-transparent hover:border-white/10 hover:bg-white/10'}`}
               >
                 {m.name}
                 <ChevronRight size={16} />
               </button>
             ))}
           </div>
        </div>

        <div className="bg-black border border-white/5 rounded-3xl p-6 shadow-xl">
           <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 px-1">Categorias</h3>
           <div className="grid grid-cols-1 gap-2">
             {categories.map(c => (
               <button
                 key={c}
                 onClick={() => setSelectedCategory(c)}
                 className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black transition-all border
                   ${selectedCategory === c 
                     ? 'bg-white/10 border-white/10 text-white shadow-xl translate-x-1 outline outline-1 outline-primary/40' 
                     : 'bg-white/5 text-gray-500 border-transparent hover:text-gray-300'}`}
               >
                 <div className={`w-2 h-2 rounded-full ${selectedCategory === c ? 'bg-primary' : 'bg-gray-700'}`} />
                 {c}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Painel Principal: Configuração de Faixas */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-black border border-white/5 rounded-3xl p-8 shadow-xl min-h-[500px] flex flex-col">
           
           {/* Header do Painel */}
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
              <div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                   <Award size={28} className="text-primary" /> {selectedModality?.name} · {selectedCategory}
                 </h2>
                 <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">
                   Defina a sequência de evolução técnica, o tempo mínimo exigido e as regras de graus.
                 </p>
              </div>
              <button 
                onClick={saveConfiguration}
                disabled={saving}
                className="px-8 py-3.5 rounded-2xl bg-primary text-black font-black uppercase text-[11px] tracking-widest transition-all hover:bg-white active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? 'Gravando...' : <><Save size={18} /> Salvar Regras</>}
              </button>
           </div>

           {/* Lista de Faixas Configuradas */}
           <div className="space-y-4 flex-1">
             {currentConfig.belts.length > 0 ? currentConfig.belts.map((belt, idx) => (
                <div key={belt.id} className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col md:flex-row gap-6 items-center">
                   
                   {/* Handle/Order */}
                   <div className="flex items-center gap-4 min-w-[120px]">
                      <span className="text-xs font-black text-gray-700 w-6">#{idx + 1}</span>
                      <div className={`w-10 h-10 rounded-xl border border-white/10 shadow-lg`} style={{ backgroundColor: belt.color }} />
                      <input 
                        className="bg-transparent border-b border-white/10 focus:border-primary text-sm font-black text-white outline-none w-full py-1 uppercase"
                        value={belt.label}
                        onChange={(e) => handleUpdateBelt(belt.id, 'label', e.target.value)}
                      />
                   </div>

                   {/* Tempo Mínimo */}
                   <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                      <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                           <Clock size={12} /> Tempo Mín. (Meses)
                         </label>
                         <input 
                           type="number"
                           className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-black"
                           value={belt.minMonths}
                           onChange={(e) => handleUpdateBelt(belt.id, 'minMonths', parseInt(e.target.value) || 0)}
                         />
                      </div>
                      
                      {/* Lógica de Graus (Opcional) */}
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                           <Info size={12} /> Graus/Stripes
                         </label>
                         <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleUpdateBelt(belt.id, 'stripes', { ...belt.stripes, enabled: !belt.stripes?.enabled })}
                              className={`p-3 rounded-xl border transition-all text-[11px] font-black uppercase
                                ${belt.stripes?.enabled ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-transparent text-gray-600'}`}
                            >
                               {belt.stripes?.enabled ? 'Ativo' : 'Inativo'}
                            </button>
                            {belt.stripes?.enabled && (
                              <div className="flex items-center gap-2 animate-fade-in">
                                 <input 
                                   type="number"
                                   className="w-16 bg-white/5 border border-white/5 rounded-xl px-2 py-3 text-sm text-white font-black text-center"
                                   value={belt.stripes?.count || 4}
                                   onChange={(e) => handleUpdateBelt(belt.id, 'stripes', { ...belt.stripes, count: parseInt(e.target.value) || 0 })}
                                 />
                                 <span className="text-[10px] text-gray-700 font-black uppercase">Qtd</span>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>

                   {/* Ações da Faixa */}
                   <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        className="w-10 h-10 bg-transparent border-none p-0 cursor-pointer rounded-xl"
                        value={belt.color}
                        onChange={(e) => handleUpdateBelt(belt.id, 'color', e.target.value)}
                      />
                      <button 
                        onClick={() => handleRemoveBelt(belt.id)}
                        className="p-3 rounded-xl bg-white/5 border border-transparent text-gray-600 hover:text-primary hover:bg-primary/5 transition-all"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>
             )) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl opacity-50">
                   <AlertCircle size={40} className="mb-4 text-gray-700" />
                   <p className="text-sm font-bold text-gray-600 uppercase tracking-[0.2em]">Nenhuma faixa configurada para este ciclo.</p>
                   <button 
                     onClick={handleAddBelt}
                     className="mt-6 flex items-center gap-2 text-primary font-black uppercase text-[11px] hover:text-white"
                   >
                     <Plus size={16} /> Começar Cadastro
                   </button>
                </div>
             )}
           </div>

           {/* Botão de Adição de Faixa */}
           {currentConfig.belts.length > 0 && (
             <button 
                onClick={handleAddBelt}
                className="mt-6 w-full py-5 rounded-2xl border-2 border-dashed border-white/5 text-gray-500 font-bold uppercase text-[11px] tracking-widest hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3"
             >
                <Plus size={18} /> Adicionar Nova Faixa à Sequência
             </button>
           )}
        </div>
        
        {/* Info Box de Arquiteto */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4">
           <Info className="shrink-0 text-primary" size={24} />
           <div>
              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest mb-1">Arquitetura de Graduação</h4>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                As faixas serão exibidas em ordem sequencial (do topo para baixo). Certifique-se de configurar o **Tempo Mínimo** corretamente para permitir o cálculo automático de progressão do aluno no painel geral.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
