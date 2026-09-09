import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
    BellRing,
    X,
    Bell,
    HelpCircle,
    RefreshCcw,
    Calendar
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import RichTextEditor from './RichTextEditor'

// Hook utilitário interno
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

const DAYS_OF_WEEK = [
    { id: 'seg', label: 'Seg' },
    { id: 'ter', label: 'Ter' },
    { id: 'qua', label: 'Qua' },
    { id: 'qui', label: 'Qui' },
    { id: 'sex', label: 'Sex' },
    { id: 'sab', label: 'Sáb' },
    { id: 'dom', label: 'Dom' },
]

function InlinePostForm({ onSave, onCancel, initialData, isInline, forceModal = false }) {
    const isMobile = useMediaQuery('(max-width: 768px)')
    const shouldShowAsModal = forceModal || isMobile;

    const [title, setTitle] = useState(initialData?.title || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [priority, setPriority] = useState(initialData?.priority || 'normal')
    const [types, setTypes] = useState(initialData?.types || (initialData?.type ? [initialData.type] : ['aviso']))
    const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(initialData?.endDate || new Date().toISOString().split('T')[0])
    const [startTime, setStartTime] = useState(initialData?.startTime || '09:00')
    const [endTime, setEndTime] = useState(initialData?.endTime || '10:00')
    const [isAllDay, setIsAllDay] = useState(initialData?.isAllDay || false)
    const [repeat, setRepeat] = useState(initialData?.repeat || 'none')
    const [notification, setNotification] = useState(initialData?.notification || { value: 30, unit: 'minutes' })
    const [diasSemana, setDiasSemana] = useState(initialData?.diasSemana || [])
    const editorRef = useRef(null)

    const toggleDay = (dayId) => {
        setDiasSemana(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        )
    }

    const onPublish = async (e) => {
        if (e) e.preventDefault();
        const currentContent = editorRef.current ? editorRef.current.innerHTML : description;
        if (!title.trim()) { toast.error('O título é obrigatório!'); return; }
        if (!currentContent.trim()) { toast.error('O conteúdo é obrigatório!'); return; }
        if (types.length === 0) { toast.error('Selecione pelo menos uma categoria!'); return; }
        await onSave({
            title,
            description: currentContent,
            priority,
            types,
            startDate,
            endDate,
            startTime: isAllDay ? '00:00' : startTime,
            endTime: isAllDay ? '23:59' : endTime,
            isAllDay,
            allDay: isAllDay,
            repeat,
            notification,
            diasSemana
        });
    };

    const formContent = (
        <motion.div
            {...(shouldShowAsModal ? {
                drag: "y",
                dragConstraints: { top: 0, bottom: 0 },
                dragElastic: 0.1,
                onDragEnd: (e, info) => {
                    if (info.offset.y > 80 || info.velocity.y > 400) onCancel();
                },
                initial: { y: "100%" },
                animate: { y: 0 },
                exit: { y: "100%" },
                transition: { type: 'spring', damping: 25, stiffness: 350, mass: 0.5 }
            } : {
                initial: { opacity: 0, y: -20, height: 0 },
                animate: { opacity: 1, y: 0, height: 'auto' },
                exit: { opacity: 0, y: -20, height: 0 },
                transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            })}
            onClick={e => e.stopPropagation()}
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
            className={shouldShowAsModal
                ? "modal-content modal-content-bottom-sheet relative max-w-2xl w-full flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden bg-[#0A0A0A] rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-2xl"
                : "bg-[#090909] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden mb-10 w-full flex flex-col"
            }
        >
            {/* Mobile Drag Handle (Only Modal) */}
            {shouldShowAsModal && (
                <div className="sm:hidden flex justify-center pt-4 pb-2 shrink-0">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                </div>
            )}

            {/* HEADER (APENAS MOBILE/MODAL) */}
            {shouldShowAsModal && (
                <div className={`p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0 ${!shouldShowAsModal && 'sm:p-6'}`}>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--clr-primary) 15%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                            }}
                        >
                            <BellRing size={24} className="md:w-[28px] md:h-[28px]" strokeWidth={2.5} style={{ color: 'var(--clr-primary)' }} />
                        </div>
                        <div>
                            <h2 className="text-[16px] md:text-xl font-black text-white uppercase tracking-tight leading-none">
                                {initialData ? 'Editar Postagem' : 'Nova Postagem'}
                            </h2>
                            <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                Estilo fórum
                            </p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95 bg-white/5 border border-white/5">
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* FORM BODY */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar scroll-smooth">
                {/* DATE & TIME (CALENDAR STYLE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex flex-col gap-3 flex-1">
                                    {/* Linha 1: Início */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-gray-300 outline-none focus:border-primary/50 flex-[2] min-w-0"
                                        />
                                        {!isAllDay && (
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-gray-300 outline-none focus:border-primary/50 flex-1 min-w-0"
                                            />
                                        )}
                                    </div>

                                    {/* Linha 2: Fim */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-gray-300 outline-none focus:border-primary/50 flex-[2] min-w-0"
                                        />
                                        {!isAllDay && (
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-gray-300 outline-none focus:border-primary/50 flex-1 min-w-0"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Lado Direito: ATÉ */}
                                <div className="flex items-center justify-center shrink-0 pr-2">
                                    <span className="text-gray-600 font-black text-[10px] uppercase tracking-widest">até</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 mt-4 sm:mt-0">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={isAllDay}
                                            onChange={e => setIsAllDay(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-primary transition-all" />
                                        <div className="absolute top-1 left-1 w-3 h-3 bg-gray-500 rounded-full peer-checked:translate-x-5 peer-checked:bg-black transition-all" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-widest">Dia Inteiro</span>
                                </label>

                                <div className="relative group/tooltip">
                                    <HelpCircle
                                        size={14}
                                        className="text-gray-600 hover:text-primary transition-colors cursor-help"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-[#111] border border-white/10 rounded-2xl text-[11px] text-gray-400 font-medium invisible group-hover/tooltip:visible group-active/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 group-active/tooltip:opacity-100 transition-all z-50 shadow-2xl pointer-events-none">
                                        <p className="mb-2 text-primary font-black uppercase tracking-widest text-[10px]">O que é isso?</p>
                                        <p className="leading-relaxed">
                                            Marque esta opção para avisos ou eventos que não têm um horário fixo e valem para o <span className="text-white">dia inteirinho</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <RefreshCcw size={14} className="text-gray-600" />
                                <select
                                    value={repeat}
                                    onChange={e => setRepeat(e.target.value)}
                                    className="bg-transparent text-[10px] font-black text-primary uppercase tracking-widest outline-none cursor-pointer"
                                >
                                    <option value="none" className="bg-[#0A0A0A]">Não se repete</option>
                                    <option value="daily" className="bg-[#0A0A0A]">Todos os dias</option>
                                    <option value="weekly" className="bg-[#0A0A0A]">Semanalmente</option>
                                    <option value="monthly" className="bg-[#0A0A0A]">Mensalmente</option>
                                </select>
                            </div>
                        </div>

                        {/* DIAS DA SEMANA */}
                        <div className="space-y-3 pt-2">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                Dias da Semana <span className="text-[8px] text-gray-700 font-normal normal-case tracking-normal">(para aparecer na agenda)</span>
                            </span>
                            <div className="grid grid-cols-7 gap-1.5">
                                {DAYS_OF_WEEK.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            diasSemana.includes(day.id)
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                                : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                                        }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-white/5 pt-6 sm:pt-0 sm:pl-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                <Bell size={16} className="text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notificar</span>
                                <input
                                    type="number"
                                    value={notification.value === 0 ? '' : notification.value}
                                    placeholder="0"
                                    onChange={e => {
                                        let valStr = e.target.value.replace(/\D/g, '');
                                        if (valStr === '') {
                                            setNotification({ ...notification, value: 0 });
                                            return;
                                        }
                                        const maxDigits = { minutes: 4, hours: 3, days: 2, weeks: 1 };
                                        const limit = maxDigits[notification.unit] || 4;
                                        if (valStr.length > limit) valStr = valStr.slice(0, limit);
                                        setNotification({ ...notification, value: parseInt(valStr) });
                                    }}
                                    className={`w-16 bg-white/5 border rounded-lg px-2 py-1 flex-1 sm:flex-none text-xs text-center font-bold text-white outline-none transition-all ${(notification.unit === 'minutes' && notification.value > 1000) ||
                                        (notification.unit === 'hours' && notification.value > 672) ||
                                        (notification.unit === 'days' && notification.value > 31) ||
                                        (notification.unit === 'weeks' && notification.value > 4)
                                        ? 'border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                        : 'border-white/10 focus:border-primary/50'
                                        }`}
                                />

                                {!isAllDay ? (
                                    <select
                                        value={notification.unit}
                                        onChange={e => {
                                            const newUnit = e.target.value;
                                            let newValue = notification.value;
                                            if (newUnit === 'hours' && newValue > 672) newValue = 672;
                                            if (newUnit === 'days' && newValue > 31) newValue = 31;
                                            if (newUnit === 'weeks' && newValue > 4) newValue = 4;
                                            if (newUnit === 'minutes' && newValue > 9999) newValue = 9999;
                                            setNotification({ ...notification, unit: newUnit, value: newValue });
                                        }}
                                        className="bg-transparent flex-1 sm:flex-none text-xs font-bold text-gray-300 uppercase tracking-widest outline-none"
                                    >
                                        <option value="minutes" className="bg-[#0A0A0A]">minutos</option>
                                        <option value="hours" className="bg-[#0A0A0A]">horas</option>
                                        <option value="days" className="bg-[#0A0A0A]">dias</option>
                                        <option value="weeks" className="bg-[#0A0A0A]">semanas</option>
                                    </select>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={notification.unit === 'weeks' ? 'weeks' : 'days'}
                                            onChange={e => setNotification({
                                                ...notification,
                                                unit: e.target.value,
                                                value: e.target.value === 'weeks' ? Math.min(notification.value, 4) : Math.min(notification.value, 31)
                                            })}
                                            className="bg-transparent text-xs font-bold text-gray-300 uppercase tracking-widest outline-none"
                                        >
                                            <option value="days" className="bg-[#0A0A0A]">dias</option>
                                            <option value="weeks" className="bg-[#0A0A0A]">semanas</option>
                                        </select>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">antes às</span>
                                        <input
                                            type="time"
                                            value={notification.time || '09:00'}
                                            onChange={e => setNotification({ ...notification, time: e.target.value })}
                                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 w-24 text-xs font-bold text-white outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CATEGORY & PRIORITY SELECTORS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Categoria</span>
                        <div className="grid grid-cols-2 p-1.5 bg-white/5 border border-white/5 rounded-3xl gap-2">
                            {[
                                { id: 'aviso', label: 'Aviso', icon: <BellRing size={14} /> },
                                { id: 'evento', label: 'Evento', icon: <Calendar size={14} /> }
                            ].map(cat => {
                                const isSelected = types.includes(cat.id)
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                if (types.length > 1) setTypes(types.filter(t => t !== cat.id))
                                            } else {
                                                setTypes([...types, cat.id])
                                            }
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isSelected
                                            ? 'bg-white/10 text-white border border-white/20 shadow-lg shadow-black/20'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent opacity-50'
                                            }`}
                                    >
                                        {cat.icon} {cat.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* PRIORIDADE */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Prioridade</span>
                        <div className="grid grid-cols-3 p-1.5 bg-white/5 border border-white/5 rounded-3xl gap-2">
                            {[
                                { id: 'normal', label: 'Normal' },
                                { id: 'alta', label: 'Alta' },
                                { id: 'urgente', label: 'Urgente' }
                            ].map(prio => (
                                <button
                                    key={prio.id}
                                    onClick={() => setPriority(prio.id)}
                                    className={`flex-1 py-3 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priority === prio.id
                                        ? prio.id === 'urgente'
                                            ? 'bg-primary text-black'
                                            : prio.id === 'alta'
                                                ? 'bg-yellow-500 text-black'
                                                : 'bg-white/30 text-white'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    {prio.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TITLE */}
                <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Título do Evento / Aviso</span>
                    <input
                        type="text"
                        placeholder="Digite o título principal aqui..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-5 rounded-3xl bg-white/[0.02] border border-white/5 text-white text-sm font-medium outline-none focus:border-primary/30 transition-all placeholder:text-gray-700"
                    />
                </div>

                {/* UNIFIED DESCRIPTION BOX */}
                <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Descrição Detalhada</span>
                    <RichTextEditor
                        ref={editorRef}
                        initialValue={initialData?.description || ''}
                        onChange={setDescription}
                        placeholder="Adicionar uma descrição..."
                    />
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className={`${shouldShowAsModal ? 'p-6 md:p-8' : 'p-4 md:p-5'} bg-[#0d0d0d] border-t border-white/5 flex gap-4 shrink-0 ${!shouldShowAsModal ? 'justify-end' : ''}`}>
                {shouldShowAsModal && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="button"
                    onClick={onPublish}
                    disabled={!title.trim() || !description.trim()}
                    className={`${shouldShowAsModal ? 'flex-[2] py-4 rounded-2xl' : 'w-fit px-10 py-3 rounded-xl'} text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white hover:text-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                        backgroundColor: 'var(--clr-primary)',
                        boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                    }}
                >
                    {initialData ? 'Salvar Alterações' : 'Publicar Agora'}
                </button>
            </div>
        </motion.div>
    );

    if (shouldShowAsModal) {
        return createPortal(
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 backdrop-blur-md bg-black/20 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
                style={{ willChange: 'opacity' }}
                onClick={onCancel}
            >
                {formContent}
            </motion.div>,
            document.body
        );
    }

    return formContent;
}

export default InlinePostForm;
