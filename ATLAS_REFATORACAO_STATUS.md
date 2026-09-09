# Atlas — Status da Refatoração Multi-Tenant

> **Arquivo vivo de acompanhamento.** Atualize este documento a cada alteração feita no frontend.
> Outra IA (ou uma nova sessão) deve ler este arquivo ANTES de continuar o trabalho.
> Última atualização: 2026-09-01

---

## 1. Objetivo

Refatorar o frontend de `G:\Programação\_Atlas Academy\System` (React + Firebase/Firestore)
para arquitetura **multi-tenant SaaS "Atlas"** com **isolamento total por academia**:

- Substituir o modelo híbrido legado (coleções raiz em inglês) por **subcoleções em português
  dentro de `organizations/{orgId}`**.
- **Bloquear coleções raiz legadas** nas Security Rules (acesso somente admin global).
- Eliminar vulnerabilidades de segurança (PIN fora da raiz, IDs sanitizados, etc.).

**IMPORTANTE:** O banco de dados está **vazio**. **NÃO criar scripts de migração de dados** —
o multi-tenant começa do zero com `criarNovaOrganizacao`.

**Regra de idioma (skill `_codigo-em-portugues`):** comunicação em PT-BR; código,
identificadores, comentários e mensagens de UI em português. **Nunca renomear campos
existentes no Firestore** (`pin`, `status`, `data`, `belt`, `jornada_tecnica`, etc.) — apenas
caminhos/coleções mudam.

---

## 2. Modelo de dados (contrato físico — o que manda para queries)

```
organizations/{orgId}
  ├── members        → equipe/staff (owner, admin, gestor, professor)
  ├── usuarios       → todas as pessoas (alunos + perfis de equipe)
  │     ├── anotacoes/{id}
  │     ├── graduacoes/{id}
  │     └── privado/segredos        → PINs (isolado)
  ├── modalidades/{id}
  │     └── turmas/{tId}
  ├── chamadas/{id}                 → sessões/aulas
  │     └── presencas/{pId}         → presença por chamada
  ├── presencas/{id}                → histórico agregado de presenças (antigo PRESENCAS_LOG)
  ├── eventos/{id}
  │     └── visualizacoes/{vId}
  ├── faturas/{id}                  → cobranças (antigo FATURAMENTO)
  ├── pagamentos/{id}
  ├── despesas/{id}
  ├── contratos/{id}
  ├── turmas/{id}                   → visão agregada
  ├── logs/{id}                     → trilha de auditoria
  └── configuracoes/{id}
```

### Constantes (`src/firebase/collections.js` — já reescrito)

- `ROOT_COLLECTIONS.ORGANIZATIONS = 'organizations'`
- `COLLECTIONS.*`: `MEMBROS:'members'`, `USUARIOS:'usuarios'`, `MODALIDADES`, `CHAMADAS`,
  `PRESENCAS`, `EVENTOS`, `FATURAS`, `PAGAMENTOS`, `DESPESAS`, `CONTRATOS`, `TURMAS`,
  `LOGS`, `CONFIGURACOES` + aliases legados (`STUDENTS:'usuarios'`, `SESSIONS:'chamadas'`,
  `CHARGES:'faturas'`, `EXPENSES:'despesas'`, `NOTICES:'eventos'`).
- `SUB_COLLECTIONS.*`: `PRESENCAS`, `ANOTACOES`, `GRADUACOES`, `TURMAS`, `VISUALIZACOES`,
  `SEGREDOS:'privado/segredos'`.
- `FIELDS.*`: campos legados preservados (`NOME:'nome'`, `STATUS:'status'`,
  `CRIADO_EM:'criadoEm'`, `PAPEIS:'papeis'`, etc.).
- Helpers: `orgPath(orgId, colecao, docId?)`, `orgCollection(db, orgId, colecao)`,
  `orgDoc(db, orgId, colecao, docId)`.

**Obs.:** `COLLECTIONS.PRESENCAS_LOG` e `COLLECTIONS.FATURAMENTO` **não existem mais**.
`COLLECTIONS.ALUNOS` **não existe mais** → usar `COLLECTIONS.USUARIOS`.
`COLLECTIONS.EQUIPE` **não existe mais** → usar `COLLECTIONS.MEMBROS`.

---

## 3. Padrões obrigatórios (imite os arquivos já refatorados)

1. **Hooks/componentes React** que precisam da organização ativa:
   ```js
   import { useOrganizacao } from '../context/OrganizacaoContext'   // hooks → '../context/...'
   import { useOrganizacao } from '../../context/OrganizacaoContext' // componentes → '../../context/...'
   const { organizacaoAtualId } = useOrganizacao()
   // acesso: collection(db, ROOT_COLLECTIONS.ORGANIZATIONS, organizacaoAtualId, COLLECTIONS.X)
   // ou:    orgDoc(db, organizacaoAtualId, COLLECTIONS.X, id)
   ```
2. **Funções standalone (fora de hooks)**:
   ```js
   import { obterOrganizacaoAtiva } from '../utils/organizacaoAtiva'
   const org = obterOrganizacaoAtiva()
   if (!org) throw new Error('Nenhuma organização ativa')
   ```
3. **Mapeamentos legados → novos:**
   | Legado (raiz) | Novo (tenant) |
   |---|---|
   | `collection(db, 'usuarios')` / `COLLECTIONS.USUARIOS` | `organizations/{orgId}/usuarios` |
   | `COLLECTIONS.PRESENCAS_LOG` | `organizations/{orgId}/presencas` |
   | `COLLECTIONS.CHAMADAS` | `organizations/{orgId}/chamadas` |
   | `COLLECTIONS.MODALIDADES` + `SUB_COLLECTIONS.TURMAS` | `organizations/{orgId}/modalidades/{mId}/turmas/{tId}` |
   | `COLLECTIONS.FATURAMENTO` | `organizations/{orgId}/faturas` |
   | `collection(db, 'usuarios', uid, 'graduacoes')` | `organizations/{orgId}/usuarios/{uid}/graduacoes` |
   | `collection(db, 'equipe')` | `organizations/{orgId}/members` |
   | `collection(db, 'visitantes')` | **não existe** — visitantes vivem em `usuarios` com `isVisitor: true` |
4. **`collectionGroup` permitido (exceção):** `collectionGroup('members')` (descoberta de orgs do
   usuário, filtro por `userId == uid`) e `collectionGroup('presencas')` (histórico, filtro por
   `organizationId`). É o que as Security Rules autorizam.
5. Adicionar `organizacaoAtualId` às dependências de `useEffect`/`useCallback` e guardar com
   `if (!organizacaoAtualId) return` / `throw new Error('Nenhuma organização ativa')`.
6. `registrarAtividade` (de `../hooks/usarLogsSistema`) já resolve a org internamente; passe
   `organizationId: organizacaoAtualId` no payload quando disponível.
7. **Windows/CRLF:** os arquivos .jsx/.js usam CRLF. `Edit` com `old_string` multilinha pode
   falhar ("old_string not found") — use edições de **linha única** ou reescreva o arquivo
   inteiro com `Write` mantendo a lógica idêntica.

---

## 4. Arquivos JÁ refatorados (concluídos — NÃO refazer)

### Infraestrutura
- `System/firestore.rules` — reescrito: raiz bloqueada (`isAdmin` global), collectionGroup
  `members`/`presencas` liberados para autenticados.
- `System/src/firebase/collections.js` — reescrito (contrato + helpers).
- `System/src/utils/organizacaoAtiva.js` — **criado**: store singleton
  (`definirOrganizacaoAtiva`, `obterOrganizacaoAtiva`, `resolverOrganizacao`) + helpers.

### Contextos
- `System/src/context/OrganizacaoContext.jsx` — carrega orgs via `collectionGroup('members')`
  (`userId == uid`); conectado ao store via `definirOrganizacaoAtiva`.
- `System/src/context/StudentsContext.jsx` — escuta `{orgId}/usuarios` (sem fallback global).
- `System/src/context/CollaboratorsContext.jsx` — escuta `{orgId}/members`.
- `System/src/context/AuthContext.jsx` — perfil via `collectionGroup('members')`; login smart
  sem consulta raiz; bootstrap sem consulta raiz.

### Hooks (todos tenant-scoped)
`useModalities`, `useFinance`, `useNotices`, `useDashboardStats`, `useTodaySessions`,
`useTeamStats`, `useStudentAttendance`, `useContracts`, `useSystemUsers` (PIN em
`usuarios/{emailId}/privado/segredos`), `useAttendanceAlerts` (collectionGroup `presencas`),
`useAttendanceHistory`, `useNotificacoesApp`, `useNotifications`, `useNotificacoesPush`,
`useStudentJourney` (`{orgId}/configuracoes`), `usarLogsSistema` (`registrarAtividade` →
`{orgId}/logs`), `usePaymentReport` (`{orgId}/faturas` + `{orgId}/usuarios`), `useStudents`
(tudo em `{orgId}/usuarios`, visitantes com `isVisitor: true`, turmas e faturas tenant),
`useTeacherIntelligence` (`{orgId}/chamadas` + `{orgId}/presencas`).

### Serviços
- `System/src/services/attendanceService.js` — chamadas/presenças tenant + collectionGroup.

### Componentes
- `System/src/components/students/GraduationHistoryModal.jsx` — **completo** (graduações em
  `usuarios/{id}/graduacoes`, modalidades `{orgId}/modalidades`, professores de
  `{orgId}/members`).
- `System/src/components/shared/GraduationChangeModal.jsx` — **completo** (updateDoc em
  `{orgId}/usuarios/{id}`).
- `System/src/components/students/AttendanceHistoryDrawer.jsx` — **completo** (presenças
  `{orgId}/presencas` + anotações `usuarios/{id}/anotacoes`).
- `System/src/components/profile/HistoryDrawer.jsx` — **completo** (presenças `{orgId}/presencas`
  + graduações `usuarios/{uid}/graduacoes`).

### Módulos / Páginas (refatorados nesta rodada)
- `System/src/modules/attendance/ReviewAttendancePage.jsx` — **completo** (chamadas/presenças e
  log de presenças tenant-scoped; `useOrganizacao` + dependência `organizacaoAtualId`).
- `System/src/modules/attendance/AttendancePage.jsx` — **completo** (histórico de chamadas em
  `{orgId}/chamadas`; guard + dependência `organizacaoAtualId`).
- `System/src/modules/dashboard/TeacherDashboard.jsx` — **completo** (notas do professor em
  `usuarios/{uid}/anotacoes`).
- `System/src/modules/journey/components/ConfigurationView.jsx` — **completo** (modalidades
  `{orgId}/modalidades` + configurações `{orgId}/configuracoes`).

**Fluxos de identidade global (diretório raiz de identidade — exceção de bootstrap):**
- `System/src/modules/auth/RSAdminRegister.jsx` e `ResetPasswordPage.jsx` — usam
  `ROOT_COLLECTIONS.USUARIOS_GLOBAIS` (raiz `usuarios` para admin/setup), coerente com as
  Security Rules (`isAdmin()` na raiz).

---

## 5. Estado final (varredura + build)

**Varredura (item crítico):** rodada no `System/src`. **Nenhuma referência a coleção raiz
legada restante.** Os únicos `collectionGroup` do projeto são escopados por tenant:
- `collectionGroup('presencas')` (histórico do aluno, filtro `studentId` + `organizationId`).
- `collectionGroup('members')` (descoberta de organizações do usuário, filtro `userId`).
- `collectionGroup('turmas')` (filtro `organizationId`).

**Build:** `npm run build` no diretório `System` **passou** (`✓ built in 3.22s`). Sem erros
novos. Ouve apenas warnings não bloqueantes (chunks > 800 kB e um `INEFFECTIVE_DYNAMIC_IMPORT`
em `firebase/config.js`).

---

## 6. Definição de pronto

- Nenhuma referência a coleção raiz legada no código (exceto `collectionGroup` com filtro).
- Todos os componentes/hooks que escrevem no Firestore apontam para `organizations/{orgId}/...`.
- Build passa sem erros novos.
- Reportar ao final: lista de arquivos alterados + confirmação do grep + resultado do build.

---

## 7. Log de alterações (linha do tempo)

| Data | Arquivo(s) | O que foi feito |
|---|---|---|
| 2026-09-01 | `firestore.rules`, `collections.js`, `organizacaoAtiva.js` | Base multi-tenant: regras, contrato e store singleton |
| 2026-09-01 | Contextos (`Organizacao`, `Students`, `Collaborators`, `Auth`) | Escuta/leitura apenas dentro de `organizations/{orgId}`; perfil via collectionGroup |
| 2026-09-01 | Hooks de dados | Todos refatorados para tenant-scoped (lista na seção 4) |
| 2026-09-01 | `attendanceService.js` | Chamadas/presenças tenant + collectionGroup `presencas` |
| 2026-09-01 | `useStudents.js` | Escrita em `{orgId}/usuarios`; visitantes com `isVisitor`; turmas/faturas tenant; PIN em `privado/segredos` |
| 2026-09-01 | `useTeacherIntelligence.js` | `{orgId}/chamadas` + `{orgId}/presencas`; dependência `organizacaoAtualId` |
| 2026-09-01 | `GraduationHistoryModal.jsx` | Graduações/modalidades/professores tenant-scoped |
| 2026-09-01 | `GraduationChangeModal.jsx` | updateDoc em `{orgId}/usuarios/{id}` |
| 2026-09-01 | `AttendanceHistoryDrawer.jsx` | Presenças + anotações tenant-scoped |
| 2026-09-01 | `HistoryDrawer.jsx` | Presenças + graduações tenant-scoped |
| 2026-09-01 | `ReviewAttendancePage.jsx` | **EM ANDAMENTO** — imports prontos; 5 refs de coleção raiz pendentes (seção 5.1) |
| 2026-09-01 | `ReviewAttendancePage.jsx` | **Concluído** — chamadas/presenças e log de presenças tenant-scoped (`{orgId}/chamadas`, `{orgId}/presencas`); guard + dependência `organizacaoAtualId` |
| 2026-09-01 | `AttendancePage.jsx` | Histórico de chamadas em `{orgId}/chamadas`; guard + dependência `organizacaoAtualId` |
| 2026-09-01 | `TeacherDashboard.jsx` | Notas do professor em `usuarios/{uid}/anotacoes` (substitui `teachers/{uid}/notes`) |
| 2026-09-01 | `ConfigurationView.jsx` | Modalidades `{orgId}/modalidades` + configurações `{orgId}/configuracoes` (remove `CONFIGURACOES_JORNADA`) |
| 2026-09-01 | `RSAdminRegister.jsx`, `ResetPasswordPage.jsx` | Identidade global via `ROOT_COLLECTIONS.USUARIOS_GLOBAIS` (raiz `usuarios`, bootstrap/admin) |
| 2026-09-01 | `AttendanceHistoryDrawer.jsx` | Corrigida duplicação de `const [records, setRecords]` (erro de parse no build) |
| 2026-09-01 | — | Varredura final OK (nenhuma coleção raiz legada restante); `npm run build` passou |

---

## 8. Prompt de continuação (colar em outra IA)

> A refatoração multi-tenant do frontend em `G:\Programação\_Atlas Academy\System` está
> **concluída**. Nenhuma referência a coleção raiz legada restante (exceto `collectionGroup`
> escopados por tenant). Build passa. Para novas features, siga o contrato da seção 2 e os
> padrões da seção 3 (todo acesso dentro de `organizations/{orgId}`).
