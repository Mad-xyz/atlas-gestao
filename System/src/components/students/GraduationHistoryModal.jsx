import React, { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query, updateDoc, doc, deleteDoc, where } from 'firebase/firestore'
import { GraduationCap, Plus, X, Trophy, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { beltConfig } from '../../data/beltConfig'
import { useHideMobileNav } from '../../hooks/useHideMobileNav'
import { COLLECTIONS } from '../../firebase/collections'

const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black']

function getBeltInfo(beltId, dynamicBelts) {
  if (dynamicBelts && dynamicBelts.length > 0) {
    const found = dynamicBelts.find(b => b.id === beltId)
    if (found) {
      return {
        label: found.name || beltId,
        color: found.color || '#ffffff',
        bgClass: 'bg-[color:' + (found.color || '#fff') + ']',
        textColor: '#111111'
      }
    }
  }
  return beltConfig[beltId] || beltConfig['white']
}

function timeDiff(from, to) {
  if (!from || !to) return null
  const diff = Math.abs(to - from)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 30) return days + ' dias'
  const m = Math.floor(days / 30)
  if (m < 12) return m + ' mes' + (m > 1 ? 'es' : '')
  const y = Math.floor(m / 12)
  const rem = m % 12
  let result = y + ' ano' + (y > 1 ? 's' : '')
  if (rem > 0) {
    result += ' e ' + rem + ' mes' + (rem > 1 ? 'es' : '')
  }
  return result
}

export default function GraduationHistoryModal({ student, isOpen, onClose }) {
  useHideMobileNav(isOpen)
  const [records, setRecords] = useState([])
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ belt: 'white', stripes: 0, professor: '', date: new Date().toISOString().split('T')[0], notes: '' })
  const [dynamicBelts, setDynamicBelts] = useState([])
  const [loadingBelts, setLoadingBelts] = useState(false)

  useEffect(() => {
    if (showForm && student) {
      const initialBelt = (student.belt === 'none' || !student.belt) ? 'white' : student.belt
      setForm(prev => ({
        ...prev,
        belt: initialBelt,
        stripes: student.stripes || 0,
        date: new Date().toISOString().split('T')[0]
      }))
    }
  }, [showForm, student?.id])

  async function loadProfessors() {
    try {
      const snap = await getDocs(collection(db, 'equipe'))
      const list = snap.docs.map(d => d.data().name).filter(Boolean)
      setProfessors([...new Set(list)])
    } catch (err) { console.error(err) }
  }

  async function loadDynamicBelts() {
    if (!student) return
    setLoadingBelts(true)
    try {
      const modalityName = student.modalityPrimary || (student.modalities && student.modalities[0]) || 'Jiu Jitsu'
      const ageCategory = student.ageCategory || 'Adulto'
      
      const q = query(collection(db, COLLECTIONS.MODALIDADES), where('name', '==', modalityName))
      const snap = await getDocs(q)
      
      if (!snap.empty) {
        const modalityData = snap.docs[0].data()
        const beltSystem = modalityData.beltSystem
        
        if (beltSystem?.categories) {
          const category = beltSystem.categories.find(cat => 
            cat.name?.toLowerCase() === ageCategory.toLowerCase() || 
            cat.id?.includes(ageCategory.toLowerCase())
          )
          
          if (category?.belts && category.belts.length > 0) {
            setDynamicBelts(category.belts)
            return
          }
        }
      }
      
      setDynamicBelts([])
    } catch (err) {
      console.error('Erro ao carregar faixas dinamicas:', err)
      setDynamicBelts([])
    } finally {
      setLoadingBelts(false)
    }
  }

  async function loadRecords() {
    if (!student?.id) return
    setLoading(true)
    try {
      const ref = collection(db, 'usuarios', student.id, 'graduacoes')
      const snap = await getDocs(ref)

      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      list.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        if (dateB !== dateA) return dateB - dateA
        
        const creatA = a.createdAt?.seconds || 0
        const creatB = b.createdAt?.seconds || 0
        return creatB - creatA
      })

      setRecords(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadRecords()
      loadProfessors()
      loadDynamicBelts()
    }
  }, [isOpen, student?.id])

  async function handleSave() {
    let beltToSave = form.belt
    let beltLabel = form.belt
    
    if (dynamicBelts.length > 0) {
      const foundBelt = dynamicBelts.find(b => b.id === form.belt)
      if (foundBelt) {
        beltLabel = foundBelt.name || form.belt
      }
    } else {
      beltLabel = beltConfig[form.belt]?.label || form.belt
    }

    const lastRecord = records[0]
    
    const getBeltIndex = (beltId) => {
      if (dynamicBelts.length > 0) {
        return dynamicBelts.findIndex(b => b.id === beltId)
      }
      return BELT_ORDER.indexOf(beltId)
    }
    
    const currentBeltIdx = getBeltIndex(form.belt)
    const lastBeltIdx = lastRecord ? getBeltIndex(lastRecord.belt) : -1
    const currentStripes = Number(form.stripes)
    const lastStripes = lastRecord ? Number(lastRecord.stripes) : 0

    if (lastRecord && form.belt === lastRecord.belt && currentStripes === lastStripes) {
      alert('Este aluno ja possui a faixa ' + beltLabel + ' com ' + currentStripes + ' graus registrada.')
      return
    }

    const isBeltRegression = currentBeltIdx < lastBeltIdx
    const isStripeRegression = currentBeltIdx === lastBeltIdx && currentStripes < lastStripes

    if (isBeltRegression || isStripeRegression) {
      const confirmed = window.confirm(
        'ATENCAO: Voce esta registrando uma graduacao INFERIOR a atual.\n\nDeseja realmente retroceder a graduacao do aluno no historico?'
      )
      if (!confirmed) return
    }

    if (!form.professor.trim()) {
      alert('Por favor, informe o nome do professor responsavel.')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'usuarios', student.id, 'graduacoes'), {
        belt: beltToSave,
        beltLabel: beltLabel,
        stripes: currentStripes,
        professor: form.professor.trim(),
        date: form.date,
        notes: form.notes,
        createdAt: serverTimestamp()
      })

      await updateDoc(doc(db, 'usuarios', student.id), {
        belt: beltToSave,
        'jornada_tecnica.faixa_atual': beltToSave,
        stripes: currentStripes,
        'jornada_tecnica.graus_atuais': currentStripes,
        lastGraduationDate: form.date,
        updatedAt: serverTimestamp()
      })

      setShowForm(false)
      setForm({ belt: 'white', stripes: 0, professor: '', date: new Date().toISOString().split('T')[0], notes: '' })
      loadRecords()
    } catch (err) {
      console.error('Erro ao graduar aluno:', err)
      alert('Erro ao salvar: ' + (err.message || 'Verifique sua conexao.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRecord(id) {
    if (!window.confirm('Deseja realmente excluir este registro de graduacao?')) return
    try {
      await deleteDoc(doc(db, 'usuarios', student.id, 'graduacoes', id))
      loadRecords()
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir registro')
    }
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="modal-backdrop z-[9990]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="modal-content modal-content-bottom-sheet relative max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="md:hidden flex justify-center pt-4 pb-2 shrink-0">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <GraduationCap size={18} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Historico de Graduacoes</h2>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest">{student?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowForm(v => !v)}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold"
              >
                <Plus size={14} /> Nova Graduacao
              </button>
              <button onClick={onClose} className="p-2 rounded-2xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {showForm && (
            <div className="px-6 py-4 bg-black border-b border-white/10 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--clr-primary)' }}>Nova Graduacao</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Faixa</label>
                  {loadingBelts ? (
                    <div className="form-input bg-black/60 text-sm py-2 rounded-2xl text-gray-500">Carregando faixas...</div>
                  ) : (
                    <select
                      value={form.belt}
                      onChange={e => setForm(p => ({ ...p, belt: e.target.value }))}
                      className="form-input bg-black/60 text-sm py-2 rounded-2xl appearance-none cursor-pointer"
                    >
                      {dynamicBelts.length > 0 ? (
                        dynamicBelts.map(belt => (
                          <option key={belt.id} value={belt.id} className="bg-[#111111]" style={{ color: belt.color || '#fff' }}>
                            {belt.name || belt.id}
                          </option>
                        ))
                      ) : (
                        BELT_ORDER.map(b => <option key={b} value={b} className="bg-[#111111]">{beltConfig[b]?.label || b}</option>)
                      )}
                    </select>
                  )}
                </div>
                <div>
                  <label className="form-label">Graus</label>
                  <select
                    value={form.stripes}
                    onChange={e => setForm(p => ({ ...p, stripes: e.target.value }))}
                    className="form-input bg-black/60 text-sm py-2 rounded-2xl appearance-none cursor-pointer"
                  >
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n} className="bg-[#111111]">{n} grau{n !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <label className="form-label">Professor</label>
                  <input
                    list="professors-list"
                    value={form.professor}
                    onChange={e => {
                      const val = e.target.value.replace(/[^a-zA-Z\u00C0-\u00FF\s]/g, '')
                      setForm(p => ({ ...p, professor: val }))
                    }}
                    className="form-input bg-black/60 text-sm py-2 rounded-2xl"
                    placeholder="Nome do Mestre"
                  />
                  <datalist id="professors-list">
                    {professors.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div>
                  <label className="form-label">Data</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input bg-black/60 text-sm py-2 rounded-2xl" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="form-label">Observacoes</label>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="form-input bg-black/60 text-sm py-2 w-full rounded-2xl" placeholder="Ex: Aprovado na avaliacao tecnica" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-2xl text-sm text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 btn-primary py-2 rounded-2xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
                >
                  {saving ? 'Salvando...' : 'Salvar Graduacao'}
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Trophy size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhuma graduacao registrada ainda.</p>
                <p className="text-xs text-gray-600 mt-1">Clique em "Nova Graduacao" para adicionar.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
                <div className="space-y-6 pl-14">
                  {records.map((rec, i) => {
                    const cfg = getBeltInfo(rec.belt, dynamicBelts)
                    const olderRecord = records[i + 1]
                    const newerRecord = records[i - 1]
                    
                    const currentDate = new Date(rec.date)
                    const upperLimitDate = newerRecord ? new Date(newerRecord.date) : new Date()
                    const duration = timeDiff(currentDate, upperLimitDate)
                    
                    return (
                      <div key={rec.id} className="relative">
                        <div
                          className={`absolute -left-9 top-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center shadow-lg ${!dynamicBelts.length ? cfg.bgClass : ''}`}
                          style={dynamicBelts.length > 0 ? { backgroundColor: cfg.color || '#ffffff' } : { boxShadow: '0 0 10px rgba(255,255,255,0.2)' }}
                        />
                        <div className="bg-white/5 rounded-[24px] p-4 border border-white/8 group/item relative">
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="absolute top-4 right-4 p-2 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 rounded-lg"
                            title="Excluir Registro"
                          >
                            <Trash2 size={14} />
                          </button>

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${!dynamicBelts.length ? cfg.bgClass : ''}`} style={dynamicBelts.length > 0 ? { backgroundColor: cfg.color || '#fff', color: cfg.textColor } : {}}>
                                {cfg.label}{rec.stripes > 0 ? ' · ' + rec.stripes + 'g' : ''}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500">
                              {new Date(rec.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {rec.professor && (
                            <p className="text-[11px] text-gray-400">
                              <span className="text-gray-600">Professor: </span>{rec.professor}
                            </p>
                          )}
                          {rec.notes && <p className="text-[11px] text-gray-400 mt-1 italic">{rec.notes}</p>}
                          {duration && (
                            <p className="text-[10px] text-gray-600 mt-2 border-t border-white/5 pt-2">
                              {i === 0 ? 'Tempo nesta faixa:' : 'Permaneceu:'} {duration}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
