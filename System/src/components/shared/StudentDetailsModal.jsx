import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, Phone, AlertCircle, HeartPulse, Calendar, Edit2, Save, Users, Smartphone, AlertTriangle, Key, Loader2, Info } from 'lucide-react'
import { beltConfig } from '../../data/beltConfig'
import { useAttendanceAlerts } from '../../hooks/useAttendanceAlerts'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { useSystemUsers } from '../../hooks/useSystemUsers'
import { motion } from 'framer-motion'
import { formatBR } from '../../utils/dateUtils'


// Status de Assiduidade removido conforme solicitado
  



export default function StudentDetailsModal({ student, onClose, onEdit }) {
  useHideMobileNav(!!student)
  const { userData, isAdmin, isGestor } = useAuth()
  const { fetchUserPin } = useSystemUsers()
  const [pin, setPin] = useState(student?.pin || null)
  const [loadingPin, setLoadingPin] = useState(false)

  const canSeePIN = isAdmin || isGestor || userData?.permissions?.viewStudentPins

  useEffect(() => {
    if (student && !student.pin && canSeePIN) {
      const loadPin = async () => {
        setLoadingPin(true)
        const p = await fetchUserPin(student.id)
        setPin(p)
        setLoadingPin(false)
      }
      loadPin()
    } else if (student?.pin) {
      setPin(student.pin)
    }
  }, [student, canSeePIN, fetchUserPin])


  const name = student.nome || student.name;
  const {
    email, phone, modality, modalities = [],
    isVisitor, createdAt, lastAttendanceAt, belt, stripes, ageCategory, gender
  } = student;

  const normalizedBelt = belt?.toLowerCase()?.trim() || 'white'
  const bgClass = beltConfig[normalizedBelt]?.bgClass || 'belt-white'
  const textColor = beltConfig[normalizedBelt]?.textColor || '#111111'
  
  // Combina 'modality' e 'modalities' num único array sem repetições
  const allMods = Array.from(new Set([
    ...(modality ? [modality] : []),
    ...(Array.isArray(modalities) ? modalities : (typeof modalities === 'string' ? modalities.split(',').map(m=>m.trim()) : []))
  ])).filter(Boolean);
  
  const formatDate = (d) => formatBR(d, {}, true)


  return createPortal(
    <motion.div 
      key="student-details-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop" 
      onClick={onClose}
    >
      <motion.div 
        key="student-details-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="modal-content modal-content-bottom-sheet relative max-w-2xl w-full flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* CABEÇALHO PREMIUM FIXO */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <Users size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                Perfil do Aluno
                {isVisitor && <span className="ml-3 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md border border-blue-500/30 uppercase font-black tracking-widest">VISITANTE</span>}
              </h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                Matrícula Ativa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10 border border-white/5">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
          {/* Header Info */}
          <div className="flex items-center gap-6">
            <div className={`w-[100px] h-[100px] shrink-0 rounded-full flex items-center justify-center font-black text-3xl shadow-2xl ring-4 ring-white/5 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 relative ${student.photo ? '' : bgClass}`} style={{ color: student.photo ? 'inherit' : textColor }}>
              {student.photo ? (
                <img src={student.photo} alt={student.nome || student.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                student.initials || (student.nome || student.name)?.charAt(0) || 'A'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl md:text-3xl font-black text-white truncate leading-tight tracking-tight">{name}</p>
              
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {allMods.length > 0 ? (
                  allMods.map((mod, idx) => (
                    <span key={idx} className="text-[9px] font-black px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 uppercase tracking-[0.1em]" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {mod}
                    </span>
                  ))
                ) : (
                  <div className="relative group flex items-center justify-center cursor-help mt-1">
                    <div className="flex items-center justify-center text-rose-500 bg-rose-500/10 w-8 h-8 rounded-xl border border-rose-500/20">
                      <AlertTriangle size={16} />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none z-50 flex flex-col items-center">
                      <div className="bg-[#111] border border-white/10 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                        Sem Modalidade
                      </div>
                      <div className="w-2 h-2 bg-[#111] border-b border-r border-white/10 transform rotate-45 -mt-1.5"></div>
                    </div>
                  </div>
                )}
                <span className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 uppercase tracking-[0.1em]">
                  {ageCategory?.toUpperCase() || 'ADULTO'}
                </span>
                <span className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 uppercase tracking-[0.1em]">
                  {gender === 'Masculino' ? 'MASC' : gender === 'Feminino' ? 'FEM' : (gender || 'NÃO INFORMADO')}
                </span>
                {(!allMods.length || !allMods.every(m => m.toLowerCase().trim() === 'boxe')) && (
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.1em] ${bgClass}`} style={{ color: textColor }}>
                    {beltConfig[belt]?.label?.toUpperCase() || belt?.toUpperCase() || 'SEM FAIXA'} {stripes ? `· ${stripes} GRAUS` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
              Informações de Contato
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.04]">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                  <Mail size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">E-mail</p>
                  <p className="text-sm text-white truncate font-bold font-mono mt-0.5">{email || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.04]">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400/60">
                  <Phone size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Telefone</p>
                  <p className="text-sm text-white truncate font-bold font-mono mt-0.5">{phone || 'Não informado'}</p>
                </div>
              </div>

              {(ageCategory === 'Kids' || ageCategory === 'Juvenil') && (
                <>
                  <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.04]">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                      <Users size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Responsável</p>
                      <p className="text-sm text-white truncate font-bold mt-0.5">{student.parentName || 'Não informado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.04]">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                      <Smartphone size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Tel. Responsável</p>
                      <p className="text-sm text-white truncate font-bold font-mono mt-0.5">{student.parentPhone || 'Não informado'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Medical & Emergency */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
              Emergência e Saúde
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 bg-red-500/[0.02] p-5 rounded-2xl border border-red-500/10 shadow-inner transition-all hover:bg-red-500/[0.04]">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Contato de Emergência</p>
                  <p className="text-sm text-white font-bold mt-0.5">{student.emergency || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 bg-emerald-500/[0.02] p-5 rounded-2xl border border-emerald-500/10 shadow-inner transition-all hover:bg-emerald-500/[0.04]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <HeartPulse size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Restrições Médicas</p>
                    <p className="text-sm text-white font-medium mt-1 whitespace-pre-wrap leading-relaxed">{student.medical || 'Nenhuma restrição informada/conhecida.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Anotações Internas */}
          {student.observacoes && student.observacoes.trim() !== '' && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                Anotações Internas
                <div className="h-px flex-1 bg-white/5" />
              </h3>
              <div className="flex flex-col gap-4 bg-primary/[0.02] p-5 rounded-2xl border border-primary/10 shadow-inner transition-all hover:bg-primary/[0.04]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Info size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Notas do Perfil</p>
                    <p className="text-sm text-white font-medium mt-1 whitespace-pre-wrap leading-relaxed">{student.observacoes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Segurança */}
          {canSeePIN && !isVisitor && (
             <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                Segurança e Credenciais
                <div className="h-px flex-1 bg-white/5" />
              </h3>
              <div className="flex items-center gap-4 bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Key size={20} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">PIN de Acesso Pessoal</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xl text-emerald-400 font-mono tracking-[0.3em] font-black">
                      {loadingPin ? <Loader2 size={16} className="animate-spin" /> : (pin || '---')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PIN removido de Assiduidade - agora no menu de perfil */}

          {/* Atividade */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
              Atividade no Sistema
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            <div className="flex items-center gap-5 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                <Calendar size={20} />
              </div>
              <div className="flex-1 flex justify-between gap-6">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Início na Academia</p>
                  <p className="text-sm text-white font-bold">{formatDate(student.startDate || createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Última aula</p>
                  <p className="text-sm text-white font-bold">{formatDate(lastAttendanceAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-[#0d0d0d] border-t border-white/5 flex gap-4 shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
          >
            Fechar Perfil
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

