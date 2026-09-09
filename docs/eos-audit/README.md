# Auditoria de Engenharia e Governança EOS — Atlas Academy

**Data:** 09/09/2026  
**Sistema:** Atlas Academy (SaaS Multi-Tenant)  
**Módulos:** `System` (React 19 / Vite / PWA) e `Site` (Landing Page / Onboarding)  
**Modo:** `REVIEW_READ_ONLY` (Evidence-First, Rigor Técnico Sênior)  
**Metodologia:** EOS (Engineering Operating System) & Revisor Sênior de Engenharia de Software  

---

## Índice de Artefatos Gerados

Esta pasta reúne a documentação completa e formal da auditoria técnica executada no repositório. Cada arquivo corresponde a uma fase metodológica do EOS:

| Arquivo | Fase EOS | Descrição do Conteúdo |
| :--- | :---: | :--- |
| 📄 [eos_audit_report_final.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/eos_audit_report_final.md) | **Relatório Final** | **Relatório Executivo Oficial** com veredito (`REJECTED`), justificativas baseadas em fatos, análise de risco e próximo menor passo seguro. |
| 📑 [00_project_context_map.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/00_project_context_map.md) | Fase 0 | **Mapeamento de Contexto:** Stack tecnológica, atores, regras de negócio gerais e classificação de evidências (`PROVEN`, `LIKELY`). |
| 📑 [01_02_structural_inventory_module_map.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/01_02_structural_inventory_module_map.md) | Fase 1 | **Inventário Estrutural:** Árvore física de arquivos, responsabilidades de cada módulo e fronteiras de camadas. |
| 📑 [03_05_architecture_reconstruction.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/03_05_architecture_reconstruction.md) | Fase 2 | **Reconstrução Arquitetural:** Diagrama Mermaid de arquitetura BaaS-Direct, mapa de dependências reais e matriz de conformidade. |
| 📑 [06_09_domain_rules_invariants.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/06_09_domain_rules_invariants.md) | Fase 3 | **Modelagem de Domínio:** Entidades e agregados (Organização, Aluno, Chamada, Fatura), catálogo de regras de negócio (BR-001 a 004), invariantes (INV-001 a 005) e máquinas de estado. |
| 📑 [10_14_contracts_data_consistency.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/10_14_contracts_data_consistency.md) | Fases 4 & 5 | **Contratos & Consistência:** Registro de DTOs e mismatches (`jornada_tecnica` vs `tech_journey`), mapa de APIs e subcoleções, matriz de riscos transacionais e limites de concorrência. |
| 📑 [15_security_findings_register.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/15_security_findings_register.md) | Fase 6 | **Catálogo de Segurança:** Registro aprofundado dos 11 achados de segurança formatados com severidade, impacto, cenário de falha, conformidade OWASP/NIST e critérios de encerramento. |
| 📑 [16_23_governance_quality_observability.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/16_23_governance_quality_observability.md) | Fase 7 | **Governança & Qualidade:** Checklist EOS, reconstrução de ADRs, verificação de Quality Gates reais (Build 21.5s, Lint com 347 erros), avaliação de CI/CD e observabilidade. |
| 📑 [24_35_reliability_debt_risks_maturity.md](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/24_35_reliability_debt_risks_maturity.md) | Fase 8 | **Resiliência & Maturidade:** Hotspots de refatoração (`AuthContext.jsx`, `StudentsPage.jsx`), matriz de causa raiz, scorecard de maturidade EOS (0.88/4.00) e matriz de priorização (P0..P3). |

---

## Principais Vulnerabilidades Registradas (P0)

1. **[SEC-01](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/15_security_findings_register.md#id-sec-01--transmissão-de-pin-e-credenciais-em-texto-plano-via-query-string-de-url):** PIN/Senha passado em query string de redirecionamento (`Site/js/quiz.js:421` -> `LoginPage.jsx:18`).
2. **[SEC-02](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/15_security_findings_register.md#id-sec-02--armazenamento-de-senha-e-pin-administrativo-em-texto-plano-no-firestore):** Armazenamento de PINs em texto puro no Firestore (`AuthContext.jsx:349` e `useStudents.js:371`).
3. **[SEC-03](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/15_security_findings_register.md#id-sec-03--elevação-de-privilégios-client-side-via-manipulação-de-localstorage):** Elevação de privilégio por console manipulando `localStorage.getItem('rs_simulated_role')` em `AuthContext.jsx:67`.
4. **[BUG-01](file:///g:/Programação/_Atlas%20Academy/docs/eos-audit/10_14_contracts_data_consistency.md):** Falha de execução com tela branca ao filtrar visitantes (`formatBR is not defined` em `StudentsPage.jsx:1217`).
