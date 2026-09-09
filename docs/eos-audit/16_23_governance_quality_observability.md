# EOS ARTIFACTS 16 a 23: GOVERNANÇA, QUALIDADE, TESTES, DEPENDÊNCIAS E OBSERVABILIDADE

**Sistema:** Atlas Academy (SaaS Multi-Tenant)  
**Módulos:** `System` & `Site`  
**Metodologia de Auditoria:** EOS Quality & Governance Gate  
**Modo:** `REVIEW_READ_ONLY` (Evidence-First)  
**Data:** 09/09/2026  

---

## ARTIFACT-16: Governance Checklist (Checklist de Governança de Engenharia)

| Critério de Governança | Status | Evidência / Constatação |
| :--- | :---: | :--- |
| **Padrão de Nomenclatura e Idioma** | ⚠️ PARCIAL | Regra `_codigo-em-portugues` parcialmente implementada. Existem coleções em português (`usuarios`, `chamadas`, `faturas`) convivendo com aliases em inglês (`students`, `sessions`, `charges`) e chaves camelCase misturadas com snake_case (`jornada_tecnica` vs `tech_journey`). |
| **Linters e Regras Estáticas Ativas** | ❌ FALHA | ESLint configurado em `System/package.json` (`eslint .`), mas falha com **347 erros** dentro de `src/` (e 606 no workspace), incluindo variáveis indefinidas e violações de React Hooks. |
| **Tipagem Estática** | ❌ AUSENTE | O projeto utiliza JavaScript puro (`.jsx`/`.js`). Nenhum arquivo `.ts` ou validação TypeScript (`tsc --noEmit`). |
| **Controle de Segredos e Credenciais** | ❌ FALHA | E-mails pessoais hardcoded em `firestore.rules`; PINs armazenados em texto plano no banco; credenciais transmitidas via query string no `Site/js/quiz.js`. |
| **Imutabilidade e Rollback** | ❌ AUSENTE | Nenhuma migração versionada de banco de dados (Firestore migrations). Deleções não possuem soft-delete padronizado ou tombstone consistente. |

---

## ARTIFACT-17: Architecture Decision Register (ADR Reconstruction)

Com base no código-fonte e histórico de refatoração, reconstruímos as decisões arquiteturais fundamentais adotadas:

### ADR-01: Adoção do Firebase como Backend-as-a-Service (BaaS) Serverless
- **Decisão:** Eliminar servidor Node.js/Express intermediário e conectar o frontend React diretamente ao Google Cloud Firestore e Firebase Authentication.
- **Justificativa Observada:** Redução de custos de infraestrutura e velocidade inicial de entrega para academias locais.
- **Consequências Técnicas:**
  - *Positivas:* Autenticação integrada, sincronização em tempo real (`onSnapshot`), persistência offline automática via IndexedDB no PWA.
  - *Negativas:* Regras de negócio críticas (inadimplência, graduação técnica, fechamento de chamada) forçadas para o cliente frontend; vulnerabilidade a adulteração se as Firestore Security Rules forem permissivas.

### ADR-02: Isolamento Multi-Tenant via Subcoleções de Organização
- **Decisão:** Estruturar cada academia como um documento sob `organizations/{orgId}` com subcoleções dedicadas (`members`, `usuarios`, `chamadas`, `faturas`, etc.), bloqueando coleções raiz legadas.
- **Justificativa Observada:** Garantir isolamento de dados entre academias e permitir que um mesmo usuário pertença a múltiplas organizações.
- **Consequências Técnicas:**
  - *Positivas:* Segurança estruturada em árvore hierárquica no Firestore; redução de risco de vazamento comparado a coleções compartilhadas com campo discriminador `orgId`.
  - *Negativas:* Dificuldade em consultas agregadas globais (exige `collectionGroup`); dependência de `collectionGroup('members')` para login, que falha se a criação não for estritamente atômica.

### ADR-03: Modelo de Autenticação Híbrido "Smart PIN"
- **Decisão:** Permitir que o mesmo e-mail acesse papéis diferentes dependendo do PIN digitado (PIN normal entra como aluno, PIN administrativo entra como gestor/staff).
- **Justificativa Observada:** Permitir que gestores testem a experiência do aluno sem precisar de duas contas de e-mail separadas.
- **Consequências Técnicas:**
  - *Positivas:* Usabilidade simplificada para donos de academia em dispositivos móveis.
  - *Negativas:* Forçou o armazenamento do PIN em texto plano na subcoleção `privado/segredos`; quebrou a separação de credenciais do Firebase Auth; introduziu vetor de bypass por manipulação de `localStorage`.

---

## ARTIFACT-18: Test Coverage Matrix (Matriz de Cobertura de Testes)

| Camada do Sistema | Tipo de Teste | Qtd. de Arquivos de Teste | Cobertura Real | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Domain & Invariants** (Graduação, Finanças) | Unitário | 0 | 0.00% | ❌ INEXISTENTE |
| **Security Rules** (Firestore Rules) | Regras / Emulador | 0 | 0.00% | ❌ INEXISTENTE |
| **Services & Hooks** (Attendance, Auth, Tenant) | Integração | 0 | 0.00% | ❌ INEXISTENTE |
| **UI Components & Pages** (Login, Dashboard) | Component / Snapshot | 0 | 0.00% | ❌ INEXISTENTE |
| **End-to-End** (Onboarding Quiz -> Login) | E2E (Playwright/Cypress) | 0 | 0.00% | ❌ INEXISTENTE |

> **Constatação Fato Verificado:** O arquivo `System/package.json` não possui script de teste (`"test"`). Não existe qualquer framework de testes (Vitest, Jest, Cypress, Playwright) instalado nas dependências. O sistema está em produção com **0% de cobertura de testes automatizados**.

---

## ARTIFACT-19: Quality Gate Verification (Verificação de Build e Linters)

Resultados das execuções estáticas reais no ambiente:

### 1. Build de Produção (`npm run build`)
- **Comando:** `vite build`
- **Resultado:** ✅ **SUCESSO** (Código de saída: 0)
- **Tempo de Execução:** 21.52 segundos
- **Bundle Analysis:**
  - `dist/index.html`: ~2.5 kB
  - `dist/assets/index-[hash].css`: ~68 kB
  - `dist/assets/index-[hash].js`: **4,218.42 kB (4.2 MB)**
- **Alerta de Performance:** O Vite reportou warning crítico de tamanho de chunk: `Some chunks are larger than 500 kB after minification`. O bundle principal tem mais de 4 MB sem code-splitting adequado, impactando severamente o Core Web Vitals (LCP) em conexões 4G/3G móveis.

### 2. Análise Estática de Código (`npm run lint`)
- **Comando:** `eslint .`
- **Resultado:** ❌ **FALHOU** (Código de saída: 1)
- **Erros Identificados dentro de `src/`:** **347 erros** e dezenas de warnings.
- **Erros Críticos que Causam Falhas em Runtime:**
  1. `StudentsPage.jsx:1217`: `'formatBR' is not defined` (`no-undef`). A função de formatação de data para visitantes é chamada sem existir no módulo.
  2. `billingAdjustment.js:85`: `'doc' is not defined` (`no-undef`). A função `doc` do Firestore é chamada sem importação.
  3. `AuthContext.jsx` e múltiplos hooks: Violações graves de dependências de hooks (`react-hooks/exhaustive-deps`), causando memory leaks e loops de renderização.

---

## ARTIFACT-20: CI/CD Pipeline Assessment (Avaliação de Integração e Deploy Contínuo)

| Componente | Existe? | Evidência | Avaliação de Risco |
| :--- | :---: | :--- | :--- |
| **GitHub Actions / Workflows** | ❌ NÃO | Diretório `.github/workflows` inexistente. | **ALTO**: Não há verificação automática de lint, build ou segurança a cada pull request/commit. |
| **Pre-commit Hooks (Husky/lint-staged)** | ❌ NÃO | Nenhum arquivo `.husky` ou script de git hook. | **MÉDIO**: Código quebrado (como os 347 erros de lint) pode ser comitado diretamente na branch `main`. |
| **Deploy Automatizado** | ❌ NÃO | Deploy depende de comando manual via CLI (`firebase deploy`). | **ALTO**: Risco de deploy a partir de máquina local com branch desalinhada ou dependências não testadas. |

---

## ARTIFACT-21: Runtime Dependency Risk Register (Registro de Riscos de Dependências)

| Dependência | Versão Instalada | Tipo | Risco Identificado | Severidade |
| :--- | :---: | :---: | :--- | :---: |
| `react` / `react-dom` | `^19.2.4` | Produção | Versão major recente (React 19). Bibliotecas de terceiros (ex: `recharts`, `html2pdf.js`) podem apresentar avisos de compatibilidade com StrictMode e Suspense. | BAIXO |
| `firebase` | `^12.11.0` | Produção | Modular SDK v12. Requer atenção estrita ao tree-shaking para evitar inchaço do bundle JS. | MÉDIO |
| `html2pdf.js` | `^0.14.0` | Produção | Dependência pesada que inclui `jspdf` e `html2canvas`. Converte o DOM em canvas para gerar PDF no cliente, consumindo memória excessiva em smartphones modestos. | MÉDIO |
| `tailwindcss` / `@tailwindcss/vite` | `^4.2.2` | Produção | Versão 4 recente. Adoção correta via plugin oficial do Vite, sem dependência de PostCSS legado. | BAIXO |
| `@capacitor/core` / `@capacitor/android` | `^8.4.0` | Produção | Versão 8 do Capacitor. Boa aderência para empacotamento Android/PWA. | BAIXO |

---

## ARTIFACT-22: Documentation Quality Map (Mapeamento de Documentação Técnica)

| Documento | Caminho | Status Real | Avaliação |
| :--- | :--- | :---: | :--- |
| `README.md` | `/README.md` | 1 linha (`# atlas-gestao`) | **Crítico:** Totalmente ausente; sem instruções de instalação, build, variáveis de ambiente ou arquitetura. |
| `ATLAS_REFATORACAO_STATUS.md` | `/ATLAS_REFATORACAO_STATUS.md` | Detalhado | Bom registro histórico do refactoring de multitenancy, porém estático e sem atualização pós-conclusão. |
| `atlas-saas-architecture.md` | `/docs/atlas-saas-architecture.md` | Parcialmente desatualizado | Descreve proposta de agosto de 2026. Apresenta divergências com o código atual (ex.: nomes de subcoleções em inglês no doc vs português no código). |
| Documentação de APIs / DTOs | - | Inexistente | Sem OpenAPI, Swagger, JSDoc ou schemas de banco. |

---

## ARTIFACT-23: Observability Specification (Especificação e Auditoria de Observabilidade)

### 1. Auditoria de Observabilidade Atual
- **Trilha de Auditoria de Negócio (`usarLogsSistema.js`):**
  - Registra ações operacionais de staff em `organizations/{orgId}/logs`.
  - Falha silenciosa: se `organizationId` for nulo, a função descarta o log com `console.warn` em vez de persistir em uma fila ou log global de fallback.
- **Telemetria de Erros Técnicos (APM / RUM):**
  - **AUSENTE:** Nenhum serviço de rastreamento de exceções (Sentry, Datadog, Bugsnag, Firebase Crashlytics) configurado no frontend.
  - Exceções não capturadas em produção resultam em tela branca no React sem notificação à equipe de engenharia.
- **Core Web Vitals & Performance Monitoring:**
  - **AUSENTE:** Nenhuma coleta de métricas de LCP, INP, CLS ou chamadas de rede lentas do Firestore.
