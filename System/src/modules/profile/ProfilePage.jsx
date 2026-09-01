import React, { useState, useRef, useEffect } from 'react'
import {
  User, Shield, Bell, Database, Palette, Info, LogOut,
  ChevronRight, Edit2, Camera, Dumbbell, Activity,
  KeyRound, CheckCircle2, Moon, Monitor, X, Save,
  AlertTriangle, AlertCircle, Clock, Users, UserCog,
  GraduationCap, Crown, Plus, Trash2, Eye, EyeOff,
  ArrowLeft, QrCode, ChevronLeft, Settings, Award, RefreshCw,
  Mail, Phone, Calendar, HeartPulse, UserCheck, ShieldCheck
} from 'lucide-react'
import { beltConfig } from '../../data/beltConfig'
import { modalities } from '../../data/modalities'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSystemUsers } from '../../hooks/useSystemUsers'
import { useSystemLogs } from '../../hooks/usarLogsSistema'
import { useTheme, THEMES } from '../../context/ThemeContext'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { formatPhoneUI, parsePhoneData } from '../../utils/phoneUtils'
import { formatBR } from '../../utils/dateUtils'
import HistoryDrawer from '../../components/profile/HistoryDrawer'

// ── Ícones de role ──────────────────────────────────────────────
const roleConfig = {
  admin: { label: 'ADMINISTRADOR', icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25' },
  gestor: { label: 'GESTOR', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  professor: { label: 'PROFESSOR', icon: UserCog, color: 'text-primary', bg: 'bg-primary/10 border-primary/25' },
  aluno: { label: 'ALUNO', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25' },
  desenvolvedor: { label: 'DESENVOLVEDOR', icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25' },
  dono: { label: 'DONO', icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25' },
}

// ── Seções da sidebar ───────────────────────────────────────────
const SECTIONS = [
  {
    group: 'Meu perfil',
    items: [
      { id: 'conta', icon: User, label: 'Minha conta' },
      { id: 'seguranca', icon: KeyRound, label: 'Senha & acesso' },
      { id: 'notificacoes', icon: Bell, label: 'Notificações' },
      { id: 'aparencia', icon: Palette, label: 'Aparência' },
    ],
  },
  {
    group: 'Sistema',
    items: [
      { id: 'usuarios', icon: Users, label: 'Usuários' },
      { id: 'academia', icon: Dumbbell, label: 'Academia' },
      { id: 'dados', icon: Database, label: 'Dados & Backup' },
      { id: 'logs', icon: Activity, label: 'Logs de atividade' },
      { id: 'erros', icon: AlertCircle, label: 'Logs de erros' },
    ],
  },
  {
    group: 'Info',
    items: [
      { id: 'sobre', icon: Info, label: 'Sobre o sistema' },
    ],
  },
]

// ════════════════════════════════════════════════════════════════
//  COMPONENTES AUXILIARES PARA A CONTA
// ════════════════════════════════════════════════════════════════
function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-gray-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-medium text-white">{value || '—'}</span>
    </div>
  )
}

function EditableRow({ label, field, value, icon: Icon, onEdit, editing, fieldValue, setFieldValue, onSave, onCancel, saving, type = 'text', isSelect = false, options = [] }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3 w-1/3">
        <Icon size={16} className="text-gray-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      </div>
      
      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          {isSelect ? (
            <select value={fieldValue} onChange={e => setFieldValue(e.target.value)} className="bg-black border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none">
              <option value="">Selecione...</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input type={type} value={fieldValue} onChange={e => setFieldValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSave()} className="bg-black border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none text-right w-full max-w-[200px]" autoFocus />
          )}
          <button onClick={onSave} disabled={saving} className="text-emerald-400 hover:text-emerald-300 p-1 bg-emerald-500/10 rounded-md transition-colors"><CheckCircle2 size={16} /></button>
          <button onClick={onCancel} className="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded-md transition-colors"><X size={16} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{type === 'date' && value ? formatBR(value, {}, true) : (value || '—')}</span>
          <button onClick={onEdit} className="text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1">
            <Edit2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  PAINEL: MINHA CONTA
// ════════════════════════════════════════════════════════════════
function SectionConta({ user, authUser, activeRole, onUpdateProfile }) {
  const [editingField, setEditingField] = useState(null)
  const [fieldValue, setFieldValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Estados compostos para edição da graduação
  const [gradEdit, setGradEdit] = useState({ belt: '', degree: 0, date: '', modality: '' })

  const isGestor = ['admin', 'gestor', 'dono', 'desenvolvedor'].includes(activeRole)

  const startEdit = (field, current) => { 
    setEditingField(field) 
    setFieldValue(current || '') 
  }
  const cancelEdit = () => setEditingField(null)

  const saveField = async () => {
    setSaving(true)
    try { 
      if (editingField === 'modality') {
         await onUpdateProfile({ modalities: [fieldValue] })
      } else {
         await onUpdateProfile({ [editingField]: fieldValue }) 
      }
    }
    finally { setSaving(false); setEditingField(null) }
  }

  const startGradEdit = () => {
    setEditingField('graduacao')
    setGradEdit({
      belt: user?.jiuJitsu?.belt || 'white',
      degree: user?.jiuJitsu?.degree || 0,
      date: user?.jiuJitsu?.lastGraduation || '',
      modality: user?.modalities?.[0] || 'Jiu-Jitsu'
    })
  }

  const saveGraduacao = async () => {
    setSaving(true)
    try {
      const historyItem = {
        belt: gradEdit.belt,
        degree: gradEdit.degree,
        date: gradEdit.date,
        modality: gradEdit.modality,
        timestamp: new Date().toISOString()
      }

      // Evita duplicatas se nada mudou
      const currentBelt = user?.jiuJitsu?.belt || 'white'
      const currentDegree = user?.jiuJitsu?.degree || 0
      const currentDate = user?.jiuJitsu?.lastGraduation || ''
      const currentMod = user?.modalities?.[0] || 'Jiu-Jitsu'
      
      let newHistory = user?.jiuJitsu?.history || []
      
      if (currentBelt !== gradEdit.belt || currentDegree !== gradEdit.degree || currentDate !== gradEdit.date || currentMod !== gradEdit.modality) {
         // Atualiza histórico apenas se os dados cruciais de faixa mudaram
         if (currentBelt !== gradEdit.belt || currentDegree !== gradEdit.degree) {
           newHistory = [...newHistory, historyItem]
         }
      }

      const updates = {
        jiuJitsu: {
          ...user?.jiuJitsu,
          belt: gradEdit.belt,
          degree: gradEdit.degree,
          lastGraduation: gradEdit.date,
          history: newHistory
        }
      }
      
      // Apenas o gestor atualiza a modalidade pelo form de graduação
      if (isGestor && gradEdit.modality !== currentMod) {
        updates.modalities = [gradEdit.modality]
      }

      await onUpdateProfile(updates)
    } finally {
      setSaving(false)
      setEditingField(null)
    }
  }

  const initials = (user?.name || 'M').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const currentBeltKey = user?.jiuJitsu?.belt || user?.belt || 'white'
  const currentBeltLabel = beltConfig[currentBeltKey]?.label || currentBeltKey
  const currentModality = user?.modalities?.[0] || user?.modality || 'Jiu-Jitsu'

  return (
    <div className="space-y-6">
      {/* HEADER DO PERFIL (Inspirado no layout da imagem) */}
      <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-xl bg-gradient-to-r from-white/[0.02] to-white/[0.05]">
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
            {/* AVATAR */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-primary/20 border-4 border-[#1a1a1a]" style={{ background: 'linear-gradient(135deg, var(--clr-primary-dark), var(--clr-primary))' }}>
                {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" alt="Avatar" /> : initials}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full text-black shadow-md border border-gray-200 hover:scale-105 transition-transform" onClick={() => startEdit('name', user?.name)}>
                <Edit2 size={10} strokeWidth={3} />
              </button>
            </div>

            {/* INFO CABEÇALHO */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">{user?.name || 'Nome do Atleta'}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentBeltLabel}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/5 text-[10px] font-bold text-gray-300 uppercase shadow-inner">{currentModality}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-colors shrink-0 active:scale-95"
          >
            <Clock size={14} /> HISTÓRICO
          </button>
        </div>
      </div>

      {/* INFORMAÇÕES PESSOAIS */}
      <Section title={<div className="flex items-center gap-2"><User size={14} className="text-gray-400" /> INFORMAÇÕES PESSOAIS</div>}>
        <InfoRow label="ID ATLETA" value={authUser?.uid || user?.id} icon={QrCode} />
        <InfoRow label="E-MAIL" value={user?.email} icon={Mail} />
        <EditableRow label="TELEFONE" field="phone" value={user?.phone || user?.telefone} icon={Phone} onEdit={() => startEdit('phone', user?.phone || user?.telefone)} editing={editingField === 'phone'} fieldValue={fieldValue} setFieldValue={setFieldValue} onSave={saveField} onCancel={cancelEdit} saving={saving} />
        <EditableRow label="NASCIMENTO" field="birthDate" value={user?.birthDate || user?.nascimento} icon={Calendar} onEdit={() => startEdit('birthDate', user?.birthDate || user?.nascimento)} editing={editingField === 'birthDate'} fieldValue={fieldValue} setFieldValue={setFieldValue} onSave={saveField} onCancel={cancelEdit} saving={saving} type="date" />
        <EditableRow label="SEXO" field="gender" value={user?.gender} icon={User} onEdit={() => startEdit('gender', user?.gender)} editing={editingField === 'gender'} fieldValue={fieldValue} setFieldValue={setFieldValue} onSave={saveField} onCancel={cancelEdit} saving={saving} isSelect options={['Masculino', 'Feminino', 'Outro']} />
      </Section>

      {/* MODALIDADE */}
      <Section title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2"><Dumbbell size={14} className="text-gray-400" /> MODALIDADE</div>
        </div>
      }>
        {editingField === 'modality' ? (
          <div className="px-6 py-4 flex gap-4 items-center bg-white/[0.02]">
            <select value={fieldValue} onChange={e => setFieldValue(e.target.value)} className="bg-black border border-white/10 rounded-md px-4 py-2 text-sm text-white focus:border-primary focus:outline-none flex-1">
              <option value="">Selecione...</option>
              {modalities.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={saveField} disabled={saving} className="btn-primary px-4 py-2 rounded-md text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Salvar</button>
            <button onClick={cancelEdit} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-md transition-colors"><X size={16} /></button>
          </div>
        ) : (
          <div className="px-6 py-5 flex items-center justify-between group">
            <span className="text-sm font-medium text-white uppercase">{currentModality}</span>
            {isGestor && (
              <button onClick={() => startEdit('modality', currentModality)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-light flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
                <Edit2 size={12} /> Editar
              </button>
            )}
          </div>
        )}
      </Section>

      {/* GRADUAÇÃO */}
      <Section title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-primary"><Award size={14} /> GRADUAÇÃO</div>
          {!editingField && (
            <button onClick={startGradEdit} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
              <Edit2 size={12} /> EDITAR
            </button>
          )}
        </div>
      }>
        {editingField === 'graduacao' ? (
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Faixa</label>
                <select disabled={!isGestor} value={gradEdit.belt} onChange={e => setGradEdit({...gradEdit, belt: e.target.value})} className="w-full bg-black border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                  {Object.entries(beltConfig).map(([id, cfg]) => <option key={id} value={id}>{cfg.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Grau</label>
                <select value={gradEdit.degree} onChange={e => setGradEdit({...gradEdit, degree: parseInt(e.target.value) || 0})} className="w-full bg-black border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none">
                  {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}º Grau</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Modalidade</label>
                <select disabled={!isGestor} value={gradEdit.modality} onChange={e => setGradEdit({...gradEdit, modality: e.target.value})} className="w-full bg-black border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                  {modalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Data da Graduação</label>
                <input type="date" value={gradEdit.date} onChange={e => setGradEdit({...gradEdit, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-md px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
              <button onClick={cancelEdit} className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all">Cancelar</button>
              <button onClick={saveGraduacao} disabled={saving} className="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-black/20 rounded-xl p-5 flex items-center gap-5 border border-white/5 shadow-inner">
               <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center shadow-md border border-white/5 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20" style={{ background: beltConfig[currentBeltKey]?.color || '#fff' }} />
                 <Award size={24} color={beltConfig[currentBeltKey]?.color || '#fff'} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-white">{currentBeltLabel} {user?.jiuJitsu?.degree ? `- ${user.jiuJitsu.degree}º Grau` : ''}</h3>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{currentModality}</p>
               </div>
            </div>
            
            {(user?.jiuJitsu?.history && user.jiuJitsu.history.length > 0) && (
              <div className="mt-8">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-white/10" /> Histórico de Graduações
                </h4>
                <div className="space-y-1">
                  {[...user.jiuJitsu.history].sort((a, b) => new Date(b.date) - new Date(a.date)).map((hist, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-3 text-sm font-bold text-white">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: beltConfig[hist.belt]?.color || '#888' }} />
                        {beltConfig[hist.belt]?.label || hist.belt} {hist.degree ? `- ${hist.degree}º Grau` : ''}
                      </div>
                      <div className="text-[11px] text-gray-500 font-bold tracking-widest bg-black/40 px-3 py-1 rounded-md border border-white/5">{hist.date ? formatBR(hist.date, {}, true) : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── History Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {historyOpen && (
          <HistoryDrawer
            userId={authUser?.uid || user?.id}
            userName={user?.name}
            userBelt={user?.jiuJitsu?.belt || user?.belt}
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


// ════════════════════════════════════════════════════════════════
//  PAINEL: PIN & ACESSO
// ════════════════════════════════════════════════════════════════
function SectionSeguranca({ user, onChangePassword, activityLogs }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [status, setStatus] = useState(null) // null | 'ok' | 'err'
  const [errMsg, setErrMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Filtra apenas o histórico deste usuário (Segurança de Dados)
  const myLogs = (activityLogs || []).filter(l => 
    l.action === 'Login' && 
    (l.userName === user?.name || l.userId === user?.id || l.userId === user?.uid)
  ).slice(0, 5)

  // Validação: apenas números e máximo 6 dígitos
  const handlePinInput = (setter) => (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6)
    setter(cleaned)
  }

  const handleUpdate = async () => {
    if (next.length !== 6) { 
      setStatus('err'); 
      setErrMsg('O PIN deve ter exatamente 6 dígitos numéricos'); 
      return 
    }
    if (next !== confirm) { 
      setStatus('err'); 
      setErrMsg('Os PINs não coincidem'); 
      return 
    }
    
    setLoading(true); setStatus(null)
    try {
      // onChangePassword no useSystemUsers já sincroniza Firestore e Firebase Auth
      await onChangePassword(current, next)
      setStatus('ok'); setCurrent(''); setNext(''); setConfirm('')
    } catch (e) {
      console.error('Erro na atualização do PIN:', e)
      setStatus('err')
      // Detecta bloqueio por AdBlock ou falta de rede
      if (!window.navigator.onLine || e.message?.includes('network') || e.code?.includes('network')) {
        setErrMsg('Erro de conexão ou bloqueio do navegador (AdBlock). Verifique suas extensões.')
      } else {
        setErrMsg(e.code === 'auth/wrong-password' ? 'PIN atual incorreto' : 'Erro ao atualizar. Verifique sua conexão.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <Section title="Segurança da Conta">
        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-col gap-4">
            <FormInput 
              label="Senha/PIN Atual" 
              value={current} 
              onChange={(v) => setCurrent(v.slice(0, 6))} 
              type={showPwd ? 'text' : 'password'} 
              placeholder="Digite sua senha ou PIN atual"
            />
            <FormInput 
              label="Novo PIN (Exatamente 6 dígitos)" 
              value={next} 
              onChange={handlePinInput(setNext)} 
              type={showPwd ? 'text' : 'password'} 
              placeholder="Ex: 123456"
            />
            <FormInput 
              label="Confirmar Novo PIN" 
              value={confirm} 
              onChange={handlePinInput(setConfirm)} 
              type={showPwd ? 'text' : 'password'} 
              placeholder="Repita o novo PIN"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button 
              onClick={() => setShowPwd(v => !v)} 
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />} {showPwd ? 'Ocultar' : 'Mostrar'} PIN
            </button>
            <button 
              onClick={handleUpdate} 
              disabled={loading || current.length < 6 || next.length < 6 || confirm.length < 6}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-40"
            >
              {loading ? 'Salvando...' : 'Atualizar PIN'}
            </button>
          </div>

          {status === 'ok' && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-[11px] text-emerald-400 font-bold uppercase">PIN atualizado com sucesso!</p>
            </div>
          )}

          {status === 'err' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <p className="text-[11px] text-red-400 font-bold uppercase">{errMsg}</p>
            </div>
          )}
        </div>
      </Section>

      <Section title="Histórico de Acesso">
        <div className="divide-y divide-white/5">
          {myLogs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <ShieldCheck size={32} className="text-gray-700 mx-auto mb-2 opacity-20" />
              <p className="text-gray-600 text-xs uppercase font-bold tracking-widest">Nenhum login recente</p>
            </div>
          ) : (
            myLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Smartphone size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{log.detalhe || 'Dispositivo Autorizado'}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{log.ip || 'Localização não identificada'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <LogTime date={log.criadoEm} />
                  <p className="text-[8px] text-emerald-500 font-black uppercase tracking-tighter mt-0.5">Ativo</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  PAINEL: USUÁRIOS DO SISTEMA
// ════════════════════════════════════════════════════════════════
function SectionUsuarios({ users, onAddUser, onUpdateUser, onDeleteUser, onSync }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmExit, setShowConfirmExit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // State for created PIN

  // -- Form States --
  const initialFormState = {
    name: '',
    role: 'professor',
    cpf: '',
    gender: '',
    email: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Ativo',
    healthInfo: '',
    modalities: [],
    jiuJitsu: { belt: 'white', stripes: 0, lastGraduation: '' }
  }

  const [form, setForm] = useState(initialFormState)

  const updateForm = (updates) => {
    setForm(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleToggleModality = (m) => {
    const next = form.modalities.includes(m)
      ? form.modalities.filter(x => x !== m)
      : [...form.modalities, m]
    updateForm({ modalities: next })
  }

  const handleCloseForm = () => {
    if (hasChanges) {
      setShowConfirmExit(true)
    } else {
      setShowAdd(false)
      setEditingId(null)
      resetForm()
    }
  }

  const resetForm = () => {
    setForm(initialFormState)
    setHasChanges(false)
    setErrors([])
    setEditingId(null)
  }

  const handleAdd = async () => {
    const newErrors = []
    if (!form.name.trim()) newErrors.push('name')
    if (!form.cpf.trim()) newErrors.push('cpf')
    if (!form.gender) newErrors.push('gender')
    if (!form.email.trim()) newErrors.push('email')

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setTimeout(() => setErrors([]), 3000)
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        // 📱 Processamento do Telefone para edição
        const phoneData = parsePhoneData(form.phone)
        const updates = { ...form }
        if (phoneData) {
          updates.phone = phoneData.display
          updates.ddd = phoneData.ddd
          updates.telefone_limpo = phoneData.telefone_limpo
          updates.telefone_completo = phoneData.telefone_completo
        }
        await onUpdateUser(editingId, updates, form.role)
        resetForm()
        setShowAdd(false)
      } else {
        // 📱 Processamento do Telefone para criação
        const phoneData = parsePhoneData(form.phone)
        if (!phoneData) {
          setErrors(['phone'])
          return
        }

        const payload = {
          ...form,
          phone: phoneData.display,
          ddd: phoneData.ddd,
          telefone_limpo: phoneData.telefone_limpo,
          telefone_completo: phoneData.telefone_completo,
          createdAt: new Date().toISOString()
        }
        const res = await onAddUser(payload)
        setResult(res)
      }
    } catch (err) {
      console.error("Save error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (u) => {
    setForm({
      ...initialFormState,
      ...u,
      jiuJitsu: { ...initialFormState.jiuJitsu, ...(u.jiuJitsu || {}) }
    })
    setEditingId(u.id)
    setShowAdd(true)
    setHasChanges(false)
  }

  const handleDelete = async (userId, role) => {
    if (window.confirm('Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.')) {
      try {
        await onDeleteUser(userId, role)
      } catch (err) {
        console.error("Delete error:", err)
      }
    }
  }

  // Formatting helpers
  const formatDate = (d) => {
    try {
      return formatBR(d, {}, true)
    } catch (e) {
      return '—'
    }
  }

  const formatCPF = (val) => {
    const numbers = val.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
      .slice(0, 14)
  }

  const formatPhone = (val) => formatPhoneUI(val)

  const isJiuJitsu = form.modalities.some(m => m.toLowerCase().includes('jiu'))

  return (
    <div className="space-y-8">

      {/* HEADER + ACTION */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Equipe & Colaboradores</h3>
          <p className="text-xs text-gray-500 mt-1">Gerencie permissões e acessos de todos os usuários do sistema.</p>
        </div>
        {!showAdd && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (window.confirm('Executar sincronização profunda? Isso alinhará todos os IDs de usuários e permissões.')) {
                  try {
                    const stats = await onSync()
                    alert(`Sincronização concluída!\n\nAlunos: ${stats.students}\nEquipe: ${stats.collaborators}\nCorrigidos: ${stats.merged || 0}`)
                  } catch (e) {
                    alert('Erro na sincronização: ' + e.message)
                  }
                }
              }}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-md flex items-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw size={16} /> Sincronizar Base
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={16} />
              Adicionar Membro
            </button>
          </div>
        )}
      </div>

      {/* FORM ADICIONAR (REFACTORADO) */}
      {showAdd && (
        <div className="rounded-xl p-6 space-y-8 bg-[#0a0a0a] border border-white/10 shadow-2xl ring-1 ring-white/5">

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <UserCog size={18} /> {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h4>
            <button onClick={handleCloseForm} className="text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <FormInput
                label="Nome Completo *"
                value={form.name}
                onChange={(val) => updateForm({ name: val })}
                placeholder="Ex: Roberto Silva"
                error={errors.includes('name')}
              />
            </div>

            <div className="space-y-2">
              <FormInput
                label="CPF *"
                value={form.cpf}
                onChange={(val) => updateForm({ cpf: formatCPF(val) })}
                placeholder="000.000.000-00"
                error={errors.includes('cpf')}
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 pl-1">Sexo *</p>
              <select
                value={form.gender}
                onChange={(e) => updateForm({ gender: e.target.value })}
                className={`w-full bg-white/5 border rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all ${errors.includes('gender') ? 'border-primary shadow-[0_0_10px_rgba(225,29,72,0.2)] animate-pulse' : 'border-white/10'}`}
              >
                <option value="" className="bg-[#111]">Selecione...</option>
                <option value="Masculino" className="bg-[#111]">Masculino</option>
                <option value="Feminino" className="bg-[#111]">Feminino</option>
                <option value="Outro" className="bg-[#111]">Outro</option>
              </select>
              {errors.includes('gender') && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, x: [-2, 2, -2, 2, 0] }} className="text-[9px] text-primary font-black uppercase tracking-widest ml-1">Obrigatório</motion.p>}
            </div>
          </div>

          {/* CONTATO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              <div className="h-px flex-1 bg-white/5" />
              <span>Contato</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormInput
                label="Email *"
                value={form.email}
                onChange={(val) => updateForm({ email: val })}
                placeholder="roberto@email.com"
                error={errors.includes('email')}
              />
              <FormInput label="Telefone" value={form.phone} onChange={(val) => updateForm({ phone: formatPhone(val) })} placeholder="91 99999-9999" />
            </div>
          </div>

          {/* CADASTRO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              <div className="h-px flex-1 bg-white/5" />
              <span>Cadastro & Saúde</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormInput label="Data Inicial" type="date" value={form.startDate} onChange={(val) => updateForm({ startDate: val })} />
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 pl-1">Estado</p>
                <div className="flex bg-white/5 p-1 rounded-md border border-white/10">
                  <button onClick={() => updateForm({ status: 'Ativo' })} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${form.status === 'Ativo' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-white'}`}>Ativo</button>
                  <button onClick={() => updateForm({ status: 'Inativo' })} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${form.status === 'Inativo' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}>Inativo</button>
                </div>
              </div>
              <FormInput label="Doença ou Medicação" value={form.healthInfo} onChange={(val) => updateForm({ healthInfo: val })} placeholder="Opcional..." />
            </div>
          </div>

          {/* MODALIDADES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              <div className="h-px flex-1 bg-white/5" />
              <span>Modalidades e Cargo</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cargo Selection */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Cargo no Sistema</p>
                <div className="flex flex-wrap gap-2">
                  {['admin', 'gestor', 'professor'].map(r => {
                    const cfg = roleConfig[r]
                    return (
                      <button key={r} onClick={() => updateForm({ role: r })}
                        className={`px-4 py-3 rounded-md text-xs font-bold border transition-all flex items-center gap-2 ${form.role === r ? 'bg-white border-white text-black' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'}`}>
                        <cfg.icon size={14} /> {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Modality Selection */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Modalidades Ensinadas</p>
                <div className="flex flex-wrap gap-2">
                  {modalities.map(m => (
                    <button key={m} onClick={() => handleToggleModality(m)}
                      className={`px-4 py-3 rounded-md text-xs font-bold border transition-all flex items-center gap-2 ${form.modalities.includes(m) ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'}`}>
                      {m.toLowerCase().includes('jiu') ? <Award size={14} /> : <Dumbbell size={14} />} {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* JIU JITSU SPECIFIC FIELDS */}
          {isJiuJitsu && (
            <div className="rounded-xl p-6 bg-primary/5 border border-primary/20 space-y-5 animate-in zoom-in-95 duration-300">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                🥋 Informações de Jiu Jitsu
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1 pl-1">Faixa</p>
                  <select
                    value={form.jiuJitsu.belt}
                    onChange={(e) => updateForm({ jiuJitsu: { ...form.jiuJitsu, belt: e.target.value } })}
                    className="w-full bg-black border border-primary/30 rounded-md px-4 py-3 text-sm text-white"
                  >
                    {Object.entries(beltConfig).map(([id, cfg]) => (
                      <option key={id} value={id} className="bg-[#111]">{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <FormInput
                  label="Grau (0-4)"
                  type="number"
                  value={form.jiuJitsu.degree}
                  onChange={(val) => updateForm({ jiuJitsu: { ...form.jiuJitsu, degree: parseInt(val) || 0 } })}
                />
                <FormInput
                  label="Última Graduação"
                  type="date"
                  value={form.jiuJitsu.lastGraduation}
                  onChange={(val) => updateForm({ jiuJitsu: { ...form.jiuJitsu, lastGraduation: val } })}
                />
              </div>
            </div>
          )}

          {/* SAVE / CANCEL BUTTONS */}
          <div className="flex gap-3 pt-4">
            <button onClick={handleCloseForm} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-md transition-all border border-white/5 active:scale-95">
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-[2] py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black rounded-md transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Gravando...' : editingId ? 'Atualizar Colaborador' : 'Salvar Colaborador'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM EXIT MODAL (CUSTOM ALERT) */}
      <AnimatePresence>
        {showConfirmExit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmExit(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-[420px] bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 bg-white/5 border-b border-white/10 justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fechar documento</span>
                <X size={16} className="text-gray-600 cursor-pointer hover:text-white" onClick={() => setShowConfirmExit(false)} />
              </div>
              <div className="p-8 flex gap-6 items-start">
                <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <AlertTriangle className="text-primary" size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white leading-tight">Alterações não salvas</h4>
                  <p className="text-sm text-gray-500 mt-2">Você deseja salvar as informações do colaborador antes de sair?</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 flex gap-2 justify-center">
                <button
                  onClick={() => { handleAdd(); setShowConfirmExit(false) }}
                  className="flex-1 py-3 bg-primary text-white rounded-md text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { resetForm(); setShowAdd(false); setShowConfirmExit(false) }}
                  className="flex-1 py-3 bg-white/5 text-gray-400 rounded-md text-sm font-black uppercase tracking-widest hover:text-white active:scale-95 transition-all"
                >
                  Descartar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LISTA DE USUÁRIOS (ESTILO ALUNO) */}
      <div className="bg-[#090909] rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 relative z-10">
          <div className="col-span-5">Membro da Equipe</div>
          <div className="col-span-3">Função / Cargo</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        <div className="divide-y divide-white/5 relative z-10">
          {users.map(u => {
            const ini = (u.name || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
            const cfg = roleConfig[u.role] || roleConfig.aluno
            const dateStr = formatDate(u.startDate || u.createdAt)

            return (
              <div key={u.id} className="group relative transition-all hover:bg-white/[0.03]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-5 items-center">
                  {/* Avatar + Info */}
                  <div className="col-span-12 md:col-span-5 flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUser(u)}>
                    <div className="w-12 h-12 rounded-md flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, var(--clr-primary-dark), var(--clr-primary))' }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-md object-cover" /> : ini}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-base font-bold truncate leading-none group-hover:text-primary transition-colors mb-2">{u.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px] font-medium tracking-tight truncate">{u.email || '—'}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-gray-600 text-[9px] font-bold uppercase tracking-wider">Início na Academia {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Badge */}
                  <div className="col-span-6 md:col-span-3">
                    <div className={`w-fit px-3 py-1.5 rounded-sm border text-[9px] font-black tracking-widest flex items-center gap-2 shadow-sm ${cfg.bg} ${cfg.color}`}>
                      <cfg.icon size={12} />
                      {cfg.label}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-3 md:col-span-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-[9px] font-black uppercase tracking-widest ${u.status === 'Inativo' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Inativo' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                      {u.status || 'Ativo'}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="col-span-3 md:col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="p-2.5 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                      title="Ver Detalhes"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-2.5 rounded-md bg-white/10 border border-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all active:scale-95"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.role)}
                      className="p-2.5 rounded-md bg-red-500/10 border border-red-500/10 text-red-400 hover:text-white hover:bg-red-500 transition-all active:scale-95"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {users.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-lg bg-white/5 mx-auto flex items-center justify-center text-gray-600">
                <Users size={32} />
              </div>
              <p className="text-gray-500 text-sm font-medium">Nenhum colaborador encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE SUCESSO (Criação com PIN) */}
      <AnimatePresence>
        {result && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setResult(null); resetForm(); setShowAdd(false); }} className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl mx-auto flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Pronto!</h3>
                <p className="text-sm text-gray-400">O colaborador foi cadastrado com sucesso no sistema.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">PIN de Acesso Único</p>
                <div className="flex justify-center gap-2">
                  {result.pin.split('').map((d, i) => (
                    <div key={i} className="w-10 h-14 bg-black border border-primary/30 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-primary/10">
                      {d}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Forneça este PIN ao colaborador para o primeiro acesso.</p>
              </div>

              <button
                onClick={() => { setResult(null); resetForm(); setShowAdd(false); }}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                Concluído
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALHES DO COLABORADOR (REF: RS TOP TEAM STUDIO) */}
      <AnimatePresence>
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedUser(null)}
          >
            {/* Overlay linkado ao container para garantir centralização total */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              className="relative w-full max-w-md bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 ring-1 ring-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(var(--clr-primary-rgb),0.1)] flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header Fixo */}
              <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0 bg-[#0a0a0a]">
                <h2 className="text-lg font-black text-white tracking-tight uppercase">Detalhes do Colaborador</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { handleEdit(selectedUser); setSelectedUser(null); }}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 rounded-2xl text-[10px] font-black text-gray-300 transition-all active:scale-95 uppercase tracking-wider"
                  >
                    <Edit2 size={11} />
                    Editar
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2.5 bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              {/* Body com Scroll Interno (Alta Densidade) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0a0a0a]">

                {/* Perfil Header */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-lg font-black text-white shadow-[0_0_20px_rgba(var(--clr-primary-rgb),0.3)] shrink-0">
                    {selectedUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight truncate">
                      {selectedUser.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${selectedUser.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        selectedUser.role === 'professor' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                        {selectedUser.role || 'Staff'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${selectedUser.status === 'Inativo' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                        {selectedUser.status || 'Ativo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção 1: IDENTIFICAÇÃO E CONTATO */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em] ml-1">Identificação & Contato</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                      <div className="text-gray-500"><User size={14} /></div>
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sexo</p>
                        <p className="text-xs font-bold text-gray-200">{selectedUser.gender || '—'}</p>
                      </div>
                    </div>
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                      <div className="text-gray-500"><Shield size={14} /></div>
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Documento</p>
                        <p className="text-xs font-bold text-gray-200">{selectedUser.cpf || '—'}</p>
                      </div>
                    </div>
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-3 col-span-2">
                      <div className="text-gray-500"><Mail size={14} /></div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">E-mail</p>
                        <p className="text-xs font-bold text-gray-200 truncate">{selectedUser.email || '—'}</p>
                      </div>
                    </div>
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-3 col-span-2">
                      <div className="text-gray-500"><Phone size={14} /></div>
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Telefone</p>
                        <p className="text-xs font-bold text-gray-200">{selectedUser.phone || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção 2: ATUAÇÃO PROFISSIONAL */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em] ml-1">Atuação & Equipe</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/60">
                        <Award size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Cargo / Função</p>
                        <p className="text-sm font-bold text-gray-200">
                          {selectedUser.role === 'admin' ? 'Administrador do Sistema' :
                            selectedUser.role === 'gestor' ? 'Gestor de Unidade' :
                              'Professor / Instrutor'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 space-y-3">
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Modalidades Ensinadas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUser.modalities?.length > 0 ? (
                            selectedUser.modalities.map(m => (
                              <span key={m} className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-gray-400 border border-white/5">{m}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-600 italic">Nenhuma modalidade vinculada</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                        <div className="text-gray-500"><Calendar size={14} /></div>
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Início</p>
                          <p className="text-xs font-bold text-gray-200">{formatDate(selectedUser.startDate) || '—'}</p>
                        </div>
                      </div>
                      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-3">
                        <div className="text-primary/60"><KeyRound size={14} /></div>
                        <div>
                          <p className="text-[9px] font-black text-primary/50 uppercase tracking-widest">PIN Sistema</p>
                          <p className="text-xs font-black text-white">{selectedUser.pin || '****'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção 3: JIU JITSU (Condicional) */}
                {selectedUser.jiuJitsu && (selectedUser.modalities?.some(m => m.toLowerCase().includes('jiu')) || selectedUser.jiuJitsu.belt !== 'white') && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em] ml-1">Graduação Jiu-Jitsu</h4>
                    <div className="bg-primary/10 border border-primary/20 rounded-[20px] p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Award size={64} />
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 shadow-xl"
                          style={{
                            backgroundColor: beltConfig[selectedUser.jiuJitsu.belt]?.color || '#fff',
                            borderColor: 'rgba(255,255,255,0.2)'
                          }}>
                          <span className="text-[10px] font-black leading-none" style={{ color: (selectedUser.jiuJitsu.belt === 'white' || selectedUser.jiuJitsu.belt === 'yellow') ? '#000' : '#fff' }}>
                            {selectedUser.jiuJitsu.degree || 0}º
                          </span>
                          <span className="text-[8px] font-black uppercase" style={{ color: (selectedUser.jiuJitsu.belt === 'white' || selectedUser.jiuJitsu.belt === 'yellow') ? '#000' : '#fff' }}>
                            GRAU
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Faixa Atual</p>
                          <h5 className="text-xl font-black text-white uppercase italic">
                            Faixa {beltConfig[selectedUser.jiuJitsu.belt]?.label || 'Branca'}
                          </h5>
                          <p className="text-[10px] font-bold text-gray-500 mt-1">
                            Graduação em: {formatDate(selectedUser.jiuJitsu.lastGraduation)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção 4: SAÚDE & OBSERVAÇÕES */}
                <div className="space-y-3 pb-2">
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em] ml-1">Saúde & Observações</h4>
                  <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-start gap-3.5 group">
                    <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors shrink-0 mt-0.5">
                      <HeartPulse size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Doença ou Medicação</p>
                      <p className="text-sm font-medium text-gray-300 leading-relaxed italic">
                        {selectedUser.healthInfo || 'Nenhuma informação de saúde registrada para este colaborador.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  PAINEL: LOGS DE ATIVIDADE (Visual estilo cards)
// ════════════════════════════════════════════════════════════════

// Cores por tipo de usuário
const CORES_POR_ROLE = {
  admin: { cor: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25', label: 'ADMIN' },
  gestor: { cor: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', label: 'GESTOR' },
  professor: { cor: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/25', label: 'PROFESSOR' },
  aluno: { cor: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', label: 'ALUNO' },
  sistema: { cor: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/25', label: 'SISTEMA' },
}

// Ícones por categoria de atividade
const ICONES_CATEGORIA = {
  evento: { icon: '📢', label: 'Evento' },
  chamada: { icon: '📋', label: 'Chamada' },
  visita: { icon: '🚪', label: 'Visitante' },
  aluno: { icon: '🎓', label: 'Aluno' },
  equipe: { icon: '👥', label: 'Equipe' },
  graduacao: { icon: '🥋', label: 'Graduação' },
  financeiro: { icon: '💰', label: 'Financeiro' },
  sistema: { icon: '⚙️', label: 'Sistema' },
}

// Componente de card de log individual
function CardLog({ log, onExpand }) {
  const [expandido, setExpandido] = useState(false)
  const estiloRole = CORES_POR_ROLE[log.usuarioPapel] || CORES_POR_ROLE.sistema
  const infoCategoria = ICONES_CATEGORIA[log.categoria] || ICONES_CATEGORIA.sistema

  const formatarData = (data) => {
    if (!data) return ''
    const d = new Date(data)
    const agora = new Date()
    const diffMs = agora - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMs / 3600000)
    const diffDias = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `Há ${diffMins}min`
    if (diffHoras < 24) return `Há ${diffHoras}h`
    if (diffDias < 7) return `Há ${diffDias}d`
    return formatBR(d, { day: '2-digit', month: 'short' }, true)
  }

  return (
    <div 
      className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
      onClick={() => setExpandido(!expandido)}
    >
      {/* Barra lateral colorida por role */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${estiloRole.bg.replace('/10', '/30')}`} />

      <div className="pl-3">
        {/* Linha superior: ícone categoria + título */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{infoCategoria.icon}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{infoCategoria.label}</span>
          <div className="flex-1" />
          <span className="text-[10px] text-gray-600">{formatarData(log.criadoEm)}</span>
        </div>

        {/* Título da ação */}
        <h3 className="text-sm font-black text-gray-200 mb-1 group-hover:text-white transition-colors">
          {(log.nomeLog || log.titulo || log.acao || log['action'] || '')}
        </h3>

        {/* Detalhes (visível quando expandido ou no desktop) */}
        <div className={`overflow-hidden transition-all ${expandido ? 'max-h-40' : 'max-h-0'}`}>
          <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
            {log.detalhe}
          </p>
        </div>

        {/* Linha inferior: usuário com badge do role */}
        <div className="flex items-center gap-2 mt-3">
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${estiloRole.bg} ${estiloRole.cor} border ${estiloRole.border}`}>
            {estiloRole.label}
          </div>
          <span className="text-xs text-gray-400 truncate">{log.usuarioNome}</span>
          {expandido && (
            <span className="text-[10px] text-gray-600 ml-auto">▼</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLogs({ logs, loading, carregandoMais, temMais, carregarMais }) {
  const activity = logs.filter(l => l.tipo === 'activity')
  const containerRef = useRef(null)

  // Scroll infinito
  useEffect(() => {
    if (!containerRef.current || loading || !temMais) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !carregandoMais) {
          carregarMais()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = containerRef.current.querySelector('[data-sentinel]')
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [loading, carregandoMais, temMais, carregarMais])

  return (
    <div className="space-y-6" ref={containerRef}>
      <Section title={`Atividade do sistema (${activity.length})`}>
        {loading ? (
          <div className="px-5 py-8 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-gray-500" />
            <p className="text-gray-600 text-sm">Carregando atividades...</p>
          </div>
        ) : activity.length === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
            <Activity size={32} strokeWidth={1.9} className="text-gray-600" />
            <p className="text-gray-500 text-sm font-medium">Nenhuma atividade registrada</p>
            <p className="text-gray-700 text-xs">As ações realizadas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3 px-2">
            {activity.map(log => (
              <CardLog key={log.id} log={log} />
            ))}
            
            {/* Sentinela para scroll infinito */}
            {temMais && (
              <div data-sentinel className="py-4 flex justify-center">
                {carregandoMais ? (
                  <RefreshCw size={20} className="animate-spin text-gray-500" />
                ) : (
                  <p className="text-xs text-gray-600">Role para carregar mais</p>
                )}
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  PAINEL: TIMELINE (Visual estilo eventos/avisos)
// ════════════════════════════════════════════════════════════════

// Função para obter cores baseadas no tema (escuro ou claro)
function obterCoresPorTema(tema) {
  const temaEscuro = ['crimson', 'dark_purple', 'neon_cyber', 'midnight', 'ocean', 'forest', 'sunset'].includes(tema)
  
  // Cores por tipo de usuário (adaptadas ao tema)
  return {
    admin: { 
      cor: temaEscuro ? 'text-purple-400' : 'text-purple-600', 
      bg: temaEscuro ? 'bg-purple-500/10' : 'bg-purple-100', 
      border: temaEscuro ? 'border-purple-500/25' : 'border-purple-200', 
      badge: temaEscuro ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-200 text-purple-700' 
    },
    gestor: { 
      cor: temaEscuro ? 'text-emerald-400' : 'text-emerald-600', 
      bg: temaEscuro ? 'bg-emerald-500/10' : 'bg-emerald-100', 
      border: temaEscuro ? 'border-emerald-500/25' : 'border-emerald-200', 
      badge: temaEscuro ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-200 text-emerald-700' 
    },
    professor: { 
      cor: temaEscuro ? 'text-blue-500' : 'text-blue-600', 
      bg: temaEscuro ? 'bg-blue-500/10' : 'bg-blue-100', 
      border: temaEscuro ? 'border-blue-500/25' : 'border-blue-200', 
      badge: temaEscuro ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-200 text-blue-700' 
    },
    aluno: { 
      cor: temaEscuro ? 'text-cyan-400' : 'text-cyan-600', 
      bg: temaEscuro ? 'bg-cyan-500/10' : 'bg-cyan-100', 
      border: temaEscuro ? 'border-cyan-500/25' : 'border-cyan-200', 
      badge: temaEscuro ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-200 text-cyan-700' 
    },
    sistema: { 
      cor: temaEscuro ? 'text-gray-400' : 'text-gray-600', 
      bg: temaEscuro ? 'bg-gray-500/10' : 'bg-gray-100', 
      border: temaEscuro ? 'border-gray-500/25' : 'border-gray-200', 
      badge: temaEscuro ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-200 text-gray-700' 
    },
    // Cores do card baseadas no tema
    cardBg: temaEscuro ? 'bg-white/[0.025]' : 'bg-gray-50',
    cardBorder: temaEscuro ? 'border-white/5' : 'border-gray-200',
    cardHover: temaEscuro ? 'hover:bg-white/[0.05] hover:border-white/10' : 'hover:bg-white hover:border-gray-300',
    titulo: temaEscuro ? 'text-gray-200' : 'text-gray-800',
    tituloHover: 'text-black',
    texto: temaEscuro ? 'text-gray-500' : 'text-gray-600',
  }
}

// Ícones e labels por categoria
const INFO_CATEGORIA = {
  evento: { emoji: '📢', label: 'EVENTO', cor: 'text-blue-400' },
  chamada: { emoji: '📋', label: 'CHAMADA', cor: 'text-green-400' },
  visita: { emoji: '🚪', label: 'VISITANTE', cor: 'text-orange-400' },
  aluno: { emoji: '🎓', label: 'ALUNO', cor: 'text-cyan-400' },
  equipe: { emoji: '👥', label: 'EQUIPE', cor: 'text-pink-400' },
  graduacao: { emoji: '🥋', label: 'GRADUAÇÃO', cor: 'text-yellow-400' },
  financeiro: { emoji: '💰', label: 'FINANCEIRO', cor: 'text-emerald-400' },
  sistema: { emoji: '⚙️', label: 'SISTEMA', cor: 'text-gray-400' },
}

// Card de timeline individual
function CardTimeline({ log, tema = 'crimson' }) {
  const [expandido, setExpandido] = useState(false)
  const cores = obterCoresPorTema(tema)
  const estilo = cores[log.usuarioPapel] || cores.sistema
  const info = INFO_CATEGORIA[log.categoria] || INFO_CATEGORIA.sistema

  const formatarDataHora = (data) => {
    if (!data) return ''
    const d = new Date(data)
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

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
    return formatBR(d, { day: '2-digit', month: 'short' }, true)
  }

  return (
    <div 
      className={`group relative ${cores.cardBg} border ${cores.cardBorder} rounded-2xl p-4 ${cores.cardHover} transition-all cursor-pointer overflow-hidden`}
      onClick={() => setExpandido(!expandido)}
    >
      {/* Barra lateral colorida por role */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${estilo.bg.replace('/10', '/30')}`} />

      <div className="pl-3 flex flex-col gap-3">
        {/* Header: categoria + tempo relativo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{info.emoji}</span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${info.cor}`}>{info.label}</span>
          </div>
          <span className="text-[10px] text-gray-600 font-medium">{tempoRelativo(log.criadoEm)}</span>
        </div>

        {/* Título principal */}
        <div>
          <h3 className={`text-sm font-bold ${cores.titulo} group-hover:${cores.tituloHover} transition-colors line-clamp-2`}>
            {(log.nomeLog || log.titulo || log.acao || log['action'] || '')}
          </h3>
          {log.detalhe && (
            <p className={`text-xs ${cores.texto} mt-1 transition-all ${expandido ? 'max-h-40' : 'max-h-0 overflow-hidden'}`}>
              {log.detalhe}
            </p>
          )}
        </div>

        {/* Footer: autor + role */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${estilo.badge}`}>
            {estilo.label || log.usuarioPapel?.toUpperCase()}
          </span>
          <span className="text-xs text-gray-400 truncate flex-1">{log.usuarioNome}</span>
        </div>

        {/* Timestamp completo quando expandido */}
        {expandido && (
          <div className="text-[10px] text-gray-700 font-mono">
            {formatarDataHora(log.criadoEm)}
          </div>
        )}
      </div>
    </div>
  )
}

// Seção Timeline principal
function SectionTimeline({ logs, loading, carregandoMais, temMais, carregarMais }) {
  const activity = logs.filter(l => l.tipo === 'activity')
  const containerRef = useRef(null)

  // Scroll infinito
  useEffect(() => {
    if (!containerRef.current || loading || !temMais) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !carregandoMais) {
          carregarMais()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = containerRef.current.querySelector('[data-sentinel]')
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [loading, carregandoMais, temMais, carregarMais])

  return (
    <div className="space-y-6" ref={containerRef}>
      <Section title={`Timeline de Atividades (${activity.length})`}>
        {loading ? (
          <div className="px-5 py-8 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-gray-500" />
            <p className="text-gray-600 text-sm">Carregando timeline...</p>
          </div>
        ) : activity.length === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
            <Clock size={32} strokeWidth={1.9} className="text-gray-600" />
            <p className="text-gray-500 text-sm font-medium">Nenhuma atividade na timeline</p>
            <p className="text-gray-700 text-xs">Ações realizadas aparecerão aqui em tempo real</p>
          </div>
        ) : (
          <div className="space-y-3 px-2">
            {activity.map(log => (
              <CardTimeline key={log.id} log={log} />
            ))}
            
            {/* Sentinela para scroll infinito */}
            {temMais && (
              <div data-sentinel className="py-4 flex justify-center">
                {carregandoMais ? (
                  <RefreshCw size={20} className="animate-spin text-gray-500" />
                ) : (
                  <p className="text-xs text-gray-600">Role para baixo para carregar mais</p>
                )}
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  PAINEL: LOGS DE ERRO
// ════════════════════════════════════════════════════════════════
function SectionErros({ logs, loading }) {
  const errors = logs.filter(l => l.tipo === 'error')
  return (
    <div className="space-y-6">
      <Section title={`Erros registrados (${errors.length})`}>
        {loading ? <p className="px-5 py-4 text-gray-600 text-sm">Carregando...</p>
          : errors.length === 0
            ? (
              <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 size={32} strokeWidth={1.9} className="text-emerald-500" />
                <p className="text-app font-semibold">Nenhum erro registrado</p>
                <p className="text-gray-500 text-sm">O sistema está funcionando perfeitamente.</p>
              </div>
            )
            : errors.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3 border-b border-white/5 last:border-0">
                <AlertCircle size={18} strokeWidth={1.9} style={{ color: 'var(--clr-primary)' }} className="flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                   <p className="text-sm font-semibold" style={{ color: 'var(--clr-primary)' }}>{(log.nomeLog || log.titulo || log.acao || log['action'] || '')}</p>
                  <p className="text-gray-500 text-xs font-mono break-all">{log.detalhe}</p>
                  <p className="text-gray-700 text-[10px] mt-0.5">{log.usuarioNome}</p>
                </div>
                <LogTime date={log.criadoEm} />
              </div>
            ))
        }
      </Section>
    </div>
  )
}

import ModuleUnderDevelopment from '../../components/shared/ModuleUnderDevelopment'

// ════════════════════════════════════════════════════════════════
//  PAINÉIS SIMPLES
// ════════════════════════════════════════════════════════════════

function SectionAparencia() {
  const { activeId, setTheme, customPrimary, setCustomPrimary, customSecondary, setCustomSecondary } = useTheme()

  const presets = Object.values(THEMES)

  return (
    <div className="space-y-6">

      {/* GRID DE TEMAS */}
      <Section title="Temas pré-definidos">
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {presets.map(t => {
            const isActive = activeId === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="relative overflow-hidden rounded-xl transition-all hover:scale-[1.03] active:scale-100"
                style={{
                  border: `2px solid ${isActive ? t.primary : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isActive ? `0 0 20px ${t.primary}55` : 'none',
                }}
              >
                {/* Mini preview */}
                <div className="h-16 w-full" style={{ background: t.bg }}>
                  {/* Sidebar strip */}
                  <div className="h-full w-6 float-left" style={{ background: t.sidebar || t.surface }}>
                    <div className="mt-2 mx-auto w-2 h-2 rounded-full" style={{ background: t.primary }} />
                    <div className="mt-1.5 mx-auto w-2 h-0.5 rounded" style={{ background: t.primary + '66' }} />
                    <div className="mt-1 mx-auto w-2 h-0.5 rounded" style={{ background: t.primary + '44' }} />
                  </div>
                  {/* Content area */}
                  <div className="ml-6 h-full p-1.5 flex flex-col gap-1">
                    <div className="h-1.5 w-10 rounded" style={{ background: t.primary }} />
                    <div className="h-1 w-8 rounded" style={{ background: t.textMuted + '60' }} />
                    <div className="mt-auto flex gap-1">
                      <div className="h-3 w-4 rounded" style={{ background: t.surface2, border: `1px solid ${t.primary}40` }} />
                      <div className="h-3 w-4 rounded" style={{ background: t.primary + '30' }} />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="px-2 py-1.5 flex items-center justify-between"
                  style={{ background: t.surface }}>
                  <span className="text-[11px] font-bold" style={{ color: t.text }}>
                    {t.emoji} {t.name}
                  </span>
                  {isActive && (
                    <CheckCircle2 size={18} strokeWidth={1.9} style={{ color: t.primary }} />
                  )}
                </div>
              </button>
            )
          })}

          {/* CUSTOM TILE */}
          <button
            onClick={() => setTheme('custom')}
            className="relative overflow-hidden rounded-2xl transition-all hover:scale-[1.03] active:scale-100"
            style={{
              border: `2px solid ${activeId === 'custom' ? customPrimary : 'rgba(255,255,255,0.07)'}`,
              boxShadow: activeId === 'custom' ? `0 0 20px ${customPrimary}55` : 'none',
            }}
          >
            <div className="h-16 w-full flex items-center justify-center" style={{
              background: `linear-gradient(135deg, ${customSecondary}22, ${customPrimary}33)`,
            }}>
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full border-2 border-white/20" style={{ background: customPrimary }} />
                <div className="w-5 h-5 rounded-full border-2 border-white/20" style={{ background: customSecondary }} />
              </div>
            </div>
            <div className="px-2 py-1.5 flex items-center justify-between" style={{ background: 'var(--clr-surface-2)' }}>
              <span className="text-[11px] font-bold text-app">🎨 Personalizado</span>
              {activeId === 'custom' && <CheckCircle2 size={18} strokeWidth={1.9} style={{ color: customPrimary }} />}
            </div>
          </button>
        </div>
      </Section>

      {/* COLOR PICKERS */}
      <Section title="Cores personalizadas">
        <div className="px-5 py-4 space-y-5">
          <p className="text-gray-500 text-xs">Defina suas cores e clique em "Personalizado" para aplicar.</p>

          {/* Cor primária */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-app text-sm font-semibold">Cor primária</p>
              <p className="text-gray-500 text-xs mt-0.5">Acentos, botões e destaques</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400">{customPrimary.toUpperCase()}</span>
              <label className="relative cursor-pointer">
                <div
                  className="w-9 h-9 rounded-lg ring-2 ring-white/10 transition-transform hover:scale-110"
                  style={{ background: customPrimary }}
                />
                <input
                  type="color"
                  value={customPrimary}
                  onChange={e => { setCustomPrimary(e.target.value); setTheme('custom') }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Cor secundária */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-app text-sm font-semibold">Cor secundária</p>
              <p className="text-gray-500 text-xs mt-0.5">Sidebar, gradientes e fundos</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400">{customSecondary.toUpperCase()}</span>
              <label className="relative cursor-pointer">
                <div
                  className="w-9 h-9 rounded-lg ring-2 ring-white/10 transition-transform hover:scale-110"
                  style={{ background: customSecondary }}
                />
                <input
                  type="color"
                  value={customSecondary}
                  onChange={e => { setCustomSecondary(e.target.value); setTheme('custom') }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Preview gradient */}
          <div
            className="h-10 rounded-lg"
            style={{ background: `linear-gradient(135deg, ${customSecondary}, ${customPrimary})`, opacity: activeId === 'custom' ? 1 : 0.4 }}
          >
            <div className="h-full rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">Preview do gradiente</span>
            </div>
          </div>

          <button
            onClick={() => setTheme('custom')}
            className="btn-primary w-full py-2.5 rounded-2xl text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${customSecondary}, ${customPrimary})` }}
          >
            {activeId === 'custom' ? '✓ Tema personalizado ativo' : 'Aplicar cores personalizadas'}
          </button>
        </div>
      </Section>
    </div>
  )
}

function SectionAcademia({ user, onUpdateProfile }) {
  const initialSettings = (user && user.academyConfig) ? user.academyConfig : { inativacao_visitante: 10 }
  const [localSettings, setLocalSettings] = React.useState(initialSettings)

  React.useEffect(() => {
    if (user?.academyConfig) {
      setLocalSettings(user.academyConfig)
    }
  }, [user?.academyConfig])

  const handleUpdateLocal = (key, val) => {
    setLocalSettings(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = (key, val) => {
    onUpdateProfile({
      academyConfig: {
        ...localSettings,
        [key]: val
      }
    })
  }

  return (
    <div className="space-y-6">
      <Section title="Informações da Academia">
        <InlineField label="Nome" value={user?.academyName || user?.name || "RS Top Team"} />
      </Section>

      <Section title="Configuração de Visitantes">
        <SettingRow 
          label="Inativação Automática" 
          desc="Após quantos dias de ausência o visitante é movido para inativo?" 
          action={
            <div className="flex items-center gap-6">
              <div className="flex-1 max-w-[200px]">
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={localSettings.inativacao_visitante || 10}
                  onChange={(e) => handleUpdateLocal('inativacao_visitante', parseInt(e.target.value))}
                  onMouseUp={(e) => handleSave('inativacao_visitante', parseInt(e.target.value))}
                  onTouchEnd={(e) => handleSave('inativacao_visitante', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">1 dia</span>
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">60 dias</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 min-w-[90px] shadow-lg shadow-primary/5">
                <span className="text-[14px] font-black text-primary leading-none">{localSettings.inativacao_visitante || 10}</span>
                <span className="text-[8px] font-bold text-primary/60 uppercase tracking-widest mt-1">Dias</span>
              </div>
            </div>
          } 
        />
      </Section>

      <Section title="Planos ativos">
        <SettingRow label="Mensalidade Jiu-Jitsu" desc="Valor padrão da mensalidade" action={<ChipButton label="R$ 180" />} />
        <SettingRow label="Mensalidade Boxe" desc="Valor padrão da mensalidade" action={<ChipButton label="R$ 150" />} />
      </Section>
    </div>
  )
}
function SectionDados({ onSync }) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    if (!window.confirm('🚀 INICIAR MIGRAÇÃO TOTAL?\n\nEste processo irá:\n1. Mover dados de coleções antigas (users, students, sessions) para as novas (usuarios, chamadas).\n2. Traduzir todos os campos para Português.\n3. Remover sufixos internos dos IDs.\n\nDeseja continuar?')) return
    
    setSyncing(true)
    try {
      const stats = await onSync()
      alert(`✅ MIGRACAO CONCLUÍDA!\n\nUsuários: ${stats.usuarios}\nChamadas: ${stats.chamadas}\nEventos: ${stats.eventos}`)
    } catch (e) {
      alert('❌ Erro na migração: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Manutenção do Sistema">
        <SettingRow 
          label="Migração de Banco de Dados" 
          desc="Transpor dados legados para a nova estrutura PT-BR e limpar IDs internos." 
          action={
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${syncing ? 'bg-white/5 text-gray-500' : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 active:scale-95'}`}
            >
              {syncing ? 'Processando...' : 'Iniciar Migração'}
            </button>
          } 
        />
      </Section>

      <Section title="Exportar dados">
        <SettingRow label="Exportar alunos" desc="Baixar lista completa em CSV" action={<ChipButton label="Exportar CSV" />} />
        <SettingRow label="Exportar presenças" desc="Histórico completo de presenças" action={<ChipButton label="Exportar CSV" />} />
      </Section>
      <Section title="Infraestrutura Firestore">
        <SettingRow label="Projeto Firebase" desc="academia-rstopteam" action={<span className="text-xs text-emerald-500 font-semibold">conectado ✓</span>} />
        <SettingRow label="Status das Coleções" desc="Nova estrutura PT-BR ativa" action={<div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />} />
      </Section>
    </div>
  )
}

function SectionSobre() {
  return (
    <div className="space-y-4">
      {/* Seção principal com informações do sistema */}
      <Section title="RS Top Team — Sistema de Gestão">
        <div className="divide-y divide-white/5">
          {[
            { label: 'Versão', value: '26.2.0-beta' },
            { label: 'Framework', value: 'React 19 + Vite' },
            { label: 'Banco de dados', value: 'Firebase Firestore' },
            { label: 'Hospedagem', value: 'Firebase Hosting' },
            { label: 'Desenvolvido por', value: '@mad.exe', link: 'https://www.instagram.com/mad.exe/' },
            { label: 'Apoio criativo e técnico', value: '@p_maxvinicius', link: 'https://www.instagram.com/p_maxvinicius/' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3">
              <span className="text-gray-500 text-sm">{row.label}</span>
              {row.link ? (
                <a
                  href={row.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold hover:underline"
                  style={{ color: 'var(--clr-primary)' }}
                >
                  {row.value}
                </a>
              ) : (
                <span className="text-white text-sm font-semibold">{row.value}</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Aviso de build beta — mesmo estilo visual do cabeçalho das Sections */}
      <div className="bg-[#0a0a0a]/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden shadow-xl">
        {/* Header — idêntico ao da Section */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Versão Beta</h3>
          <AlertTriangle size={14} style={{ color: 'var(--color-primary)' }} />
        </div>

        {/* Corpo do aviso */}
        <div className="px-6 py-4 flex items-start gap-3">
          {/* Ícone de alerta */}
          {/* <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
            style={{ background: 'var(--color-primary)' }}
          >
            <AlertTriangle size={15} style={{ color: 'var(--color-primary)' }} />
          </div> */}

          {/* Texto do aviso */}
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(248, 248, 248, 0.6)' }}>
            Esta versão pode conter bugs, instabilidades ou comportamentos inesperados.
            Recomendamos reportar qualquer problema ao desenvolvedor para que seja corrigido o mais breve possível.
          </p>
        </div>
      </div>
    </div>
  )
}

function SectionNotificacoes({ user, onUpdateProfile }) {
  // Estado local para feedback instantâneo na UI
  const [localPrefs, setLocalPrefs] = React.useState({
    general: user?.preferences?.notifications?.general ?? true,
    sound: user?.preferences?.notifications?.sound ?? true,
    vibrate: user?.preferences?.notifications?.vibrate ?? true,
  })

  // Sincroniza o estado local quando os dados do usuário terminam de carregar
  React.useEffect(() => {
    if (user?.preferences?.notifications) {
      setLocalPrefs(prev => ({
        ...prev,
        ...user.preferences.notifications
      }))
    }
  }, [user?.preferences?.notifications])

  const togglePref = (key) => {
    const newVal = !localPrefs[key]
    const updated = { ...localPrefs, [key]: newVal }
    
    // Atualiza localmente primeiro para ser instantâneo
    setLocalPrefs(updated)

    // Persiste no banco
    onUpdateProfile({
      preferences: {
        ...user?.preferences,
        notifications: {
          ...user?.preferences?.notifications,
          [key]: newVal
        }
      }
    })
  }

  const openSystemSettings = () => {
    try {
      if (/Android/i.test(navigator.userAgent)) {
        window.location.href = 'intent:package:com.android.settings#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=' + window.location.hostname + ';end'
      } else {
        alert('Para gerenciar notificações do sistema, acesse as Configurações do seu dispositivo e procure por este Aplicativo.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Geral">
        <SettingRow
          label="Notificações Gerais"
          desc="Ativar ou desativar todos os avisos do app"
          action={<Toggle isOn={localPrefs.general} onToggle={() => togglePref('general')} />}
        />
        <SettingRow
          label="Som"
          desc="Reproduzir som ao receber notificações"
          action={<Toggle isOn={localPrefs.sound} onToggle={() => togglePref('sound')} />}
        />
        <SettingRow
          label="Vibrar"
          desc="Vibrar o dispositivo ao receber notificações"
          action={<Toggle isOn={localPrefs.vibrate} onToggle={() => togglePref('vibrate')} />}
        />
      </Section>

      <div className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary flex-shrink-0">
          <Settings size={28} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm font-bold text-white mb-1">Configurações do Dispositivo</p>
          <p className="text-xs text-gray-500 max-w-sm">Para gerenciar permissões de nível de sistema (bloquear totalmente ou fixar no topo), use as configurações nativas.</p>
        </div>
        <button
          onClick={openSystemSettings}
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-white hover:bg-white/10 transition-all active:scale-95 whitespace-nowrap"
        >
          ABRIR AJUSTES
        </button>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Detectar sub-rota (ex: /perfil/logs) ou query param (ex: ?tab=logs)
  const pathParts = location.pathname.split('/').filter(Boolean)
  const activeTab = pathParts[1] || searchParams.get('tab') || 'conta'

  const setActive = (id) => {
    // Usa sub-rota para /perfil/logs, /perfil/conta, etc
    navigate(`/perfil/${id}`, { replace: true })
  }

  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const { user: authUser, userData, logout, effectiveRole } = useAuth()
  const { setIsMobileNavHidden } = useApp()
  const { users, loading: usersLoading, updateProfile, uploadAvatar, uploadBanner, createNewUser, changePassword, deleteUser, runDeepMigration } = useSystemUsers()
  const { logs, loading: logsLoading, carregandoMais, temMais, carregarMais } = useSystemLogs('all', 100)
  const { activeId: temaAtivo } = useTheme()

  // O 'id' do usuário logado para as operações de salvamento
  const currentUserId = userData?.id || userData?.uid || ''
  const currentUserRole = effectiveRole || 'aluno'

  const handleUpdateProfile = async (data) => {
    if (currentUserId && currentUserRole) await updateProfile(currentUserId, data, currentUserRole)
  }

  const initials = (userData?.name || 'A')[0].toUpperCase()
  const role = roleConfig[effectiveRole] || roleConfig.aluno

  const panels = {
    conta: <SectionConta user={userData} authUser={authUser} activeRole={effectiveRole} onUpdateProfile={handleUpdateProfile} />,
    seguranca: <SectionSeguranca user={userData} onChangePassword={changePassword} activityLogs={logs} />,
    notificacoes: <SectionNotificacoes user={userData} onUpdateProfile={handleUpdateProfile} />,
    aparencia: <SectionAparencia />,
    academia: <SectionAcademia user={userData} onUpdateProfile={handleUpdateProfile} />,
    usuarios: <SectionUsuarios
      users={users}
      onAddUser={createNewUser}
      onUpdateUser={(id, data, role) => updateProfile(id, data, role)}
      onDeleteUser={deleteUser}
      onSync={runDeepMigration}
    />,
    dados: <SectionDados onSync={runDeepMigration} />,
    logs: <SectionLogs logs={logs} loading={logsLoading} carregandoMais={carregandoMais} temMais={temMais} carregarMais={carregarMais} />,
    erros: <SectionErros logs={logs} loading={logsLoading} />,
    sobre: <SectionSobre />,
  }

  const isStaff = ['admin', 'gestor', 'professor'].includes(effectiveRole)

  // Filtra as seções baseado no cargo (Sistema apenas para Gestor/Admin)
  const visibleSections = SECTIONS.filter(sec => {
    if (sec.group === 'Sistema') return isStaff
    return true
  })

  // Se o usuário tentar acessar uma aba restrita via URL, volta para 'conta'
  const isRestrictedTab = SECTIONS.find(s => s.group === 'Sistema')?.items.some(i => i.id === activeTab)
  const canAccess = !isRestrictedTab || isStaff

  React.useEffect(() => {
    if (!canAccess) setActive('conta')
  }, [canAccess])

  const activeSection = SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab)

  // Handlers
  const handleSelectSection = (id) => {
    setActive(id)
    setMobileDetailOpen(true)
  }

  React.useEffect(() => {
    // Esconde a navegação mobile enquanto estiver na página de perfil/configurações
    setIsMobileNavHidden(true)
    
    // Cleanup ao desmontar a página (garante que volte ao navegar para outro lugar)
    return () => setIsMobileNavHidden(false)
  }, [setIsMobileNavHidden])

  const goBack = () => {
    navigate('/')
  }

  return (
    <div className="flex min-h-full" style={{ background: 'var(--clr-bg)' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-[280px] flex-shrink-0 flex-col py-8 px-4 overflow-y-auto"
        style={{ background: 'var(--clr-bg)', borderRight: '1px solid rgba(255,255,255,0.03)' }}>

        {/* BACK BUTTON */}
        <button
          onClick={goBack}
          className="group flex items-center gap-2 px-3 py-2 mb-8 text-gray-500 hover:text-white transition-all rounded-2xl hover:bg-white/5 w-fit"
        >
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-primary/30 transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold tracking-tight">Voltar ao Início</span>
        </button>

        {/* MINI PERFIL */}
        <div className="flex items-center gap-3 px-3 mb-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-lg shadow-primary/10"
            style={{ background: 'linear-gradient(135deg, var(--clr-primary-dark), var(--clr-primary))' }}>{initials}</div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold leading-none truncate">{userData?.name || 'Anon'}</p>
            <p className="text-[10px] text-gray-600 truncate">{userData?.handle || '@user'}</p>
            <span className={`text-[9px] font-bold ${role.color}`}>{role.label}</span>
          </div>
        </div>

        <div className="h-px mx-3 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* NAV */}
        <nav className="flex-1 space-y-0.5">
          {visibleSections.map(sec => (
            <div key={sec.group} className="mb-4">
              <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest px-3 mb-1">{sec.group}</p>
              {sec.items.map(item => (
                <button key={item.id} onClick={() => setActive(item.id)}
                  className={`nav-item w-full text-left mb-0.5 ${activeTab === item.id ? 'active' : ''}`}>
                  <item.icon size={18} strokeWidth={1.9} className={activeTab === item.id ? 'nav-icon' : ''} />
                  <span className="text-[13px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="h-px mx-3 mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <button className="nav-item w-full text-left" onClick={async () => { await logout(); navigate('/login'); }} style={{ color: 'var(--clr-primary)' }}>
          <LogOut size={18} strokeWidth={1.9} /> <span className="text-[13px]">Sair</span>
        </button>
      </aside>

      {/* ── MOBILE VIEW ── */}
      <div className="md:hidden flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--clr-bg)' }}>
        <AnimatePresence mode="wait">
          {!mobileDetailOpen ? (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-full overflow-y-auto pb-10"
            >
              {/* Header Mobile - Just the back button */}
              <div className="flex items-center px-6 py-5">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white/50 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5 shadow-2xl active:scale-90">
                  <ArrowLeft size={18} strokeWidth={1.9} />
                </button>
              </div>

              {/* Profile Intro */}
              <div className="flex flex-col items-center px-8 pb-10 pt-2 text-center">
                <div
                  className="relative w-32 h-32 rounded-full mb-6 p-1 bg-black/20"
                >
                  <div className="w-full h-full rounded-full bg-[#000] p-1 overflow-hidden relative border border-white/5 shadow-2xl">
                    {userData?.avatarUrl ? (
                      <img src={userData.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-4xl font-black bg-gradient-to-br from-white/10 to-white/5 text-white/20">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-white tracking-tight mb-3">{userData?.name || 'Anon'}</h1>
                <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                  {Object.entries(userData?.roles || {}).filter(([_, active]) => active).map(([rKey]) => {
                    const rCfg = roleConfig[rKey] || roleConfig.aluno
                    return (
                      <div key={rKey} className={`px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] border ${rCfg.bg} ${rCfg.color}`}>
                        {rCfg.label}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Menu Sections */}
              <div className="px-6 space-y-10">
                {visibleSections.map((sec) => (
                  <div key={sec.group} className="space-y-3">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">{sec.group}</h3>
                    <div className="bg-[#111] rounded-lg overflow-hidden border border-white/5 shadow-sm">
                      {sec.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectSection(item.id)}
                          className="w-full flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 active:bg-white/5 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white/5 text-gray-400">
                            <item.icon size={18} strokeWidth={1.9} />
                          </div>
                          <span className="flex-1 text-left text-sm font-bold text-white/90">{item.label}</span>
                          <ChevronRight size={18} strokeWidth={1.9} className="text-gray-700" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Sair */}
                <button
                  onClick={async () => { await logout(); navigate('/login'); }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-gray-400 font-bold text-sm hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-[0.98] mt-4 mb-20 group"
                >
                  <LogOut size={16} className="group-hover:text-red-400" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mobile-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full overflow-y-auto"
            >
              {/* Header Detalhe */}
              <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-[#000]/80 backdrop-blur-md border-b border-white/5">
                <button onClick={() => setMobileDetailOpen(false)} className="p-2 -ml-2 text-white placeholder-gray-500 bg-white/5 rounded-2xl border border-white/5 active:scale-90">
                  <ArrowLeft size={20} strokeWidth={2.4} />
                </button>
                <div className="text-center absolute left-1/2 -translate-x-1/2">
                  <h1 className="font-bold text-sm text-white">{activeSection?.label}</h1>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-black mt-0.5">Configurações</p>
                </div>
                <div className="w-8" />
              </div>

              {/* Content */}
              <div className="p-6 pb-40">
                {panels[activeTab]}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── DESKTOP MAIN PANEL ── */}
      <main className="hidden md:flex flex-1 overflow-y-auto px-4 md:px-6 py-6 justify-center">
        <div className="w-full">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2">{activeSection?.label}</h1>
              <p className="text-gray-500 text-sm font-medium">Gerencie suas configurações e preferências do sistema.</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-500">
              <activeSection.icon size={24} strokeWidth={1.5} />
            </div>
          </div>

          <div key={activeTab} className="pb-20">
            {panels[activeTab]}
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Sub-componentes auxiliares ──────────────────────────────

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card border border-white/5 rounded-xl p-5 flex items-center gap-4 transition-all hover:border-white/10 group">
      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm text-white font-bold truncate group-hover:text-primary/90 transition-colors">{value || 'Não informado'}</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-[#0a0a0a]/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden shadow-xl">
      <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">
        {children}
      </div>
    </div>
  )
}

function FormInput({ label, value, onChange, type = 'text', placeholder, error }) {
  return (
    <div className="space-y-1.5 flex-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 pl-1">{label}</p>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/5 border rounded-md px-5 py-3.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${error ? 'border-primary shadow-[0_0_10px_rgba(225,29,72,0.15)]' : 'border-white/10 hover:border-white/20'
          }`}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[9px] text-primary font-black uppercase tracking-widest ml-1 mt-1"
        >
          Campo obrigatório
        </motion.p>
      )}
    </div>
  )
}

function SettingRow({ label, desc, action }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 group hover:bg-white/[0.02] transition-colors">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{label}</p>
        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors mt-0.5">{desc}</p>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  )
}

function InlineField({ label, value, placeholder }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 group hover:bg-white/[0.02]">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${value ? 'text-white' : 'text-gray-600 italic'}`}>
        {value || placeholder}
      </p>
    </div>
  )
}

function LogTime({ date }) {
  const d = (typeof date === 'string' || typeof date === 'number') ? new Date(date) : date.toDate()
  return (
    <div className="text-right flex-shrink-0">
      <p className="text-gray-500 text-[10px] font-bold">{formatBR(d, {}, true)}</p>
      <p className="text-gray-700 text-[10px]">{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  )
}

function Toggle({ isOn = false, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full relative transition-all duration-300 ${isOn ? 'bg-primary' : 'bg-white/10'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isOn ? 'left-6 shadow-md' : 'left-1'}`} />
    </button>
  )
}

function ChipButton({ label }) {
  return (
    <button className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all">
      {label}
    </button>
  )
}


