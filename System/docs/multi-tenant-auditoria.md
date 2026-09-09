# RELATÓRIO DE AUDITORIA COMPLETA — R.S TOP TEAM (FASE 0)

> **Data da Auditoria:** 28/08/2026  
> **Objetivo:** Mapeamento profundo do estado atual do código, banco de dados, regras e fluxos da aplicação R.S Top Team para subsidiar a transformação na plataforma SaaS Multi-tenant **Atlas**.

---

## 1. RESUMO EXECUTIVO

A aplicação **R.S Top Team** é um sistema completo de gestão de academia de artes marciais construído em **React 19 + Vite 6 + Tailwind CSS v4 + Firebase (Auth + Firestore + Storage)** sem backend Node.js dedicado, funcionando como um SPA PWA.

Atualmente, todos os módulos assumem que o sistema atende **uma única academia implícita** (a R.S Top Team). Todas as coleções do Firestore armazenam documentos no nível raiz de forma global.

---

## 2. MAPEAMENTO DE ESTRUTURA E ARQUIVOS CHAVE

### 2.1. Configuração e Dependências (`package.json`, `vite.config.js`)
* **React:** 19.2.4 (JSX puro, sem TypeScript na aplicação).
* **Vite:** 8.0.1 com plugin PWA (`vite-plugin-pwa`) e Tailwind v4 (`@tailwindcss/vite`).
* **Firebase SDK:** v12.11.0.
* **Roteamento:** React Router v7.13.2.
* **Estilização:** Tailwind CSS v4.2.2 + CSS Variables dinâmicas em `src/index.css` (6 temas dark).

### 2.2. Autenticação e Sessão (`src/context/AuthContext.jsx`)
* **Dual Auth Architecture:**
  1. Instância principal do Firebase Auth (`auth`) para controle de sessão persistente no navegador via `browserLocalPersistence`.
  2. Instância auxiliar `verifyAuth` com `inMemoryPersistence` para reautenticação e validações pontuais sem alterar a sessão ativa.
* **Controle de Papéis (SSoT):**
  * Prioridade 1: Objeto `papeis` (`papeis.admin`, `papeis.gestor`, `papeis.professor`).
  * Prioridade 2: Objeto `roles` (legado).
  * Prioridade 3: String `role` (`'admin'`, `'gestor'`, `'professor'`, `'aluno'`).
* **Simulação de Visão (`simulatedRole`):**
  * Permite que administradores alternem temporariamente para a visão de `'aluno'`.

---

## 3. MAPEAMENTO COMPLETO DE COLEÇÕES E SUBCOLEÇÕES FIRESTORE

Definidos em `src/firebase/collections.js` e validados nas `firestore.rules`:

| Coleção Firestore | Alias / Antigo | Finalidade | Nível Atual |
|---|---|---|---|
| `usuarios` | `users` | Perfis de colaboradores, professores, gestores e alunos | Raiz (Global) |
| `alunos` | `students` | Cadastro detalhado dos alunos, jornada técnica, faixas | Raiz (Global) |
| `equipe` | `collaborators` | Dados da equipe e colaboradores | Raiz (Global) |
| `chamadas` | `sessions` | Sessões de aulas e presença | Raiz (Global) |
| `modalidades` | `modalities` | Modalidades esportivas (Jiu-Jitsu, Muay Thai, etc.) | Raiz (Global) |
| `eventos` | `notices` | Quadro de avisos e eventos da academia | Raiz (Global) |
| `faturamento` | `billing` | Cobranças, mensalidades e receitas | Raiz (Global) |
| `despesas` | `expenses` | Registro de custos e despesas operacionais | Raiz (Global) |
| `contratos` | `contracts` | Contratos e termos de adesão | Raiz (Global) |
| `cofre_pins` | `vault` | Armazenamento de PINs e credenciais | Raiz (Global) |
| `professores` | `teachers` | Cadastro específico de professores | Raiz (Global) |
| `presencas_log` | `attendance` | Registros históricos de presença | Raiz (Global) |
| `configuracoes_jornada` | `tech_journey_configs` | Requisitos de faixas e graduações | Raiz (Global) |
| `planos` | `plans` | Planos de assinatura e mensalidades | Raiz (Global) |
| `logs_sistema` | `systemLogs` | Trilha de auditoria e registros | Raiz (Global) |

### Subcoleções Mapeadas:
* `/usuarios/{userId}/privado/segredos` -> PINs masters e segredos sensíveis.
* `/usuarios/{userId}/anotacoes` -> Observações internas de staff sobre o aluno.
* `/usuarios/{userId}/graduacoes` -> Histórico de faixas e graus.
* `/usuarios/{userId}/visitantes` -> Ficha de visitantes associada ao perfil.
* `/modalidades/{modalidadeId}/turmas` -> Horários e turmas da modalidade.
* `/chamadas/{chamadaId}/presencas` -> Alunos presentes na chamada.
* `/eventos/{eventoId}/visualizacoes` -> Confirmações de leitura de avisos.

---

## 4. ANÁLISE DE SECURITY RULES (`firestore.rules`)

As regras atuais utilizam funções auxiliares de verificação baseadas no e-mail do token Firebase Auth e consultas ao documento do usuário:
* `isAuth()`: Verifica se `request.auth != null`.
* `isAdmin()`: Checa e-mail hardcoded (`pmadsonm@gmail.com`) ou se o campo `papeis.admin == true` no documento `/usuarios/{email}`.
* `isStaff()`: Checa se é admin, gestor ou professor.

### Fragilidades do Modelo Atual para Multi-tenancy:
1. **Sem conceito de tenant:** Qualquer usuário autenticado com perfil `isStaff` possui acesso total de leitura/escrita em **todas** as coleções do banco de dados.
2. **Leitura global de alunos/faturamento:** `faturamento` permite leitura se `resource.data.studentId == request.auth.uid`, mas a listagem de faturamento por staff lê todos os documentos do banco sem restrição de organização.
3. **Coleções legadas (`users`, `students`):** Mantêm permissões amplas de `isStaff()` para compatibilidade histórica.

---

## 5. AUDITORIA DE CHAMADAS DE DADOS NOS HOOKS E CONTEXTOS

Foram analisados todos os hooks e serviços que realizam chamadas ao Firestore (`getDocs`, `onSnapshot`, `addDoc`, etc.):

* `src/context/StudentsContext.jsx`: Consulta `collection(db, 'alunos')` sem filtro de tenant.
* `src/hooks/useStudents.js`: Consulta `collection(db, 'alunos')` diretamente.
* `src/hooks/useFinance.js`: Consulta `faturamento` e `despesas` de forma global.
* `src/hooks/useModalities.js`: Consulta `modalidades` de forma global.
* `src/hooks/useTodaySessions.js` e `useAttendanceHistory.js`: Consultam `chamadas` de forma global.
* `src/hooks/useNotices.js`: Consulta `eventos` sem restrição de organização.

---

## 6. CONCLUSÃO DA AUDITORIA E RISCOS IDENTIFICADOS

1. **Risco de Vazamento de Dados (Cross-Tenant):** Se um segundo tenant for adicionado no modelo atual, um professor da Academia A poderá visualizar alunos e faturamento da Academia B.
2. **Ausência de Contexto de Organização:** Nenhum hook ou componente React atual possui estado ou parâmetro `organizationId`.
3. **Persistência do Cache do Firestore:** O cache local `persistentLocalCache` guardará documentos de todas as consultas ativas, exigindo um mecanismo de reset de estado/query ao trocar de organização.

---

## 7. PRÓXIMOS PASSOS IMEDIATOS (FASE 1 DA ESTRATÉGIA)
1. Definir modelo formal em `docs/modelo-de-dados.md` e `docs/adr/001-modelo-de-multi-tenancy.md`.
2. Implementar `OrganizationContext` e estrutura base de `organizations` e `memberships`.
3. Garantir migração sem perdas do tenant `rs-top-team`.
