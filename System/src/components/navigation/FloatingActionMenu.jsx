import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, UserPlus, CalendarDays, Zap, 
  FileUp, X, GraduationCap, DollarSign, Info
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AddStudentModal from '../shared/AddStudentModal'
import { useStudents } from '../../hooks/useStudents'
import { useApp } from '../../context/AppContext'
import { useModalities } from '../../hooks/useModalities'
import ModalityModal from '../../modules/modalities/components/ModalityModal'
import ClassModal from '../../modules/modalities/components/ClassModal'

const FloatingActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { effectiveRole } = useAuth()
  const { addStudent } = useStudents()
  const { currentModality } = useApp()
  const { addModality, addClass } = useModalities()
  
  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddModality, setShowAddModality] = useState(false)
  const [showAddClass, setShowAddClass] = useState(false)

  if (effectiveRole === 'aluno') return null

  const actions = [
    { 
      label: 'Novo Aluno', 
      icon: UserPlus, 
      color: 'bg-emerald-500', 
      onClick: () => { setShowAddStudent(true); setIsOpen(false); },
      roles: ['admin', 'gestor', 'professor']
    },
    { 
      label: 'Nova Turma', 
      icon: CalendarDays, 
      color: 'bg-blue-500', 
      onClick: () => { setShowAddClass(true); setIsOpen(false); },
      roles: ['admin', 'gestor', 'professor']
    },
    { 
      label: 'Nova Modalidade', 
      icon: Zap, 
      color: 'bg-amber-500', 
      onClick: () => { setShowAddModality(true); setIsOpen(false); },
      roles: ['admin', 'gestor']
    },
    { 
      label: 'Importar Dados', 
      icon: FileUp, 
      color: 'bg-purple-500', 
      onClick: () => { alert('Funcionalidade de importação disponível em breve no Dashboard Desktop.'); setIsOpen(false); },
      roles: ['admin', 'gestor']
    }
  ].filter(a => a.roles.includes(effectiveRole))

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[120] md:hidden">
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-16 right-0 mb-4 flex flex-col items-end gap-4">
              {actions.map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-[#111] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xll border border-white/10 shadow-2xl">
                    {action.label}
                  </span>
                  <button
                    onClick={action.onClick}
                    className={`w-12 h-12 rounded-xll ${action.color} text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform`}
                  >
                    <action.icon size={20} strokeWidth={2.5} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-90 ${isOpen ? 'bg-white text-black rotate-45' : 'bg-primary text-white'}`}
        >
          {isOpen ? <X size={32} strokeWidth={3} /> : <Plus size={32} strokeWidth={3} />}
        </button>

        {/* Overlay when menu is open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[-1]" 
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modals with proper hooks connected */}
      <AnimatePresence>
        {showAddStudent && (
          <AddStudentModal 
            onClose={() => setShowAddStudent(false)} 
            onAdd={async (data, mod, opts) => {
              await addStudent(data, mod || currentModality, opts)
              setShowAddStudent(false)
            }}
          />
        )}
        
        {showAddModality && (
          <ModalityModal 
            isOpen={showAddModality} 
            onClose={() => setShowAddModality(false)}
            onSave={async (data) => {
              await addModality(data)
              setShowAddModality(false)
            }}
          />
        )}

        {showAddClass && (
          <ClassModal 
            isOpen={showAddClass} 
            onClose={() => setShowAddClass(false)}
            onSave={async (data) => {
              // Note: activeModalityId needs to be handled if null
              // ClassModal should probably allow picking modality if modalityId is null
              if (data.modalityId) {
                await addClass(data.modalityId, data)
              }
              setShowAddClass(false)
            }}
            modalityId={null} 
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingActionMenu

