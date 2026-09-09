import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import html2pdf from 'html2pdf.js'
import { 
  X, FileText, ChevronDown, Search, Calendar, 
  Printer, Layout, Users, DollarSign, Check, Trash2, Download, RefreshCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useModalities } from '../../hooks/useModalities'
import { usePaymentReport } from '../../hooks/usePaymentReport'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { useAuth } from '../../context/AuthContext'

const R$ = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const formatReportDate = (date) => (date ? String(date) : '-')

/**
 * Seletor Customizado Premium (Reutilizado do padrão AddStudentModal)
 */
function CustomSelect({ label, value, onChange, options, disabled, placeholder = '...' }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o[0] === value)

  return (
    <div className={`flex flex-col gap-1.5 relative w-full ${isOpen ? 'z-[500]' : 'z-10'}`} ref={ref}>
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`form-input bg-black opacity-100 h-[54px] text-sm px-6 text-gray-300 font-medium text-left flex justify-between items-center w-full disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-2xl transition-all hover:bg-[#080808] focus:ring-1 focus:ring-white/20 ${isOpen ? 'ring-1 ring-primary/50 border-primary/50' : ''}`}
      >
        <span className="truncate font-bold">{selectedOption ? selectedOption[1] : placeholder}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0B0B0B] opacity-100 border border-white/10 rounded-2xl z-[600] overflow-hidden shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => { onChange(v); setIsOpen(false) }}
              className={`w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider transition-colors hover:bg-white/5 border-b border-white/[0.02] last:border-0 ${value === v ? 'text-primary bg-primary/5' : 'text-gray-400'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Visualização do Relatório para Impressão - Versão SIMPLES para PDF
 */
function SimpleReportView({ data, filters, modalities }) {
  const now = new Date()
  const genDate = now.toLocaleDateString('pt-BR')
  const genTime = now.toLocaleTimeString('pt-BR')

  const filterModality = filters.modalityId ? modalities?.find(m => m.id === filters.modalityId)?.name : 'Todas'

  return (
    <div style={{ background: 'white', color: 'black', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .report-container { padding: 0 !important; width: 100% !important; max-width: none !important; box-shadow: none !important; }
          table { page-break-inside: auto; width: 100% !important; border-collapse: collapse !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .page-break { page-break-before: always; }
          .report-header { margin-bottom: 20px; padding-bottom: 10px; }
          .group-header { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
          .text-primary { color: #000 !important; }
          .bg-primary\\/5 { background-color: transparent !important; }
          .border-white\\/5, .border-white\\/10 { border-color: #ddd !important; }
          .text-gray-400, .text-gray-500, .text-gray-600 { color: #333 !important; }
          .status-paid { color: #059669 !important; font-weight: bold; }
          .status-overdue { color: #dc2626 !important; font-weight: bold; }
          .status-pending { color: #f43f5e !important; font-weight: bold; }
        }
      `}</style>

      {/* Cabeçalho do Relatório */}
      <div className="report-header flex justify-between items-start mb-4 pb-4 border-b-2 border-gray-900">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Relatório de Pagamentos</h1>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-600">Filtro: {filterModality}</p>
          </div>
        </div>  
        <div className="text-right">
          <p className="text-[9px] uppercase font-black text-gray-500">Gerado em: {genDate} às {genTime}</p>
        </div>
      </div>

      {/* Totais no Topo */}
      <div className="mb-8 pt-4 border-t-4 border-gray-900">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Pago</p>
            <p className="text-lg font-black text-emerald-600">{R$(data.totalPaid)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Pendente</p>
            <p className="text-lg font-black text-amber-600">{R$(data.totalPending)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Atrasado</p>
            <p className="text-lg font-black text-rose-600">{R$(data.totalOverdue)}</p>
          </div>
          <div className="bg-gray-900 p-3 rounded-xl text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Geral</p>
            <p className="text-xl font-black text-white">{R$(data.totalAmount)}</p>
          </div>
        </div>
      </div>

      {!data.modalities || data.modalities.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhum dado encontrado com os filtros aplicados</p>
        </div>
      ) : (
        <div className="space-y-10">
          {data.modalities.map((mod, mIdx) => (
            <div key={mod.name} className="modality-group">
              <div className="group-header bg-gray-50 px-4 py-3 border-l-4 border-gray-900 mb-4 flex justify-between items-center">
                <h2 className="text-sm font-black uppercase tracking-widest">{mod.name}</h2>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-gray-500 mr-4">SUBTOTAL:</span>
                  <span className="text-sm font-black">{R$(mod.totalAmount)}</span>
                </div>
              </div>

              {mod.turmas.map((turma, tIdx) => (
                <div key={turma.name} className="turma-section mb-6 ml-4">
                  <div className="flex items-center gap-3 mb-3 border-b border-gray-100 pb-1">
                    <Users size={12} className="text-gray-400" />
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-700">{turma.name}</h3>
                    <div className="flex-1" />
                    <span className="text-[10px] font-bold text-gray-400">{R$(turma.totalAmount)}</span>
                  </div>

<table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 text-[8px] font-black uppercase tracking-widest">
                        <th className="text-center py-2 px-1 w-1/3">Aluno</th>
                        <th className="text-center py-2 px-1">Pagamento</th>
                        <th className="text-center py-2 px-1">Vencimento</th>
                        <th className="text-center py-2 px-1">Confirmado por</th>
                        <th className="text-center py-2 px-1">Valor</th>
                        <th className="text-center py-2 px-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turma.bills.map((bill, bIdx) => (
                        <tr key={bill.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-1 text-center font-bold">{bill.studentName}</td>
                          <td className="py-2 px-1 text-center font-mono">{formatReportDate(bill.reportPaidAt || bill.paidAt)}</td>
                          <td className="py-2 px-1 text-center font-mono">{formatReportDate(bill.reportDueDate || bill.dueDate)}</td>
                          <td className="py-2 px-1 text-center text-emerald-600 font-medium text-xs">
                            {bill.paidBy || '-'}
                          </td>
                          <td className="py-2 px-1 text-center font-black">{R$(bill.amount)}</td>
                          <td className="py-2 px-1 text-center uppercase font-black text-[8px]">
                            <span className={
                              bill.status === 'paid' ? 'status-paid text-emerald-600' : 
                              bill.status === 'overdue' ? 'status-overdue text-rose-600' : 
                              'status-pending text-rose-600'
                            }>
                              {bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end gap-6 mt-2 text-[8px] font-black uppercase tracking-widest text-gray-400">
                    <span>Pago: {R$(turma.totalPaid)}</span>
                    <span>Pendente: {R$(turma.totalPending)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PaymentReportModal({ isOpen, onClose }) {
  const { userData } = useAuth()
  const { modalities, loading: loadingModalities } = useModalities()
  const { groupedData, filters, updateFilters, resetFilters, loading } = usePaymentReport()
  const [isMobile, setIsMobile] = useState(false)
  const [step, setStep] = useState('filters')

  useHideMobileNav(isOpen)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isOpen) setStep('filters')
  }, [isOpen])

  const statusOptions = [
    ['', 'Todas Situações'],
    ['paid', 'Pago'],
    ['pending', 'Pendente'],
    ['overdue', 'Atrasado'],
  ]
  const periodTypeOptions = [
    ['payment', 'Data de Pagamento'],
    ['due', 'Data de Vencimento'],
  ]

  const modalityOptions = [
    ['', 'Todas Modalidades'],
    ...(modalities || []).map(m => [m.id, m.name])
  ]

  // Opções de turmas filtradas pela modalidade selecionada
  const filteredTurmas = useMemo(() => {
    if (!filters.modalityId) return []
    const mod = modalities?.find(m => m.id === filters.modalityId)
    return (mod?.turmas || []).map(t => [t.id, t.name])
  }, [filters.modalityId, modalities])

  const turmaOptions = [
    ['', 'Todas as Turmas'],
    ...filteredTurmas
  ]

  const handleOpenReport = () => {
    if (loading) {
      alert('Aguarde, carregando dados...')
      return
    }

    if (!groupedData || groupedData.count === 0) {
      alert('Nenhum dado encontrado para visualizar o relatório.')
      return
    }

    const filterModality = filters.modalityId 
      ? modalities?.find(m => m.id === filters.modalityId)?.name 
      : 'Todas'

    const now = new Date()
    const genDate = now.toLocaleDateString('pt-BR')
    const genTime = now.toLocaleTimeString('pt-BR')
    const userName = userData?.nome || userData?.name || 'Sistema'

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Pagamentos - ${genDate}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            background: #e5e5e5; 
            min-height: 100vh;
            padding: 20px;
          }
          .actions-bar {
            text-align: center;
            margin-bottom: 20px;
          }
          .btn-print {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 15px rgba(220,38,38,0.3);
            transition: all 0.3s;
          }
          .btn-print:hover {
            background: #b91c1c;
            transform: scale(1.02);
          }
          .btn-print:active {
            transform: scale(0.98);
          }
          .actions-bar p {
            margin-top: 12px;
            font-size: 11px;
            color: #888;
            font-family: Arial, sans-serif;
          }
          .actions-bar kbd {
            background: #333;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: monospace;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            background: white;
            margin: 0 auto;
            padding: 5px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          }
          .header {
            display: flex;
            justify-content: space-between;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .header .subtitle { font-size: 10px; color: #666; margin-top: 5px; }
          .header-right { text-align: right; }
          .header-right p { font-size: 9px; color: #666; }
          .header-right .meta { font-size: 10px; margin-top: 5px; }
          .modality-block { margin-bottom: 25px; }
          .modality-header {
            background: #f5f5f5;
            padding: 10px 15px;
            border-left: 4px solid #000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .modality-header h2 { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .modality-header span { font-size: 14px; font-weight: bold; }
          .turma-section { margin-left: 15px; margin-bottom: 20px; }
          .turma-header {
            border-bottom: 1px solid #ddd;
            padding: 8px 0;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .turma-header span:first-child { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; }
          .turma-header span:last-child { margin-left: auto; font-size: 10px; color: #999; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { 
            background: #f0f0f0; 
            padding: 8px 5px; 
            text-align: left; 
            font-weight: bold; 
            text-transform: uppercase; 
            font-size: 8px; 
            color: #666;
            border-bottom: 1px solid #ccc;
          }
          td { padding: 8px 5px; border-bottom: 1px solid #eee; }
          .status-paid { color: #059669; font-weight: bold; }
          .status-pending { color: #d97706; font-weight: bold; }
          .status-overdue { color: #dc2626; font-weight: bold; }
          .totals-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 3px solid #000;
          }
          .total-box { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
          .total-box.dark { background: #111; color: white; }
          .total-box label { font-size: 8px; text-transform: uppercase; color: #666; }
          .total-box .value { font-size: 16px; font-weight: bold; margin-top: 5px; }
          .total-box.dark .value { color: white; }
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            font-size: 8px;
            color: #999;
            display: flex;
            justify-content: space-between;
            text-transform: uppercase;
          }
          @media print {
            body { background: white; padding: 0; }
            .page { box-shadow: none; margin: 0; }
            .actions-bar { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="actions-bar">
          <button class="btn-print" onclick="window.print()">
            🖨️ IMPRIMIR / SALVAR COMO PDF
          </button>
          <p>Clique no botão acima ou pressione <kbd>Ctrl+P</kbd> (ou <kbd>Cmd+P</kbd> no Mac) para salvar como PDF</p>
        </div>
        <div class="page">
          <div class="header">
            <div>
              <h1>Relatório de Pagamentos</h1>
              <p class="subtitle">Filtro: ${filterModality}</p>
            </div>
            <div class="header-right">
              <p>Gerado em: ${genDate} às ${genTime}</p>
              <p class="meta">Por: ${userName}</p>
            </div>
          </div>

          <!-- Totais no Topo -->
          <div class="totals-grid" style="margin-bottom:30px;padding-top:15px;border-top:3px solid #000;">
            <div class="total-box">
              <label>Total Pago</label>
              <div class="value" style="color:#059669;">${R$(groupedData.totalPaid)}</div>
            </div>
            <div class="total-box">
              <label>Total Pendente</label>
              <div class="value" style="color:#d97706;">${R$(groupedData.totalPending)}</div>
            </div>
            <div class="total-box">
              <label>Total Atrasado</label>
              <div class="value" style="color:#dc2626;">${R$(groupedData.totalOverdue)}</div>
            </div>
            <div class="total-box dark">
              <label style="color:#999;">Total Geral</label>
              <div class="value">${R$(groupedData.totalAmount)}</div>
            </div>
          </div>
    `

    if (!groupedData.modalities || groupedData.modalities.length === 0) {
      html += '<p style="text-align:center;color:#666;padding:60px;">Nenhum dado encontrado com os filtros aplicados</p>'
    } else {
      groupedData.modalities.forEach(mod => {
        html += `
          <div class="modality-block">
            <div class="modality-header">
              <h2>${mod.name}</h2>
              <span>${R$(mod.totalAmount)}</span>
            </div>
        `
        
mod.turmas.forEach(turma => {
          html += `
            <div class="turma-section">
              <div class="turma-header">
                <span>${turma.name}</span>
                <span>${R$(turma.totalAmount)}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="text-align:center;">Aluno</th>
                    <th style="text-align:center;">Pagamento</th>
                    <th style="text-align:center;">Vencimento</th>
                    <th style="text-align:center;">Confirmado por</th>
                    <th style="text-align:center;">Valor</th>
                    <th style="text-align:center;">Status</th>
                  </tr>
                </thead>
                <tbody>
          `
          
          turma.bills.forEach(bill => {
            const statusClass = bill.status === 'paid' ? 'status-paid' : bill.status === 'overdue' ? 'status-overdue' : 'status-pending'
            const statusLabel = bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'
            
            html += `
              <tr>
                <td style="text-align:center;font-weight:bold;">${bill.studentName || '-'}</td>
                <td style="text-align:center;">${formatReportDate(bill.reportPaidAt || bill.paidAt)}</td>
                <td style="text-align:center;">${formatReportDate(bill.reportDueDate || bill.dueDate)}</td>
                <td style="text-align:center;color:#059669;">${bill.paidBy || '-'}</td>
                <td style="text-align:center;font-weight:bold;">${R$(bill.amount)}</td>
                <td style="text-align:center;" class="${statusClass}">${statusLabel}</td>
              </tr>
            `
          })
          
          html += `
                </tbody>
              </table>
            </div>
          `
        })
        
        html += '</div>'
      })
    }

    html += `
          </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
    } else {
      alert('Permita pop-ups para visualizar o relatório.')
    }
  }

  if (!isOpen) return null

  // TELA DE FILTROS (MODAL PADRÃO)
  return (
    <>
      {createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop z-[1001]" 
      onClick={onClose} 
    >
      <motion.div 
        layout
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.5 }}
        onClick={e => e.stopPropagation()} 
        className="fixed z-[1002] bg-[#0A0A0A] border border-white/10 shadow-2xl flex flex-col overflow-hidden
                   inset-x-0 bottom-0 h-[95vh] rounded-t-[32px]
                   sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:w-full sm:h-auto sm:max-h-[90vh] sm:rounded-[32px]"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* CABEÇALHO */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <FileText className="text-rose-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                {step === 'preview' ? 'Visualizar Relatório' : 'Relatórios'}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                {step === 'preview' ? 'Folha A4 - role para visualizar todo conteúdo' : 'Personalize os filtros para exportação'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar scroll-smooth">
          {/* Seção Principal */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
              Filtros de Estrutura
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomSelect 
                label="Modalidade" 
                value={filters.modalityId} 
                onChange={v => updateFilters('modalityId', v)} 
                options={modalityOptions} 
                disabled={loadingModalities} 
                placeholder="Todas Modalidades" 
              />
              <CustomSelect 
                label="Turma" 
                value={filters.turmaId} 
                onChange={v => updateFilters('turmaId', v)} 
                options={turmaOptions} 
                disabled={!filters.modalityId}
                placeholder={filters.modalityId ? "Todas Turmas" : "Selecione Modalidade..."} 
              />
            </div>
          </div>

          {/* Filtros Financeiros */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
              Filtros Financeiros
              <div className="h-px flex-1 bg-white/5" />
            </h3>

            <CustomSelect 
              label="Situação do Pagamento" 
              value={filters.status} 
              onChange={v => updateFilters('status', v)} 
              options={statusOptions} 
            />

            <CustomSelect
              label="Campo do Período"
              value={filters.periodType}
              onChange={v => updateFilters('periodType', v)}
              options={periodTypeOptions}
            />
          </div>

          {/* Período */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
              Período
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">De</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    type="date" 
                    value={filters.startDate} 
                    onChange={e => updateFilters('startDate', e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Até</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    type="date" 
                    value={filters.endDate} 
                    onChange={e => updateFilters('endDate', e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW DO RELATÓRIO */}
          {step === 'preview' && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                Visualização do Relatório
                <div className="h-px flex-1 bg-white/5" />
              </h3>
              
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 overflow-auto max-h-[60vh]">
                <div className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-2xl">
                  <SimpleReportView 
                    data={groupedData} 
                    filters={filters} 
                    modalities={modalities} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-6 md:p-8 bg-[#0d0d0d] border-t border-white/5 flex gap-4 shrink-0">
          {step === 'preview' ? (
            <button 
              onClick={() => setStep('filters')} 
              className="w-full py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
            >
              ← Voltar aos Filtros
            </button>
          ) : (
            <>
              <button 
                onClick={resetFilters} 
                className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Limpar
              </button>
              <button 
                onClick={handleOpenReport} 
                disabled={loading} 
                className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
              >
                <FileText size={16} /> Visualizar Relatório
              </button>
            </>
          )}
        </div>
</motion.div>
    </motion.div>, 
    document.body
  )}
    </>
  )
}
