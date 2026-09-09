# ARTIFACT-01 & ARTIFACT-02 — Inventário Estrutural e Mapa de Responsabilidades

## FASE 1: Inventário Estrutural (ARTIFACT-01)

### 1. Árvore de Diretórios e Responsabilidades Físicas

```
_Atlas Academy/
├── Site/                              → Landing Page pública de conversão e onboarding
│   ├── index.html                     → Página institucional com questionário de maturidade (overlay)
│   ├── cadastro.html                  → Formulário de criação de tenant/academia
│   ├── css/                           → Folhas de estilo vanilla CSS
│   └── js/
│       ├── firebase-config.js         → Chaves do Firebase e URL do login do sistema
│       └── quiz.js                    → Motor de avaliação de maturidade e envio do cadastro
├── System/                            → SPA Multi-Tenant React 19 (Atlas Core)
│   ├── assets/                        → Ícones e splash screen nativos
│   ├── public/                        → Manifest PWA, ícones WebP/PNG
│   ├── scripts/                       → Scripts Node/MJS administrativos (claims, migrações, APK)
│   ├── docs/                          → Documentações legadas e relatórios de migração
│   ├── firestore.rules                → Regras de segurança de acesso e autorização do banco
│   ├── firestore.indexes.json         → Índices compostos de consulta Firestore
│   ├── vite.config.js                 → Configuração do Bundler Vite + PWA + Tailwind
│   └── src/
│       ├── main.jsx                   → Bootstrap do React 19 + Service Worker
│       ├── App.jsx                    → Shell da aplicação, roteamento e guards
│       ├── components/
│       │   ├── auth/                  → Guards de rotas protegidas (ProtectedRoute)
│       │   ├── navigation/            → Barras de navegação (MobileNav, MobileHeader, NetworkStatus)
│       │   ├── notifications/         → Centro de notificações em tempo real
│       │   ├── organizacao/           → Seletor e modal de criação de tenant
│       │   ├── profile/               → Drawers de histórico de perfil
│       │   ├── shared/                → Modais globais, ErrorBoundary, KPICard, SlideOver
│       │   ├── sidebar/               → Barra lateral responsiva
│       │   └── students/              → Modais de graduação, faltas e pagamentos
│       ├── context/                   → Gestão de estado global (Auth, Org, Students, Collabs, App, Theme)
│       ├── data/                      → Configurações de domínio (faixas de Jiu-Jitsu, modalidades)
│       ├── firebase/                  → Configuração do SDK v12 e mapeamento de coleções
│       ├── hooks/                     → Camada de acesso a dados e orquestração de efeitos
│       ├── modules/                   → Módulos funcionais e páginas lazy-loaded
│       │   ├── admin/                 → Painel Super Admin global da plataforma
│       │   ├── attendance/            → Registro de presença e revisão de chamadas
│       │   ├── auth/                  → Login, recuperação de PIN e entrada de admin
│       │   ├── collaborators/         → Gestão de membros da equipe e instrutores
│       │   ├── contracts/             → Gestão de termos e contratos de alunos
│       │   ├── dashboard/             → Dashboards específicos por perfil (Gestor, Professor, Aluno)
│       │   ├── events/                → Mural de avisos, comunicados e eventos
│       │   ├── finance/               → Faturamento (faturas), despesas e relatórios financeiros
│       │   ├── journey/               → Gestão da jornada técnica e graduação do aluno
│       │   ├── modalities/            → Modalidades de luta e turmas
│       │   ├── profile/               → Perfil do usuário, logs de auditoria e página de erros
│       │   └── students/              → Cadastro, busca e gerenciamento de alunos/visitantes
│       ├── services/                  → Serviços com lógica de persistência isolada (attendanceService)
│       ├── theme/                     → Tokens e variáveis de design system
│       └── utils/                     → Helpers utilitários de formatação, sanitização e segurança
```

---

## FASE 1: Mapa de Responsabilidade dos Módulos (ARTIFACT-02)

| Módulo / Camada | Responsabilidade Observada | Dependências de Entrada | Dependências de Saída | Conformidade com Camadas |
| :--- | :--- | :--- | :--- | :--- |
| `context/AuthContext` | Autenticação Firebase, resolução de perfis, cálculo de `effectiveRole`, PIN verification | Firebase Auth, Firestore (`members`, `usuarios/privado/segredos`) | `localStorage`, React Context | ⚠️ **Acoplado**: decide regras de autorização client-side e lê segredos de banco diretamente |
| `context/OrganizacaoContext` | Descoberta de tenants via `collectionGroup('members')`, controle da academia ativa, criação de tenant | `AuthContext`, Firestore (`organizations`, `members`, `usuarios`) | `localStorage`, `organizacaoAtiva.js` | ⚠️ **Misto**: gerencia estado mas executa mutações multi-coleção não-atômicas |
| `services/attendanceService` | Criação de chamada, lote de presenças (`markAttendanceBatch`), deleção de sessões | Firestore (`chamadas`, `presencas`, `usuarios`), `usarLogsSistema` | Firestore Batch | ⚠️ **Vazamento**: `deleteSession` deixa subcoleções órfãs e não reverte estatísticas |
| `hooks/useFinance` | Leitura e mutação de faturas e despesas tenant-scoped | Firestore (`faturas`, `despesas`), `AuthContext`, `OrganizacaoContext` | Componentes de UI Financeira | ⚠️ **Problema**: Realiza agregações monetárias em memória com ponto flutuante IEEE 754 |
| `hooks/useStudents` | CRUD de alunos e visitantes, vinculação de turmas, criação de faturamento inicial e Auth secundário | `vAuth`, Firestore (`usuarios`, `members`, `turmas`, `faturas`), `AuthContext` | `StudentsContext`, UI | ⚠️ **Alta Complexidade**: Um único hook acumula 736 linhas e 6 responsabilidades distintas |
| `modules/students/StudentsPage` | Listagem, filtros por modalidade/status, tabela de alunos e visitantes | `useStudents`, `StudentsContext`, `OrganizacaoContext` | Modais de aluno | ❌ **Defeito**: Contém chamada para função não importada `formatBR()` causando crash em visitantes |
| `utils/security` & `utils/sanitize` | Sanitização contra XSS e injeção de tags | Nenhuma (funções puras) | Formulários e hooks | ⚠️ **Duplicação**: Dois arquivos implementando filtros regex parciais sem usar o `DOMPurify` instalado |
| `Site/cadastro.html` & `quiz.js` | Onboarding público do SaaS: questionário, criação de conta Auth, criação de tenant e perfil | Firebase Compat v10 (Auth, Firestore) | Redirecionamento URL com credenciais | ❌ **Crítico**: Passa PIN em texto plano na query string de redirecionamento |
