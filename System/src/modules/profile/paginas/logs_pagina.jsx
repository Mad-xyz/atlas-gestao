/**
 * PÁGINA DE LOGS DE ATIVIDADE
 * URL: /logs
 * Acesso: admin, gestor, professor
 *
 * TUDO EM PORTUGUÊS:
 * - Campos: usuarioNome, usuarioPapel, usuarioAvatar, titulo, detalhe, acao, etc.
 * - Visibilidade: gestor/professor não veem ações de admin (filtro no hook)
 * - Avatar do usuário que executou a ação
 * - Cores por ação (criar=verde, editar=azul, excluir=vermelho, pagar=ouro)
 * - Scroll infinito sem recarregar tudo
 * - Detalhes expandidos com valorAntigo → valorNovo
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  Activity, RefreshCw, User, ChevronDown,
  Plus, Edit3, Trash2, DollarSign, ToggleRight, CheckCircle, Play
} from 'lucide-react'
import { useSystemLogs } from '../../../hooks/usarLogsSistema'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../../context/AuthContext'

/**
 * GERA INICIAIS DO NOME PARA AVATAR FALLBACK
 */
function gerarIniciais(nome) {
  if (!nome) return '?'
  return nome
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * CALCULA COR DO AVATAR BASEADA NO NOME (hash simples)
 */
function corDoAvatar(nome) {
  const cores = [
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-blue-500 to-cyan-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500',
    'from-violet-500 to-purple-500',
    'from-sky-500 to-indigo-500',
    'from-lime-500 to-green-500'
  ]
  let hash = 0
  for (let i = 0; i < (nome || '').length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  return cores[Math.abs(hash) % cores.length]
}

// ─── CONFIGURAÇÕES DE COR POR AÇÃO ───────────────────────────────────────────

const CORES_ACAO = {
  criar:    { cor: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', icone: Plus,        label: 'CRIOU' },
  editar:   { cor: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    icone: Edit3,       label: 'EDITOU' },
  excluir:  { cor: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25',     icone: Trash2,      label: 'EXCLUIU' },
  pagar:    { cor: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   icone: DollarSign,  label: 'PAGOU' },
  alterar_status: { cor: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25', icone: ToggleRight, label: 'ALTEROU' },
  finalizar:{ cor: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', icone: CheckCircle, label: 'FINALIZOU' },
}

const ACAO_PADRAO = { cor: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/25', icone: Activity, label: 'AÇÃO' }

// ─── CORES POR PAPEL ─────────────────────────────────────────────────────────

const CORES_PAPEL = {
  admin:     'text-purple-400 bg-purple-500/10 border-purple-500/25',
  gestor:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  professor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  aluno:     'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  sistema:   'text-gray-400 bg-gray-500/10 border-gray-500/25',
}

// ─── INFO POR CATEGORIA ──────────────────────────────────────────────────────

const INFO_CATEGORIA = {
  aluno:     { label: 'ALUNO',      cor: 'text-cyan-400' },
  chamada:   { label: 'CHAMADA',    cor: 'text-green-400' },
  financeiro:{ label: 'FINANCEIRO', cor: 'text-emerald-400' },
  evento:    { label: 'EVENTO',     cor: 'text-blue-400' },
  equipe:    { label: 'EQUIPE',     cor: 'text-pink-400' },
  sistema:   { label: 'SISTEMA',    cor: 'text-gray-400' },
}

/**
 * COMPONENTE: CardLog
 * Card individual de log com avatar, ação, detalhes e expansão.
 */
function CardLog({ log }) {
  const [expandido, setExpandido] = useState(false)

  // Dados do log (campos em português + compatibilidade legada)
  const {
    acao = '',
    titulo = '',
    detalhe = log.detalhe || log['detail'] || '',
    usuarioNome = log.usuarioNome || log['userName'] || 'Sistema',
    usuarioPapel = log.usuarioPapel || log['userRole'] || 'sistema',
    usuarioAvatar = log.usuarioAvatar || log['userAvatar'] || '',
    categoria = log.categoria || log['category'] || 'sistema',
    alvoNome = log.alvoNome || log['targetName'] || '',
    valorAntigo = log.valorAntigo ?? log['oldValue'] ?? null,
    valorNovo = log.valorNovo ?? log['newValue'] ?? null,
    criadoEm = log.criadoEm || log['createdAt'] || null
  } = log

  // Estilos baseados na ação
  const estiloAcao = CORES_ACAO[acao] || ACAO_PADRAO
  const IconeAcao = estiloAcao.icone

  // Estilo do papel
  const estiloPapel = CORES_PAPEL[usuarioPapel] || CORES_PAPEL.sistema

  // Info da categoria
  const infoCat = INFO_CATEGORIA[categoria] || INFO_CATEGORIA.sistema

  /**
   * FORMATA TEMPO RELATIVO
   */
  const tempoRelativo = (data) => {
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

  /**
   * FORMATA DATA/HORA COMPLETA
   */
  const formatarDataHora = (data) => {
    if (!data) return ''
    const d = new Date(data)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      className="group relative bg-white/[0.025] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer overflow-hidden"
      onClick={() => setExpandido(!expandido)}
    >
      {/* Barra lateral colorida por ação */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${estiloAcao.bg.replace('/10', '/30')}`} />

      <div className="pl-3 flex flex-col gap-3">
        {/* Linha 1: Categoria + tempo relativo */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">{infoCat.label}</span>
          <span className="text-[10px] text-gray-600 font-medium">{tempoRelativo(criadoEm)}</span>
        </div>

        {/* Linha 2: Avatar + Título combinado com alvo */}
        <div className="flex items-start gap-3">
          {/* Avatar do usuário */}
          <div className="shrink-0 mt-0.5">
            {usuarioAvatar ? (
              <img
                src={usuarioAvatar}
                alt={usuarioNome}
                className="w-9 h-9 rounded-full object-cover border-2 border-white/10"
              />
            ) : (
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${corDoAvatar(usuarioNome)} flex items-center justify-center text-[10px] font-black text-white`}>
                {gerarIniciais(usuarioNome)}
              </div>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            {/* Título + alvo combinados: "Excluiu aluno kdsfhjjf" */}
            <h3 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
              <span className={`w-4 h-4 rounded ${estiloAcao.bg} inline-flex items-center justify-center mr-1.5 align-middle`}>
                <IconeAcao size={10} className={estiloAcao.cor} />
              </span>
              {titulo}{alvoNome ? ` ${alvoNome}` : ''}
            </h3>

            {/* Detalhe expandido: "Usuário madson editou: nome, modalidade, telefone" */}
            {expandido && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400">
                  <span className="text-gray-500">Usuário</span>{' '}
                  <span className="font-semibold text-gray-300">{usuarioNome}</span>
                  {' '}{estiloAcao.label.toLowerCase()}{detalhe ? `: ${detalhe}` : ''}
                </p>

                {/* Valor Antigo → Novo */}
                {valorAntigo !== null && valorNovo !== null && (
                  <div className="flex items-center gap-2 text-xs bg-white/[0.03] rounded-xl px-3 py-2">
                    <span className="text-red-400 line-through">{valorAntigo}</span>
                    <ChevronDown size={10} className="text-gray-600 -rotate-90 shrink-0" />
                    <span className="text-emerald-400 font-bold">{valorNovo}</span>
                  </div>
                )}

                {/* Timestamp completo */}
                <div className="text-[10px] text-gray-700 font-mono">
                  {formatarDataHora(criadoEm)}
                </div>
              </div>
            )}
          </div>

          {/* Seta expansão */}
          <ChevronDown
            size={16}
            className={`text-gray-700 transition-transform duration-200 shrink-0 mt-1 ${expandido ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Footer com nome + role */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${estiloPapel}`}>
            {usuarioPapel}
          </span>
          <span className="text-xs text-gray-500 font-medium truncate">
            {usuarioNome}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * PÁGINA PRINCIPAL DE LOGS
 */
export default function LogsPagina() {
  const containerRef = useRef(null)
  const sentinelRef = useRef(null)
  const { logs, loading, carregandoMais, temMais, carregarMais } = useSystemLogs('activity', 100)

  // Scroll infinito com IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !carregandoMais && temMais) {
          carregarMais()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(sentinelRef.current)

    return () => observer.disconnect()
  }, [loading, carregandoMais, temMais, carregarMais])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Activity size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider">Logs de Atividade</h1>
            <p className="text-xs text-gray-500">Registro de todas as ações no sistema</p>
          </div>
        </div>

        {/* Legenda de cores */}
        <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider">
          {Object.entries(CORES_ACAO).map(([chave, estilo]) => {
            const Icone = estilo.icone
            return (
              <span key={chave} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${estilo.bg} ${estilo.cor}`}>
                <Icone size={10} />
                {estilo.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Lista de logs */}
      <div ref={containerRef} className="max-w-4xl mx-auto space-y-3">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-gray-500" />
            <p className="text-gray-600 text-sm">Carregando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <Activity size={32} strokeWidth={1.9} className="text-gray-600" />
            <p className="text-gray-500 text-sm font-medium">Nenhum registro de atividade</p>
            <p className="text-gray-700 text-xs">As ações realizadas aparecerão aqui</p>
          </div>
        ) : (
          <>
            {logs.map(log => (
              <CardLog key={log.id} log={log} />
            ))}

            {/* Sentinela para scroll infinito */}
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {carregandoMais ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-xs">Carregando mais...</span>
                </div>
              ) : temMais ? (
                <p className="text-xs text-gray-700">Role para carregar mais registros</p>
              ) : logs.length > 0 ? (
                <p className="text-xs text-gray-700">Todos os registros carregados</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
