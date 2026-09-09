# ADR-002 — Camada Operacional de Prompts no EOS Framework

* **Status**: Aprovada
* **Autor(es)**: Arquiteto de Software & Equipe Técnica
* **Data**: 2026-07-13
* **Decisões Relacionadas**: [ADR-001 — Criação do EOS e Definições Fundamentais de Design](ADR-001-criacao-eos.md)

---

## 1. Contexto e Problema

O EOS Framework possui uma base sólida de governança técnica baseada em princípios, modelos analíticos e protocolos de processos. Contudo, observou-se que a transição do protocolo (teoria processual) para o desenvolvimento prático (codificação, auditorias reais) dependia excessivamente da interpretação de quem executa a tarefa. 

Especialmente ao cooperar com agentes cognitivos de IA, a falta de guias operacionais imperativos gerava variações indesejadas de qualidade técnica, risco de refatorações massivas simultâneas (Big Bang) e alteração prematura de regras de negócio sem aprovação prévia. 

Precisamos de um mecanismo que oriente a execução prática e passo a passo de tarefas críticas, garantindo a aplicação dos protocolos de forma repetível.

---

## 2. Alternativas Consideradas

### Opção A: Manter Apenas os Protocolos Existentes
* *Prós*: Mantém o repositório do framework enxuto e reduz a complexidade de documentações.
* *Contras*: Não resolve o problema de variação na execução. Agentes de IA continuariam a propor refatorações massivas ou pular etapas do processo de design técnico.

### Opção B: Criar Prompts Operacionais Separados (Fora do Repositório)
* *Prós*: Evita adicionar mais um nível de diretórios no framework principal.
* *Contras*: Desalinhamento do histórico de versionamento. Prompts salvos externamente tendem a ficar obsoletos à medida que os protocolos evoluem.

### Opção C: Criar uma Ferramenta CLI ou Aplicação Própria
* *Prós*: Controle absoluto de validação de processos via software compilado.
* *Contras*: Cria complexidade acidental desproporcional para o estágio atual do EOS (v0.1.3), exigindo manutenção de código de ferramenta.

---

## 3. Decisão Proposta

Decidimos **criar uma nova camada oficial chamada "Prompts Operacionais de Engenharia"** localizada na pasta `EOS/prompts/` do repositório principal do framework.

Estes prompts são arquivos markdown concebidos para orientar agentes humanos e de IA passo a passo na execução de quatro atividades fundamentais:
1. Reconhecimento de novos projetos (onboarding).
2. Diagnóstico estrutural (auditoria).
3. Modificações de código seguras (implementação controlada).
4. Revisão e validação final (revisão pós-implementação).

---

## 4. Consequências e Trade-offs

### Ganhos (Benefícios de 1ª e 2ª Ordem)
* **Execução Repetível e Padronizada**: Garante que qualquer desenvolvedor ou agente autônomo de IA realize as análises, refatorações e revisões usando exatamente o mesmo roteiro técnico e salvaguardas.
* **Redução de Regressões**: A proibição de refatorações paralelas em `implementacao-controlada.md` protege o código contra quebras silenciosas.
* **Facilidade para IAs**: Facilita a incorporação de restrições rígidas no contexto da IA durante interações de programação em par (pair programming).

### Custos / Riscos (Perdas de 1ª e 2ª Ordem)
* **Mais um Nível de Organização**: Aumenta sutilmente a quantidade de diretórios e arquivos sob a pasta `/EOS`, exigindo disciplina do time para manter a distinção entre Protocolos (o que fazer) e Prompts (como executar).
* **Necessidade de Manutenção Dupla**: Mudanças significativas nos protocolos podem exigir atualizações pontuais nos prompts correspondentes para manter a conformidade.
