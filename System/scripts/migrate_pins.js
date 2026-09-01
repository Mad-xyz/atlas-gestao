/**
 * Script de Migração de Segurança — Hardening 007
 * 
 * Objetivo: Mover PINs da raiz dos documentos `usuarios/{id}` para a
 * subcoleção restrita `usuarios/{id}/privado/segredos`.
 * 
 * Dependências: firebase-admin instalado no projeto.
 * Uso: node scripts/migrate_pins.js
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);

// Firebase Admin v12+ usa exports nomeados
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar service account localmente
const serviceAccountPath = join(__dirname, '..', 'firebase-key.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const auth = getAuth();

async function migratePins() {
  console.log('🔄 Iniciando migração de PINs para subcoleção privado/segredos...');
  let migradosCont = 0;
  let erroCont = 0;

  try {
    const snapshot = await db.collection('usuarios').get();

    if (snapshot.empty) {
      console.log('⚠️  Nenhum usuário encontrado na coleção "usuarios".');
      process.exit(0);
    }

    console.log(`📋 Total de documentos encontrados: ${snapshot.docs.length}`);

    const batchLimit = 450; // Margem segura (Firebase limita 500 por batch, split op = 2)
    let batch = db.batch();
    let operacoesNoBatch = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const profileId = docSnap.id;

      const pin = data.pin || data.PIN;
      const adminPin = data.adminPin || data.admPin || data.AdminPin;

      if (pin || adminPin) {
        // 1. GRAVAR na subcoleção segura
        const segredosRef = db
          .collection('usuarios').doc(profileId)
          .collection('privado').doc('segredos');

        const segredosData = { migradoEm: FieldValue.serverTimestamp() };
        if (pin) segredosData.pin = pin;
        if (adminPin) segredosData.adminPin = adminPin;

        batch.set(segredosRef, segredosData, { merge: true });
        operacoesNoBatch++;

        // 2. REMOVER da raiz após cópia (Limpeza de segurança)
        const camposParaRemover = {};
        if (pin) camposParaRemover.pin = FieldValue.delete();
        if (pin) camposParaRemover.PIN = FieldValue.delete();
        if (adminPin) camposParaRemover.adminPin = FieldValue.delete();
        if (adminPin) camposParaRemover.admPin = FieldValue.delete();
        if (adminPin) camposParaRemover.AdminPin = FieldValue.delete();

        batch.update(db.collection('usuarios').doc(profileId), camposParaRemover);
        operacoesNoBatch++;

        migradosCont++;
        console.log(`  ↳ [${migradosCont}] Migrando: ${profileId}`);

        // 3. GARANTIR CONTA NO FIREBASE AUTH (Fallback para usuários antigos)
        const emailBruto = data.email || profileId;
        const emailAuth = emailBruto.includes('@')
          ? emailBruto
          : `${emailBruto}@rstopteam.internal`;
        const pinSeguro = String(pin || '000000').trim().padEnd(6, '0');

        try {
          await auth.getUserByEmail(emailAuth);
          // Conta já existe, nenhuma ação necessária
        } catch (authErr) {
          if (authErr.code === 'auth/user-not-found') {
            try {
              await auth.createUser({
                email: emailAuth,
                password: pinSeguro,
                displayName: data.nome || data.name || 'Usuário Migrado'
              });
              console.log(`    👤 Conta Auth criada: ${emailAuth}`);
            } catch (createErr) {
              console.warn(`    ⚠️  Não foi possível criar Auth para ${emailAuth}: ${createErr.message}`);
            }
          }
        }

        // Commitar lote antes de atingir o limite
        if (operacoesNoBatch >= batchLimit) {
          await batch.commit();
          console.log(`  ✅ Lote intermediário commitado (${operacoesNoBatch} ops).`);
          batch = db.batch();
          operacoesNoBatch = 0;
        }
      } else {
        // Documento sem PIN, ignorar silenciosamente
      }
    }

    // Commitar o lote final
    if (operacoesNoBatch > 0) {
      await batch.commit();
      console.log(`  ✅ Lote final commitado (${operacoesNoBatch} ops).`);
    }

    console.log(`\n🎉 Migração concluída! ${migradosCont} usuário(s) migrado(s).`);

  } catch (error) {
    console.error('❌ Erro crítico durante a migração:', error.message);
    erroCont++;
  }

  process.exit(erroCont > 0 ? 1 : 0);
}

migratePins();
