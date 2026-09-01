import { db } from '../firebase/config'
import { 
  collection, query, where, getDocs, orderBy, limit, updateDoc, serverTimestamp 
} from 'firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'

const normalizeText = (text) => {
  if (!text) return ''
  return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Ajusta a cobrança pendente do aluno quando suas modalidades mudam.
 * Called when a student leaves or enters a modality.
 * @param {string} studentId - ID do aluno
 * @param {string[]} newModalities - Novas modalidades do aluno
 * @param {Array} modalitiesConfig - Configuração de preços das modalidades (do useModalities)
 */
export async function adjustBillForModalityChange(studentId, newModalities, modalitiesConfig) {
  if (!studentId || !Array.isArray(newModalities) || !Array.isArray(modalitiesConfig)) {
    console.log('[Cobrança] Parâmetros inválidos para ajuste')
    return
  }

  try {
    const today = new Date()
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    const q = query(
      collection(db, COLLECTIONS.FATURAMENTO),
      where('studentId', '==', studentId),
      where('status', '==', 'pending'),
      orderBy('dueDate', 'desc'),
      limit(1)
    )

    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log('[Cobrança] Nenhuma cobrança pendente encontrada para ajuste')
      return
    }

    const cobrancaDoc = snapshot.docs[0]
    const cobrancaData = cobrancaDoc.data()

    // Verificar se a cobrança é do mês atual
    const cobrancaDueDate = new Date(cobrancaData.dueDate + 'T00:00:00')
    if (cobrancaDueDate < currentMonthStart || cobrancaDueDate > currentMonthEnd) {
      console.log('[Cobrança] Cobrança pendente não é do mês atual, não precisa ajustar')
      return
    }

    // Calcular novo valor baseado nas novas modalidades
    const cat = (cobrancaData.ageCategory || 'Adulto').toLowerCase()
    let novoValor = 0

    newModalities.forEach(modName => {
      const normalizedSearch = normalizeText(modName)
      const modConfig = modalitiesConfig.find(m => 
        normalizeText(m.name) === normalizedSearch || 
        normalizeText(m.id) === normalizedSearch ||
        normalizeText(m.slug) === normalizedSearch
      )
      if (modConfig && modConfig.pricing && modConfig.pricing[cat]) {
        const rule = modConfig.pricing[cat]
        if (rule.enabled) {
          novoValor += Number(rule.price) || 0
        }
      }
    })

    // Verificar se o valor mudou
    const valorAtual = Number(cobrancaData.amount) || 0
    if (novoValor !== valorAtual && novoValor > 0) {
      await updateDoc(doc(db, COLLECTIONS.FATURAMENTO, cobrancaDoc.id), {
        amount: novoValor,
        modalities: newModalities,
        updatedAt: serverTimestamp()
      })
      console.log(`[Cobrança] Valor ajustado de R$${valorAtual} para R$${novoValor}`)
      return true
    } else if (novoValor === 0) {
      console.log('[Cobrança] Nova modalidade sem preço definido, cobrança não alterada')
    }
    
    return false
  } catch (error) {
    console.error('[Cobrança] Erro ao ajustar cobrança:', error)
    return false
  }
}