// RESUMO: Gerenciamento de Alunos.
// Centraliza a listagem, filtros por status/modalidade, busca global e ações rápidas (editar, financeiro, graduação).
// Implementa diálogos de segurança para deleção e alteração de status (inativação/suspensão).
import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  User,
  Plus,
  FileDown,
  FileUp,
  Search,
  Clock,
  UserCheck,
  UserX,
  UserMinus,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Edit2,
  Copy,
  CalendarDays,
  GraduationCap,
  CreditCard,
  Trash2,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Award,
  Target,
  Smartphone,
  Eye,
  GraduationCap as GraduationIcon,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";
import { useFinance } from "../../hooks/useFinance";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useStudents } from "../../hooks/useStudents";
import { useSystemUsers } from "../../hooks/useSystemUsers";
import { useStudentJourney } from "../../hooks/useStudentJourney";
import { useAttendanceAlerts } from "../../hooks/useAttendanceAlerts";
import { useApp } from "../../context/AppContext";
import { useModalities } from "../../hooks/useModalities";
import { adjustBillForModalityChange } from "../../utils/billingAdjustment";
import { formatBR } from "../../utils/dateUtils";
import AddStudentModal from "../../components/shared/AddStudentModal";
import GraduationHistoryModal from "../../components/students/GraduationHistoryModal";
import PaymentDrawer from "../../components/students/PaymentDrawer";
import StatusChangeDialog from "../../components/students/StatusChangeDialog";
import AttendanceHistoryDrawer from "../../components/students/AttendanceHistoryDrawer";
import PageHeader from "../../components/shared/PageHeader";
import StudentDetailsModal from "../../components/shared/StudentDetailsModal";
import KPICard from "../../components/shared/KPICard";
import PinVerificationModal from "../../components/shared/PinVerificationModal";
import { beltConfig } from "../../data/beltConfig";
import { FIELDS } from "../../firebase/collections";
import MobileHeader from "../../components/navigation/MobileHeader";
import { useHideMobileNav } from "../../hooks/useHideMobileNav";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

function normalizeStatus(status) {
  if (!status || status === "ativo" || status === "active") return "ativo";
  if (status === "inativo" || status === "inactive") return "inativo";
  if (status === "suspenso" || status === "suspended") return "suspenso";
  if (status === "arquivado" || status === "archived") return "arquivado";
  return "ativo";
}

function VisitorAttendanceBadge({ studentId, createdAt }) {
  const { monthlyCount, isLoading } = useAttendanceAlerts(studentId, createdAt);
  if (isLoading)
    return (
      <span className="text-[10px] text-gray-500 font-black animate-pulse">
        ...
      </span>
    );
  return (
    <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase whitespace-nowrap">
      {monthlyCount} {monthlyCount === 1 ? "Visita" : "Visitas"}
    </div>
  );
}

// Dialog de confirmação dupla para deletar
function DeleteConfirmDialog({ student, onConfirm, onClose }) {
  useHideMobileNav(!!student);
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  if (!student) return null;
  const normalize = (str) =>
    (str || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  const match = normalize(input) === normalize(student.nome || student.name);

  async function handleDelete() {
    if (!match) return;
    setDeleting(true);
    try {
      await onConfirm();
    } catch (err) {
      alert(`Erro: ${err.message}`);
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl bg-[#0d0d0d]"
        style={{ animation: "fadeSlideUp 0.22s ease both" }}
      >
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Deletar {student.roles?.visitante ? "Visitante" : "Aluno"}
              </h2>
              <p className="text-[11px] text-gray-500">
                Esta ação é IRREVERSÍVEL.
              </p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 leading-relaxed">
            Você está prestes a <strong>deletar permanentemente</strong> o{" "}
            {student.roles?.visitante ? "visitante" : "aluno"}{" "}
            <strong>{student.nome || student.name}</strong>. Todos os dados
            associados a este cadastro serão perdidos.
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-black block mb-1.5">
              Para confirmar, digite exatamente:{" "}
              <span className="text-white">{student.nome || student.name}</span>
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="form-input bg-black text-sm w-full"
              placeholder={`Digite o nome do ${student.roles?.visitante ? "visitante" : "aluno"}...`}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={!match || deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-black bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              {deleting ? "Apagando..." : "🗑 Deletar Permanentemente"}
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    </div>
  );
}

function CustomSelect({ label, value, onChange, options, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o[0] === value) || options[0];

  return (
    <div
      className={`flex flex-col gap-1.5 relative ${isOpen ? "z-[110]" : "z-[10]"}`}
      ref={ref}
    >
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`form-input bg-black opacity-100 input-raise text-sm py-3 px-4 text-gray-300 font-medium text-left flex justify-between items-center w-full disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-2xl transition-all hover:bg-black/90 focus:ring-1 focus:ring-white/20 ${isOpen ? "ring-1 ring-primary/50 border-primary/50" : ""}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption[1] : "..."}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180 text-primary" : ""}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-black opacity-100 border border-white/10 rounded-2xl z-[100] overflow-hidden shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(([v, l]) => (
            <button
              key={v}
              onClick={() => {
                onChange(v);
                setIsOpen(false);
              }}
              className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-white/5 ${value === v ? "text-white bg-white/10 font-black" : "text-gray-400 font-medium"}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentsPage({ defaultTypeFilter = "aluno" }) {
  const { currentModality, isAdminView } = useApp();
  const { user, userData, effectiveRole } = useAuth();
  const {
    students,
    isLoadingStudents,
    addStudent,
    updateStudentProfile,
    changeStudentStatus,
    deleteStudent,
    deleteVisitor,
  } = useStudents();
  const { fetchUserPin } = useSystemUsers();
  const [fetchedPins, setFetchedPins] = useState({});
  const { bills } = useFinance();
  const { modalities: modalitiesConfig } = useModalities();

  const isAdmin = effectiveRole === "admin";
  const isGestor = effectiveRole === "gestor";
  const canSeeStudents =
    isAdmin || isGestor || userData?.permissions?.viewStudentPins;
  const journeyStats = useStudentJourney();

  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editData, setEditData] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  // 🔐 Security States
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalAction, setPinModalAction] = useState(null); // { type, student }

  // 🛡️ Hide mobile navigation when menu is open
  useHideMobileNav(!!showMenu);

  const [attendanceDrawerStudent, setAttendanceDrawerStudent] = useState(null);
  const [graduationModalStudent, setGraduationModalStudent] = useState(null);
  const [paymentDrawerStudent, setPaymentDrawerStudent] = useState(null);
  const [statusDialogStudent, setStatusDialogStudent] = useState(null);
  const [deleteDialogStudent, setDeleteDialogStudent] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter); // 'aluno', 'visitante' ou 'todos'
  const [modalityFilter, setModalityFilter] = useState("todas");
  const [sortBy, setSortBy] = useState("recente");
  // ⬇️ Controla a visibilidade de alunos inativos/suspensos/arquivados na tabela
  const [showArchived, setShowArchived] = useState(false);

  // ==========================================
  // ⚡ PAGINAÇÃO CLIENT-SIDE (OTIMIZAÇÃO)
  // ==========================================
  // States para controlar a página atual e o limite de itens na tela (10 por padrão).
  // Isso evita o travamento do DOM ao lidar com bases grandes de alunos (Core Web Vitals).
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // "Reseta" para a página 1 sempre que qualquer filtro ou busca for modificado pelo usuário.
  // Isso previne que o usuário caia em uma página "fantasma" que ficou vazia após o filtro.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, modalityFilter, sortBy, showArchived]);

  const stats = useMemo(() => {
    let active = 0,
      inactive = 0,
      suspended = 0,
      archived = 0;
    students.forEach((s) => {
      // 🛡️ Filtramos estatísticas pelo tipo atual (Aluno ou Visitante)
      const isTypeMatch =
        typeFilter === "todos" ||
        (typeFilter === "aluno" && s.roles?.aluno) ||
        (typeFilter === "visitante" && s.roles?.visitante);

      if (!isTypeMatch) return;

      const n = normalizeStatus(s.status);
      if (n === "ativo") active++;
      else if (n === "inativo") inactive++;
      else if (n === "suspenso") suspended++;
      else if (n === "arquivado") archived++;
    });
    return { active, inactive, suspended, archived };
  }, [students, typeFilter]);

  // ⚡ Lógica de Inativação Automática de Visitantes (SSoT)
  useEffect(() => {
    if (
      !students ||
      students.length === 0 ||
      !userData?.academyConfig?.inativacao_visitante
    )
      return;

    const limitDays = userData.academyConfig.inativacao_visitante;
    const now = new Date();

    // Filtramos apenas visitantes ATIVOS que excederam o limite de dias desde a última visita (ou criação)
    const visitorsToInactivate = students.filter((s) => {
      if (!s.roles?.visitante || normalizeStatus(s.status) !== "ativo")
        return false;

      const d = s.lastAttendanceAt || s.createdAt;
      const lastVisit = d
        ? typeof d.toDate === "function"
          ? d.toDate()
          : new Date(d)
        : new Date();
      const diffTime = Math.abs(now - lastVisit);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > limitDays;
    });

    if (visitorsToInactivate.length > 0) {
      console.log(
        `⚡ Academy Bot: Inativando ${visitorsToInactivate.length} visitantes por ausência excedida (${limitDays} dias).`,
      );
      visitorsToInactivate.forEach((v) => {
        changeStudentStatus(v.id, "inativo", {
          reason: `Inativação automática por ausência superior a ${limitDays} dias.`,
        });
      });
    }
  }, [
    students,
    userData?.academyConfig?.inativacao_visitante,
    changeStudentStatus,
  ]);

  const modalities = useMemo(() => {
    const raw = students
      .flatMap((s) => {
        const mods = s[FIELDS.MODALIDADES] || s.modalities || [];
        const single = s[FIELDS.MODALIDADE] || s.modality;
        return [...(Array.isArray(mods) ? mods : [mods]), single];
      })
      .filter(Boolean);

    const normalized = Array.from(
      new Set(
        raw.map((m) => {
          if (typeof m !== "string") return m;
          const t = m.trim();
          const lower = t.toLowerCase();
          if (
            lower === "jiu-jitsu" ||
            lower === "jiu jitsu" ||
            lower === "jiujitsu"
          )
            return "Jiu Jitsu";
          if (lower === "boxe") return "Boxe";
          if (lower === "muay thai" || lower === "muay-thai")
            return "Muay Thai";
          return t;
        }),
      ),
    );
    return ["todas", ...normalized];
  }, [students]);

  const filtered = useMemo(() => {
    // 🛡️ SEGURANÇA: Filtrar por papel (ALUNO ou VISITANTE)
    let list = students.filter((s) => {
      if (typeFilter === "aluno") return s.roles?.aluno === true;
      if (typeFilter === "visitante") return s.roles?.visitante === true;
      return s.roles?.aluno === true || s.roles?.visitante === true;
    });

    // 🔒 SEGURANÇA E ESCOPO: Se for professor, vê apenas alunos da sua turma/modalidade
    if (
      !isAdmin &&
      !isGestor &&
      userData?.modalities &&
      userData.modalities.length > 0
    ) {
      const teacherMods = userData.modalities.map((m) =>
        m.toLowerCase().replace(/-/g, " ").trim(),
      );

      list = list.filter((s) => {
        const studentMods = (
          Array.isArray(s.modalities) ? s.modalities : [s.modality]
        )
          .filter(Boolean)
          .map((m) => m.toLowerCase().replace(/-/g, " ").trim());

        if (studentMods.length === 0) return false;
        return studentMods.some((m) => teacherMods.includes(m));
      });
    }

    // 🛡️ SEGURANÇA: Ocultar Staff (Admins, Gestores, Professores) da listagem de Alunos
    if (!isAdmin && !isGestor) {
      list = list.filter((s) => {
        const isStaff = s.roles?.admin || s.roles?.gestor || s.roles?.professor;
        return !isStaff;
      });
    }

    // 👁️ VISIBILIDADE: Por padrão, oculta arquivados/inativos/suspensos
    // Só mostra quando o usuário clica no KPI "Arquivados"
    if (!showArchived) {
      list = list.filter((s) => normalizeStatus(s.status) === "ativo");
    } else {
      // No modo arquivados, mostra apenas os não-ativos
      list = list.filter((s) => normalizeStatus(s.status) !== "ativo");
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          (s.nome || s.name || "").toLowerCase().includes(lower) ||
          (s.email || "").toLowerCase().includes(lower) ||
          (s.phone || "").includes(lower),
      );
    }
    if (statusFilter !== "todos")
      list = list.filter((s) => normalizeStatus(s.status) === statusFilter);
    if (modalityFilter !== "todas") {
      // 🔧 FIX: Comparação case-insensitive para cobrir variações de capitalização
      // ex: "boxe" == "Boxe", "jiu-jitsu" == "Jiu Jitsu", etc.
      const filterNorm = modalityFilter
        .toLowerCase()
        .replace(/-/g, " ")
        .trim();
      list = list.filter((s) => {
        const allMods = [
          s.modality,
          ...(Array.isArray(s.modalities) ? s.modalities : []),
        ]
          .filter(Boolean)
          .map((m) => m.toLowerCase().replace(/-/g, " ").trim());
        return allMods.includes(filterNorm);
      });
    }
    // Filtro "Recente": Ordena por data de criação ou atualização (do mais novo para o mais velho)
    if (sortBy === "recente") {
      list = [...list].sort((a, b) => {
        // Função auxiliar para extrair o timestamp de qualquer formato de data
        const getT = (s) => {
          // 1. Tenta campos diretos de data
          const campoDireto = s.createdAt || s.updatedAt || s.startDate || 0;
          if (campoDireto) {
            if (typeof campoDireto.toMillis === "function") return campoDireto.toMillis();
            if (typeof campoDireto.toDate === "function") return campoDireto.toDate().getTime();
            if (campoDireto instanceof Date) return campoDireto.getTime();
            const parsed = new Date(campoDireto).getTime();
            if (!Number.isNaN(parsed)) return parsed;
          }
          // 2. Fallback: data do primeiro histórico da jornada técnica (todos os alunos têm)
          try {
            const hist = s.jornada_tecnica?.historico;
            if (hist && hist.length > 0) {
              const d = hist[0].date;
              if (d) {
                if (typeof d.toMillis === "function") return d.toMillis();
                if (typeof d.toDate === "function") return d.toDate().getTime();
                if (d instanceof Date) return d.getTime();
                const parsed = new Date(d).getTime();
                if (!Number.isNaN(parsed)) return parsed;
              }
            }
          } catch (e) {}
          return 0;
        };
        // Ordem decrescente (mais recente primeiro)
        return getT(b) - getT(a);
      });
    } 
    // Ordem alfabética: A-Z
    else if (sortBy === "az") {
      list = [...list].sort((a, b) =>
        (a.nome || a.name || "").localeCompare(b.nome || b.name || ""),
      );
    } 
    // Ordem alfabética reversa: Z-A
    else if (sortBy === "za") {
      list = [...list].sort((a, b) =>
        (b.nome || b.name || "").localeCompare(a.nome || a.name || ""),
      );
    }
    return list;
  }, [
    students,
    searchTerm,
    statusFilter,
    modalityFilter,
    sortBy,
    isAdmin,
    typeFilter,
    showArchived,
]);

  // 🔐 Busca PINs do subcollection privado/segredos (migrados)
  // Tenta primeiro com s.id (docId da origem), depois com o email normalizado (fallback para alunos de coleções alternativas)
  useEffect(() => {
    if (!canSeeStudents) return;
    const target = filtered.slice(0, 50);
    target.forEach((s) => {
      if (s.pin || fetchedPins[s.id] || fetchedPins[s.email?.toLowerCase().trim()]) return;

      const emailKey = s.email?.toLowerCase().trim();

      fetchUserPin(s.id).then((pin) => {
        if (pin) {
          setFetchedPins((prev) => ({ ...prev, [s.id]: pin }));
          return;
        }
        // Fallback: alunos vindos das coleções 'alunos'/'students' podem ter docId diferente do 'usuarios'
        if (emailKey && emailKey !== s.id) {
          fetchUserPin(emailKey).then((pin2) => {
            if (pin2) setFetchedPins((prev) => ({ ...prev, [s.id]: pin2 }));
          });
        }
      });
    });
  }, [filtered, canSeeStudents]);

  // Calcula dinamicamente o número total de páginas (Arredonda para cima)
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  // Recorte da lista estritamente para a página atual usando memoization.
  // Evita re-renderizações pesadas, enviando ao JSX apenas a fração de 10 alunos necessários.
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  async function handleAddStudent(data, modality, options) {
    try {
      if (editData) {
        const wasVisitor = editData.isVisitor || editData.roles?.visitante;

        if (wasVisitor && !options.isVisitor) {
          // PROMOÇÃO: Transformar Visitante em Aluno
          // 1. Criar novo registro na coleção USARIOS
          await addStudent(data, modality, { ...options, isVisitor: false });
          // 2. Deletar registro da coleção VISITANTES
          await deleteVisitor(editData.id);
        } else {
          // EDIÇÃO NORMAL
          const oldModalities =
            editData.modalities || editData[FIELDS.MODALIDADES] || [];
          const newModalities = Array.isArray(modality) ? modality : [modality];

          await updateStudentProfile(editData.id, {
            ...data,
            modalities: newModalities,
            modality: newModalities[0] || "Jiu Jitsu",
          });

          // Ajustar cobrança se modalidades mudaram
          const modalitiesChanged =
            JSON.stringify(oldModalities.sort()) !==
            JSON.stringify(newModalities.sort());
          if (modalitiesChanged && modalitiesConfig.length > 0) {
            await adjustBillForModalityChange(
              editData.id,
              newModalities,
              modalitiesConfig,
            );
          }
        }
      } else {
        // MODO CRIAÇÃO: Verifica duplicidade antes de adicionar
        const isDuplicate = students.some((s) => {
          const emailMatch =
            data.email && s.email?.toLowerCase() === data.email.toLowerCase();
          const nameMatch =
            (s.nome || s.name || s.nomeCompleto)?.toLowerCase() ===
            (data.nome || data.name || data.nomeCompleto)?.toLowerCase();

          const isSamePerson = data.email ? emailMatch : nameMatch;

          if (isSamePerson) {
            // Se a pessoa já existe, verificamos se ela JÁ TEM o papel que estamos tentando adicionar
            const isTryingToCreateVisitor = options?.isVisitor;
            if (isTryingToCreateVisitor && s.roles?.visitante) return true;
            if (!isTryingToCreateVisitor && s.roles?.aluno) return true;

            // Se ela existe mas não tem o papel (ex: é apenas Admin), não consideramos duplicata fatal.
            // O backend fará o merge dos papéis.
            return false;
          }
          return false;
        });

        if (isDuplicate) {
          alert(
            "🛑 ATENÇÃO: Já existe um aluno/visitante ativo cadastrado com este nome ou e-mail.",
          );
          return;
        }

        await addStudent(data, modality, options);
      }
      setShowModal(false);
      setEditData(null);
      setDuplicateData(null);
    } catch (err) {
      console.error("Erro ao salvar aluno:", err);
      alert("Erro ao salvar. Verifique sua conexão e tente novamente.");
    }
  }

  async function handleStatusChange({ reason, returnDate }) {
    const { student, action } = statusDialogStudent;
    const newStatus =
      action === "inativar"
        ? "inativo"
        : action === "arquivar"
          ? "arquivado"
          : action === "reativar"
            ? "ativo"
            : action === "remover arquivado"
              ? "ativo"
              : "suspenso";
    await changeStudentStatus(student.id, newStatus, { reason, returnDate });
    setStatusDialogStudent(null);
  }

  async function handleConfirmDelete() {
    if (!deleteDialogStudent || !deleteDialogStudent.id) {
      console.error("❌ Aluno não selecionado para deleção");
      return;
    }

    const isSelf =
      deleteDialogStudent.id.toLowerCase() === userData?.id?.toLowerCase() ||
      deleteDialogStudent.email?.toLowerCase() ===
        userData?.email?.toLowerCase();

    if (isSelf) {
      alert(
        "🛑 SEGURANÇA: Você não pode excluir sua própria conta administrativa enquanto estiver logado no sistema.",
      );
      setDeleteDialogStudent(null);
      return;
    }

    await deleteStudent(deleteDialogStudent.id);
    setDeleteDialogStudent(null);
  }

  function renderAvatar(student) {
    const isVisitor = student.roles?.visitante;
    
    // Normalização robusta da faixa para busca no config
    const rawBelt = (student.belt || "").toLowerCase().trim();
    const belt =
      rawBelt === "sem faixa" || rawBelt === "branca"
        ? rawBelt === "branca"
          ? "white"
          : "none"
        : rawBelt;
    const config = beltConfig[belt] || beltConfig.none;

    const bgClass = isVisitor ? "bg-amber-500/20" : (config.bgClass || "belt-none");
    const textColor = isVisitor ? "#f59e0b" : (config.textColor || "#FFFFFF");
    const initials =
      student.initials ||
      (student.nome || student.name || "A")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
      <div className={`flex items-center justify-center p-0.5 transition-colors shrink-0 relative ${isVisitor ? 'rounded-2xl border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'group-hover:border-primary/30'}`}>
        {student.photo ? (
          <img
            src={student.photo}
            alt={student.nome || student.name}
            className={`w-11 h-11 object-cover ring-1 ring-white/10 shadow-lg ${isVisitor ? 'rounded-xl' : 'rounded-full'}`}
          />
        ) : (
          <div
            className={`w-11 h-11 flex items-center justify-center text-xs font-black ring-1 ring-white/10 ${bgClass} shadow-inner relative overflow-hidden transition-all duration-300 ${isVisitor ? 'rounded-xl' : 'rounded-full'}`}
            style={{ color: textColor }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10 opacity-40" />
            <span className="relative z-10 drop-shadow-md">
              {isVisitor ? <User size={18} strokeWidth={2.5} /> : initials}
            </span>
          </div>
        )}
      </div>
    );
  }

  function renderStatusBadge(student) {
    const norm = normalizeStatus(student.status);
    const cfg = {
      ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      inativo: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      suspenso: "bg-primary/10 text-primary border-primary/20",
      arquivado: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
    const labels = {
      ativo: "Ativo",
      inativo: "Inativo",
      suspenso: "Suspenso",
      arquivado: "Arquivado",
    };
    return (
      <span
        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border inline-flex ${cfg[norm]}`}
      >
        {labels[norm]}
      </span>
    );
  }

  return (
    <>
      <MobileHeader
        title={typeFilter === "visitante" ? "Visitantes" : "Alunos"}
      />

      <PageHeader
        icon={typeFilter === "visitante" ? Clock : Users}
        title={
          typeFilter === "visitante"
            ? "GESTÃO DE VISITANTES"
            : "GESTÃO DE ALUNOS"
        }
        subtitle={
          typeFilter === "visitante"
            ? "CONTROLE DE LEADS E INTERESSADOS"
            : "CONTROLE DE MATRÍCULAS E PRESENÇA"
        }
      />

      <div className="px-4 md:px-6 py-6 pb-12 fade-slide-up space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <KPICard
            title="Ativos"
            value={stats.active}
            description={
              typeFilter === "visitante"
                ? "Visitantes ativos"
                : "Alunos matriculados"
            }
            icon={UserCheck}
            valueColor="text-emerald-400"
            onClick={() => {
              setShowArchived(false);
              setStatusFilter(statusFilter === "ativo" ? "todos" : "ativo");
            }}
            active={statusFilter === "ativo" && !showArchived}
          />
          <KPICard
            title="Inativos"
            value={stats.inactive}
            description={
              typeFilter === "visitante"
                ? "Visitantes inativos"
                : "Cancelamentos ou travaram"
            }
            icon={UserX}
            onClick={() => {
              setShowArchived(false);
              setStatusFilter(statusFilter === "inativo" ? "todos" : "inativo");
            }}
            active={statusFilter === "inativo" && !showArchived}
          />

          {typeFilter === "visitante" ? (
            <>
              <KPICard
                title="Visitantes"
                value={students.filter((s) => s.roles?.visitante).length}
                description="Total de interessados"
                icon={Users}
                valueColor="text-amber-400"
                onClick={() => setStatusFilter("todos")}
                active={statusFilter === "todos"}
              />
              <KPICard
                title="% de Conversão"
                value="-- %"
                description="Visitantes que viraram alunos"
                icon={Award}
                valueColor="text-primary"
              />
            </>
          ) : (
            <>
              <KPICard
                title="Graduados"
                value={journeyStats?.totalGraduated || 0}
                description="Total de alunos com faixa"
                icon={Award}
                valueColor="text-blue-400"
              />
              <KPICard
                title="Arquivados"
                value={stats.archived + stats.inactive + stats.suspended}
                description="Inativos, suspensos e arquivados"
                icon={Archive}
                valueColor="text-amber-400"
                active={showArchived}
                onClick={() => setShowArchived((v) => !v)}
              />
            </>
          )}
        </div>

        {/* Barra de pesquisa*/}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 relative group">
            <Search
              size={18}
              strokeWidth={1.9}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors"
            />
            <input
              className="w-full bg-[#111] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/10 transition-all font-medium"
              placeholder="Buscar por nome, email, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdminView && (
            <button
              onClick={() => {
                setDuplicateData(null);
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/30"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="hidden md:inline">
                {typeFilter === "visitante" ? "NOVO VISITANTE" : "NOVO ALUNO"}
              </span>
            </button>
          )}

          {(statusFilter !== "todos" ||
            modalityFilter !== "todas" ||
            typeFilter !== defaultTypeFilter ||
            searchTerm ||
            showArchived) && (
            <button
              onClick={() => {
                setStatusFilter("todos");
                setModalityFilter("todas");
                setTypeFilter(defaultTypeFilter);
                setSearchTerm("");
                setShowArchived(false);
              }}
              className="flex items-center justify-center gap-2 px-4 md:px-6 h-[46px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            >
              <RefreshCw size={18} strokeWidth={1.9} />
              <span className="hidden md:inline">Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="bg-[#0B0B0D]/80 backdrop-blur-md rounded-[24px] p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-visible">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Ordenar por",
                value: sortBy,
                onChange: setSortBy,
                options: [
                  ["recente", "Mais Recente"],
                  ["az", "A → Z"],
                  ["za", "Z → A"],
                ],
              },
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options:
                  typeFilter === "visitante"
                    ? [
                        ["todos", "Todos"],
                        ["ativo", "Ativos"],
                        ["inativo", "Inativos"],
                      ]
                    : [
                        ["todos", "Todos"],
                        ["ativo", "Ativos"],
                        ["inativo", "Inativos"],
                        ["suspenso", "Suspensos"],
                        ["arquivado", "Arquivados"],
                      ],
              },
              {
                label: "Tipo",
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  ["aluno", "Alunos"],
                  ["visitante", "Visitantes"],
                  ["todos", "Todos"],
                ],
              },
              {
                label: "Modalidade",
                value: modalityFilter,
                onChange: setModalityFilter,
                options: modalities.map((m) => [
                  m,
                  m === "todas" ? "Todas" : m,
                ]),
              },
            ].map(({ label, value, onChange, options, disabled }) => (
              <CustomSelect
                key={label}
                label={label}
                value={value}
                onChange={onChange}
                options={options}
                disabled={disabled}
              />
            ))}
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
            {isLoadingStudents ? (
              <div className="text-center py-16 text-gray-500">
                Carregando{" "}
                {typeFilter === "visitante" ? "visitantes" : "alunos"}...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Users
                  size={48}
                  strokeWidth={1.5}
                  className="mx-auto mb-4 opacity-20"
                />
                <p className="text-sm font-medium">
                  Nenhum {typeFilter === "visitante" ? "visitante" : "aluno"}{" "}
                  encontrado.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-black text-gray-500 tracking-wider bg-white/5">
                    <th className="py-3 px-5">
                      {typeFilter === "visitante" ? "Visitante" : "Aluno"}
                    </th>
                    <th className="py-3 px-5 text-center">Telefone</th>
                    {typeFilter !== "visitante" && (
                      <th className="py-3 px-5 text-center">PIN</th>
                    )}
                    <th className="py-3 px-5 text-center">Modalidade</th>
                    {typeFilter !== "visitante" && (
                      <th className="py-3 px-5 text-center">Pagamento</th>
                    )}
                    {typeFilter === "visitante" && (
                      <th className="py-3 px-5 text-center">Última Visita</th>
                    )}
                    {typeFilter === "visitante" && (
                      <th className="py-3 px-5 text-center">Visitas</th>
                    )}
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5 w-12 text-center text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-4">
                          {renderAvatar(student)}
                          <div className="flex flex-col">
                            <span className="text-sm text-app font-medium flex items-center gap-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                              {student.nome || student.name}
                              {student.medical && student.medical.trim() !== '' && (
                                <HeartPulse size={14} className="text-emerald-400" title="Possui Restrições Médicas" />
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                              {student.roles?.visitante && (
                                <span className="text-primary flex items-center gap-1 font-black mr-1">
                                  <User size={10} /> VISITANTE
                                </span>
                              )}
                              {student.belt && student.belt !== "none" ? (
                                <>
                                  {student.roles?.visitante && (
                                    <span className="opacity-30">·</span>
                                  )}
                                  {beltConfig[student.belt?.toLowerCase()]
                                    ?.label || student.belt}
                                  {student.stripes > 0
                                    ? ` · ${student.stripes} GRAUS`
                                    : ""}
                                </>
                              ) : (
                                !student.roles?.visitante && (() => {
                                  const val = student[FIELDS.MODALIDADES] || student.modalities || [];
                                  const single = student[FIELDS.MODALIDADE] || student.modality;
                                  const raw = [...(Array.isArray(val) ? val : [val]), single].filter(Boolean);
                                  const isOnlyBoxe = raw.length > 0 && raw.every(m => typeof m === 'string' && m.trim().toLowerCase() === 'boxe');
                                  
                                  if (isOnlyBoxe) return null;
                                  
                                  return <span>Sem faixa</span>;
                                })()
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center text-sm text-gray-300">
                        {student.phone ? (
                          <a
                            href={`https://wa.me/${student.telefone_completo || "55" + (student.phone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all font-mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Smartphone size={12} />
                            {student.phone}
                          </a>
                        ) : (
                          <span className="text-gray-600">--</span>
                        )}
                      </td>
                      {typeFilter !== "visitante" && (
                        <td className="py-4 px-5 text-center">
                          {canSeeStudents ? (
                            <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-mono text-emerald-400 tracking-[0.2em] min-w-[80px]">
                              {student.pin || fetchedPins[student.id] || "---"}
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-mono text-gray-700 tracking-widest min-w-[80px]">
                              ••••••
                            </div>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-mono text-gray-400 min-w-[80px]">
                          {(() => {
                            const val =
                              student[FIELDS.MODALIDADES] ||
                              student.modalities ||
                              [];
                            const single =
                              student[FIELDS.MODALIDADE] || student.modality;
                            const raw = [
                              ...(Array.isArray(val) ? val : [val]),
                              single,
                            ].filter(Boolean);

                            const mods = Array.from(
                              new Set(
                                raw.map((m) => {
                                  if (typeof m !== "string") return m;
                                  const t = m.trim();
                                  const lower = t.toLowerCase();
                                  if (
                                    lower === "jiu-jitsu" ||
                                    lower === "jiu jitsu" ||
                                    lower === "jiujitsu"
                                  )
                                    return "Jiu Jitsu";
                                  if (lower === "boxe") return "Boxe";
                                  if (
                                    lower === "muay thai" ||
                                    lower === "muay-thai"
                                  )
                                    return "Muay Thai";
                                  return t;
                                }),
                              ),
                            );

                            return mods.length > 0 ? (
                              mods.join(", ")
                            ) : (
                              <div className="relative group flex items-center justify-center cursor-help">
                                <div className="flex items-center justify-center text-rose-500 bg-rose-500/10 w-7 h-7 rounded-lg border border-rose-500/20">
                                  <AlertTriangle size={14} />
                                </div>
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none z-50 flex flex-col items-center">
                                  <div className="bg-[#111] border border-white/10 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                    Sem Modalidade
                                  </div>
                                  <div className="w-2 h-2 bg-[#111] border-b border-r border-white/10 transform rotate-45 -mt-1.5"></div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      {typeFilter !== "visitante" && (
                        <td className="py-4 px-5 text-center">
                          {(() => {
                            const studentBill = bills.find(
                              (b) =>
                                b.studentId === student.id &&
                                (b.status === "paid" ||
                                  b.status === "pending" ||
                                  b.status === "overdue"),
                            );
                            let paymentLabel = "---";
                            let paymentColor = "text-gray-400";

                            if (studentBill) {
                              const status = studentBill.status;
                              const statusConfig = {
                                paid: {
                                  label: "Pago",
                                  color: "text-emerald-400",
                                },
                                pending: {
                                  label: "Pendente",
                                  color: "text-rose-400",
                                },
                                overdue: {
                                  label: "Vencido",
                                  color: "text-rose-400",
                                },
                              };
                              const config =
                                statusConfig[status] || statusConfig.pending;
                              paymentLabel = config.label;
                              paymentColor = config.color;
                            }

                            return canSeeStudents ? (
                              <div
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-mono ${paymentColor} tracking-[0.2em] min-w-[80px]`}
                              >
                                {paymentLabel}
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-mono text-gray-700 tracking-widest min-w-[80px]">
                                ••••••
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      {typeFilter === "visitante" && (
                        <td className="py-4 px-5 text-center">
                          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">
                            {formatBR(
                              student.lastAttendanceAt || student.createdAt,
                            )}
                          </span>
                        </td>
                      )}

                      {typeFilter === "visitante" && (
                        <td className="py-4 px-5 text-center">
                          <VisitorAttendanceBadge
                            studentId={student.id}
                            createdAt={student.createdAt}
                          />
                        </td>
                      )}

                      <td className="py-4 px-5 text-center">
                        {renderStatusBadge(student)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const isVisitor = student.roles?.visitante;
                              const menuHeight = isVisitor ? 220 : 410;
                              const openUp =
                                window.innerHeight - rect.bottom < menuHeight;
                              setMenuPosition({
                                top: openUp
                                  ? rect.top + window.scrollY - menuHeight
                                  : rect.top + window.scrollY + rect.height + 4,
                                left:
                                  rect.left + window.scrollX - 160 + rect.width,
                                originY: openUp ? 1 : 0,
                              });
                              setShowMenu(
                                showMenu === student.id ? null : student.id,
                              );
                            }}
                            className={`p-2.5 rounded-xl transition-all active:scale-90 border border-transparent flex items-center justify-center mx-auto ${showMenu === student.id ? "bg-white/10 text-white border-white/10" : "hover:bg-white/10 text-white/20 hover:text-white hover:border-white/10"}`}
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
              {/* Exibindo total de aluno*/}
          {!isLoadingStudents && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-[11px] text-gray-600 font-bold text-center md:text-left w-full md:w-auto ml-1">
                Exibindo <span className="text-gray-400">{filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filtered.length)}</span> de <span className="text-gray-400">{filtered.length}</span> {typeFilter === "visitante" ? "visitante" : "aluno"}{filtered.length !== 1 ? "s" : ""}
              </p>

              {/* 
                CONTROLES DE PAGINAÇÃO
                Renderizado apenas quando o volume de alunos exigir 2 ou mais páginas.
              */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-transparent text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      
                      // Lógica de "Encurtamento Inteligente" numérico:
                      // Mostramos sempre: Página 1, Última Página e Adjacentes (Página atual -1 e +1)
                      const showPage = page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1;
                      
                      // Se a distância for exata de 2 blocos, substituimos o número intermediário por "..."
                      const showDotsBefore = page === currentPage - 2 && page > 1;
                      const showDotsAfter = page === currentPage + 2 && page < totalPages;
                      
                      if (showPage) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                              currentPage === page
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (showDotsBefore || showDotsAfter) {
                        return <span key={page} className="text-gray-600 text-xs px-1">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-transparent text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modais e Gavetas */}
      <AttendanceHistoryDrawer
        student={attendanceDrawerStudent}
        isOpen={!!attendanceDrawerStudent}
        onClose={() => setAttendanceDrawerStudent(null)}
      />

      <GraduationHistoryModal
        student={graduationModalStudent}
        isOpen={!!graduationModalStudent}
        onClose={() => setGraduationModalStudent(null)}
      />

      <PaymentDrawer
        student={paymentDrawerStudent}
        isOpen={!!paymentDrawerStudent}
        onClose={() => setPaymentDrawerStudent(null)}
      />

      {statusDialogStudent && (
        <StatusChangeDialog
          student={statusDialogStudent.student}
          action={statusDialogStudent.action}
          onConfirm={handleStatusChange}
          onClose={() => setStatusDialogStudent(null)}
        />
      )}

      {deleteDialogStudent && (
        <DeleteConfirmDialog
          student={deleteDialogStudent}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteDialogStudent(null)}
        />
      )}

      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailsModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onUpdate={updateStudentProfile}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <AddStudentModal
            isOpen={true}
            initialModality={modalityFilter !== "todas" ? modalityFilter : null}
            initialData={editData || duplicateData}
            initialType={typeFilter === "aluno" ? "aluno" : "visitante"}
            isDuplicate={!!duplicateData}
            onClose={() => {
              setShowModal(false);
              setEditData(null);
              setDuplicateData(null);
            }}
            onAdd={handleAddStudent}
          />
        )}
      </AnimatePresence>

      {showPinModal && (
        <PinVerificationModal
          onConfirm={() => {
            const { type, student } = pinModalAction;
            if (type === "view") {
              setShowPinModal(false);
              setSelectedStudent(student);
            } else if (type === "edit" || type === "convert") {
              setShowPinModal(false);
              if (type === "convert") {
                setEditData({ ...student, isPromoting: true });
              } else {
                setEditData(student);
              }
              setShowModal(true);
            } else if (type === "delete") {
              setShowPinModal(false);
              setDeleteDialogStudent(student);
            }
          }}
          onClose={() => setShowPinModal(false)}
          title="Confirmar Identidade"
          message={`Você está tentando ${pinModalAction?.type === "view" ? "visualizar" : pinModalAction?.type === "edit" ? "editar" : "excluir"} os dados de ${pinModalAction?.student?.nome || pinModalAction?.student?.name}.`}
        />
      )}

      {/* GLOBAL ACTIONS MENU PORTAL */}
      <AnimatePresence>
        {showMenu && (
          <StudentActionMenu
            student={filtered.find((s) => s.id === showMenu)}
            menuPosition={menuPosition}
            onClose={() => setShowMenu(null)}
            onAction={(actionType, student) => {
              if (actionType === "view") {
                setSelectedStudent(student);
              } else if (actionType === "attendance") {
                setAttendanceDrawerStudent(student);
              } else if (actionType === "duplicate") {
                setDuplicateData(student);
                setShowModal(true);
              } else if (actionType === "graduations") {
                setGraduationModalStudent(student);
              } else if (actionType === "cards") {
                setPaymentDrawerStudent(student);
              } else if (
                actionType === "edit" ||
                actionType === "delete" ||
                actionType === "convert"
              ) {
                if (student.roles?.visitante) {
                  if (actionType === "delete") {
                    setDeleteDialogStudent(student);
                  } else {
                    setEditData(
                      actionType === "convert"
                        ? { ...student, isPromoting: true }
                        : student,
                    );
                    setShowModal(true);
                  }
                } else {
                  setPinModalAction({ type: actionType, student });
                  setShowPinModal(true);
                }
              } else if (
                actionType === "inactive" ||
                actionType === "suspend" ||
                actionType === "archive"
              ) {
                const actionMap = {
                  inactive: "inativar",
                  suspend: "suspender",
                  archive: "arquivar",
                };
                setStatusDialogStudent({
                  student,
                  action: actionMap[actionType],
                });
              } else if (actionType === "active") {
                setStatusDialogStudent({ student, action: "reativar" });
              } else if (actionType === "unarchive") {
                setStatusDialogStudent({
                  student,
                  action: "remover arquivado",
                });
              }
              setShowMenu(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * StudentActionMenu - Renderiza o menu de ações de um aluno
 */
function StudentActionMenu({ student, menuPosition, onClose, onAction }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  if (!student) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
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
          onClick={(e) => e.stopPropagation()}
          className="hidden md:block absolute z-[1001] w-64 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            originX: 1,
            originY: menuPosition.originY,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction("edit", student);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <Edit2 size={14} className="text-orange-400" />
            </div>
            {student.roles?.visitante ? "Editar Perfil" : "Editar Aluno"}
          </button>
          {student.roles?.visitante && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("convert", student);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-all group font-medium"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <GraduationIcon size={14} className="text-primary" />
              </div>
              Converter em Aluno
            </button>
          )}
          {!student.roles?.visitante && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("duplicate", student);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Copy size={14} className="text-purple-400" />
                </div>
                Duplicar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("attendance", student);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <CalendarDays size={14} className="text-blue-400" />
                </div>
                Histórico de Presença
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("graduations", student);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <GraduationIcon size={14} className="text-emerald-400" />
                </div>
                Histórico de Graduações
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("cards", student);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <CreditCard size={14} className="text-indigo-400" />
                </div>
                Cartões / Financeiro
              </button>
            </>
          )}

          <div className="h-px bg-white/5 my-1" />

          {/* BOTÕES CONDICIONAIS POR STATUS */}
          {student.status === "ativo" && !student.roles?.visitante && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("inactive", student);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-500/10 hover:text-gray-300 transition-all group font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center group-hover:bg-gray-500/20 transition-colors">
                  <UserX size={14} className="text-gray-400" />
                </div>
                Inativar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("suspend", student);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-all group font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <UserMinus size={14} className="text-primary" />
                </div>
                Suspender
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("archive", student);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-500 hover:bg-blue-500/10 transition-all group font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Archive size={14} className="text-blue-500" />
                </div>
                Arquivar
              </button>
            </>
          )}

          {(student.status === "inativo" || student.status === "suspenso") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("active", student);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-all group font-medium"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle2 size={14} className="text-emerald-400" />
              </div>
              Reativar
            </button>
          )}

          {student.status === "arquivado" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("unarchive", student);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 transition-all group font-medium"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <ArchiveRestore size={14} className="text-blue-400" />
              </div>
              Remover Arquivado
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction("delete", student);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-all group font-medium"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <Trash2 size={14} className="text-red-500" />
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
            <div className="flex justify-center shrink-0 w-full mb-6">
              <div className="w-12 h-1.5 bg-white/10 rounded-full" />
            </div>

            <div className="flex items-center gap-4 mb-8 text-left">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-black text-lg border border-white/10">
                {student.photo ? (
                  <img
                    src={student.photo}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (student.nome || student.name || "A").charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-white truncate">
                  {student.nome || student.name}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {student.roles?.visitante
                    ? "Visitante da Academia"
                    : "Aluno da Academia"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("edit", student);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Edit2 size={20} className="text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">
                    {student.roles?.visitante
                      ? "Editar Perfil"
                      : "Editar Aluno"}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                    Alterar dados cadastrais
                  </p>
                </div>
              </button>

              {student.roles?.visitante && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction("convert", student);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 active:scale-95 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <GraduationIcon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-primary">
                      Converter em Aluno
                    </p>
                    <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest leading-none mt-1">
                      Transformar lead em matrícula
                    </p>
                  </div>
                </button>
              )}

              {!student.roles?.visitante && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction("duplicate", student);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Copy size={20} className="text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white">Duplicar</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                        Copiar informações
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction("attendance", student);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <CalendarDays size={20} className="text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white">Presença</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                        Ver histórico completo
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction("graduations", student);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <GraduationIcon size={20} className="text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white">
                        Graduações
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                        Histórico de faixas
                      </p>
                    </div>
                  </button>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction("inactive", student);
                  }}
                  className="w-full flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 active:scale-95 text-center transition-colors hover:bg-white/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <UserX size={16} className="text-gray-400" />
                  </div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Inativar
                  </p>
                </button>

                {!student.roles?.visitante && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction("suspend", student);
                      }}
                      className="w-full flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10 active:scale-95 text-center transition-colors hover:bg-primary/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserMinus size={16} className="text-primary" />
                      </div>
                      <p className="text-[11px] font-black text-primary uppercase tracking-widest">
                        Suspender
                      </p>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction("archive", student);
                      }}
                      className="w-full flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 active:scale-95 text-center transition-colors hover:bg-blue-500/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Archive size={16} className="text-blue-500" />
                      </div>
                      <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">
                        Arquivar
                      </p>
                    </button>
                  </>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction("delete", student);
                  }}
                  className={`w-full flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-red-500/5 border border-red-500/10 active:scale-95 text-center transition-colors hover:bg-red-500/10 ${student.roles?.visitante ? "col-span-1" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Trash2 size={16} className="text-red-500" />
                  </div>
                  <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">
                    Deletar
                  </p>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>,
    document.body,
  );
}
