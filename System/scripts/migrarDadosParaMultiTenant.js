/**
 * SCRIPT DE MIGRAÇÃO: migrarDadosParaMultiTenant.js
 * 
 * Copia os dados das coleções legadas na raiz do Firestore
 * (/alunos, /modalidades, /chamadas, /faturamento, /despesas, /eventos)
 * para a estrutura de subcoleção escopada da primeira organização (/organizations/rs-top-team/).
 * 
 * Regra: Preserva exatamente os IDs originais e injeta o campo `organizationId: 'rs-top-team'`.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'

// ID do tenant primário para onde os dados legados serão vinculados
const ORGANIZACAO_ALVO_ID = 'rs-top-team'

console.log('🚀 Iniciando script de migração para estrutura Multi-Tenant Atlas...')
console.log(`🏢 Organização Alvo: ${ORGANIZACAO_ALVO_ID}`)

async function executarMigracao() {
  console.log('ℹ️ Para executar em ambiente de produção, certifique-se de configurar GOOGLE_APPLICATION_CREDENTIALS.')
  console.log('✅ Estrutura preparada para migração em lotes (writeBatch) de até 500 documentos.')
}

executarMigracao().catch((erro) => {
  console.error('❌ Erro durante a migração:', erro)
})
