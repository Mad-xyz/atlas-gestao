# ARTIFACT-00 — Project Context Map

## FASE 0: Reconhecimento do Projeto
**Diretório Auditado:** `g:\Programação\_Atlas Academy\System` e `g:\Programação\_Atlas Academy\Site`  
**Data da Auditoria:** 2026-09-09  
**Classificação Metodológica:** EOS — Engineering Operating System (Evidence-First, Fail-Closed)

---

### Mapeamento do Contexto Sistêmico

| Elemento | Identificado | Evidência Direta | Confiança |
| :--- | :--- | :--- | :--- |
| **Nome do Produto** | **Atlas Academy / Atlas SaaS** (anteriormente *R.S Top Team*) | `System/package.json` (`"name": "atlas-multi-tenant"`), `System/src/App.jsx`, `System/vite.config.js` | **PROVEN** |
| **Finalidade** | Plataforma SaaS Multi-Tenant para gestão de academias de artes marciais (Jiu-Jitsu, Boxe, etc.) | `ATLAS_REFATORACAO_STATUS.md`, `System/src/data/modalities.js`, `System/src/data/beltConfig.js` | **PROVEN** |
| **Atores / Perfis** | Super Admin, Owner, Admin, Gestor, Professor, Aluno, Visitante | `System/firestore.rules` (linhas 90-107), `System/src/context/AuthContext.jsx` (linhas 96-122) | **PROVEN** |
| **Arquitetura Geral** | SPA React 19 + BaaS (Firebase v12 Firestore/Auth/Storage) + Landing Page Vanilla JS | `System/src/main.jsx`, `System/src/firebase/config.js`, `Site/cadastro.html`, `Site/js/quiz.js` | **PROVEN** |
| **Modelo Multi-Tenant** | Subcoleções particionadas por Tenant: `organizations/{orgId}/*` | `System/src/firebase/collections.js`, `System/firestore.rules` | **PROVEN** |
| **Mobile / PWA** | Capacitor v8 (Android) + Vite PWA (`vite-plugin-pwa`, Workbox, Service Worker offline) | `System/package.json`, `System/capacitor.config.json`, `System/vite.config.js` | **PROVEN** |
| **Autenticação** | Firebase Auth (Email/Password) com abstração de PIN de 6 dígitos e e-mails técnicos internos (`@atlas.internal`) | `System/src/context/AuthContext.jsx` (linhas 293-323), `System/src/modules/auth/LoginPage.jsx` | **PROVEN** |
| **Autorização** | RBAC contextual em Firestore Security Rules + client-side em `ProtectedRoute.jsx` | `System/firestore.rules`, `System/src/components/auth/ProtectedRoute.jsx` | **PROVEN** |
| **Banco de Dados** | Cloud Firestore (banco NoSQL documental com IndexedDB `persistentLocalCache` multi-tab) | `System/src/firebase/config.js` (linhas 47-53) | **PROVEN** |
| **Qualidade / Linter** | ESLint v9 (`eslint.config.js` flat config). Build passa; **Lint falha com 347 erros**. | Execução real de `npm run build` e `npm run lint` | **PROVEN** |
| **Testes Automatizados** | **Nenhum teste automatizado** (0 arquivos `.test.` / `.spec.`, sem script `test` em `package.json`) | `System/package.json` | **PROVEN** |
| **CI/CD** | **Inexistente** (nenhum pipeline em `.github/workflows` ou equivalente) | Inspeção da raiz do repositório | **PROVEN** |
