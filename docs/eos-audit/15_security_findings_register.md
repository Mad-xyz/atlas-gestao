# EOS ARTIFACT-15: REGISTRO DE ACHADOS DE SEGURANÇA E AUDITORIA TÉCNICA

**Sistema:** Atlas Academy (SaaS Multi-Tenant)  
**Módulos:** `System` (Frontend Web App PWA) & `Site` (Landing Page / Onboarding Quiz)  
**Metodologia de Auditoria:** EOS Security Gate / OWASP ASVS v4.0 / NIST CSF v2.0 / NIST SP 800-63B / CIS Controls v8.0  
**Modo:** `REVIEW_READ_ONLY` (Evidence-First)  
**Data:** 09/09/2026  

---

## RESUMO DO PERFIL DE RISCO DE SEGURANÇA

| Nível de Severidade | Quantidade de Achados | Fatos Verificados | Hipóteses |
| :--- | :---: | :---: | :---: |
| **CRÍTICO** | 4 | 4 | 0 |
| **ALTO** | 3 | 3 | 0 |
| **MÉDIO** | 2 | 2 | 0 |
| **BAIXO / INFORMATIVO** | 2 | 2 | 0 |
| **TOTAL** | **11** | **11** | **0** |

---

## CATÁLOGO DETALHADO DE ACHADOS DE SEGURANÇA

### ID: SEC-01 — Transmissão de PIN e Credenciais em Texto Plano via Query String de URL
- **Título:** Vazamento de Senha/PIN via Redirecionamento HTTP GET com Parâmetros de Consulta
- **Classificação:** Defeito de Arquitetura de Autenticação / Violação de Confidencialidade
- **Severidade:** **CRÍTICO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `Site/js/quiz.js`: linhas 418 a 424:
    ```javascript
    function irParaLogin(email, pin) {
      if (!ENDERECO_LOGIN) return false;
      var separador = ENDERECO_LOGIN.indexOf("?") !== -1 ? "&" : "?";
      var url = ENDERECO_LOGIN + separador + "email=" + encodeURIComponent(email) + "&pin=" + encodeURIComponent(pin);
      window.location.href = url;
      return true;
    }
    ```
  - `System/src/modules/auth/LoginPage.jsx`: linhas 17 a 23:
    ```javascript
    const [searchParams] = useSearchParams()
    const urlEmail = searchParams.get('email') || ''
    const urlPin   = searchParams.get('pin') || ''
    ...
    const [email, setEmail] = useState(urlEmail)
    const [pin, setPin]     = useState(urlPin)
    ```
- **Comportamento Atual:** Ao concluir o cadastro no site institucional, o navegador do usuário é redirecionado para a aplicação de gestão passando `?email=...&pin=123456` na barra de endereços do browser.
- **Comportamento Esperado:** Credenciais e tokens de autenticação nunca devem trafegar em URLs. O cadastro deve autenticar diretamente via API backend ou gerar um token de sessão de uso único (one-time ticket) de curta duração enviado via POST/Storage seguro.
- **Regra / Princípio Afetado:** CWE-598, OWASP Top 10 (A07:2021 Identification and Authentication Failures), OWASP ASVS v4.0 (V3.1.1), NIST SP 800-63B (Seção 5.1.1).
- **Causa:** Conveniência na implementação da integração entre o site estático e o sistema React sem autenticação compartilhada.
- **Impacto Técnico:** A senha/PIN do gestor da academia fica registrada no histórico do navegador (`window.history`), nos logs de acesso do servidor web e CDN, em proxies corporativos, e vaza no cabeçalho HTTP `Referer` caso a página faça requisições a links de terceiros.
- **Impacto no Negócio:** Exposição direta das credenciais de novos clientes da plataforma, permitindo sequestro imediato de contas por invasores com acesso ao histórico local ou logs de tráfego.
- **Cenário de Falha:** Usuário cadastra sua academia em uma máquina compartilhada ou lan house; o próximo usuário abre o histórico do navegador e visualiza a URL completa com a senha administrativa em texto legível.
- **Recomendação:** Remover imediatamente os parâmetros `pin` da URL. O `Site` deve invocar uma Cloud Function autenticada para criar a conta e retornar uma sessão segura (Custom Token / Session Cookie) ou redirecionar o usuário apenas com o e-mail pré-preenchido, exigindo digitação do PIN.
- **Trade-offs da Recomendação:** Exige que o usuário digite o PIN uma vez após o redirecionamento ou exige infraestrutura de Cloud Functions/Auth Token.
- **Critério de Encerramento:** Parâmetro `pin` completamente removido do `quiz.js` e `LoginPage.jsx`; testes confirmando ausência de credenciais em URLs e histórico.

---

### ID: SEC-02 — Armazenamento de Senha e PIN Administrativo em Texto Plano no Firestore
- **Título:** Falha Crítica no Armazenamento de Segredos (Armazenamento sem Hash Criptográfico)
- **Classificação:** Violação Crítica de Gerenciamento de Credenciais
- **Severidade:** **CRÍTICO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `System/src/context/AuthContext.jsx`: linhas 346 a 351:
    ```javascript
    const segredosDoc = await getDoc(doc(db, 'organizations', perfil.organizationId, 'usuarios', perfil.id, 'privado', 'segredos'))
    if (segredosDoc.exists()) {
      const segredos = segredosDoc.data();
      const dbAdminPin = segredos.adminPin ? String(segredos.adminPin).trim() : null;
      matchesAdminPin = dbAdminPin && (typedPin === dbAdminPin || securePIN === dbAdminPin);
    }
    ```
  - `System/src/hooks/useStudents.js`: linha 371:
    ```javascript
    await setDoc(doc(db, ROOT_COLLECTIONS.ORGANIZATIONS, orgId, USERS_COLLECTION, studentId, 'privado', 'segredos'), {
      pin: studentData.pin,
      adminPin: studentData.adminPin || null,
      atualizadoEm: serverTimestamp()
    })
    ```
  - `System/src/context/AuthContext.jsx`: linhas 87 a 94:
    ```javascript
    const getHash = (str) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
      }
      return hash.toString()
    }
    ```
- **Comportamento Atual:** Os PINs de alunos e PINs administrativos de gestores são gravados em texto plano no banco de dados na subcoleção `privado/segredos`. A função `getHash` presente no arquivo é um algoritmo fraco de 32-bit (Java `hashCode`) e sequer é utilizada para proteger o `adminPin` persistido.
- **Comportamento Esperado:** Senhas e PINs nunca devem ser gravados em texto puro nem verificados diretamente no cliente. Devem ser processados por algoritmos de hashing criptográfico resistentes com sal e fator de trabalho adaptativo (Argon2id ou bcrypt).
- **Regra / Princípio Afetado:** CWE-256, CWE-916, OWASP ASVS v4.0 (V2.4.1), NIST SP 800-63B (Seção 5.1.1.2), ISO 27002:2022 (Controle 8.24).
- **Causa:** Simplificação de arquitetura para evitar backend próprio, transferindo verificação de senhas para consultas diretas do Firestore no cliente.
- **Impacto Técnico:** Qualquer leitura autorizada ou não autorizada do documento `privado/segredos` expõe diretamente os PINs mestres da academia.
- **Impacto no Negócio:** Vazamento catastrófico de dados cadastrais e financeiros caso o banco seja comprometido ou regras do Firestore sejam mal configuradas; não conformidade direta com LGPD e PCI DSS.
- **Cenário de Falha:** Uma consulta ao Firestore por um usuário com acesso staff (ver achado SEC-04) lê os documentos de todos os usuários em `privado/segredos`, obtendo os PINs administrativos de todos os gestores e donos.
- **Recomendação:** Migrar a verificação de credenciais administrativas para Cloud Functions / Backend. Armazenar apenas hashes Argon2id/bcrypt. Nunca retornar o campo `adminPin` para o frontend.
- **Trade-offs da Recomendação:** Requer execução serverless (Firebase Cloud Functions / Cloud Run) para validação do PIN administrativo.
- **Critério de Encerramento:** Remoção de `adminPin` em texto puro do banco; implementação de verificação via função segura com hash Argon2id ou remoção do conceito de PIN paralelo em favor de Firebase Auth nativo.

---

### ID: SEC-03 — Elevação de Privilégios Client-Side via Manipulação de `localStorage`
- **Título:** Bypass de Controle de Acesso por Simulação de Papel Client-Side
- **Classificação:** Falha de Autorização e Integridade de Sessão
- **Severidade:** **CRÍTICO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `System/src/context/AuthContext.jsx`: linhas 66 a 68 e 96 a 98:
    ```javascript
    const [simulatedRole, setSimulatedRole] = useState(() => {
      return localStorage.getItem('rs_simulated_role') || null
    })
    ...
    const effectiveRole = (() => {
      if (simulatedRole) return simulatedRole;
      ...
    })()
    ```
  - `System/src/modules/auth/ProtectedRoute.jsx`:
    Utiliza `effectiveRole` para liberar acesso a rotas restritas de administradores, gestores e relatórios financeiros.
- **Comportamento Atual:** O papel efetivo do usuário (`effectiveRole`) prioriza incondicionalmente o valor contido na chave `rs_simulated_role` do `localStorage`. Qualquer usuário autenticado (incluindo um aluno regular) pode executar no console do navegador:
  `localStorage.setItem('rs_simulated_role', 'admin')`
  e recarregar a página para desbloquear a interface administrativa, menus, relatórios financeiros e controles de gestão.
- **Comportamento Esperado:** Papéis e autorizações devem ser derivados exclusivamente de fontes criptograficamente verificadas (Firebase Auth Custom Claims validados no JWT ou Firestore Security Rules atômicas). O cliente não pode aceitar sobrescritas arbitrárias em produção.
- **Regra / Princípio Afetado:** CWE-602 (Client-Side Enforcement of Server-Side Security), OWASP Top 10 (A01:2021 Broken Access Control), NIST CSF v2.0 (PR.AC-01).
- **Causa:** Recurso de depuração / visualização de perfis ("ver sistema como aluno") mantido em código de produção sem checagem de permissão prévia do usuário real.
- **Impacto Técnico:** Acesso total e irrestrito à interface administrativa no frontend por qualquer usuário autenticado.
- **Impacto no Negócio:** Alunos podem visualizar telas de faturamento, dados cadastrais confidenciais de outros alunos e menus restritos da academia.
- **Cenário de Falha:** Aluno comum inspeciona o armazenamento local, insere `rs_simulated_role = 'admin'`, e ganha acesso visual imediato a relatórios de pagamentos e inadimplência da academia.
- **Recomendação:** Apenas usuários cujo perfil real seja comprovadamente `owner` ou `admin` podem ativar a simulação. Adicionar guard clause impedindo que usuários sem privilégio ativem `simulatedRole`. Remover o recurso completamente de builds de produção ou restringi-lo a Custom Claims.
- **Trade-offs da Recomendação:** Nenhum; trata-se de correção de falha de segurança elementar.
- **Critério de Encerramento:** Teste automatizado e manual comprovando que alterar `rs_simulated_role` no console não concede privilégios de gestor/admin a um aluno comum.

---

### ID: SEC-04 — Vazamento de Segredos nas Security Rules para Qualquer Membro Staff
- **Título:** Permissão Excessiva de Leitura na Subcoleção `privado/segredos`
- **Classificação:** Falha de Configuração de Segurança em Regras de Banco de Dados
- **Severidade:** **ALTO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `System/firestore.rules`: linhas 91 a 95 e 174 a 179:
    ```javascript
    function isOrganizationStaff(orgId) {
      return isOrganizationMember(orgId)
        && exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid))
        && obterRoleNaOrganizacao(orgId) in ['owner', 'admin', 'gestor', 'professor'];
    }
    ...
    match /privado/segredos {
      allow read: if isOrganizationStaff(orgId) || ehProprioUsuario(userId);
      allow write: if isOrganizationStaff(orgId)
        || (ehProprioUsuario(userId)
            && request.resource.data.get('pin', '').matches('[0-9]{6}'));
    }
    ```
- **Comportamento Atual:** A regra autoriza qualquer usuário com perfil `isOrganizationStaff` (o que inclui explicitamente o papel de `professor`) a **LER e ESCREVER** na subcoleção `privado/segredos` de **QUALQUER** usuário da academia, incluindo o `owner` e administradores!
- **Comportamento Esperado:** Professores e colaboradores não devem ter acesso aos segredos/PINs do dono ou de outros administradores da academia (Princípio do Menor Privilégio). Apenas o próprio usuário ou o administrador com autorização estrita deve acessar dados sensíveis.
- **Regra / Princípio Afetado:** CWE-272, OWASP ASVS v4.0 (V1.4.1 Least Privilege), CIS Controls v8 (Controle 5.4).
- **Causa:** Agrupamento genérico de papéis dentro da função utilitária `isOrganizationStaff` sem granularidade para recursos confidenciais.
- **Impacto Técnico:** Qualquer professor da academia pode disparar uma consulta direta ao Firestore e extrair o PIN administrativo do proprietário da academia.
- **Impacto no Negócio:** Risco de insubordinação interna, roubo de controle de academia por prestadores de serviço contratados ou professores.
- **Recomendação:** Alterar a regra de leitura/escrita de `privado/segredos` para exigir estritamente `isOrganizationAdmin(orgId)` para leitura administrativa, ou restringir exclusivamente ao próprio usuário (`ehProprioUsuario(userId)`).
- **Critério de Encerramento:** Regras do Firestore atualizadas e validadas com teste no emulador garantindo que professores recebem `PERMISSION_DENIED` ao tentar ler `/privado/segredos` de outro usuário.

---

### ID: SEC-05 — Superadmin Hardcoded em E-mails Pessoais nas Regras do Firestore
- **Título:** Backdoor / Acesso Mestre Hardcoded em E-mails Pessoais no Firestore
- **Classificação:** Violação de Gerenciamento de Identidade e Integridade
- **Severidade:** **ALTO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `System/firestore.rules`: linhas 45 a 54:
    ```javascript
    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.admin == true ||
        request.auth.token.email.lower() in [
          'pmadsonm@gmail.com',
          'pmadsonm_gmail_com@atlas.internal',
          'pmadsonm_gmail_com@rstopteam.internal'
        ]
      );
    }
    ```
- **Comportamento Atual:** O acesso administrativo global (com capacidade de ler e escrever em qualquer coleção raiz, legada e dados de todas as organizações) é concedido a endereços de e-mail literais chumbados no código-fonte das regras.
- **Comportamento Esperado:** A concessão de papel administrativo de plataforma deve ser baseada exclusivamente em Custom Claims (`request.auth.token.admin == true`) assinados por chave privada do Firebase Admin SDK, nunca por string matching de e-mails em arquivos do repositório.
- **Regra / Princípio Afetado:** CWE-798 (Use of Hard-coded Credentials), NIST CSF v2.0 (PR.AC-04), CIS Controls v8.
- **Causa:** Prática comum de desenvolvimento inicial (bootstrap rápido) que permaneceu esquecida no arquivo de regras de produção.
- **Impacto Técnico:** Comprometimento da conta de e-mail listada concede acesso total e irrestrito ao banco de produção; exposição do endereço de e-mail pessoal do desenvolvedor no código-fonte público/compartilhado.
- **Recomendação:** Remover a lista de e-mails hardcoded de `firestore.rules`. Exigir estritamente `request.auth.token.admin == true`, gerenciado via script administrativo offline usando Firebase Admin SDK.
- **Critério de Encerramento:** Ausência total de e-mails hardcoded no arquivo `firestore.rules`.

---

### ID: SEC-06 — Vazamento de Dados Financeiros entre Tenants em Cache Global de Módulo
- **Título:** Isolamento Multi-Tenant Violado por Cache Compartilhado em Memória JavaScript
- **Classificação:** Quebra de Isolamento Multi-Tenant / Confidencialidade de Dados
- **Severidade:** **CRÍTICO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `System/src/hooks/usePaymentReport.js`: linhas 8 a 9 e 167 a 171:
    ```javascript
    let _cachedBills = null
    let _billListeners = []
    ...
    export function usePaymentReport() {
      ...
      const [bills, setBills] = useState(_cachedBills || [])
      ...
      if (_cachedBills) {
        _billListeners.forEach(l => l.setBills(_cachedBills))
        _billListeners.forEach(l => l.setLoading(false))
        return
      }
    ```
- **Comportamento Atual:** A variável `_cachedBills` é definida no escopo global do módulo ESM, compartilhada entre instâncias do hook. Ela **não armazena o `organizacaoAtualId`** associado aos dados. Se um usuário gerencia mais de uma academia e altera a academia ativa no dropdown (`OrganizacaoContext.jsx`), o hook reaproveita o cache em memória e exibe as cobranças da academia anterior na tela da nova academia.
- **Comportamento Esperado:** Caches em memória em sistemas multi-tenant devem ser obrigatoriamente particionados pelo identificador do tenant (ex.: `_cachedBillsByOrg[organizacaoAtualId]`) e limpos imediatamente no evento de logout ou troca de tenant.
- **Regra / Princípio Afetado:** CWE-488 (Data Exposure Through Directory Listing / Shared Data), ISO 27002:2022 (Controle 8.12 Data Leakage Prevention).
- **Causa:** Otimização prematura de renderização sem modelagem consciente de contexto multi-tenant.
- **Impacto Técnico:** Exposição de valores financeiros, nomes de alunos e cobranças confidenciais de uma academia para outra.
- **Recomendação:** Remover o singleton global ou convertê-lo em um Map indexado por `orgId` (`Map<orgId, Bills>`), com invalidação automática em trocas de organização.
- **Critério de Encerramento:** Troca de organização no frontend comprovadamente limpa o estado de faturas e não reexibe dados da organização anterior.

---

### ID: SEC-07 — Proteção contra Força Bruta Executada Exclusivamente no Cliente
- **Título:** Bloqueio de Login por Tentativas Excessivas Armazenado no `localStorage`
- **Classificação:** Mitigação Ineficaz contra Ataques de Automação / Força Bruta
- **Severidade:** **MÉDIO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `System/src/modules/auth/LoginPage.jsx`: linhas 30 a 37 e 57 a 58:
    ```javascript
    const [failedAttempts, setFailedAttempts] = useState(() => {
      const saved = localStorage.getItem('rs_login_attempts')
      return saved ? parseInt(saved, 10) : 0
    })
    const [lockoutTime, setLockoutTime] = useState(() => {
      const saved = localStorage.getItem('rs_login_lockout_until')
      return saved ? parseInt(saved, 10) : 0
    })
    ...
    localStorage.removeItem('rs_login_lockout_until')
    localStorage.removeItem('rs_login_attempts')
    ```
- **Comportamento Atual:** O controle de taxa (rate limiting) de 5 tentativas e bloqueio de 3 minutos é inteiramente mantido no `localStorage` do navegador.
- **Comportamento Esperado:** Rate limiting de autenticação deve ser garantido no servidor / identity provider (Firebase App Check + Cloud Armor / Cloud Functions com Redis ou Firestore token bucket).
- **Regra / Princípio Afetado:** CWE-307 (Improper Restriction of Excessive Authentication Attempts), NIST SP 800-63B (Seção 5.2.2).
- **Causa:** Tentativa de implementar rate limiting sem infraestrutura de backend.
- **Impacto Técnico:** Um invasor utilizando script de força bruta contra a API do Firebase Auth ignora completamente o bloqueio do `localStorage`. Como os PINs são numéricos de 6 dígitos ($10^6$ combinações), um ataque de dicionário online automatizado consegue quebrar o PIN em poucos minutos se não houver bloqueio server-side.
- **Recomendação:** Ativar Firebase App Check com reCAPTCHA Enterprise e habilitar a proteção nativa de bloqueio por IP/conta no console do Firebase Authentication.
- **Critério de Encerramento:** Firebase App Check ativo e validação de tokens em chamadas de autenticação.

---

### ID: SEC-08 — Entropia Insuficiente de Credenciais Mestre (PIN de 6 Dígitos como Senha Firebase)
- **Título:** Senhas do Firebase Auth Padronizadas como PINs Numéricos de 6 Dígitos
- **Classificação:** Fraqueza de Complexidade de Credenciais
- **Severidade:** **MÉDIO**
- **Confiança:** `PROVEN` (FATO VERIFICADO)
- **Evidência:**
  - `System/src/context/AuthContext.jsx`: linhas 376 a 377 e 384:
    ```javascript
    const typedPin = String(password || '').trim().replace(/\D/g, '').slice(0, 6)
    const securePIN = typedPin.length >= 6 ? typedPin : typedPin.padEnd(6, '0')
    ...
    authResult = await signInWithEmailAndPassword(auth, email, securePIN)
    ```
- **Comportamento Atual:** A senha da conta no Firebase Auth é exatamente o PIN de 6 dígitos digitado pelo usuário (completado com zeros à direita se tiver menos de 6 dígitos).
- **Comportamento Esperado:** Credenciais de autenticação primária devem possuir entropia suficiente (mínimo de 8 a 12 caracteres alfanuméricos com símbolos) ou utilizar mecanismos modernos sem senha (Magic Links / Passkeys / WebAuthn).
- **Regra / Princípio Afetado:** NIST SP 800-63B (Seção 5.1.1.2 Memorized Secret Authenticators).
- **Impacto Técnico:** Vulnerabilidade a ataques de força bruta online caso o rate limiting falhe.
- **Recomendação:** Manter PIN apenas para operações rápidas em quiosques presenciais (com hardware id/tenant id associado), e utilizar senha forte ou login federado (Google/Email Link) para gestores e administradores.
- **Critério de Encerramento:** Separação entre credencial web de gestor (senha forte) e PIN presencial de catraca/presença.
