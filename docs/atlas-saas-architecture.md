# ATLAS — Arquitetura SaaS Multi-Tenant (Proposta)

> Documento de arquitetura e auditoria da transformação do **R.S Top Team** em
> **ATLAS**. Redigido como base para as etapas seguintes, com base em **auditoria
> real do código atual** (não presunção) e sem afirmações de segurança sem evidência.

**Data:** 28/08/2026
**Regra ativa:** `_codigo-em-portugues` (código novo em português do Brasil).
**Objetivo:** Manter a stack (React 19 + Vite + Firebase v12 + Tailwind v4) e evoluir
o sistema existente para um produto SaaS sem reescrever o que já funciona.

---

## 1. Estado atual (auditoria) — o que realmente existe

### 1.1 Stack confirmada
Localizada no diretório `System/` (este é o `atlas-app`):

- **React 19** + **Vite 8** + **Tailwind CSS v4** (@tailwindcss/vite)
- **Firebase v12** (Auth, Firestore, Storage, Hosting)
- **Framer Motion**, **Lucide React**, **Recharts**, **React Router v7**, **react-hot-toast**
- **PWA** (via `vite-plugin-pwa`), persistência offline (`persistentLocalCache`)
- **JavaScript/JSX** — sem TypeScript

### 1.2 Firebase / Hosting (configurado hoje)
- Projeto Firebase configurado em `src/firebase/config.js` e `.firebaserc`:
  `atlas-os-21356` (usado como default).

  > ⚠️ **Divergência:** `AGENTS.md` ainda registra `academia-rstopteam` como projeto,
  > e o `firebase.json` de hosting ainda usa o site `rstopteam` e CSP com domínios
  > `academia-rstopteam`/`rstopteam`. O código aponta para `atlas-os-21356`.

- `firebase.json`: hosting `site: rstopteam`, `public: dist`, rewrites SPA,
  CSP estrita, headers de segurança (CSP, HSTS, X-Frame, nosniff).
- `firestore.rules` e `firestore.indexes.json`: **já existem**.

### 1.3 Multitenancy — o que já foi implementado
O sistema já foi migrado para o modelo de **subcoleções escopadas por organização**:

```
/organizations/{orgId}
  /members/{uid}      -> role: owner, admin, gestor, professor, aluno
  /students/{id}      -> aluno
  /modalities/{id}
    /turmas/{tId}
  /sessions/{id}
    /presencas/{id}
  /charges/{id}       -> faturamento
  /expenses/{id}      -> despesas
  /events/{id}        -> eventos/comunicados
  /contracts/{id}     -> contratos
```

Arquitetura/peças já criadas:

| Peça | Arquivo | Status |
|------|---------|--------|
| Contexto da organização ativa | `src/context/OrganizacaoContext.jsx` | ⚠️ funcional, mas com **falha de segurança** |
| Seletor de academia (dropdown) | `src/components/organizacao/SeletorDeOrganizacao.jsx` | ✅ existe |
| Hook de subcoleção com tenant | `src/hooks/useColecaoComTenant.js` | ✅ existe |
| Modal de criação de organização | `src/components/organizacao/ModalCriarOrganizacao.jsx` | ❌ **quebrado** (chama função inexistente) |
| Regras do Firestore | `firestore.rules` | ⚠️ existem, mas com gaps de isolamento |

### 1.4 Autenticação atual (herança R.S Top Team)
O `AuthContext.jsx` é um fluxo **legado e específico da R.S Top Team**:

- Login por **PIN** (não por senha de texto livre).
- Identidade dupla: e-mails reais + derivados `@rstopteam.internal`.
- Papéis simulados (`simulatedRole`) e detecção de papel por PIN.
- Perfis no Firestore localizados por combinações de e-mail id, campos, coleções
  `usuarios` **e** `users` (duas coleções).

> **Consequência:** o fluxo padrão de cadastro SaaS (e-mail + senha) solicitado no
> item 10 **não existe ainda** como fluxo principal. O cadastro existente
> (`RSAdminRegister`) é administrativo e legado.

### 1.5 O que falta para o produto Atlas
- **Site público** (`atlas.com`) — diretório `Site/` **vazio**.
- **Painel Super Admin** (`admin.atlas.com`) — diretório `Admin/` **vazio**.
- Modelo de **planos / assinatura / trial** (não existe).
- Fluxo de **cadastro SaaS** (e-mail + senha + criação da organization).
- Modelo de **`platformRole`** (super_admin) — hoje é `isAdmin()` com e-mails fixos.
- Separação de **ambientes** development/production.
- Documentação completa e testes de isolamento.

---

## 2. Arquitetura proposta

```
                        ATLAS
                          │
          ┌───────────────┼─────────────────┐
          │               │                 │
          ▼               ▼                 ▼
     atlas.com      app.atlas.com     admin.atlas.com
     SITE PÚBLICO      APP (System)      SUPER ADMIN
          │               │                 │
          └───────────────┼─────────────────┘
                          ▼
                 FIREBASE (produção)
                          │
            Auth  |  Firestore  |  Storage
                          │
                    organizations/{orgId}
                          │
          ┌───────────────┼───────────────┐
          │               │               │
       Org A            Org B           Org C
```

### 2.1 Três aplicações com responsabilidades separadas

| App | Dir. | Função | Acessa dados de academias? |
|-----|------|--------|----------------------------|
| **atlas-site** | `Site/` | Marketing, planos, conversão, cadastro, login | Não (apenas `plans` públicos) |
| **atlas-app** | `System/` | Gestão da academia (multi-tenant) | Sim (somente a org ativa) |
| **atlas-admin** | `Admin/` | Gestão da plataforma (Super Admin) | Sim (visão global, via `platformRole`) |

### 2.2 Modelo de dados multi-tenant

```
User  (Firebase Auth → uid)
  ├── users/{uid}                     -> perfil global (nome, email, platformRole)
  └── memberships  (relação user→organização)
       memberships/{userId}_{orgId}   OR   organizaçãos/{orgId}/members/{uid}

Organization  -> organizations/{orgId}
  ├── name, slug, logo, status, branding, subscription, settings
  ├── members/{uid}      -> role contextual (owner/admin/gestor/professor/aluno)
  ├── students/{id}
  ├── modalities/{id}
  ├── sessions/{id}
  ├── charges/{id}
  ├── expenses/{id}
  ├── events/{id}
  └── contracts/{id}
```

### 2.3 Assinatura / Trial (pertencente à **organização**, nunca ao usuário)

```
organizations/{orgId}/subscription   (ou campo subscription no doc da org)
{
  plan: 'basic' | 'pro' | 'premium' | 'trial',
  status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled',
  trialStartedAt: <Timestamp>,
  trialEndsAt: <Timestamp>,
  currentPeriodStart: <Timestamp>,
  currentPeriodEnd: <Timestamp>
}
```

> Os valores de trial devem ser **timestamps confiáveis** (serverTimestamp/Cloud
> Functions), nunca gerados apenas no cliente (item 70/71/72).

### 2.4 Roles

- **Platform role** (`users/{uid}.platformRole`): `super_admin` | `user`.
- **Organization role** (`organizations/{orgId}/members/{uid}.role`):
  `owner` | `admin` | `gestor` | `professor` | `aluno`.

Distinção clara: `super_admin` gerencia a **plataforma** (todas as academias);
o papel da organização é **escopado** àquela academia.

---

## 3. Regras de segurança / autoridade (quem decide o quê)

1. **O frontend nunca é autoridade.** `localStorage.organizationId` é apenas
   conveniência de UX; toda verificação passa pelas **Firestore Rules**.
2. **Topologia de regras:** a regra deve validar a cadeia
   `request.auth != null` → `é membro da organização` → `role/permite a ação`.
3. **Quando criar regra, garantir isolamento:** organização A nunca lê/grava em B.

---

## 4. Priorização por etapas (execução incremental)

Conforme o item 80 do prompt mestre, não executar tudo de uma vez.

| Etapa | Entregável | Estado sugerido |
|-------|-----------|-----------------|
| 1 | Auditoria + este documento | **Concluído** |
| 2 | Validar multitenancy atual (gaps) | Pendente (ver seção 5) |
| 3 | Site público | Pendente |
| 4 | Fluxo cadastro/trial | Pendente |
| 5 | Criação real da organization | Pendente (parcial — falta corrigir) |
| 6 | Super Admin | Pendente |
| 7 | Métricas reais | Pendente |
| 8 | Ambientes Firebase | Pendente |
| 9 | Testes de segurança | Pendente |
| 10 | Validação de produção | Pendente |

---

## 5. Achados de auditoria que exigem atenção (evidências)

1. **Falha de segurança em `OrganizacaoContext.jsx` (linha ~79-90):** quando o
   usuário não possui membership, o código **automaticamente concede** acesso à
   organização `rs-top-team` como `owner`. Isso quebra o isolamento do SaaS
   (qualquer usuário autenticado viraria dono da R.S Top Team). **Precisa remover.**

2. **`ModalCriarOrganizacao.jsx` usa `criarNovaOrganizacao` (linha 15/30), mas o
   `OrganizacaoContext` não exporta essa função.** A criação de academia está
   **quebrada**. Precisamos implementar `criarNovaOrganizacao` de forma
   consistente, com compensação de erro.

3. **`isAdmin()` em `firestore.rules` (linha 37-51)** depende de e-mails
   hardcoded e da coleção legada `usuarios`. Não há `platformRole == 'super_admin'`.
   Precisamos migrar para um modelo baseado em `platformRole`.

4. **Gaps de isolamento nas rules:**
   - `/organizations/{orgId}` → `allow read: if isAuth();` (qualquer autenticado lê
     qualquer organização).
   - `/memberships/{membershipId}` → `allow read, write: if isAuth();`
   - `/sessions/{id}/presencas/{pId}` → `allow read, write: if isAuth();`
   - Collection groups `/turmas`, `/visualizacoes`, `/presencas` → `if isAuth()`.
   Precisamos apertar para membros da organização.

5. **Hardcode `RS Top Team` / `rs-top-team` / `rstopteam`** ainda presente em:
   `OrganizacaoContext`, `attendanceService` (default `organizationId='rs-top-team'`),
   `Sidebar`, `ProfilePage`, `MobileNav`, `TopBar`, `StudentDashboard`,
   `useNotificacoesApp`, `AuthContext` (e-mails `@rstopteam.internal`),
   `useSystemUsers`, `useStudents`. Parte é **legado obrigatório** (não remover
   sem impacto), parte é **informação de academia que deve ser dinâmica**.

6. **`firebase-key.json` na raiz do projeto** — service account comprometeria o
   projeto se versionada. **Não deve ir para o repositório/`git`.** (Item 37/67.)

7. **`AGENTS.md` desatualizado** — ainda descreve o projeto como `academia-rstopteam`
   e não menciona as três aplicações, trial, assinatura, super admin.

8. **Sem separação de ambientes** development/production (item 31/77). Hoje tudo
   aponta para `atlas-os-21356`.

---

## 6. Decisões de arquitetura propostas (a confirmar antes de codificar)

- **Manter subcoleções por organização** como modelo principal (já implantado).
- **Extrair o site e o admin como projetos Vite separados** (`Site/`, `Admin/`),
  sem duplicar o código do app. Compartilhamento real apenas quando necessário
  (item 36) — sem monorepo complexo por estética.
- **Criar o fluxo de cadastro SaaS** com e-mail + senha (Firebase Auth) + criação
  de `organization` + `membership(owner)` + `subscription(trial)` — com
  **compensação** de erro (não criar em estados inconsistentes).
- **Remover o "fallback" inseguro** de `OrganizacaoContext` e implementar
  `criarNovaOrganizacao`.
- **Adotar `platformRole`** para Super Admin e ajustar as rules para usar uma
  função `ehSuperAdmin()`; redesenhar `isAdmin()`.
- **Preparar `plans/{planId}`** e o modelo de assinatura sem billing real.
- **Criar docs** exigidas (ver seção 7) e **testes de isolamento** (itens 44-45).

---

## 7. Documentação a criar

```
docs/
├── produto-atlas.md        -> visão de produto (as 3 experiências)
├── arquitetura-atlas.md    -> arquitetura técnica (este documento evolui para cá)
├── multi-tenancy.md        -> modelo e isolamento
├── onboarding.md           -> fluxo de cadastro/trial/criação de organização
├── subscriptions.md        -> planos, assinatura, trial
├── super-admin.md          -> modelo platformRole e painel
├── firebase-ambientes.md   -> development/production
├── seguranca.md            -> rules, RBAC, isolamento
└── deployment.md           -> deploy de site/app/admin
```

---

## 8. Definição de pronto (referência)

- **Site:** landing, recursos, planos, CTA, cadastro, login, responsivo, SEO básico.
- **Trial:** 7 dias, escopo da organização, timestamps confiáveis, aviso de expiração.
- **App:** organização ativa, nome dinâmico, branding, switcher, módulos tenant-aware.
- **Admin:** super admin, dashboard, academias, detalhes, status, trial, assinaturas.
- **Firebase:** development, production, Auth, Firestore, Storage, Hosting.
- **Segurança:** rules, isolamento cross-tenant, RBAC, platform role, proteção do owner.

**Compromisso:** nenhuma afirmação de "100% seguro/pronto" é feita sem testes
concretos de isolamento e revisão das rules (item 86).

---

## 9. Próxima ação sugerida

Começar pela **Etapa 2 + 4/5** (correção do fluxo de cadastro/trial e criação
real da organização), que desbloqueia o Site e o onboarding. Depois **Etapa 3**
(Site público) e **Etapa 6** (Super Admin).

*Documento gerado na primeira ação, conforme o item 81 do prompt mestre.*
