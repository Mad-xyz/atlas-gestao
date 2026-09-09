# PLANO DE MIGRAÇÃO DA R.S TOP TEAM PARA TENANT ÚNICO

> **Status:** Planejamento de Migração  
> **Tenant Alvo:** `rs-top-team`  
> **Data:** 28/08/2026

---

## 1. OBJETIVO DA MIGRAÇÃO

Garantir que 100% dos dados existentes no Firestore da **R.S Top Team** sejam transformados de coleções globais para a nova estrutura tenant-scoped sob a organização `organizations/rs-top-team/`, sem perda de IDs, histórico de presenças, faixas ou lançamentos financeiros.

---

## 2. ESTRATÉGIA DE ZERO DATA LOSS

1. **Backup Pré-Migração:** Exportar todas as coleções do Firestore para arquivo de backup seguro via Firebase Admin SDK ou CLI.
2. **Criação da Organização Primária:**
   * ID da Organização: `rs-top-team`
   * Nome: `RS Top Team`
   * Slug: `rs-top-team`
3. **Mapeamento de Coleções Migradas:**

| Coleção Atual (Global) | Nova Coleção Tenant-Scoped |
|---|---|
| `/usuarios` | `/organizations/rs-top-team/members` + `/users` |
| `/alunos` | `/organizations/rs-top-team/students` |
| `/chamadas` | `/organizations/rs-top-team/sessions` |
| `/modalidades` | `/organizations/rs-top-team/modalities` |
| `/eventos` | `/organizations/rs-top-team/events` |
| `/faturamento` | `/organizations/rs-top-team/charges` |
| `/despesas` | `/organizations/rs-top-team/expenses` |
| `/contratos` | `/organizations/rs-top-team/contracts` |

---

## 3. SCRIPT DE MIGRAÇÃO (`scripts/migrarDadosParaMultiTenant.js`)

Um script dedicado em Node.js com Firebase Admin SDK será criado para realizar a migração em lote (`writeBatch` com até 500 operações por lote):

* Preserva os IDs originais dos documentos.
* Adiciona o campo `organizationId: 'rs-top-team'` em todos os documentos convertidos para compatibilidade dupla durante a transição.
* Gera log detalhado de quantos documentos foram migrados por coleção e relata inconsistências.

---

## 4. ESTRATÉGIA DE ROLLBACK

Caso ocorra qualquer divergência durante a validação da interface pós-migração:
1. As coleções globais originais serão mantidas intactas em modo somente-leitura até a homologação final.
2. O sistema poderá ser revertido alterando a flag de feature `VITE_ENABLE_MULTI_TENANCY=false`.
