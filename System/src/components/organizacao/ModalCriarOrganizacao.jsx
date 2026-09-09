/**
 * MODAL DE ONBOARDING: ModalCriarOrganizacao.jsx (Multi-Tenant Atlas)
 * 
 * Permite que um administrador crie uma nova organização/academia na plataforma,
 * inicializando a estrutura no Firestore e atribuindo a membership de proprietário (owner).
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, X, Plus, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useOrganizacao } from '../../context/OrganizacaoContext'
import { toast } from 'react-hot-toast'

export default function ModalCriarOrganizacao({ isOpen, onClose }) {
  const { criarNovaOrganizacao } = useOrganizacao()
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('Informe o nome da academia')
      return
    }

    setCarregando(true)
    try {
      const orgId = await criarNovaOrganizacao(nome.trim())
      toast.success(`Academia "${nome}" criada com sucesso!`)
      setNome('')
      onClose()
    } catch (err) {
      console.error('❌ Erro ao criar academia:', err)
      toast.error('Não foi possível criar a academia.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Nova Academia</h3>
                <p className="text-xs text-gray-400">Onboarding de tenant na plataforma Atlas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Nome da Academia / Organização
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Atlas Academy Centro"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary text-sm transition-colors"
              />
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3 text-xs text-primary/90">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>
                Você será automaticamente definido como <strong>Proprietário (Owner)</strong> da nova academia.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={carregando}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {carregando ? 'Criando...' : 'Criar Academia'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
