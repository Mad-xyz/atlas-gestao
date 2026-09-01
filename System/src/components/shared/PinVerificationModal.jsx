import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'

/**
 * PinVerificationModal - Modal de Segurança Universal
 * 
 * Solicita o PIN do usuário logado para autorizar ações sensíveis 
 * (como revelar senhas de terceiros).
 */
export default function PinVerificationModal({ onConfirm, onClose, title = "Segurança", message = "Para visualizar dados sensíveis, confirme seu próprio PIN de segurança." }) {
    useHideMobileNav(true)
    const [pin, setPin] = useState('')

    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)
    const { verifyPIN } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading || pin.length < 4) return

        setLoading(true)
        setError(false)
        try {
            const isValid = await verifyPIN(pin)
            if (isValid) {
                onConfirm(pin)
            } else {
                setError(true)
            }
        } finally {
            setLoading(false)
        }
    }

    const modalContent = (
        <div className="modal-backdrop" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-[#0d0d0d]/80 backdrop-blur-md border border-white/10 rounded-[32px] p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                    <ShieldAlert className="text-orange-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">{title}</h3>
                <p className="text-[11px] text-gray-400 mb-8 font-medium leading-relaxed">
                    {message}
                </p>
                <div className="space-y-6">
                    {/* Campos ocultos removidos por não ser mais um formulário submetível */}
                    <input
                        id="pin-verification-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={pin}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !loading && pin.length >= 4) {
                            handleSubmit(e);
                          }
                        }}
                        onChange={(e) => { 
                            const val = e.target.value.replace(/\D/g, ''); // Apenas números
                            setPin(val); 
                            setError(false);
                        }}
                        className={`w-full bg-black border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-4 text-center text-3xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-white/30 transition-all`}
                        placeholder="••••••"
                        style={{ WebkitTextSecurity: 'disc' }} // Mantém as "bolinhas" visualmente se preferir ocultar
                        autoFocus
                    />
                    {error && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest animate-pulse">PIN Incorreto</p>}
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${loading ? 'bg-gray-700 text-gray-500 cursor-wait' : 'bg-orange-500 text-black hover:shadow-lg hover:shadow-orange-500/20'}`}
                        >
                            {loading ? 'Verificando...' : 'Verificar'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
