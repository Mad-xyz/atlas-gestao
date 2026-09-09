import React, { useState } from 'react'
import { GraduationCap, Calendar, Save, X, Info } from 'lucide-react'
import { beltConfig } from '../../data/beltConfig'
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { COLLECTIONS, ROOT_COLLECTIONS } from '../../firebase/collections'
import { useOrganizacao } from '../../context/OrganizacaoContext'

/**
 * Modal para registro de troca de faixa (Graduação).
 * Atualiza o campo 'belt' principal e adiciona entrada no 'tech_journey.history'.
 * MULTI-TENANT: aluno em organizations/{orgId}/usuarios.
 */
export default function GraduationChangeModal({ student, onClose, onFinish }) {
  useHideMobileNav(!!student)
  const { organizacaoAtualId } = useOrganizacao()
  const [newBelt, setNewBelt] = useState(student?.belt || 'white')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('Promoção de Graduação')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!student || !organizacaoAtualId) return
    setLoading(true)
    try {
      // MULTI-TENANT: aluno na subcoleção `usuarios` da organização ativa
      const studentRef = doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, organizacaoAtualId, COLLECTIONS.USUARIOS, student.id)
      const promotionDate = new Date(date)
      
      await updateDoc(studentRef, {
        belt: newBelt,
        'tech_journey.current_belt': newBelt,
        'tech_journey.last_promotion_date': promotionDate.toISOString(),
        'tech_journey.history': arrayUnion({
          belt: newBelt,
          date: promotionDate.toISOString(),
          reason: reason || 'Promoção técnica'
        }),
        updatedAt: serverTimestamp()
      })

      if (onFinish) onFinish()
      onClose()
    } catch (err) {
      console.error('Erro ao registrar graduação:', err)
      alert('Erro ao salvar graduação. Verifique o console.')
    } finally {
      setLoading(false)
    }
  }

  if (!student) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0d0d0d] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
        style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
        
        {/* Header */}
        <div className="bg-white/[0.02] border-b border-white/5 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <GraduationCap size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Registrar Graduação</h3>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Aluno: {student.nome || student.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Alerta de Faixa Atual */}
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
             <div className={`w-12 h-12 rounded-full ring-2 ring-white/10 ${beltConfig[student.belt]?.bgClass || 'belt-none'} flex items-center justify-center text-xs font-black shadow-lg`}>
                {beltConfig[student.belt]?.label[0]}
             </div>
             <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Faixa Atual</p>
                <p className="text-sm text-white font-bold">{beltConfig[student.belt]?.label || 'Sem Faixa'}</p>
             </div>
          </div>

          {/* Seleção de Nova Faixa */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nova Faixa</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(beltConfig).filter(([key]) => key !== 'none').map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setNewBelt(key)}
                  className={`p-3 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2
                    ${newBelt === key ? 'bg-primary/20 border-primary/40 text-primary shadow-lg shadow-primary/5 scale-[1.02]' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${cfg.bgClass} border border-white/10`} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data e Motivo */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Data da Troca</label>
              <div className="relative group">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Observação / Motivo</label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Exame de Graduação..."
                rows={2}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-primary/40 transition-all font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 bg-white/[0.02] border-t border-white/5 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white/5 text-gray-400 hover:bg-white/10 transition-all border border-white/5"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-[1.5] py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-primary text-black hover:bg-white transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processando...' : <><Save size={18} /> Confirmar Troca</>}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
