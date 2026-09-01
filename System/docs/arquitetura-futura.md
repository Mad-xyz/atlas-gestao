# DOCUMENTAÇÃO DA ARQUITETURA FUTURA — ATLAS SAAS MULTI-TENANT

> **Status:** Visão Alvo / Target Architecture  
> **Plataforma:** Atlas (Evolução do R.S Top Team)  
> **Data:** 28/08/2026

---

## 1. VISÃO GERAL DA ARQUITETURA ALVO

O **Atlas** será uma plataforma SaaS de alta performance para gestão multi-tenant de academias, permitindo isolamento lógico completo de dados, autenticação contextualizada por organização e gerenciamento global pela equipe proprietária (Super Admin).

```text
                                  ┌────────────────────────┐
                                  │      PLATAFORMA        │
                                  │         ATLAS          │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
         │     RS TOP TEAM     │   │  ACADEMIA IMPACTO   │   │     ACADEMIA X      │
         │  (Tenant Isolated)  │   │  (Tenant Isolated)  │   │  (Tenant Isolated)  │
         └─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

---

## 2. COMPONENTES ARQUITETURAIS CHAVE

### 2.1. Organization Context (`src/context/OrganizationContext.jsx`)
Provê estado global da academia ativa para a aplicação:
```javascript
const {
  organizacaoAtual,
  organizacaoAtualId,
  organizacoesDoUsuario,
  membroAtual,
  papelAtual,
  permissoesAtuais,
  alterarOrganizacao,
  carregandoOrganizacao
} = useOrganization()
```

### 2.2. Organization Switcher (`src/components/organization/OrganizationSwitcher.jsx`)
Componente no cabeçalho/sidebar permitindo alternar de forma transparente entre as academias às quais o usuário tem acesso.

### 2.3. Platform Role vs. Organization Role
* **Platform Role:** Defenido no perfil global (`users/{uid}`). Exemplo: `super_admin` (equipe Atlas) e `user` (usuário padrão).
* **Organization Role:** Definido na associação (`organizations/{orgId}/members/{uid}`). Exemplo: `owner`, `admin`, `manager`, `teacher`, `student`.

---

## 3. FIRESTORE SECURITY RULES MULTI-TENANT

As regras de segurança em `firestore.rules` garantirão isolamento completo:

```javascript
function ehMembro(orgId) {
  return isAuth() && exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
}

function obterMembro(orgId) {
  return get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data;
}

function possuiRole(orgId, role) {
  return ehMembro(orgId) && obterMembro(orgId).role == role;
}
```

---

## 4. PREPARATIVOS PARA RECURSOS FUTUROS (ROADMAP SAAS)
1. **Planos & Assinaturas (Billing SaaS):** Limites por plano (ex: máximo de alunos, fotos por evento).
2. **Branding Customizado:** Cores da marca, logo própria e subdomínios.
3. **Painel Super Admin:** Gestão centralizada de academias cadastradas e métricas globais de faturamento.
