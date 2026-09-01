import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Edit2, Trash2, BellRing } from 'lucide-react'

function NoticeActionMenu({ notice, menuPosition, onClose, onEdit, onDelete }) {
    if (!notice) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none"
                onClick={onClose}
            />

            {/* Desktop Dropdown */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="hidden md:block absolute z-[1001] w-56 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
                style={{
                    top: menuPosition?.top,
                    left: menuPosition?.left,
                    originX: 1
                }}
            >
                <button onClick={() => { onEdit(notice); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all group font-medium text-left">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Edit2 size={14} className="group-hover:text-primary transition-colors" />
                    </div>
                    Editar Comunicado
                </button>
                <button onClick={() => { onDelete(notice); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-all group font-medium text-left">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Trash2 size={14} />
                    </div>
                    Apagar Permanente
                </button>
            </motion.div>

            {/* Mobile Bottom Sheet (Padrão Aba Aluno) */}
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

                    <div className="flex items-center gap-4 mb-8">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--clr-primary) 15%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--clr-primary) 30%, transparent)'
                            }}
                        >
                            <BellRing size={22} style={{ color: 'var(--clr-primary)' }} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-base font-black text-white truncate uppercase tracking-tight">{notice.title}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Ações Disponíveis</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => { onEdit(notice); onClose(); }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 active:scale-95 transition-all text-left"
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center border"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--clr-primary) 10%, transparent)',
                                    borderColor: 'color-mix(in srgb, var(--clr-primary) 20%, transparent)'
                                }}
                            >
                                <Edit2 size={20} style={{ color: 'var(--clr-primary)' }} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase tracking-wider">Editar Postagem</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Alterar conteúdo ou datas</p>
                            </div>
                        </button>

                        <button
                            onClick={() => { onDelete(notice); onClose(); }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 active:scale-95 transition-all text-left group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:bg-red-500/20 transition-all">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-red-500 uppercase tracking-wider">Apagar Comunicado</p>
                                <p className="text-[10px] text-red-900 font-bold uppercase tracking-widest leading-none mt-1">Esta ação é irreversível</p>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>,
        document.body
    );
}

export default NoticeActionMenu;
