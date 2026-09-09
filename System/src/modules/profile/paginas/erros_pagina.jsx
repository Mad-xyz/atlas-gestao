/**
 * Página de Logs de Erros
 * URL: /erros
 * Acesso: apenas admin
 * Visual: Lista de erros com detalhes
 */
import React, { useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useSystemLogs } from '../../../hooks/usarLogsSistema'

// Formatar data/hora
function formatarDataHora(data) {
  if (!data) return ''
  const d = new Date(data)
  return d.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Tempo relativo
function tempoRelativo(data) {
  if (!data) return ''
  const d = new Date(data)
  const agora = new Date()
  const diffMs = agora - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}min`
  if (diffHoras < 24) return `${diffHoras}h`
  if (diffDias < 7) return `${diffDias}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// Card de erro individual
function CardErro({ log }) {
  const [expandido, setExpandido] = useState(false)

  return (
    <div 
      className="group bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] hover:border-red-500/20 transition-all cursor-pointer"
      onClick={() => setExpandido(!expandido)}
    >
      <div className="flex items-start gap-3">
        {/* Ícone de erro */}
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={18} className="text-red-500" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Título e tempo */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-red-400 truncate">
              {log.nomeLog || log.titulo || log['action'] || log.acao || ''}
            </h3>
            <span className="text-[10px] text-gray-600 whitespace-nowrap">
              {tempoRelativo(log.criadoEm || log['createdAt'])}
            </span>
          </div>

          {/* Detalhe do erro */}
          <p className="text-xs text-gray-500 font-mono line-clamp-2">
            {log.detalhe || log['detail'] || ''}
          </p>

          {/* Informações do usuário */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
            <span className="text-[9px] uppercase tracking-wider text-gray-600">Usuário:</span>
            <span className="text-xs text-gray-400">{log.usuarioNome || log['userName'] || ''}</span>
            {(log.usuarioPapel || log['userRole']) && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-500 uppercase">
                {log.usuarioPapel || log['userRole']}
              </span>
            )}
          </div>

          {/* Timestamp completo quando expandido */}
          {expandido && (
            <div className="text-[10px] text-gray-700 font-mono mt-2 pt-2 border-t border-white/5">
              {formatarDataHora(log.criadoEm || log['createdAt'])}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Página principal de erros
export default function ErrosPagina() {
  const { logs, loading } = useSystemLogs('error', 100)
  const erros = logs.filter(l => l.tipo === 'error')

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider">Logs de Erros</h1>
            <p className="text-xs text-gray-500">Registro de erros e exceções do sistema</p>
          </div>
        </div>
      </div>

      {/* Lista de erros */}
      <div className="max-w-4xl mx-auto space-y-3">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-gray-500" />
            <p className="text-gray-600 text-sm">Carregando erros...</p>
          </div>
        ) : erros.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <AlertCircle size={28} strokeWidth={1.9} className="text-emerald-500" />
            </div>
            <p className="text-gray-400 text-sm font-medium">Nenhum erro registrado</p>
            <p className="text-gray-600 text-xs">O sistema está funcionando perfeitamente</p>
          </div>
        ) : (
          erros.map(log => (
            <CardErro key={log.id} log={log} />
          ))
        )}
      </div>
    </div>
  )
}