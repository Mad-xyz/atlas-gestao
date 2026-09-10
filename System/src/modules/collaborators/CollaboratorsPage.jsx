import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, UserPlus, Search,
  MoreVertical, Shield, User,
  CheckCircle2, XCircle, Clock, UserCheck,
  ShieldCheck, ShieldAlert, RefreshCcw, ChevronDown,
  Edit2, Trash2, FileText, Smartphone, Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSystemUsers } from '../../hooks/useSystemUsers'
import { useAuth } from '../../context/AuthContext'
import UserCreationModal from '../../components/shared/UserCreationModal'
import MobileHeader from '../../components/navigation/MobileHeader'
import PageHeader from '../../components/shared/PageHeader'
import KPICard from '../../components/shared/KPICard'
import CollaboratorDetailsModal from '../../components/shared/CollaboratorDetailsModal'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import PinVerificationModal from '../../components/shared/PinVerificationModal'
import { beltConfig } from '../../data/beltConfig'


// ────────────────────────────────────────────────
// UTILS & HOOKS
// ────────────────────────────────────────────────
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

// Seletor Customizado Premium
function CustomSelect({ label, value, onChange, options, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o[0] === value) || options[0]

  return (
    <div className={`flex flex-col gap-1.5 relative w-full ${isOpen ? 'z-[500]' : 'z-[10]'}`} ref={ref}>
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`form-input bg-black h-[54px] opacity-100 text-sm px-6 text-gray-300 font-medium text-left flex justify-between items-center w-full disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-2xl transition-all hover:bg-[#080808] focus:ring-1 focus:ring-white/20 ${isOpen ? 'ring-1 ring-primary/50 border-primary/50' : ''}`}
      >
        <span className="truncate font-bold">{selectedOption ? selectedOption[1] : '...'}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-[#0B0B0B] opacity-100 border border-white/10 rounded-2xl z-[600] overflow-hidden shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(([v, l]) => (
            <button
              key={v}
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

// Dialog de confirmação dupla para deletar
function DeleteConfirmDialog({ member, onConfirm, onClose }) {
  useHideMobileNav(!!member)
  const [input, setInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  if (!member) return null
  const normalize = (str) => (str || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, ' ')
  const match = normalize(input) === normalize(member.nome || member.name)

  async function handleDelete() {
    if (!match) return
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      alert(`Erro: ${err.message}`)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl bg-[#0d0d0d]"
        style={{ animation: 'fadeSlideUp 0.22s ease both' }}>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Deletar Membro da Equipe</h2>
              <p className="text-[11px] text-gray-500">Esta ação é IRREVERSÍVEL.</p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 leading-relaxed">
            Você está prestes a <strong>deletar permanentemente</strong> o membro <strong>{member.nome || member.name}</strong>.
            Todos os dados associados a este cadastro serão perdidos.
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-black block mb-1.5">
              Para confirmar, digite exatamente: <span className="text-white">{member.nome || member.name}</span>
            </label>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className="form-input bg-black text-sm w-full"
              placeholder="Digite o nome do membro..."
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10">Cancelar</button>
            <button
              onClick={handleDelete}
              disabled={!match || deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-black bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              {deleting ? 'Apagando...' : '🗑 Deletar Permanentemente'}
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    </div>
  )
}


export default function CollaboratorsPage() {

  const { users, loading, updateProfile, runDeepMigration, fetchUserPin, deleteUser } = useSystemUsers()

  const { userData, loading: authLoading, verifyPIN, effectiveRole } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isAdmin = effectiveRole === 'admin'
  const isGestor = effectiveRole === 'gestor'

  // 🔓 PERMISSÕES GLOBAIS: Admin e Gestor sempre veem tudo. 
  // Outros cargos dependem de permissões específicas no perfil.
  const canSeeStaff = isAdmin || isGestor || userData?.permissions?.viewStaffPins
  const canSeeStudents = isAdmin || isGestor || userData?.permissions?.viewStudentPins
  const hasSomeViewPerm = canSeeStaff || canSeeStudents

  const [sortBy, setSortBy] = useState('recente')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [isMigrating, setIsMigrating] = useState(false)
  const [fetchedPins, setFetchedPins] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedCollaborator, setSelectedCollaborator] = useState(null)
  const [showMenu, setShowMenu] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })

  // 🛡️ Hide mobile navigation when menu is open
  useHideMobileNav(!!showMenu)

  const [deleteDialogUser, setDeleteDialogUser] = useState(null)

  // 🔐 Security States
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinModalAction, setPinModalAction] = useState(null) // { type, member }


  const isLoading = loading || authLoading


  /**
   * CÁLCULO DE ESTATÍSTICAS (KPIs)
   * 📊 Baseado no estado reativo de 'users'.

   * 🎯 Filtra por 'roles' para garantir precisão no modelo Multi-Role.
   */
  const stats = useMemo(() => {
    const getRoles = (u) => u.papeis || u.roles || {}

    // 🏷️ Filtramos para ignorar Admins nos cálculos, conforme solicitado
    const staffExcludingAdmins = users.filter(u => {
      const r = getRoles(u)
      return !r.admin && (r.gestor || r.professor)
    })

    const active = staffExcludingAdmins.filter(u => u.status === 'Ativo').length
    const professors = staffExcludingAdmins.filter(u => getRoles(u).professor).length
    const gestors = staffExcludingAdmins.filter(u => getRoles(u).gestor).length

    return {
      total: staffExcludingAdmins.length,
      active,
      professors,
      gestors
    }
  }, [users])

  /**
   * MOTOR DE FILTRAGEM (SEARCH & RBAC)
   * 🔍 Processa a lista em tempo real com base nos inputs do usuário.
   */
  const filteredUsers = useMemo(() => {
    let list = users.filter(user => {
      const uRoles = user.papeis || user.roles || {}
      // 1. Regra de Negócio: Exibir apenas colaboradores na aba de Equipe
      const hasStaffRole = uRoles.admin || uRoles.gestor || uRoles.professor
      // Garantir que o usuário corrente (admin) apareça mesmo sem roles definidas
      if (!hasStaffRole && user.id !== userData?.id) return false

      // 🛡️ SEGURANÇA: Ocultar Administradores de quem não é Admin
      // Um Gestor, Professor ou qualquer outro não pode ver perfis Admin na lista
      if (!isAdmin && uRoles.admin) return false

      // 2. Filtro Textual (Nome/Email)
      const matchesSearch = (user.nome || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())

      // 3. Filtro por Categoria de Cargo
      const matchesRole = roleFilter === 'all' ||
        (roleFilter === 'professor' && user.roles?.professor) ||
        (roleFilter === 'gestor' && (user.roles?.gestor || user.roles?.admin))

      // 4. Filtro por Status da Conta
      const matchesStatus = statusFilter === 'todos' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })

    // Ordenação alfabética
    if (sortBy === 'az') list = [...list].sort((a, b) => (a.nome || a.name || '').localeCompare(b.nome || b.name || ''))
    if (sortBy === 'za') list = [...list].sort((a, b) => (b.nome || b.name || '').localeCompare(a.nome || a.name || ''))
    return list
  }, [users, searchTerm, roleFilter, statusFilter, sortBy])

  // 🐛 DEBUG: Testa fetchUserPin diretamente
  const [debugPin, setDebugPin] = useState(null)
  useEffect(() => {
    if (!hasSomeViewPerm || filteredUsers.length === 0) return;
    const testUser = filteredUsers[0];
    if (!testUser) return;
    console.log('🔬 [DEBUG] Testando fetchUserPin para', testUser.id);
    fetchUserPin(testUser.id).then(pin => {
      console.log('🔬 [DEBUG] RESULTADO fetchUserPin:', pin, typeof pin);
      setDebugPin(pin);
      // Tenta ler direto do Firestore como fallback
      if (!pin) {
        console.log('🔬 [DEBUG] PIN veio NULO - tentando caminho alternativo...');
      }
    });
  }, [filteredUsers, hasSomeViewPerm]); // só 1 vez

  // 🔐 Busca PINs do subcollection privado/segredos (migrados)
  useEffect(() => {
    if (!hasSomeViewPerm) return;
    console.log('🔄 [Equipe] Buscando PINs para', filteredUsers.length, 'membros');
    const target = filteredUsers.slice(0, 50);
    target.forEach((m) => {
      if (!fetchedPins[m.id]) {
        fetchUserPin(m.id).then((pin) => {
          console.log('🔑 [Equipe] PIN fetch result for', m.nome || m.name, ':', pin || 'NULO');
          if (pin) setFetchedPins((prev) => ({ ...prev, [m.id]: pin }));
        });
      }
    });
  }, [filteredUsers, hasSomeViewPerm]);

  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo'
    if (confirm(`Deseja alterar o status de ${user.nome || user.name} para ${newStatus}?`)) {
      await updateProfile(user.id, { status: newStatus })
    }
    setShowMenu(null)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setShowMenu(null)
    setIsModalOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deleteDialogUser || !deleteDialogUser.id) {
      console.error('❌ Usuário não selecionado para deleção')
      return
    }

    const isSelf = deleteDialogUser.id.toLowerCase() === userData?.id?.toLowerCase() ||
      deleteDialogUser.email?.toLowerCase() === userData?.email?.toLowerCase()

    if (isSelf) {
      alert("🛑 SEGURANÇA: Você não pode excluir sua própria conta administrativa enquanto estiver logado no sistema.")
      setDeleteDialogUser(null)
      return
    }

    await deleteUser(deleteDialogUser.id)
    setDeleteDialogUser(null)
  }



  const roleStyles = {
    admin: { label: 'Admin', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    gestor: { label: 'Gestor', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    professor: { label: 'Professor', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    aluno: { label: 'Aluno', color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' }
  }


  return (
    <>
      <MobileHeader
        title="Colaboradores"
      />

      <PageHeader
        icon={Users}
        title="GESTÃO DE EQUIPE"
        subtitle="CONTROLE DE COLABORADORES E PROFESSORES"
      />

      <main className="flex-1 px-4 md:px-6 py-6 pb-12 fade-slide-up space-y-6 animate-in fade-in duration-500">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <KPICard title="Total Equipe" value={stats.total} description="Todos os membros da academia" icon={Users} />
          <KPICard title="Ativos" value={stats.active} description="Colaboradores em atividade" icon={UserCheck} valueColor="text-emerald-400"
            onClick={() => setStatusFilter(statusFilter === 'Ativo' ? 'todos' : 'Ativo')} active={statusFilter === 'Ativo'} />
          <KPICard title="Professores" value={stats.professors} description="Instrutores e mestres" icon={Shield}
            onClick={() => setRoleFilter(roleFilter === 'professor' ? 'all' : 'professor')} active={roleFilter === 'professor'} />
          <KPICard title="Gestores" value={stats.gestors} description="Administração e suporte" icon={ShieldCheck}
            onClick={() => setRoleFilter(roleFilter === 'gestor' ? 'all' : 'gestor')} active={roleFilter === 'gestor'} />
        </div>

        {/* Elite Search Bar (Outside) */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 relative group">
            <Search size={18} strokeWidth={1.9} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors" />
            <input
              className="w-full bg-[#111] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/10 transition-all font-medium"
              placeholder="Buscar por nome, email, cargo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/30"
          >
            <UserPlus size={18} strokeWidth={2.5} />
            <span className="hidden md:inline">NOVO COLABORADOR</span>
          </button>

          {(statusFilter !== 'todos' || roleFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => { setStatusFilter('todos'); setRoleFilter('all'); setSearchTerm('') }}
              className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            >
              <RefreshCcw size={18} strokeWidth={1.9} />
              <span className="hidden md:inline">Limpar Filtros</span>
            </button>
          )}
        </div>
        {/* caixxa que sobre tudo */}
        <div className="bg-[#0B0B0D]/80 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/5">
          {/* Filtros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <CustomSelect label="Ordenar por" value={sortBy} onChange={setSortBy} options={[['recente', 'Mais Recente'], ['az', 'A → Z'], ['za', 'Z → A']]} />
            <CustomSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[['todos', 'Todos'], ['Ativo', 'Ativos'], ['Inativo', 'Inativos']]} />
            <CustomSelect label="Unidade" value="matriz" onChange={() => { }} disabled={true} options={[['matriz', 'Matriz']]} />
            <CustomSelect label="Cargo / Função" value={roleFilter} onChange={setRoleFilter} options={[['all', 'Todos'], ['professor', 'Professores'], ['gestor', 'Gestores']]} />
          </div>

          {/* Tabela (Layout Clonado de Alunos) */}
          <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-black text-gray-500 tracking-wider bg-white/5">
                  <th className="py-3 px-5">Colaborador</th>
                  <th className="py-3 px-5 text-center">E-mail</th>
                  <th className="py-3 px-5 text-center">WhatsApp</th>
                  <th className="py-3 px-5 text-center">Cargo</th>
                  <th className="py-3 px-5 text-center">PIN</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 w-12 text-center text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((member, index) => (

                  <tr
                    key={member.id}
                    onClick={() => setSelectedCollaborator(member)}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center p-0.5 group-hover:border-primary/30 transition-colors shrink-0 relative">
                          {member.photoURL ? (
                            <img src={member.photoURL} alt={member.nome || member.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ring-1 ring-white/10 text-white shadow-inner ${beltConfig[member.belt]?.bgClass || 'bg-gradient-to-br from-primary to-black/10'}`}>
                              {getInitials(member.nome || member.name)}
                            </div>
                          )}

                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-app font-medium block uppercase tracking-tight group-hover:text-primary transition-colors">
                              {member.nome || member.name || 'Sem Nome'}
                            </span>
                            {member.id === userData?.id && (
                              <span className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase tracking-tighter">Você</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{member.role || 'COLABORADOR'}</span>
                            {member.belt && member.belt !== 'none' && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-800" />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${beltConfig[member.belt]?.bgClass.replace('belt-', 'text-') || 'text-gray-500'}`}>
                                  {beltConfig[member.belt]?.label}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="text-sm font-medium text-gray-300 block">{member.email}</span>
                    </td>

                    <td className="py-4 px-5 text-center">
                      {member.phone ? (
                        <a
                          href={`https://wa.me/55${(member.phone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all font-mono"
                        >
                          <Smartphone size={12} />
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-700 italic">OFFLINE</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {Object.entries(member.papeis || member.roles || {}).map(([role, active]) => {
                          if (!active) return null
                          const cfg = roleStyles[role] || roleStyles.professor
                          return (
                            <span key={role} className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {cfg.label}
                            </span>
                          )
                        })}
                        {(!(member.papeis || member.roles) || Object.keys(member.papeis || member.roles || {}).length === 0) && (
                          <span className="text-[10px] text-gray-700 font-bold italic">Sem Roles</span>
                        )}
                      </div>
                    </td>

                      {/* 🔐 PIN Protegido */}
                      <td className="py-4 px-5 text-center">
                        {((hasSomeViewPerm && !(member.roles?.admin || member.roles?.gestor || member.papeis?.admin || member.papeis?.gestor)) || member.id === userData?.id) ? (
                          <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-mono text-emerald-400 tracking-[0.2em] min-w-[80px]">
                            {member.pin || member.PIN || fetchedPins[member.id] || "---"}
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-mono text-gray-700 tracking-widest min-w-[80px]" title="Protegido">
                            ••••••
                          </div>
                        )}
                      </td>

                    <td className="py-4 px-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border inline-flex ${member.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {member.status || 'ATIVO'}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center relative">
                      <div className="relative menu-container">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const openUp = window.innerHeight - rect.bottom < 220;
                            setMenuPosition({
                              top: openUp ? (rect.top + window.scrollY) - 170 : (rect.top + window.scrollY) + rect.height + 4,
                              left: (rect.left + window.scrollX) - 160 + rect.width,
                              originY: openUp ? 1 : 0
                            });
                            setShowMenu(showMenu === member.id ? null : member.id);
                          }}
                          className={`p-2.5 rounded-xl transition-all active:scale-90 border border-transparent ${showMenu === member.id ? 'bg-white/10 text-white border-white/10' : 'hover:bg-white/10 text-white/20 hover:text-white hover:border-white/10'}`}
                        >
                          <MoreVertical size={18} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Exibindo <span className="text-gray-400">{filteredUsers.length}</span> de <span className="text-gray-400">{users.length}</span> membros</span>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <UserCreationModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedUser(null)
            }}
            initialData={selectedUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCollaborator && (
          <CollaboratorDetailsModal
            collaborator={selectedCollaborator}
            onClose={() => setSelectedCollaborator(null)}
            onEdit={handleEdit}
          />
        )}
      </AnimatePresence>

      {/* 🛡️ Pin Verification for Sensitive Actions */}
      {showPinModal && (
        <PinVerificationModal
          onConfirm={() => {
            const { type, member } = pinModalAction;
            if (type === 'edit') {
              setShowPinModal(false);
              handleEdit(member);
            } else if (type === 'delete') {
              setShowPinModal(false);
              setDeleteDialogUser(member);
            }
          }}
          onClose={() => setShowPinModal(false)}
          title="Confirmar Identidade"
          message={`Você está tentando ${pinModalAction?.type === 'edit' ? 'editar' : 'deletar'} os dados de ${pinModalAction?.member?.nome || pinModalAction?.member?.name}.`}
        />
      )}

      {deleteDialogUser && (
        <DeleteConfirmDialog
          member={deleteDialogUser}
          onClose={() => setDeleteDialogUser(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* GLOBAL ACTIONS MENU PORTAL */}
      <AnimatePresence>
        {showMenu && (
          <CollaboratorActionMenu
            member={users.find(u => u.id === showMenu)}
            menuPosition={menuPosition}
            isSelf={showMenu === userData?.id}
            onClose={() => setShowMenu(null)}
            onAction={(actionType, member) => {
              if (actionType === 'view') {
                setSelectedCollaborator(member)
              } else if (actionType === 'edit' || actionType === 'delete') {
                setPinModalAction({ type: actionType, member })
                setShowPinModal(true)
              } else if (actionType === 'toggleStatus') {
                toggleStatus(member)
              }
              setShowMenu(null)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * CollaboratorActionMenu - Renderiza o menu de ações de um colaborador de forma unificada
 * Usa Portal nativamente para evitar cortes de overflow ou bugs de hierarquia Z-Index
 */
function CollaboratorActionMenu({ member, menuPosition, isSelf, onClose, onAction }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  if (!member) return null

  const getInitials = (n) => n?.substring(0, 2).toUpperCase() || '??'

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop for click-outside */}
      <div
        className="absolute inset-0 bg-black/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Desktop Menu */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          onClick={e => e.stopPropagation()}
          className="hidden md:block absolute z-[1001] w-48 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            originX: 1,
            originY: menuPosition.originY
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onAction('view', member) }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Eye size={14} className="text-emerald-500" />
            </div>
            Ver Perfil
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction('edit', member) }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Edit2 size={14} className="text-blue-500" />
            </div>
            Editar Perfil
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction('toggleStatus', member) }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all group font-medium ${member.status === 'Ativo' ? 'text-red-500/70 hover:bg-red-500/10 hover:text-red-500' : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-500'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${member.status === 'Ativo' ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`}>
              {member.status === 'Ativo' ? <XCircle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
            </div>
            {member.status === 'Ativo' ? 'Inativar' : 'Reativar'}
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button
            disabled={isSelf}
            onClick={(e) => { e.stopPropagation(); onAction('delete', member) }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all group font-medium ${isSelf ? 'text-gray-700 cursor-not-allowed' : 'text-red-500 hover:bg-red-500/10'}`}
            title={isSelf ? 'Você não pode excluir seu próprio perfil' : ''}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelf ? 'bg-gray-800' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
              <Trash2 size={14} className={isSelf ? 'text-gray-600' : 'text-red-500'} />
            </div>
            Deletar
          </button>
        </motion.div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <div className="md:hidden">
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-0 bottom-0 bg-[#0A0A0A] border-t border-white/10 rounded-t-[32px] p-6 pb-12 z-[1002] shadow-[0_-8px_30px_rgb(0,0,0,0.8)]"
          >
            <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-6 shrink-0" />

            <div className="flex items-center gap-4 mb-8 text-left">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-black text-lg border border-white/10">
                {member.photoURL ? (
                  <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(member.nome || member.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-white truncate">{member.nome || member.name}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Colaborador da Academia</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-left">
              <button
                onClick={(e) => { e.stopPropagation(); onAction('view', member) }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Eye size={20} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">Ver Perfil</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Detalhes de acesso e contato</p>
                </div>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onAction('edit', member) }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Edit2 size={20} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">Editar Perfil</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Alterar dados e permissões</p>
                </div>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onAction('toggleStatus', member) }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-left group ${member.status === 'Ativo' ? 'text-red-500' : 'text-emerald-500'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${member.status === 'Ativo' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                  {member.status === 'Ativo' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black">{member.status === 'Ativo' ? 'Inativar' : 'Reativar'}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Alterar status de acesso</p>
                </div>
              </button>

              <button
                disabled={isSelf}
                onClick={(e) => { e.stopPropagation(); onAction('delete', member) }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border active:scale-95 text-left group ${isSelf ? 'bg-gray-500/5 border-gray-500/10 opacity-50 cursor-not-allowed' : 'bg-red-500/5 border-red-500/10'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelf ? 'bg-gray-500/10' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
                  <Trash2 size={20} className={isSelf ? 'text-gray-600' : 'text-red-500'} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-black ${isSelf ? 'text-gray-600' : 'text-red-500'}`}>Deletar Permanentemente</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mt-1 ${isSelf ? 'text-gray-700' : 'text-red-500/50'}`}>
                    {isSelf ? 'Não é possível excluir a si mesmo' : 'Ação irreversível'}
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>,
    document.body
  )
}
