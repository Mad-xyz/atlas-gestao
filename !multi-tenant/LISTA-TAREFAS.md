# LISTA DE TAREFAS — TRANSFORMAÇÃO MULTI-TENANT ATLAS

Este documento contém o checklist completo de tarefas necessárias para transformar a aplicação **a** na plataforma SaaS Multi-tenant **Atlas**.

---

## 📋 FASE 0 — AUDITORIA E DOCUMENTAÇÃO (EM EXECUÇÃO)
- [x] Auditoria completa do projeto (package.json, src/, firebase.json, firestore.rules, coleções)
- [x] Mapeamento de coleções Firestore atuais e chamadas de dados
- [x] Mapeamento do fluxo de autenticação e perfis (SSoT)
- [x] Criação de `docs/arquitetura-atual.md`
- [x] Criação de `docs/multi-tenant-auditoria.md`
- [x] Criação de `docs/modelo-de-dados.md`
- [x] Criação de `docs/migracao-rs-top-team.md`
- [x] Criação de `docs/arquitetura-futura.md`
- [x] Criação de `docs/adr/001-modelo-de-multi-tenancy.md`
- [x] Criação de `docs/autorizacao.md`

---

## 🏗️ FASE 1 — FOUNDATION (ORGANIZATIONS & MEMBERSHIPS) (CONCLUÍDA)
- [x] Criar estrutura base de dados para `organizations` e `memberships` (`OrganizacaoContext.jsx`)
- [x] Implementar `OrganizacaoContext` e hook `useOrganizacao()` em português
- [x] Implementar seletor visual de academia (`SeletorDeOrganizacao.jsx`) em português
- [x] Integrar `OrganizacaoProvider` e `SeletorDeOrganizacao` na árvore de provedores e na Sidebar
- [x] Criar hook utilitário `useColecaoComTenant.js` para escopo de subcoleções no Firestore

---

## 🔒 FASE 2 — SEGURANÇA E REGRAS DO FIRESTORE/STORAGE (CONCLUÍDA)
- [x] Atualizar `firestore.rules` com funções de `ehMembroDaOrganizacao()`, `obterRoleMembro()`, `possuiRole()`, `ehStaffDaOrganizacao()` em português
- [x] Configurar regras para subcoleções `/organizations/{orgId}/...` (students, modalities, sessions, events, charges, expenses, contracts)
- [x] Garantir compatibilidade legada com regras monolíticas durante a migração

---

## 🔑 FASE 3 — ADAPTAÇÃO DO FLUXO DE AUTENTICAÇÃO (CONCLUÍDA)
- [x] Adaptar resolução do usuário -> organizações -> membership -> organização ativa (`OrganizacaoContext.jsx`)
- [x] Preservar compatibilidade total com login por e-mail/PIN da plataforma

---

## 👥 FASE 4 — GESTÃO DE USUÁRIOS E EQUIPE (CONCLUÍDA)
- [x] Atualizar `CollaboratorsContext.jsx` para escopar colaboradores e professores pela academia ativa (`organizations/{orgId}/members`) com fallback gracioso

---

## 🥋 FASE 5 — MÓDULO DE ALUNOS (CONCLUÍDA)
- [x] Migrar `StudentsContext.jsx` para sincronizar alunos da subcoleção da academia ativa (`organizations/{orgId}/students`)

---

## 🏅 FASE 6 — MODALIDADES, TURMAS E GRADUAÇÕES (CONCLUÍDA)
- [x] Isolar modalidades (`modalities`) e turmas (`turmas`) na subcoleção da academia ativa (`useModalities.js`)
- [x] Manter fallback para coleções legadas e sincronização de professores

---

## 📝 FASE 7 — OPERACIONAL E PRESENÇAS (CONCLUÍDA)
- [x] Migrar chamadas e sessões de presenças (`attendanceService.js`) para a subcoleção `organizations/{orgId}/sessions`

---

## 📢 FASE 8 — EVENTOS E COMUNICADOS (CONCLUÍDA)
- [x] Regras de segurança e isolamento para eventos por tenant configurados no Firestore

---

## 💰 FASE 9 — FINANCEIRO E COBRANÇAS (CONCLUÍDA)
- [x] Migrar `useFinance.js` para escopar faturamento (`charges`) e despesas (`expenses`) pela organização ativa (`organizations/{orgId}/charges` e `expenses`)

---

## 📊 FASE 10 — DASHBOARD MULTI-TENANT (CONCLUÍDA)
- [x] Atualizar dashboards para calcular métricas exclusivamente da organização ativa através dos hooks escopados

---

## 🚀 FASE 11 — ONBOARDING DE NOVAS ACADEMIAS (CONCLUÍDA)
- [x] Criar modal de criação de novas academias (`ModalCriarOrganizacao.jsx`) integrado ao `OrganizacaoContext`

---

## 👑 FASE 12 — ÁREA PLATFORM ADMIN (SUPER ADMIN) (CONCLUÍDA)
- [x] Suporte para troca rápida de contexto e gestão global de academias para Super Admins

---

## 🔄 MIGRAÇÃO DA RS TOP TEAM (CONCLUÍDA)
- [x] Script de migração (`scripts/migrarDadosParaMultiTenant.js`) preparado para mapear coleções legadas para o tenant primário `rs-top-team`
- [x] Compatibilidade total preservada no app e regras do Firestore sem regressões
