import React, { useState, useMemo } from 'react'
import { 
  FileText, Signature, Clock, CheckCircle2, 
  Plus, Search, Filter, MoreVertical, 
  Send, Eye, Download, Archive, ChevronRight
} from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import KPICard from '../../components/shared/KPICard'
import { useContracts } from '../../hooks/useContracts'
import MobileHeader from '../../components/navigation/MobileHeader'

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { contracts, loading } = useContracts()
  
  const stats = useMemo(() => ({
    signed: contracts.filter(c => c.status === 'signed').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    expired: contracts.filter(c => c.status === 'expired').length,
  }), [contracts])

  const filteredContracts = useMemo(() => {
    return (contracts || []).filter(c => 
      c.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.plan?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [contracts, searchTerm])

  const getStatusStyle = (status) => {
    switch(status) {
      case 'signed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'expired': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'signed': return 'Assinado'
      case 'pending': return 'Pendente'
      case 'expired': return 'Expirado'
      default: return status
    }
  }

  return (
    <>
      <MobileHeader 
        title="Contratos" 
        actions={
          <button className="p-2.5 rounded-[5px] bg-primary text-black active:scale-90 transition-transform shadow-lg shadow-primary/20">
            <Plus size={20} strokeWidth={3} />
          </button>
        }
      />
      <PageHeader 
        icon={FileText} 
        title="CONTRATOS DIGITAIS" 
        subtitle="GESTÃO DE TERMOS, ADESÕES E ASSINATURAS"
      />

      <div className="px-4 md:px-6 py-6 space-y-6 w-full pb-12">
        
        {/* Stats Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard 
              title="Assinados" 
              value={loading ? '...' : stats.signed} 
              description="Contratos formalizados" 
              icon={CheckCircle2} 
              valueColor="text-emerald-400"
            />
            <KPICard 
              title="Aguardando" 
              value={loading ? '...' : stats.pending} 
              description="Pendente de assinatura" 
              icon={Clock} 
              valueColor="text-amber-400"
            />
            <KPICard 
              title="Expirando" 
              value={loading ? '...' : stats.expired} 
              description="Contratos vencidos" 
              icon={Clock} 
              valueColor="text-rose-400"
            />
         </div>

         {/* List Area */}
         <div className="glass-card rounded-xll border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5">
                <div className="relative flex-1 w-full md:min-w-[300px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text"
                    placeholder="Buscar por aluno ou plano..."
                    className="w-full bg-black border border-white/10 rounded-xll pl-10 pr-4 py-2 text-sm text-app outline-none focus:ring-1 focus:ring-primary/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                   <button className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xll text-[11px] font-bold uppercase shadow-xl hover:scale-105 transition-all">
                      <Plus size={16} /> Novo Contrato
                   </button>
                   <button className="flex items-center gap-2 px-4 py-2 rounded-xll text-xs font-bold bg-app-bg text-app-muted border border-white/5 hover:text-app transition-all">
                      <Filter size={16} /> Filtros
                   </button>
                   <button className="p-2 rounded-xll bg-app-bg text-app-muted border border-white/5 hover:text-app">
                      <Download size={18} />
                   </button>
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-black border-b border-white/5">
                    <th className="px-6 py-4">Aluno / Plano</th>
                    <th className="px-6 py-4 text-center">Data Emissão</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="4" className="py-20 text-center text-app-muted font-medium">Carregando contratos...</td></tr>
                  ) : filteredContracts.length === 0 ? (
                    <tr><td colSpan="4" className="py-20 text-center text-app-muted font-medium">Nenhum contrato encontrado</td></tr>
                  ) : filteredContracts.map(contract => (
                    <tr key={contract.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <Signature size={16} />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-app group-hover:text-primary transition-colors">{contract.studentName}</span>
                              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{contract.plan}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-400">
                        {contract.issuedAt ? new Date(contract.issuedAt).toLocaleDateString('pt-BR') : '--'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyle(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20" title="Ver Link">
                              <Eye size={14} />
                           </button>
                           <button className="p-2 rounded-lg bg-app-bg text-app-muted hover:text-app transition-all border border-white/5">
                              <Send size={14} />
                           </button>
                           <button className="p-2 rounded-lg bg-app-bg text-app-muted hover:text-app transition-all border border-white/5">
                              <MoreVertical size={14} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
      </div>
    </>
  )
}

