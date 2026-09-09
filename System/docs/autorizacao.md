# MATRIZ DE AUTORIZAÇÃO E RBAC — ATLAS MULTI-TENANT

> **Status:** Especificação Oficial  
> **Versão:** 1.0.0  
> **Data:** 28/08/2026

---

## 1. NÍVEIS DE ACESSO E ROLES

### 1.1. Roles da Plataforma (Platform Roles)
Definidos globalmente em `/users/{uid}`:

* `super_admin`: Equipe proprietária do Atlas com acesso a gestão global de academias e métricas.
* `user`: Usuário padrão da plataforma.

### 1.2. Roles da Organização (Organization Roles)
Definidos por tenant em `/organizations/{organizationId}/members/{userId}`:

* `owner`: Proprietário da academia (acesso irrestrito e exclusivo para gestão da conta).
* `admin`: Administrador da academia (acesso a alunos, finanças e cadastros).
* `manager` (Gestor): Gestor operacional (alunos, turmas, presenças, relatórios operacionais).
* `teacher` (Professor): Instrutores (chamadas, presenciais, turmas e alunos).
* `student` (Aluno): Alunos (visão do próprio perfil, presenças e financeiro individual).

---

## 2. MATRIZ FORMAL DE PERMISSÕES POR RECURSO

| Recurso / Módulo | Owner | Admin | Gestor | Professor | Aluno |
|---|---|---|---|---|---|
| Configurações da Academia | ✅ | ⚠️ (Limitado) | ❌ | ❌ | ❌ |
| Gestão de Membros / Equipe | ✅ | ✅ | ⚠️ (Sem alterar Admins) | ❌ | ❌ |
| Cadastro de Alunos | ✅ | ✅ | ✅ | ✅ (Visualizar/Presença) | Próprio perfil |
| Modalidades e Turmas | ✅ | ✅ | ✅ | ⚠️ (Leitura/Turmas) | ❌ |
| Chamadas e Presenças | ✅ | ✅ | ✅ | ✅ | Própria presença |
| Faturamento e Cobranças | ✅ | ✅ | ✅ | ❌ | Próprias faturas |
| Custos e Despesas | ✅ | ✅ | ❌ | ❌ | ❌ |
| Relatórios Financeiros | ✅ | ✅ | ⚠️ (Operacionais) | ❌ | ❌ |
| Avisos e Eventos | ✅ | ✅ | ✅ | ✅ (Criar/Leitura) | Leitura |
