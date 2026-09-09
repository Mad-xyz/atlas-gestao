// RESUMO: Painel central exclusivo para o Super Administrador (Dono da Plataforma Atlas Academy).
// Permite visualizar todas as academias/organizações cadastradas, estatísticas globais e logs de auditoria.
import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  ExternalLink,
  Search,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'

export default function PainelSuperAdmin() {
  const { userData } = useAuth()
  const [organizacoes, setOrganizacoes] = useState([])
  const [logsAuditoria, setLogsAuditoria] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [termoBusca, setTermoBusca] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('organizacoes') // 'organizacoes' | 'auditoria'

  /**
   * Carrega os dados globais das academias e logs de auditoria
   */
  const carregarDadosGlobais = async () => {
    setCarregando(true)
    try {
      // 1. Busca todas as organizações
      const colecaoOrgs = collection(db, 'organizacoes')
      const snapshotOrgs = await getDocs(colecaoOrgs)
      const listaOrgs = snapshotOrgs.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      setOrganizacoes(listaOrgs)

      // 2. Busca os últimos logs do sistema para auditoria
      try {
        const consultaLogs = query(
          collection(db, 'logs_sistema'),
          orderBy('criadoEm', 'desc'),
          limit(20)
        )
        const snapshotLogs = await getDocs(consultaLogs)
        const listaLogs = snapshotLogs.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        setLogsAuditoria(listaLogs)
      } catch (erroLogs) {
        console.warn('Aviso: Coleção de logs_sistema vazia ou sem permissão de ordenação direta:', erroLogs)
      }
    } catch (erro) {
      console.error('Erro ao carregar dados do Super Admin:', erro)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDadosGlobais()
  }, [])

  // Filtragem de organizações por nome ou ID
  const organizacoesFiltradas = organizacoes.filter((org) => {
    const nome = (org.nome || org.name || org.id || '').toLowerCase()
    const responsavel = (org.responsavel || org.ownerEmail || '').toLowerCase()
    const termo = termoBusca.toLowerCase()
    return nome.includes(termo) || responsavel.includes(termo)
  })

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 animate-entrance">
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest">
              Acesso Mestre
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Claim Ativo
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase">
            Visão Geral da Plataforma
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Bem-vindo, <strong className="text-white">{userData?.nome || 'Dono'}</strong>. Gestão centralizada de todas as academias clientes.
          </p>
        </div>

        <button
          onClick={carregarDadosGlobais}
          disabled={carregando}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} />
          Atualizar Dados
        </button>
      </div>

      {/* Cartões de Indicadores Gerais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Academias */}
        <div className="p-5 rounded-2xl bg-[#121212]/80 border border-white/5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Academias</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{organizacoes.length}</span>
            <span className="text-xs text-emerald-400 font-medium">cadastradas</span>
          </div>
        </div>

        {/* Nível de Acesso */}
        <div className="p-5 rounded-2xl bg-[#121212]/80 border border-white/5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Permissão Atual</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">Super Admin</span>
          </div>
        </div>

        {/* Status da Plataforma */}
        <div className="p-5 rounded-2xl bg-[#121212]/80 border border-white/5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Status do Sistema</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">Operacional</span>
          </div>
        </div>

        {/* Total de Auditorias */}
        <div className="p-5 rounded-2xl bg-[#121212]/80 border border-white/5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Logs Registrados</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{logsAuditoria.length}</span>
            <span className="text-xs text-gray-400 font-medium">recentes</span>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setAbaAtiva('organizacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            abaAtiva === 'organizacoes'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Academias Clientes ({organizacoes.length})
        </button>
        <button
          onClick={() => setAbaAtiva('auditoria')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            abaAtiva === 'auditoria'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Auditoria & Logs ({logsAuditoria.length})
        </button>
      </div>

      {/* Conteúdo da Aba 1: Lista de Organizações */}
      {abaAtiva === 'organizacoes' && (
        <div className="space-y-4">
          {/* Barra de Busca */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar academia por nome ou ID..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#121212]/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Tabela de Organizações */}
          <div className="bg-[#121212]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-white/5 text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/5">
                  <tr>
                    <th className="py-3.5 px-4">Academia / Organização</th>
                    <th className="py-3.5 px-4">ID do Sistema</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Plano</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {carregando ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500">
                        <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                        <p>Carregando lista de academias...</p>
                      </td>
                    </tr>
                  ) : organizacoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500">
                        Nenhuma academia encontrada com os critérios informados.
                      </td>
                    </tr>
                  ) : (
                    organizacoesFiltradas.map((org) => (
                      <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-semibold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                            {(org.nome || org.name || org.id).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-bold">{org.nome || org.name || 'Sem nome'}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{org.responsavelEmail || org.email || 'E-mail não informado'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] text-gray-400">
                          {org.id}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Ativa
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-300 font-medium">
                          {org.plano || 'Standard'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-[10px] text-gray-500 font-mono">
                            Multi-tenant
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Auditoria e Logs */}
      {abaAtiva === 'auditoria' && (
        <div className="bg-[#121212]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Últimos Eventos Críticos Registrados
          </h2>

          {logsAuditoria.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">
              Nenhum log crítico registrado recentemente.
            </p>
          ) : (
            <div className="space-y-3">
              {logsAuditoria.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-start justify-between gap-4 text-xs font-mono"
                >
                  <div>
                    <span className="text-primary font-bold">[{log.tipo || 'SISTEMA'}]</span>{' '}
                    <span className="text-gray-300">{log.descricao || JSON.stringify(log)}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {log.criadoEm?.toDate ? log.criadoEm.toDate().toLocaleString('pt-BR') : 'Recente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
