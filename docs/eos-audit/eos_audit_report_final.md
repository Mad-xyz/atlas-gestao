# RELATÓRIO DE REVISÃO DE ENGENHARIA

**Sistema:** Atlas Academy (SaaS Multi-Tenant de Gestão de Academias)  
**Módulos Auditados:** `System` (React 19 + Vite + Tailwind v4 + Firebase SDK v12) & `Site` (HTML5/CSS3/Vanilla JS)  
**Metodologia:** EOS (Engineering Operating System) & Revisor Sênior de Engenharia de Software  
**Modo de Operação:** `REVIEW_READ_ONLY` (Evidence-First, Rigor Técnico Sênior)  
**Data:** 09/09/2026  
**Avaliador:** Revisor Sênior de Engenharia de Software  

---

## 1. Objetivo
Executar uma auditoria profunda, independente e fundamentada em evidências técnicas do repositório Atlas Academy, avaliando se a solução:
- Resolve de forma sustentável e segura as necessidades de negócio de uma plataforma SaaS multi-tenant;
- Mantém fronteiras arquiteturais coerentes e responsabilidades nas camadas corretas;
- Garante a segurança de credenciais, isolamento de dados entre academias e proteção contra elevação de privilégios;
- Preserva a integridade e consistência transacional dos dados no Cloud Firestore;
- Cumpre os Quality Gates de compilação, análise estática, governança e conformidade com padrões de mercado (OWASP ASVS v4.0, NIST CSF v2.0, NIST SP 800-63B, CIS Controls v8.0).

---

## 2. Escopo
- **Componentes no Escopo:**
  - Aplicação Frontend Administrativa e PWA (`System/src/`): módulos de Autenticação, Alunos, Presenças/Chamadas, Financeiro, Graduações, Dashboard, Contextos globais, Hooks e Serviços.
  - Regras de Segurança do Banco de Dados (`System/firestore.rules` e `firestore.indexes.json`).
  - Landing Page Institucional e Funil de Onboarding (`Site/`): formulários de cadastro e fluxo de integração (`js/quiz.js`).
  - Configuração de Build, Dependências e Empacotamento (`package.json`, `vite.config.js`, `firebase.json`).
- **Componentes Fora do Escopo:**
  - Código legado mantido em diretórios descontinuados (`multi-tenant/`, `Admin/`).
  - Emuladores de hardware locais (leitores biométricos ou catracas físicas não conectados).

---

## 3. Evidências Analisadas
1. **Histórico e Estrutura Git:** Histórico em `.git/logs/HEAD`, `refs/heads/master` e sincronização verificada na branch `main`.
2. **Quality Gate de Build Real:** Execução de `npm run build` em `System` finalizada com sucesso em 21.52 segundos (gerando bundle PWA de 4.2 MB com aviso de chunks excedendo 500 kB).
3. **Quality Gate Estático Real:** Execução de `npm run lint` em `System` falhou com código 1, gerando **347 erros** dentro do diretório `src/`.
4. **Inspeção de Código-Fonte e Regras:** Análise direta de 100% dos arquivos críticos (`firestore.rules`, `AuthContext.jsx`, `OrganizacaoContext.jsx`, `LoginPage.jsx`, `useStudents.js`, `useFinance.js`, `usePaymentReport.js`, `attendanceService.js`, `quiz.js`, etc.).
5. **Artefatos EOS Produzidos:** 8 documentos de detalhamento técnico consolidados no diretório brain da sessão.

---

## 4. Limitações
- A auditoria foi executada estritamente no modo `REVIEW_READ_ONLY`, sem alteração ou remediação em tempo real de nenhum arquivo da base de código.
- Não foi executada suite de testes automatizados devido à constatação de que o projeto possui **zero testes automatizados** e não possui script `"test"` configurado.

---

## 5. Arquitetura Observada
- **Padrão Arquitetural:** Frontend SPA (Single Page Application) e PWA conectado diretamente a um Backend-as-a-Service (BaaS) serverless no Google Cloud Firestore e Firebase Auth, sem camada de backend Node.js dedicado.
- **Topologia Multi-Tenant:** Modelo hierárquico baseado em subcoleções sob o documento `organizations/{orgId}`. As coleções raiz legadas são bloqueadas por regras de segurança.
- **Acoplamento:** Forte acoplamento da camada de apresentação (React Components) diretamente com chamadas de rede do Firebase SDK, sem camada intermediária de repositório ou abstração de dados (ausência de Clean Architecture / Ports and Adapters).

---

## 6. Domínio e Regras Identificadas
1. **Identidade e Membros:** Uma organização (academia) possui membros (equipe técnica com papéis: `owner`, `admin`, `gestor`, `professor`) e usuários (alunos e visitantes).
2. **Jornada Técnica de Graduação:** Progressão de faixas e graus baseada em tempo mínimo (meses na faixa) e frequência de presença em aulas (`aulas_desde_ultima_graduacao`).
3. **Assiduidade:** Sessões de chamadas registram o comparecimento dos alunos e incrementam atomicamente contadores de assiduidade.
4. **Ciclo Financeiro:** Geração e liquidação de cobranças (`faturas`) com status `'pending'`, `'paid'` e `'overdue'`.

---

## 7. Achados de Engenharia e Segurança

### Críticos
1. **ID: SEC-01 — Transmissão de PIN/Senha em Texto Plano via Query String de URL**
   - *Evidência:* `Site/js/quiz.js:421` redireciona para `System` concatenando `?email=...&pin=...`.
   - *Impacto:* Credenciais do cliente vazam no histórico do navegador, logs de servidores/CDN e proxies corporativos.
2. **ID: SEC-02 — Armazenamento de PINs e Senhas em Texto Plano no Firestore**
   - *Evidência:* `AuthContext.jsx:349` e `useStudents.js:371` gravam e comparam `adminPin` sem hash criptográfico (bcrypt/Argon2id).
   - *Impacto:* Comprometimento absoluto de senhas mestras caso as permissões do banco sejam expostas.
3. **ID: SEC-03 — Elevação de Privilégios Client-Side via `localStorage`**
   - *Evidência:* `AuthContext.jsx:67, 97` prioriza incondicionalmente `localStorage.getItem('rs_simulated_role')`.
   - *Impacto:* Qualquer aluno regular pode alterar o valor no console para `'admin'` e desbloquear telas de faturamento e administração.
4. **ID: SEC-06 — Vazamento de Dados Financeiros entre Tenants em Cache Global**
   - *Evidência:* `usePaymentReport.js:8, 167-171` armazena `_cachedBills` em escopo global de módulo sem chave de organização.
   - *Impacto:* Troca de academia ativa sem refresh exibe cobranças confidenciais da academia anterior na nova academia.

### Altos
1. **ID: SEC-04 — Permissão Excessiva em `firestore.rules` para `privado/segredos`**
   - *Evidência:* `firestore.rules:174-179` permite que qualquer membro staff (incluindo `professor`) leia segredos de donos e administradores.
2. **ID: SEC-05 — Superadmin Hardcoded por E-mails Pessoais nas Regras**
   - *Evidência:* `firestore.rules:47-53` concede acesso mestre à lista de e-mails incluindo `pmadsonm@gmail.com`.
3. **ID: RISK-CONS-01 — Criação Não Atômica de Tenancy**
   - *Evidência:* `OrganizacaoContext.jsx:191-208` executa 3x `await setDoc` separados; falha intermediária gera tenant órfão inacessível.
4. **ID: RISK-CONS-03 — Bug de Fuso Horário em Inadimplência**
   - *Evidência:* `useFinance.js:97` usa UTC (`toISOString()`); no Brasil (UTC-3), entre 21h e 23h59 o sistema marca faturas de hoje como vencidas.
5. **ID: BUG-01 — Quebra de Execução em Runtime (Undefined Functions)**
   - *Evidência:* `StudentsPage.jsx:1217` chama `formatBR` (inexistente) e `billingAdjustment.js:85` chama `doc` (não importado), causando tela branca.

### Médios
1. **ID: SEC-07 — Rate Limiting de Autenticação Executado no Cliente**
   - *Evidência:* `LoginPage.jsx:30-37` armazena contagem de falhas de login no `localStorage`, facilmente contornável por scripts.
2. **ID: QA-01 — Falha no Quality Gate Estático**
   - *Evidência:* 347 erros de ESLint em `src/`, incluindo violações graves de dependências de hooks (`react-hooks/exhaustive-deps`).
3. **ID: RISK-CONS-05 — Divergência de Schema de Graduação**
   - *Evidência:* `attendanceService.js:109` grava `jornada_tecnica`, mas `useStudentJourney.js:80` lê `student.tech_journey`.

### Baixos & Informativos
1. **ID: PERF-01 — Ausência de Code-Splitting**
   - *Evidência:* Bundle principal JS com 4.2 MB em arquivo único gerado pelo Vite.
2. **ID: DOC-01 — Documentação Inexistente / Desatualizada**
   - *Evidência:* `README.md` com apenas 1 linha; ausência de manuais operacionais e diagramas atualizados.

---

## 8. Segurança
A auditoria constatou conformidade **insuficiente** com os padrões OWASP ASVS v4.0 e NIST SP 800-63B. Embora a estrutura de regras do Firestore utilize isolamento por subcoleções de organizações (`organizations/{orgId}`), as falhas de credenciais em texto plano (SEC-01 e SEC-02), o bypass por `localStorage` (SEC-03) e as permissões excessivas para professores lerem segredos (SEC-04) comprometem severamente a postura de segurança da plataforma.

---

## 9. Dados e Concorrência
- **Atomicidade:** Apenas o fechamento de chamada (`attendanceService.js`) utiliza lote atômico (`writeBatch`). A criação de academias e deleções de sessões não são atômicas, deixando registros órfãos.
- **Concorrência:** Operações de incremento (`increment(1)`) garantem segurança no campo do Firestore, mas a validação de regras de duplicidade ocorre na memória do cliente, permitindo registros concorrentes indevidos.

---

## 10. Testes e Qualidade
- **Cobertura Automatizada:** **0.00%** (Nenhum teste unitário, de integração, de regras do Firestore ou ponta-a-ponta).
- **Análise Estática:** Bloqueada por 347 erros de linter.
- **Tipagem:** Ausência de TypeScript ou validação formal de schemas em tempo de execução.

---

## 11. Operação e Observabilidade
- **Telemetria de Erros:** Inexistente (sem Sentry, Crashlytics ou Datadog). Exceções em clientes não são capturadas nem reportadas.
- **Trilha de Auditoria:** Funcional para ações administrativas internas via `organizations/{orgId}/logs`, porém sem resiliência caso a organização não esteja definida.
- **CI/CD:** Inexistente (sem GitHub Actions; deploy manual via CLI).

---

## 12. Riscos Residuais
A arquitetura sem backend (direct-to-Firestore) transfere regras sensíveis de cobrança e graduação para o navegador dos usuários. Qualquer falha futura nas regras de segurança do Firestore expõe diretamente o banco de produção a adulterações.

---

## 13. Dívidas Técnicas Relevantes
1. Arquivos gigantes com múltiplas responsabilidades (`AuthContext.jsx` com 631 linhas; `StudentsPage.jsx` com >1200 linhas).
2. Convivência confusa de terminologia em inglês e português entre banco, serviços e componentes.
3. Bundle JS de 4.2 MB prejudicando o tempo de carregamento inicial em redes móveis (Core Web Vitals).

---

## 14. Prioridade Recomendada de Remediação

```
┌──────────┬──────────────┬────────────────────────────────────────────────────────┐
│ Nível    │ IDs          │ Ações Necessárias                                      │
├──────────┼──────────────┼────────────────────────────────────────────────────────┤
│ P0       │ SEC-01       │ Remover transmissão de PIN na URL em Site/js/quiz.js   │
│ Imediato │ SEC-03       │ Remover bypass de permissão rs_simulated_role no Auth  │
│          │ BUG-01       │ Corrigir erros que crasham a tela de Alunos (formatBR) │
├──────────┼──────────────┼────────────────────────────────────────────────────────┤
│ P1       │ SEC-02       │ Eliminar armazenamento de PINs mestres em texto plano   │
│ Urgente  │ SEC-04/05    │ Ajustar firestore.rules (remover e-mails e segredos)   │
│          │ SEC-06       │ Particionar cache global em usePaymentReport.js        │
│          │ RISK-CONS-03 │ Ajustar fuso horário de cobranças para UTC-3           │
├──────────┼──────────────┼────────────────────────────────────────────────────────┤
│ P2       │ QA-01        │ Resolver 347 erros de ESLint e criar suite de testes   │
│          │ PERF-01      │ Aplicar React.lazy() para code-splitting no App.jsx    │
├──────────┼──────────────┼────────────────────────────────────────────────────────┤
│ P3       │ CI-01        │ Implantar GitHub Actions com Quality Gates obrigatórios│
└──────────┴──────────────┴────────────────────────────────────────────────────────┘
```

---

## 15. Veredito Final de Engenharia

# VEREDITO: **REJECTED**

> **Justificativa do Veredito:**
> O sistema apresenta violações críticas de segurança (vazamento de credenciais na URL, senhas em texto puro no banco e bypass de autorização no frontend) somadas a defeitos de execução que crasham a aplicação (`ReferenceError`) e total ausência de testes automatizados e pipelines de CI/CD. O sistema **NÃO ESTÁ APROVADO** para operação em produção antes da conclusão e homologação das correções do pacote **P0**.

---

## 16. Próximo Menor Passo Seguro

1. **Parar a execução e submeter este Relatório Consolidado para ciência e validação do usuário** (mantendo estritamente o modo `REVIEW_READ_ONLY`).
2. **Aguardar a autorização explícita do usuário** para iniciar a Fase de Remediação.
3. Após a autorização, abrir ciclo de correção focado estritamente nos achados **P0**:
   - `P0.1`: Corrigir `Site/js/quiz.js` e `LoginPage.jsx` eliminando passagem de PIN por parâmetro GET.
   - `P0.2`: Proteger a resolução de `effectiveRole` em `AuthContext.jsx` contra injeção de perfis via `localStorage`.
   - `P0.3`: Declarar/importar `formatBR` em `StudentsPage.jsx` e `doc` em `billingAdjustment.js`.
