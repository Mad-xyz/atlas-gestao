# MODELO DE DADOS E ENTIDADES — ATLAS MULTI-TENANT

> **Status:** Especificação Técnica  
> **Versão:** 1.0.0  
> **Data:** 28/08/2026

---

## 1. VISÃO GERAL DA ESTRUTURA DE DADOS MULTI-TENANT

Para transformar a aplicação monotenant em multi-tenant preservando compatibilidade, adotamos o modelo **Organização Centralizada + Subcoleções com Fallback de Filtro por `organizationId`**.

```text
/users/{uid}                           <-- Perfil Global do Usuário (Identidade)
/organizations/{organizationId}        <-- Cadastro da Academia (Tenant)
    /members/{userId}                  <-- Relacionamento e Permissões no Tenant
    /students/{studentId}              <-- Alunos da Academia
    /modalities/{modalityId}           <-- Modalidades da Academia
        /turmas/{turmaId}              <-- Turmas da Modalidade
    /sessions/{sessionId}              <-- Aulas e Chamadas da Academia
        /presencas/{presencaId}        <-- Presenças da Aula
    /events/{eventId}                  <-- Quadro de Avisos do Tenant
    /charges/{chargeId}                <-- Faturamento e Mensalidades do Tenant
    /expenses/{expenseId}              <-- Despesas do Tenant
    /contracts/{contractId}            <-- Contratos do Tenant
    /settings/configuracoes            <-- Configurações e Branding do Tenant
```

---

## 2. DETALHAMENTO DOS SCHEMAS DE ENTIDADE

### 2.1. Organização (`organizations/{organizationId}`)
```json
{
  "id": "rs-top-team",
  "nome": "RS Top Team",
  "slug": "rs-top-team",
  "ownerId": "uid_do_proprietario",
  "status": "ativo",
  "criadoEm": "2026-08-28T00:00:00.000Z",
  "atualizadoEm": "2026-08-28T00:00:00.000Z",
  "configuracoes": {
    "logoUrl": "https://...",
    "corPrimaria": "#e53e3e",
    "fusoHorario": "America/Belem",
    "idioma": "pt-BR",
    "cnpj": "00.000.000/0001-00",
    "telefone": "(91) 98000-0000"
  }
}
```

### 2.2. Associação (`organizations/{organizationId}/members/{userId}`)
```json
{
  "userId": "uid_do_usuario",
  "email": "usuario@exemplo.com",
  "role": "owner",
  "status": "ativo",
  "permissoes": {
    "alunos": { "visualizar": true, "criar": true, "editar": true, "excluir": true },
    "financeiro": { "visualizar": true, "criar": true, "editar": true, "excluir": true },
    "chamadas": { "visualizar": true, "criar": true, "editar": true, "excluir": true },
    "configuracoes": { "visualizar": true, "editar": true }
  },
  "criadoEm": "2026-08-28T00:00:00.000Z"
}
```

### 2.3. Perfil de Usuário Global (`users/{userId}` ou `usuarios/{userId}`)
```json
{
  "uid": "uid_firebase_auth",
  "nome": "Madson Silva",
  "email": "pmadsonm@gmail.com",
  "telefone": "(91) 98000-0000",
  "platformRole": "super_admin",
  "avatarUrl": "https://...",
  "criadoEm": "2026-08-28T00:00:00.000Z"
}
```

---

## 3. RELACIONAMENTOS E NAVEGAÇÃO ENTRE TENANTS

1. **Um Usuário -> Múltiplas Organizações:** O usuário autenticado possui um registro global em `users/{uid}` e pode ter múltiplos documentos de `members` em diferentes `organizations/{organizationId}/members/{userId}`.
2. **Organização Ativa:** Mantida no `OrganizationContext` do React. Quando o usuário altera a organização ativa no `OrganizationSwitcher`, todas as queries recarregam apontando para a subcoleção do tenant ativo.
