/**
 * SCRIPT DE SEED INICIAL (Multi-Tenant Atlas)
 * 
 * Cria o documento da organização primária `rs-top-team` no Firestore
 * e uma membership de Owner para o admin principal.
 * 
 * USO:
 *   node scripts/inicializarOrganizacaoPrimaria.js
 * 
 * REQUISITO: Definir a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS
 * com o caminho para a Service Account do Firebase.
 * 
 * OU execute manualmente no Console do Firestore conforme as instruções abaixo.
 */

const { initializeApp, cert } = await import('firebase-admin/app')
const { getFirestore, Timestamp } = await import('firebase-admin/firestore')

// ── Configuração ────────────────────────────────────────────────────────────
const ORGANIZACAO_ID    = 'rs-top-team'
const ORGANIZACAO_NOME  = 'RS Top Team'
const ADMIN_EMAIL       = 'pmadsonm@gmail.com'
// UID do admin no Firebase Authentication (cole aqui após consultar o console Firebase)
const ADMIN_UID         = 'SEU_UID_AQUI'

// ── Inicializa Firebase Admin ───────────────────────────────────────────────
initializeApp()
const db = getFirestore()

async function executarSeed() {
  console.log('🌱 Iniciando seed da organização primária Atlas...')
  
  const refOrganizacao = db.collection('organizations').doc(ORGANIZACAO_ID)
  const refMembership  = db.collection('memberships').doc(`${ADMIN_UID}_${ORGANIZACAO_ID}`)
  const refMembro      = refOrganizacao.collection('members').doc(ADMIN_UID)

  const agora = Timestamp.now()

  // 1. Cria o documento da organização
  await refOrganizacao.set({
    nome:        ORGANIZACAO_NOME,
    slug:        ORGANIZACAO_ID,
    status:      'ativo',
    plano:       'starter',
    criadoEm:    agora,
    atualizadoEm: agora
  }, { merge: true })
  console.log(`✅ Organização "${ORGANIZACAO_NOME}" (${ORGANIZACAO_ID}) criada.`)

  // 2. Cria a membership global do admin
  await refMembership.set({
    userId:         ADMIN_UID,
    organizationId: ORGANIZACAO_ID,
    role:           'owner',
    email:          ADMIN_EMAIL,
    criadoEm:       agora
  }, { merge: true })
  console.log(`✅ Membership global criada para ${ADMIN_EMAIL}.`)

  // 3. Cria o membro na subcoleção da organização
  await refMembro.set({
    userId: ADMIN_UID,
    email:  ADMIN_EMAIL,
    role:   'owner',
    criadoEm: agora
  }, { merge: true })
  console.log(`✅ Membro "${ADMIN_EMAIL}" adicionado como owner na organização.`)

  console.log('\n🎉 Seed concluído com sucesso! A plataforma Atlas está pronta para uso.')
}

executarSeed().catch(console.error)
