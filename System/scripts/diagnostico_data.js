/**
 * Diagnóstico: quais campos de data existem nos documentos de alunos?
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

// Lê o service account
const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function main() {
  const snap = await db.collection('usuarios').get();
  console.log(`Total de documentos em "usuarios": ${snap.size}\n`);

  let comCriadoEm = 0, comCreatedAt = 0, comAmbos = 0, semNada = 0;

  snap.forEach(doc => {
    const data = doc.data();
    const temCriadoEm = data.criadoEm !== undefined;
    const temCreatedAt = data.createdAt !== undefined;

    if (temCriadoEm && temCreatedAt) comAmbos++;
    else if (temCriadoEm) comCriadoEm++;
    else if (temCreatedAt) comCreatedAt++;
    else semNada++;

    const tipoCriadoEm = data.criadoEm ? typeof data.criadoEm + 
      (typeof data.criadoEm === 'object' ? 
        (' toDate' in data.criadoEm ? ' (Timestamp)' : ' (' + data.criadoEm.constructor?.name + ')') : '') : '-';

    console.log(`${doc.id.slice(0,30).padEnd(32)} | criadoEm: ${String(data.criadoEm ?? '❌').slice(0,30).padEnd(32)} | ${tipoCriadoEm}`);
  });

  console.log(`\n--- Resumo ---`);
  console.log(`Só criadoEm: ${comCriadoEm}`);
  console.log(`Só createdAt: ${comCreatedAt}`);
  console.log(`Ambos: ${comAmbos}`);
  console.log(`Nenhum: ${semNada}`);
}

main().catch(console.error);
