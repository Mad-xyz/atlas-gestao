# DOCUMENTAÇÃO DA ARQUITETURA ATUAL — R.S TOP TEAM

> **Status:** Legado Monotenant Implícito  
> **Versão:** 26.2.1  
> **Data:** 28/08/2026

---

## 1. VISÃO GERAL DA ARQUITETURA

A aplicação **R.S Top Team** é um SPA (Single Page Application) moderno com suporte PWA offline-first. Ela é composta por um frontend React desacoplado rodando sobre serviços gerenciados pela Plataforma Google Firebase.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (SPA / PWA)                     │
│                                                                        │
│  React 19 + Vite 6 + Tailwind v4 + Framer Motion + Lucide + Recharts  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐      ┌──────────────────────────┐
       │ Firebase Auth SDK v12  │      │  Firestore Database v12  │
       │ (Dual-Auth Engine)     │      │  (Persistent Cache DB)   │
       └────────────────────────┘      └──────────────────────────┘
```

---

## 2. CAMADA DE AUTENTICAÇÃO E SESSÃO

A autenticação é gerenciada pelo `AuthContext.jsx`.

### 2.1. Dual-Auth Architecture
* **Instância Principal (`auth`):** Gerencia o ciclo de vida do usuário logado na aba/dispositivo. Utiliza `browserLocalPersistence`.
* **Instância de Verificação (`verifyAuth`):** Instância isolada com `inMemoryPersistence` criada em `initializeApp(firebaseConfig, 'verify')`. Utilizada para reautenticar PINs sensíveis sem corromper a sessão principal.

### 2.2. Fluxo de Identificação e Login
1. O usuário digita o e-mail (ou telefone) e o PIN de 6 dígitos.
2. O sistema realiza busca pelo documento em `/usuarios/{email}`.
3. Dependendo do PIN digitado (PIN do perfil ou `adminPin` da subcoleção `/privado/segredos`), o papel retornado será o papel real (Admin/Gestor/Professor) ou simulará a visão restrita (`'aluno'`).

---

## 3. PROVEDORES DE CONTEXTO E ESTADO GLOBAL

A aplicação utiliza exclusivamente a **Context API do React** (sem Redux ou Zustand). A árvore de provedores no `src/App.jsx` está configurada da seguinte forma:

```jsx
<ThemeProvider>
  <AuthProvider>
    <StudentsProvider>
      <CollaboratorsProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </CollaboratorsProvider>
    </StudentsProvider>
  </AuthProvider>
</ThemeProvider>
```

---

## 4. ESTRUTURA DE ROTAS E PROTEÇÃO DE ACESSO

Gerenciado via React Router v7 em `src/App.jsx` utilizando `ProtectedRoute.jsx`:

* `/`: Dashboard Principal
* `/chamadas`: Chamadas e Lista de Presença (`manageClasses`)
* `/alunos`: Gestão de Alunos e Matrículas (`viewStudents`)
* `/equipe`: Gestão da Equipe e Colaboradores (`manageUsers`)
* `/eventos`: Quadro de Comunicados e Eventos (`manageEvents`)
* `/perfil`: Perfil do Usuário Logado
* `/contratos`: Gestão de Contratos de Adesão
* `/financeiro`: Faturamento e Receitas (`viewBillingTab`)
* `/despesas`: Custos Operacionais (`viewExpensesTab`)
* `/relatorios`: Relatórios Financeiros e DRE (`viewFinance`)
* `/modalidades`: Modalidades Esportivas (`manageSystem`)

---

## 5. REGRAS DE SEGURANÇA NO FIRESTORE

As Security Rules em `firestore.rules` operam em um ambiente monolítico. Todas as coleções residem na raiz:

* `/usuarios/{userId}`
* `/alunos/{id}`
* `/chamadas/{id}`
* `/modalidades/{id}`
* `/faturamento/{id}`
* `/despesas/{id}`
* `/eventos/{id}`

Todas as regras concedem acesso amplo com base no predicado `isStaff()` (Admin, Gestor ou Professor).

---

## 6. PWA E FUNCIONAMENTO OFFLINE

* **Service Worker:** Gerado pelo `vite-plugin-pwa` em modo `autoUpdate`.
* **IndexedDB Cache:** Configurado em `src/firebase/config.js` via `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`. Os dados consultados são gravados em cache no dispositivo e servidos offline.
