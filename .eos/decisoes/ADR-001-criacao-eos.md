# ADR-001 — Criação do EOS e Definições Fundamentais de Design

* **Status**: Aprovada
* **Autor(es)**: Arquiteto de Software & Equipe Técnica
* **Data**: 2026-07-13
* **Decisões Relacionadas**: Nenhuma

---

## 1. Contexto Técnico e de Negócio

No início do desenvolvimento do Engineering Operating System (EOS), enfrentamos três perguntas fundamentais sobre sua natureza e entrega:
1. **Formato de Entrega**: Como disseminar e documentar o framework de forma que sua adoção seja simples e integrada ao ciclo de vida do desenvolvimento?
2. **Plataforma**: Devemos construir uma aplicação web dedicada (painel, CLI) ou manter a estrutura baseada em arquivos estáticos?
3. **Escopo Tecnológico**: O EOS deve recomendar bibliotecas e padrões de stacks específicas (React, Node, Firebase) ou se manter neutro?

---

## 2. Decisão Proposta

Decidimos as seguintes diretrizes fundacionais para o EOS:
1. **Adoção baseada em Markdown (`.md`)**: O framework é composto inteiramente por documentos markdown. A aplicação em projetos (instanciação) é feita criando uma pasta `.eos/` na raiz do repositório contendo arquivos markdown.
2. **Agnóstico de Tecnologia**: O core do EOS não recomenda ou impõe linguagens, frameworks ou ferramentas de infraestrutura específicas. Ele dita *como* avaliar acoplamento e *como* gerenciar decisões, não quais tecnologias usar.
3. **Não criar uma aplicação web própria**: O EOS viverá como documentação versionada ao lado do código fonte, sem a necessidade de um portal ou banco de dados externo para sua leitura.

---

## 3. Consequências e Trade-offs

### Ganhos (Benefícios de 1ª e 2ª Ordem)
* **Atrito Zero de Adoção**: Qualquer desenvolvedor pode adotar o EOS criando arquivos de texto simples, sem precisar de credenciais de login, provisionamento de nuvem ou novas ferramentas CLI na máquina local.
* **Histórico ao Lado do Código**: As decisões técnicas (ADRs) e o mapeamento de arquitetura são comitados junto com o código do produto. Se a arquitetura mudar, o histórico de commits no Git reflete essa mudança no exato momento em que ela ocorreu.
* **Portabilidade e Durabilidade**: Markdown é um padrão universal suportado por editores, GitHub, GitLab e IDEs. O conhecimento persistirá mesmo se a stack da empresa mudar completamente.
* **Independência de Stack**: O framework pode governar projetos em Go, Python, React ou COBOL com o mesmo rigor conceitual.

### Custos / Perdas (Riscos e Complexidade Acidental)
* **Ausência de Automatização Inicial**: Como são apenas arquivos Markdown, a validação de conformidade (ex: garantir que todas as ADRs estão preenchidas) é visual ou manual nos code reviews, não havendo verificação via compilador ou ferramenta integrada automatizada por padrão.
* **Falta de Gráficos Dinâmicos**: A matriz de acoplamento e os níveis de maturidade dependem de preenchimento em tabelas Markdown, exigindo disciplina humana na manutenção das instâncias.

---

## 4. Alternativas Consideradas

| Alternativa | Prós | Contras | Por que foi descartada? |
| :--- | :--- | :--- | :--- |
| **Construir um Portal Web do EOS** | Interface bonita, gráficos interativos e centralização fácil. | Exige manutenção de banco de dados, login e infraestrutura própria. Desvia a atenção do foco principal (código). | Complexidade acidental desproporcional. A documentação ficaria desalinhada do Git do projeto. |
| **Framework Acoplado a Stacks (ex: React/TypeScript)** | Regras muito específicas e código pronto de infraestrutura. | Exclui projetos que usem outras linguagens/padrões no ecossistema da empresa. | Reduz a utilidade do EOS como sistema operacional de engenharia corporativo global. |
