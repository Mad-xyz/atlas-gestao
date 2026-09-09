import React from 'react'
import { CreditCard, Lock, Zap } from 'lucide-react'
import SlideOver from '../shared/SlideOver'

export default function PaymentDrawer({ student, isOpen, onClose }) {
  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title="Financeiro"
      subtitle={student?.name}
      width="max-w-md"
    >
      <div className="p-5 space-y-5">
        {/* Banner em desenvolvimento */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 rounded-xll p-5 border border-yellow-500/20 text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-3">
            <Zap size={22} className="text-yellow-400 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-yellow-400 mb-1">Módulo em Desenvolvimento</h3>
          <p className="text-xs text-gray-500">O módulo financeiro está sendo construído e estará disponível em breve.</p>
        </div>

        {/* Preview dos campos futuros */}
        <div className="space-y-3">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Pré-visualização</h3>
          {[
            { label: 'Plano Atual', value: 'Mensal — R$ 150,00', icon: CreditCard },
            { label: 'Próximo Vencimento', value: '15 de Abril, 2026', icon: Lock },
            { label: 'Último Pagamento', value: '15 de Março, 2026', icon: Lock },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 bg-white/5 rounded-xll p-4 border border-white/5 opacity-50 cursor-not-allowed">
              <item.icon size={16} className="text-gray-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">{item.label}</p>
                <p className="text-sm text-gray-400 font-medium">{item.value}</p>
              </div>
              <Lock size={12} className="text-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </SlideOver>
  )
}

