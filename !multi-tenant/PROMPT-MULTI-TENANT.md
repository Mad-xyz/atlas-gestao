# PROMPT MASTER — TRANSFORMAR O R.S TOP TEAM EM UMA PLATAFORMA SAAS MULTI-TENANT

Você é o principal arquiteto e engenheiro responsável por transformar o projeto existente **R.S Top Team** em uma plataforma SaaS multi-tenant profissional chamada futuramente **Atlas**.

REPOSITÓRIO PRINCIPAL DO PROJETO:


REFERÊNCIAS ARQUITETURAIS:
https://github.com/mooceanstudio/saas-starter-kit/tree/main
https://github.com/krivoox/agent-stack-template

IMPORTANTE:
O projeto existente já possui uma aplicação funcional.
NÃO comece criando um projeto novo.
NÃO faça uma reescrita completa.
NÃO troque a stack sem uma justificativa técnica extremamente forte.
A missão é transformar a arquitetura atual gradualmente, mantendo o funcionamento do sistema e preservando suas funcionalidades existentes.

---

# 1. OBJETIVO PRINCIPAL

Atualmente o R.S Top Team foi concebido para atender implicitamente uma única academia.

Quero transformar essa aplicação em uma plataforma SaaS onde várias academias possam utilizar o mesmo sistema.

Exemplo:

```text
ATLAS
│
├── RS Top Team
│   ├── Alunos
│   ├── Professores
│   ├── Gestores
│   ├── Modalidades
│   ├── Turmas
│   ├── Presenças
│   ├── Graduações
│   ├── Eventos
│   ├── Comunicados
│   └── Financeiro
│
├── Academia Impacto
│   ├── Alunos
│   ├── Professores
│   ├── Gestores
│   ├── Modalidades
│   ├── Turmas
│   ├── Presenças
│   ├── Graduações
│   ├── Eventos
│   ├── Comunicados
│   └── Financeiro
│
└── Academia X
    └── ...
```

Cada academia deve funcionar como um **tenant/organization isolado**.

Um usuário de uma academia jamais deve conseguir visualizar, alterar, excluir, consultar, descobrir ou inferir dados pertencentes a outra academia sem uma autorização explícita para isso.

---

# 2. STACK QUE DEVE SER PRESERVADA

O projeto existente deve continuar utilizando sua arquitetura atual, salvo necessidade comprovada:
* React
* Vite
* TypeScript/JavaScript conforme o projeto existente
* Tailwind CSS
* Firebase Authentication
* Firestore
* Firebase Storage
* Firebase Hosting
* PWA
* Recharts
* Framer Motion
* Lucide
* demais bibliotecas já utilizadas

NÃO migrar automaticamente para:
* Next.js
* PostgreSQL
* Prisma
* FastAPI
* SQLAlchemy
* Better Auth
* JWT próprio
* outro backend
* outro banco

O `saas-starter-kit` NÃO deve ser copiado literalmente. Ele deve servir apenas como referência arquitetural para conceitos como:
* organizations
* memberships
* RBAC
* isolamento de tenant
* camada de serviços
* testes de isolamento
* proteção contra acesso cruzado
* convites
* regras para owner/admin
* separação entre autenticação e autorização

O `agent-stack-template` deve servir como referência para:
* `AGENTS.md`
* regras para agentes
* skills
* documentação
* arquitetura
* ADRs
* fluxo de desenvolvimento
* padrões de implementação
* testes e revisão

---

# 3. REGRA OBRIGATÓRIA DE PORTUGUÊS

Existe neste projeto um arquivo de skill que deve ser tratado como regra ativa para todo o trabalho:
`SKILL(1).md` / `_codigo-em-portugues/SKILL.md`

Essa skill exige comunicação em português do Brasil e código novo com nomes, comentários, funções, componentes, hooks, arquivos, pastas e mensagens em português sempre que possível.

---

# 4. PRIMEIRA REGRA: ANALISAR ANTES DE ALTERAR
Auditoria completa do projeto (Fase 0).
Gerar: `docs/multi-tenant-auditoria.md`

# 5. DOCUMENTAR A ARQUITETURA ATUAL
Gerar: `docs/arquitetura-atual.md`

# 6. NOVO CONCEITO CENTRAL: ORGANIZATION
Introduzir `organization` / `organizationId` (`organizations/{organizationId}`).

# 7. ORGANIZAÇÃO NÃO É USUÁRIO
Separar: `User`, `Organization`, `Membership`.

# 8. MEMBERSHIP
Relacionamento `organizations/{organizationId}/members/{userId}` com roles e permissões contextuais.

# 9. SEPARAR PLATFORM ROLE DE ORGANIZATION ROLE
Plataforma: `super_admin`, `user`.
Organização: `owner`, `admin`, `manager`, `teacher`, `student`.

# 10. SUPER ADMIN
Equipe proprietária da plataforma Atlas.

# 11. ACTIVE ORGANIZATION
`OrganizationProvider` e hook `useOrganization()`.

# 12. ORGANIZATION SWITCHER
Componente visual de troca de academia com troca total de contexto, listeners e estados.

# 13. FIRESTORE
Estrutura multi-tenant planejada com subcoleções ou campos `organizationId`.

# 14. ORGANIZATION ID
Decisão documentada em `docs/adr/001-modelo-de-multi-tenancy.md`.

# 15. PRINCÍPIO DE ISOLAMENTO
Toda operação resolvida dentro do contexto do tenant ativo. Nunca filtrar apenas no cliente por segurança.

# 16. CLIENTE NÃO É AUTORIDADE
Security rules e backend como autoridade de autorização.

# 17. FIRESTORE SECURITY RULES
Funções reutilizáveis no `firestore.rules` validando `isAuth()`, `ehMembro()`, `possuiRole()`, `ehOwner()`, `ehSuperAdmin()`.

# 18. TESTE CONTRA CROSS-TENANT
Testar explicitamente isolamento entre Org A e Org B.

# 19. NÃO REVELAR EXISTÊNCIA DE OUTRO TENANT
Evitar vazamento de informações inter-tenant.

# 20. RBAC
Matriz formal de permissões em `docs/autorizacao.md`.

# 21. PERMISSIONS
Refinamento granular por recurso em português.

# 22. ADMINISTRAÇÃO DE MEMBROS
Gestão de membros da organização por Owner/Admin com proteções de remoção/rebaixamento.

# 23. CONVITES
Fluxo seguro de convite por token.

# 24. MIGRAÇÃO DA RS TOP TEAM
Tornar RS Top Team o primeiro tenant `rs-top-team` sem perda de dados. `docs/migracao-rs-top-team.md`.

# 25. MIGRATION SCRIPT
Script dedicado em `scripts/migrarDadosParaMultiTenant.js`.

# 26. BACKUP
Estratégia de backup e validação.

# 27. MIGRAR MÓDULO POR MÓDULO
Migração incremental por módulos.

# 28. AUTH
Firebase Auth como base de identidade + resolução de memberships.

# 29. USUÁRIO GLOBAL
`users/{uid}` para perfil global e subcoleções para memberships.

# 30-39. MÓDULOS TENANT-AWARE
Alunos, Professores, Modalidades, Turmas, Presenças, Graduações, Eventos, Comunicados, Financeiro, Dashboard.

# 40-43. REALTIME, CACHE, STORAGE, EXPORTAÇÕES
Listeners scoped, reset de estado na troca de tenant, paths no storage com `organizations/{orgId}/`, exportações scoped.

# 44-48. ROTAS, SLUG, BRANDING, CONFIGURAÇÕES, CAMADA DE SERVIÇO
Rotas amigáveis com slug, branding por org, settings por org, services exigindo contexto.

# 49-56. PADRÃO DE FEATURES, AGENTS.MD, SKILLS, DOCS, ADRS, TESTES, E2E
Padrões documentados em `docs/`, `AGENTS.md`, ADRs e suíte de testes.

# 57-90. BUILD, PRESERVAÇÃO DE FEATURES, UI/UX E DEFINITION OF DONE
Garantia de build limpo, sem regressões e checklist completo de aceitação.
