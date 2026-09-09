import React, { useState } from 'react'
import { X, AlertTriangle, UserX, UserMinus, CheckCircle2, ArchiveRestore } from 'lucide-react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'

export default function StatusChangeDialog({ student, action, onConfirm, onClose }) {
  useHideMobileNav(!!action)
  const [reason, setReason] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [saving, setSaving] = useState(false)

  if (!action || !student) return null

  const isInactivate = action === 'inativar'
  const isSuspend = action === 'suspender'
  const isReativar = action === 'reativar'
  const isRemoveArchive = action === 'remover arquivado'

  const config = {
    inativar: {
      icon: UserX,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20',
      title: 'Inativar Aluno',
      description: `O aluno "${student.nome || student.name}" será marcado como inativo. Ele não aparecerá nas chamadas, mas seus dados serão mantidos.`,
      btnLabel: 'Confirmar Inativação',
      btnClass: 'bg-gray-600 hover:bg-gray-500 text-white',
    },
    suspender: {
      icon: UserMinus,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      title: 'Suspender Aluno',
      description: `O aluno "${student.nome || student.name}" ficará temporariamente suspenso. Use para lesões, viagens ou licenças.`,
      btnLabel: 'Confirmar Suspensão',
      btnClass: 'bg-yellow-600 hover:bg-yellow-500 text-white',
    },
    reativar: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      title: 'Reativar Aluno',
      description: `O aluno "${student.nome || student.name}" terá o status alterado para ATIVO. Todos os acessos serão restaurados.`,
      btnLabel: 'Confirmar Reativação',
      btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    'remover arquivado': {
      icon: ArchiveRestore,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      title: 'Remover Arquivado',
      description: `O aluno "${student.nome || student.name}" terá o status alterado para ATIVO. O arquivamento será removido.`,
      btnLabel: 'Confirmar Remoção',
      btnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
  }

  const { icon: Icon, color, bgColor, borderColor, title, description, btnLabel, btnClass } = config[action] || config.inativar

  async function handleConfirm() {
    if (!reason.trim()) {
      alert('Por favor, informe o motivo.')
      return
    }
    if (isSuspend && !returnDate) {
      alert('Informe a data estimada de retorno para suspensão.')
      return
    }
    setSaving(true)
    try {
      await onConfirm({ reason, returnDate: returnDate || null })
    } catch (err) {
      alert(`Erro: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="modal-backdrop z-[9995]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="modal-content modal-content-bottom-sheet relative max-w-md w-full flex flex-col max-h-[90vh] overflow-y-auto bg-[#0d0d0d]"
          style={{
            background: 'var(--clr-surface)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Mobile Drag Handle */}
          <div className="md:hidden flex justify-center pt-4 pb-2 shrink-0">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          {/* Header */}
          <div className={`flex items-center gap-3 px-6 py-4 border-b ${borderColor}`} style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bgColor} ${borderColor}`}>
              <Icon size={18} className={color} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-black text-white">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Aviso */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${bgColor} ${borderColor}`}>
              <AlertTriangle size={16} className={`${color} shrink-0 mt-0.5`} />
              <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
            </div>

            {/* Motivo */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
                Motivo <span style={{ color: 'var(--clr-primary)' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={isInactivate ? 'Ex: Aluno cancelou a matrícula.' : isSuspend ? 'Ex: Lesão no joelho, fisioterapia por 3 meses.' : 'Ex: Aluno solicitou reativação.'}
                rows={3}
                className="form-input bg-black resize-none text-sm w-full"
              />
            </div>

            {/* Data de Retorno (só Suspensão) */}
            {isSuspend && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
                  Data Estimada de Retorno <span style={{ color: 'var(--clr-primary)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="form-input bg-black text-sm w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${btnClass}`}
              >
                {saving ? 'Salvando...' : btnLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
