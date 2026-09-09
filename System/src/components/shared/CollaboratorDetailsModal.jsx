import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, Phone, Shield, Calendar, Key, Loader2, Users, Smartphone, CheckCircle2, User, AlertCircle, HeartPulse, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { useSystemUsers } from '../../hooks/useSystemUsers'
import { useAttendanceAlerts } from '../../hooks/useAttendanceAlerts'
import { beltConfig } from '../../data/beltConfig'
import { COLLECTIONS, FIELDS } from '../../firebase/collections'
import { motion, AnimatePresence } from 'framer-motion'
import { formatBR } from '../../utils/dateUtils'


export default function CollaboratorDetailsModal({ collaborator, onClose, onEdit }) {
  useHideMobileNav(!!collaborator)
  const { userData, isAdmin, isGestor } = useAuth()
  const { fetchUserPin } = useSystemUsers()
  const [pin, setPin] = useState(collaborator?.pin || null)
  const [adminPin, setAdminPin] = useState(collaborator?.adminPin || null)
  const [loadingPin, setLoadingPin] = useState(false)

  // 🛡️ Permissões robustas: Admin Super (all) vê tudo, outros dependem da permissão explícita
  const hasGlobalAccess = userData?.permissions?.all === true || userData?.permissões?.all === true
  const canSeeStaff = hasGlobalAccess || userData?.permissions?.viewStaffPins === true || (isAdmin && userData?.permissions?.viewStaffPins !== false);

  useEffect(() => {
    if (collaborator && !collaborator.pin && canSeeStaff) {
      const loadPin = async () => {
        setLoadingPin(true)
        const p = await fetchUserPin(collaborator.id)
        setPin(p)
        setLoadingPin(false)
      }
      loadPin()
    } else if (collaborator?.pin) {
      setPin(collaborator.pin)
    }

    if (collaborator?.adminPin) {
      setAdminPin(collaborator.adminPin)
    }
  }, [collaborator, canSeeStaff, fetchUserPin])


  // 🔄 Mapeamento Flexível de Dados (Padronizado com Aluno)
  const name = collaborator.nome || collaborator.name;
  const email = collaborator.email;
  const phone = collaborator.telefone || collaborator[FIELDS?.TELEFONE] || collaborator.telefone_completo || collaborator.phone || '';
  const status = collaborator.status || 'Ativo';
  const createdAt = collaborator.createdAt || collaborator.criadoEm;
  const updatedAt = collaborator.updatedAt || collaborator.atualizadoEm;
  const roles = collaborator.papeis || collaborator.roles || {};
  
  // Dados de Graduação / Aluno
  const jt = collaborator.jornada_tecnica || {};
  const belt = collaborator.belt || jt.faixa_atual;
  const stripes = collaborator.stripes !== undefined ? collaborator.stripes : jt.graus_atuais;
  const modality = collaborator.modality || collaborator.modalidade;
  const modalities = collaborator.modalities || (collaborator.modalidade ? [collaborator.modalidade] : []);
  
  const ageCategory = collaborator.ageCategory || collaborator.categoria || 'ADULTO';
  const gender = collaborator.gender || collaborator.sexo;
  const emergency = collaborator.emergency || collaborator.contato_emergencia;
  const medical = collaborator.medical || collaborator.restricoes_medicas;
  const isPaymentExempt = collaborator.isPaymentExempt || collaborator.isBolsista;
  const planValue = collaborator.planValue || collaborator.valor_plano;
  const lastAttendanceAt = collaborator.lastAttendanceAt || collaborator.ultima_presenca;

  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const beltKey = belt || 'none';
  const bgClass = beltConfig[beltKey]?.bgClass || 'belt-none'
  const textColor = beltConfig[beltKey]?.textColor || '#E5E7EB'
  const primaryMod = modality || modalities[0]

  const formatDate = (d) => formatBR(d, {}, true)

  const roleLabels = {
    admin: 'Administrador',
    gestor: 'Gestor(a)',
    professor: 'Professor(a)',
    aluno: 'Aluno(a)'
  }

  const roleStyles = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    gestor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    professor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    aluno: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }

  const primaryRole = roles.admin ? 'admin' : roles.gestor ? 'gestor' : roles.professor ? 'professor' : 'aluno'

  return createPortal(
    <motion.div 
      key="collaborator-details-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop z-[1000]" 
      onClick={onClose}
    >
      <motion.div 
        key="collaborator-details-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="modal-content modal-content-bottom-sheet relative max-w-2xl w-full flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* CABEÇALHO PREMIUM FIXO (Padronizado com Aluno) */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <Users size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                Perfil da Equipe
              </h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                Acesso de Gestão
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
          {/* Header Info (Padronizado com Aluno) */}
          <div className="flex items-center gap-6">
            <div className={`w-[100px] h-[100px] shrink-0 rounded-full flex items-center justify-center font-black text-3xl shadow-2xl ring-4 ring-white/5 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 ${collaborator.photoURL || collaborator.photo ? '' : bgClass}`} style={{ color: collaborator.photoURL || collaborator.photo ? 'inherit' : textColor }}>
              {collaborator.photoURL || collaborator.photo ? (
                <img src={collaborator.photoURL || collaborator.photo} alt={name} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl md:text-3xl font-black text-white truncate leading-tight tracking-tight">{name}</p>
              
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.1em] ${roleStyles[primaryRole]}`}>
                  {roleLabels[primaryRole] || primaryRole.toUpperCase()}
                </span>
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.1em] ${status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {status}
                </span>
                {primaryMod && (
                  <span className="text-[9px] font-black px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 uppercase tracking-[0.1em] bg-white/5">
                    {primaryMod}
                  </span>
                )}
                <span className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 uppercase tracking-[0.1em]">
                  {ageCategory?.toUpperCase() || 'ADULTO'}
                </span>
                <span className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 uppercase tracking-[0.1em]">
                  {gender === 'Masculino' ? 'MASC' : 'FEM'}
                </span>
                {belt && belt !== 'none' && (
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.1em] ${bgClass}`} style={{ color: textColor }}>
                    {beltConfig[belt]?.label?.toUpperCase() || belt?.toUpperCase()} {stripes ? `· ${stripes} GRAUS` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info (Labels Atualizadas) */}
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
            </div>
          </div>

          {/* Emergency & Health */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
              Emergência e Saúde
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 bg-red-500/[0.02] p-5 rounded-2xl border border-red-500/10">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Contato de Emergência</p>
                  <p className="text-sm text-white font-bold mt-0.5">{emergency || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 bg-emerald-500/[0.02] p-5 rounded-2xl border border-emerald-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <HeartPulse size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Restrições Médicas</p>
                    <p className="text-sm text-white font-medium mt-1 whitespace-pre-wrap leading-relaxed">
                      {medical || 'Nenhuma restrição informada/conhecida.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Segurança */}
          {canSeeStaff && (
             <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                Segurança e Credenciais
                <div className="h-px flex-1 bg-white/5" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PIN de Acesso (Geral/Aluno) */}
                <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${roles.admin ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-500/5 border-emerald-500/10 md:col-span-2'}`}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Key size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">PIN de Aluno</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xl text-emerald-400 font-mono tracking-[0.3em] font-black">
                        {loadingPin ? <Loader2 size={16} className="animate-spin" /> : (pin || '---')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PIN Administrativo (Apenas se for Admin) */}
                {roles.admin && (
                  <div className="flex items-center gap-4 bg-primary/5 p-5 rounded-2xl border border-primary/20 animate-in slide-in-from-right-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] text-primary/60 uppercase font-black tracking-widest">PIN Administrativo</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xl text-primary font-mono tracking-[0.3em] font-black">
                          {loadingPin ? <Loader2 size={16} className="animate-spin" /> : (adminPin || '---')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Desde</p>
                  <p className="text-sm text-white font-bold">{formatDate(collaborator.startDate || createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Última atualização</p>
                  <p className="text-sm text-white font-bold">{formatDate(updatedAt)}</p>
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
