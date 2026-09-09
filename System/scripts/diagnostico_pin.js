/**
 * Diagnóstico: Onde estão os PINs?
 * 
 * Verifica:
 *  - Root document `usuarios/{id}` contém campo `pin`?
 *  - Subcollection `usuarios/{id}/privado/segredos` contém campo `pin`?
 *  - Os IDs dos documentos correspondem ao esperado?
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(readFileSync(join(__dirname, '..', 'firebase-key.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function diagnostic() {
  console.log('🔍 Diagnóstico de PINs\n');

  // 1. Todos os usuários da coleção 'usuarios'
  const usuariosSnap = await db.collection('usuarios').get();
  const totalDocs = usuariosSnap.docs.length;
  console.log(`📋 Coleção 'usuarios': ${totalDocs} docs (TODOS)\n`);

  let countNoEmail = 0, countNoPin = 0, countSubOk = 0, countSubMissing = 0;

  for (const docSnap of usuariosSnap.docs) {
    const id = docSnap.id;
    const data = docSnap.data();
    const isEmail = id.includes('@');
    const hasRootPin = 'pin' in data || 'PIN' in data;
    const rootPin = data.pin || data.PIN || null;

    // Verifica subcoleção
    const segSnap = await db.collection('usuarios').doc(id).collection('privado').doc('segredos').get();
    const hasSubPin = segSnap.exists && ('pin' in segSnap.data());
    const subPin = segSnap.exists ? segSnap.data().pin || null : null;

    const status = [];
    if (!isEmail) { status.push('⚠️ ID AUTO-GERADO'); countNoEmail++; }
    if (hasRootPin) status.push('ROOT-PIN');
    if (hasSubPin) { status.push('SUB-PIN'); countSubOk++; }
    if (!hasRootPin && !hasSubPin) { status.push('❌ SEM PIN'); countNoPin++; countSubMissing++; }

    if (totalDocs <= 20) {
      console.log(`  👤 ${id}`);
      console.log(`     ${status.join(' | ')}`);
      if (hasRootPin) console.log(`     Root pin: ${rootPin}`);
      if (hasSubPin) console.log(`     Sub pin: ${subPin}`);
      console.log(`     Nome: ${data.nome || data.name || '---'}`);
      console.log(`     Email: ${data.email || '---'}`);
      console.log('');
    }
  }

  console.log(`\n📊 RESUMO:`);
  console.log(`   Total: ${totalDocs} usuários`);
  console.log(`   IDs auto-gerados (sem @): ${countNoEmail}`);
  console.log(`   Com PIN na subcoleção: ${countSubOk}`);
  console.log(`   Sem PIN (subcoleção ausente): ${countSubMissing}`);
  console.log(`   Root PIN existente: ${/* counted inline */ '0'} (0 — todos migrados ou sem)`);

  // 2. Verifica se existem documentos na coleção 'alunos'
  const alunosSnap = await db.collection('alunos').limit(3).get();
  console.log(`📋 Coleção 'alunos': ${alunosSnap.docs.length} docs (até 3)`);
  for (const docSnap of alunosSnap.docs) {
    console.log(`  👤 ${docSnap.id} -> nome: ${docSnap.data().nome || docSnap.data().name || '---'}`);
  }
  console.log('');

  // 3. Verifica se existem documentos na coleção 'students'
  const studentsSnap = await db.collection('students').limit(3).get();
  console.log(`📋 Coleção 'students': ${studentsSnap.docs.length} docs (até 3)`);
  for (const docSnap of studentsSnap.docs) {
    console.log(`  👤 ${docSnap.id} -> nome: ${docSnap.data().nome || docSnap.data().name || '---'}`);
  }
  console.log('');

  // 4. Verifica coleção 'users'
  const usersSnap = await db.collection('users').limit(3).get();
  console.log(`📋 Coleção 'users': ${usersSnap.docs.length} docs (até 3)`);
  for (const docSnap of usersSnap.docs) {
    console.log(`  👤 ${docSnap.id} -> nome: ${docSnap.data().nome || docSnap.data().name || '---'}`);
  }

  process.exit(0);
}

diagnostic().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
