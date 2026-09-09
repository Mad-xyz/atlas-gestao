/**
 * definirClaimSuperAdmin.mjs
 * ──────────────────────────────────────────────────────────────
 * Script de execução ÚNICA para definir o Custom Claim de
 * Super Admin no Firebase Authentication.
 *
 * O Custom Claim { admin: true } é gravado diretamente no token
 * JWT do usuário — invisível no Firestore, impossível de forjar.
 *
 * COMO USAR:
 * 1. Baixe a Service Account no Firebase Console:
 *    → Configurações do projeto → Contas de serviço → Gerar nova chave privada
 * 2. Salve o arquivo .json como: scripts/serviceAccount.json
 * 3. Execute no terminal:
 *    node scripts/definirClaimSuperAdmin.mjs
 *
 * ATENÇÃO:
 * ─ NUNCA commite o arquivo serviceAccount.json no Git.
 * ─ Adicione "scripts/serviceAccount.json" ao .gitignore antes de executar.
 * ─ Após executar, faça logout e login novamente para o claim aparecer.
 */

import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Configuração ──────────────────────────────────────────────────────────────

// E-mail real da conta do dono da plataforma no Firebase Auth
const EMAIL_DO_DONO = 'pmadsonm@gmail.com'

// Caminho para o arquivo da Service Account (nunca commitar!)
const CAMINHO_SERVICE_ACCOUNT = join(__dirname, 'serviceAccount.json')

// ── Inicialização do Firebase Admin SDK ──────────────────────────────────────

let credencial
try {
  credencial = JSON.parse(readFileSync(CAMINHO_SERVICE_ACCOUNT, 'utf-8'))
} catch (erro) {
  console.error('\n❌ Arquivo serviceAccount.json não encontrado em scripts/')
  console.error('   Baixe em: Firebase Console → Configurações do projeto → Contas de serviço')
  console.error('   Clique em "Gerar nova chave privada" e salve como scripts/serviceAccount.json')
  process.exit(1)
}

initializeApp({ credential: cert(credencial) })

const autenticacaoAdmin = getAuth()
const bancoDados = getFirestore()

// ── Função principal ──────────────────────────────────────────────────────────

async function definirSuperAdmin() {
  console.log(`\n🔍 Buscando usuário: ${EMAIL_DO_DONO}`)

  let registroUsuario
  try {
    registroUsuario = await autenticacaoAdmin.getUserByEmail(EMAIL_DO_DONO)
  } catch (erro) {
    console.error(`\n❌ Usuário "${EMAIL_DO_DONO}" não encontrado no Firebase Auth.`)
    console.error('   Verifique se o e-mail está correto e o usuário existe no Firebase Console.')
    process.exit(1)
  }

  const { uid, email, displayName } = registroUsuario
  console.log(`✅ Usuário encontrado:`)
  console.log(`   UID    : ${uid}`)
  console.log(`   E-mail : ${email}`)
  console.log(`   Nome   : ${displayName || '(sem nome definido)'}`)

  // Verifica se o claim já existe — evita operação desnecessária
  const claimsAtuais = registroUsuario.customClaims || {}
  if (claimsAtuais.admin === true) {
    console.log('\n⚠️  Custom Claim { admin: true } já está definido para este usuário.')
    console.log('   Nenhuma alteração necessária. Tudo certo!')
    return
  }

  // Define o Custom Claim no Firebase Auth
  // ─ Invisível no Firestore (nenhuma academia vê)
  // ─ Assinado pelo servidor Firebase (impossível de forjar)
  console.log('\n🔐 Definindo Custom Claim { admin: true } no Firebase Auth...')
  await autenticacaoAdmin.setCustomUserClaims(uid, { admin: true })
  console.log('✅ Custom Claim definido com sucesso!')

  // Registra evento como log de auditoria no Firestore
  // (coleção logs_sistema protegida por isAdmin() nas Security Rules)
  try {
    await bancoDados.collection('logs_sistema').add({
      tipo: 'SUPER_ADMIN_CLAIM_DEFINIDO',
      uid,
      email,
      definitoEm: new Date().toISOString(),
      descricao: 'Custom Claim de Super Admin definido via script local seguro.',
    })
    console.log('📋 Evento registrado em logs_sistema (auditoria).')
  } catch (erroLog) {
    // Falha no log não impede o resultado principal
    console.warn('⚠️  Log de auditoria não gravado:', erroLog.message)
  }

  console.log('\n════════════════════════════════════════════════════════')
  console.log('🎉 SUPER ADMIN CONFIGURADO COM SUCESSO')
  console.log('════════════════════════════════════════════════════════')
  console.log(`   Conta : ${email}`)
  console.log(`   UID   : ${uid}`)
  console.log('\n📌 PRÓXIMO PASSO OBRIGATÓRIO:')
  console.log('   Faça logout e login novamente com esta conta.')
  console.log('   O token JWT precisa ser renovado para carregar o claim.')
  console.log('════════════════════════════════════════════════════════\n')
}

definirSuperAdmin().catch((erro) => {
  console.error('\n❌ Erro inesperado:')
  console.error(erro.message || erro)
  process.exit(1)
})
