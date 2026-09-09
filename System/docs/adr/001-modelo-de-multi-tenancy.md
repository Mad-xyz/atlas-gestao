# ADR 001: MODELO DE ARQUITETURA MULTI-TENANCY PARA O ATLAS

> **Status:** Aceito  
> **Data:** 28/08/2026  
> **Autor:** Arquitetura de Software Atlas

---

## CONTEXTO E PROBLEMA

O sistema **R.S Top Team** foi desenvolvido originalmente para atender uma única academia com coleções globais no Firestore (`/alunos`, `/chamadas`, `/faturamento`). Para expandir a aplicação para o modelo SaaS **Atlas**, onde múltiplas academias utilizam a mesma plataforma, é necessário escolher um modelo de isolamento de dados performático, seguro, escalável e economicamente eficiente no Firestore.

---

## OPÇÕES CONSIDERADAS

### Opção 1: Bancos de Dados Firestore Separados por Tenant (Multi-database)
* **Vantagens:** Isolamento físico total no GCP.
* **Desvantagens:** Alto custo operacional, complexidade extrema para gerenciar múltiplos projetos/databases no SDK cliente, impossibilidade de painel global agilizado para Super Admin.

### Opção 2: Documentos Globais com Campo `organizationId` em Todas as Coleções
* **Vantagens:** Estrutura plana fácil de consultar.
* **Desvantagens:** Alto risco de vazamento de dados caso uma query esqueça de adicionar `where('organizationId', '==', orgId)`, Security Rules mais complexas e propensas a falha.

### Opção 3: Hierarquia de Subcoleções por Organização (`organizations/{organizationId}/...`) — ESCOLHIDA
* **Vantagens:** Isolamento natural por caminho no Firestore, Security Rules limpas e imutáveis por prefixo de rota, impossibilidade de vazamento acidental em consultas no cliente, facilidade de auditoria e limpeza de tenant.
* **Desvantagens:** Exige ajuste nas consultas que dependiam da coleção plana na raiz.

---

## DECISÃO

Decidimos adotar a **Opção 3 (Hierarquia de Subcoleções por Organização)** combinada com fallback de campo `organizationId` em coleções legadas durante o período de migração.

---

## CONSEQUÊNCIAS

1. **Segurança:** As regras do Firestore podem validar o acesso verificando a membership diretamente em `/organizations/{organizationId}/members/{userId}` antes de permitir qualquer operação de leitura ou escrita nas subcoleções.
2. **Desempenho:** Consultas escopadas por subcoleção buscam apenas os documentos daquela academia específica, reduzindo leituras desnecessárias.
3. **Migração:** O projeto existente `rs-top-team` será migrado para `/organizations/rs-top-team/` de maneira transparente.
