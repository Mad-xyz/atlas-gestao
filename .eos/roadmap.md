# Roadmap de Evolução — EOS Framework

Este roadmap define as etapas estratégicas de desenvolvimento e amadurecimento do framework **EOS**.

---

## 1. Visão de Evolução

O EOS deve provar seu valor técnico em projetos reais da empresa (como o Cebus ERP) antes de expandir suas diretrizes em camadas mais específicas (como frontend, backend ou devops).

---

## 2. Ações Planejadas

### Fase 1: Piloto Controlado no Cebus ERP (Em Andamento)
* **Ações**:
  1. Instanciar o EOS v0.1.1 no repositório do Cebus.
  2. Executar a primeira auditoria sem alterações no código produtivo para identificar os riscos reais da aplicação.
  3. Validar se o diagnóstico gerado pelo EOS produziu insights de engenharia superiores a uma análise ad-hoc comum.
* **Métrica de Sucesso**: Relatório de auditoria do Cebus aprovado pela direção com roadmap de refatoração claro e priorizado.

### Fase 2: Amadurecimento do Core (Mapeamento de Necessidades)
* **Ações**:
  1. Coletar feedbacks da equipe técnica sobre a facilidade de preenchimento dos templates e modelos do EOS.
  2. Ajustar os templates (ADR, Mapeamento de Módulos) com base no aprendizado prático do piloto.
  3. Expandir a pasta de `modelos/` com guias para avaliação de riscos arquiteturais e divisão de dívida técnica.

### Fase 3: Módulos Especialistas (Futuro)
* **Ações**:
  1. Avaliar a necessidade de criar guias específicos para especialidades da equipe (ex: padrões de CSS e design system em Frontend; resiliência de conexões e ORM em Backend; automação de CI/CD em DevOps).
  2. Manter o core do EOS agnóstico, importando estes guias apenas como extensões opcionais.
