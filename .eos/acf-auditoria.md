# RELATÓRIO DE AUDITORIA DE ARQUITETURA CONTINUA (EOS v3.0)

**Audit Run ID:** `RUN-9215033c716c`  
**Data / Hora:** `2026-08-15T13:49:13.556Z`  
**Target ID:** `TGT-4e56730a6a36ff30`  
**Caminho Alvo:** `C:\Users\Max\Desktop\Projeto\EOS`  
**Branch / Commit:** `main` / `fd4d9d81029c3f81d8355f304a595911b7af218b`  

## 1. MÉTICAS DE COBERTURA DE COLETA

| Métrica | Valor |
|---|---|
| Arquivos Descobertos | 22844 |
| Arquivos Analisados | 22844 |
| Arquivos Ignorados | 0 |
| Arquivos com Erro | 0 |
| Arquivos Inacessíveis | 0 |
| Diretórios Descobertos | 11227 |
| Diretórios Ignorados | 10 |
| Symlinks Descobertos | 7 |
| Symlinks Ignorados | 4 |

## 2. RESULTADO DOS QUALITY GATES & RULES

### Rule: `ARCH-RULE-001-MANDATORY-DOMAIN-DIR` (❌ FAIL)
- **Versão:** `3.0.0`
- **Justificativa:** Violação Arquitetural: O diretório obrigatório de domínio 'src/domain' não existe no repositório auditado.
- **Fatos Utilizados:** `FCT-FS-f64e37aa9ca9`

### Rule: `ARCH-RULE-002-NO-DOMAIN-TO-INFRA-DEPENDENCY` (⚠️ INSUFFICIENT_EVIDENCE)
- **Versão:** `4.6.0`
- **Justificativa:** Evidência Insuficiente: Existem 134 dependência(s) com resolução incerta (UNRESOLVED ou AMBIGUOUS) que não puderam ser verificadas com certeza semântica.
- **Fatos Utilizados:** `FCT-DEP-eccce46e83df`, `FCT-DEP-d8cbb5a77c53`, `FCT-DEP-ab0e2f9f82f7`, `FCT-DEP-16d0947a6f6f`, `FCT-DEP-a7109abf4ea0`, `FCT-DEP-ef942c05ec63`, `FCT-DEP-fb3ece57a245`, `FCT-DEP-c5a40d6becaf`, `FCT-DEP-543485359d0f`, `FCT-DEP-547f3aa79312`, `FCT-DEP-cbfec3567c5d`, `FCT-DEP-5592d3b0170b`, `FCT-DEP-2703d34f8cdc`, `FCT-DEP-aa46cacdc03f`, `FCT-DEP-4d714e3d21dc`, `FCT-DEP-e54b43fb76d9`, `FCT-DEP-ebd96e5d137e`, `FCT-DEP-979fa62985ee`, `FCT-DEP-1f3b9b64453b`, `FCT-DEP-018ebe0869b1`, `FCT-DEP-bf22357449c2`, `FCT-DEP-34699f6b17e3`, `FCT-DEP-0445dbd6c551`, `FCT-DEP-9c95ff17f523`, `FCT-DEP-c07315ca8bd8`, `FCT-DEP-4d7f7f8ba7fd`, `FCT-DEP-4386953b6fd5`, `FCT-DEP-2c76df00d5fc`, `FCT-DEP-127ea3f7c35e`, `FCT-DEP-a57b7429b0ae`, `FCT-DEP-84ba5108816d`, `FCT-DEP-a3ee533fbb68`, `FCT-DEP-2298b198f4e9`, `FCT-DEP-0668094fbc3e`, `FCT-DEP-8590474ab0d7`, `FCT-DEP-0dbd8e8c17bc`, `FCT-DEP-60eda193e495`, `FCT-DEP-30c75a6ff94b`, `FCT-DEP-ebf14a7cb36d`, `FCT-DEP-c63f07c91680`, `FCT-DEP-83d3d6d09a4c`, `FCT-DEP-a2750e6accd0`, `FCT-DEP-128d23483cc8`, `FCT-DEP-aafa7c30f633`, `FCT-DEP-4637c4055133`, `FCT-DEP-2d4a217b8b7b`, `FCT-DEP-1906436df73e`, `FCT-DEP-4b093623b85a`, `FCT-DEP-5a096cf654e8`, `FCT-DEP-7d08b325da95`, `FCT-DEP-fb45564017c1`, `FCT-DEP-d7522c1a2566`, `FCT-DEP-7d073c73386d`, `FCT-DEP-d38ffa8394e5`, `FCT-DEP-a4d96d361662`, `FCT-DEP-665a0d2392f9`, `FCT-DEP-6483462cc536`, `FCT-DEP-34755abdf9f9`, `FCT-DEP-0266c48f1500`, `FCT-DEP-870a0652887d`, `FCT-DEP-44216fbbad3d`, `FCT-DEP-7ac9a5a38613`, `FCT-DEP-9e6b53d471f6`, `FCT-DEP-0419c67284ad`, `FCT-DEP-1e32031fc2ba`, `FCT-DEP-6d07ea3cbf98`, `FCT-DEP-c75087c5fe70`, `FCT-DEP-519b5840caef`, `FCT-DEP-dcce4f30cf09`, `FCT-DEP-dc56a53540ce`, `FCT-DEP-ce3918fbe57c`, `FCT-DEP-fd4e0690f6a5`, `FCT-DEP-116bfdaee98d`, `FCT-DEP-892c4a0d76c8`, `FCT-DEP-e3aa7e799735`, `FCT-DEP-465bac84d870`, `FCT-DEP-054282c55dc0`, `FCT-DEP-1bbea75423de`, `FCT-DEP-cd3060717710`, `FCT-DEP-f7d9d9213e3a`, `FCT-DEP-6e87cbe9bcf8`, `FCT-DEP-ea7187d153f0`, `FCT-DEP-1f0ba52a42a0`, `FCT-DEP-eb95f2c36e9c`, `FCT-DEP-2b2b07cc4d2d`, `FCT-DEP-505296df0ca2`, `FCT-DEP-756529ffdd64`, `FCT-DEP-bf68f7092140`, `FCT-DEP-3b834e85c3a9`, `FCT-DEP-0712a50d5c27`, `FCT-DEP-2db847da0053`, `FCT-DEP-7750bad38430`, `FCT-DEP-aae9901eadd5`, `FCT-DEP-f1b26eccefdd`, `FCT-DEP-597215b9fa04`, `FCT-DEP-b5701cba499b`, `FCT-DEP-e8a4f452d0cc`, `FCT-DEP-c304c9504616`, `FCT-DEP-0a5e72136f41`, `FCT-DEP-3eb39422e853`, `FCT-DEP-b2fa68e55c16`, `FCT-DEP-86e4192713bf`, `FCT-DEP-b429c89e23c7`, `FCT-DEP-4ae775a70006`, `FCT-DEP-33d0ee34f976`, `FCT-DEP-b67abc0a0582`, `FCT-DEP-7dad89e62eca`, `FCT-DEP-1ff0b40ce4da`, `FCT-DEP-1c809bd7514d`, `FCT-DEP-c84b3925d0c6`, `FCT-DEP-700465fb9ed8`, `FCT-DEP-f7aa0cd3e46f`, `FCT-DEP-83420432a89f`, `FCT-DEP-2c5263827998`, `FCT-DEP-2e03e0eb3832`, `FCT-DEP-79cd126478c9`, `FCT-DEP-9f38fe815866`, `FCT-DEP-e62f2b6001f9`, `FCT-DEP-37be31d725f6`, `FCT-DEP-9ed802297f10`, `FCT-DEP-115e811e44a7`, `FCT-DEP-595e0c9024d9`, `FCT-DEP-a93c06ff4ac4`, `FCT-DEP-9bd8512a5c8a`, `FCT-DEP-2c8f38286ee2`, `FCT-DEP-da38badd9b98`, `FCT-DEP-fafb8d9b783e`, `FCT-DEP-89deebf0ebb9`, `FCT-DEP-7b7a1e3cfa36`, `FCT-DEP-75e7f0ff142a`, `FCT-DEP-bb298eeff1f4`, `FCT-DEP-4f0381561fe1`, `FCT-DEP-94770bb65877`, `FCT-DEP-f4f70f1513a0`

## 3. ACHADOS (FINDINGS)

### [HIGH] Diretório Crítico de Domínio Ausente (src/domain)
- **ID do Achado:** `FND-ARCH-651faac627`
- **Localização:** `src/domain`
- **Descrição:** Conforme a convenção Clean Architecture, o projeto DEVE possuir a camada de domínio isolada na pasta 'src/domain'.
- **Fatos de Origem:** `FCT-FS-f64e37aa9ca9`
- **Evidências Rastreáveis:** `EVD-FS-00064cab29c0`, `EVD-FS-000778504e79`, `EVD-FS-0009cc8f7b4b`, `EVD-FS-000a733b52c5`, `EVD-FS-000defc4969e`, `EVD-FS-0010e1a6c639`, `EVD-FS-001145f15bf1`, `EVD-FS-00158f10bacd`, `EVD-FS-001a67e52340`, `EVD-FS-0020db8b9824`

## 4. PROVENIÊNCIA & RASTREABILIDADE

Este relatório foi gerado deterministicamente sem injeção de dados de demonstração ou fixtures.
Todos os achados derivam de Evidências com hashes SHA-256 verificáveis contra o sistema de arquivos real.