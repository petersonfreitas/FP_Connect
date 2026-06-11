# DECISIONS.md — Decisões do Ecossistema FP WebTech

Este arquivo registra decisões arquiteturais e operacionais para evitar retrabalho e manter coerência no desenvolvimento.

## Decisões ativas

| ID | Decisão | Status |
|---|---|---|
| DEC-001 | O projeto será desenvolvido em monorepo com Next.js, NestJS e Supabase/PostgreSQL. | Aprovada |
| DEC-002 | O `AGENTS.md` será mantido enxuto e operacional, evitando documentação excessiva. | Aprovada |
| DEC-003 | Backlogs são a fonte principal de escopo. | Aprovada |
| DEC-004 | Na fase atual, priorizar Admin Console, Robots, Food e Tracking. | Aprovada |
| DEC-005 | Backlogs orientam prioridade, mas fluxos reais orientam implementação. | Aprovada |
| DEC-006 | Dependências reais autorizam transição entre módulos. | Aprovada |
| DEC-007 | Transição entre módulos exige base mínima coerente antes da função dependente. | Aprovada |
| DEC-008 | Ao transitar, implementar só até o ponto necessário e depois retornar ao fluxo original. | Aprovada |
| DEC-009 | Toda entidade de negócio deve possuir `company_id`, salvo entidade claramente global. | Aprovada |
| DEC-010 | Toda exclusão de dado de negócio deve usar soft delete. | Aprovada |
| DEC-011 | Hard delete só é permitido para dados temporários, descartáveis, seeds ou com autorização explícita. | Aprovada |
| DEC-012 | Toda alteração de schema deve usar migration versionada. | Aprovada |
| DEC-013 | Regra crítica deve ficar no backend, no banco ou em ambos; nunca apenas no frontend. | Aprovada |
| DEC-014 | Acesso deve validar autenticação, empresa, vínculo, permissão, módulo contratado e escopo por `company_id`. | Aprovada |
| DEC-015 | FP Robots será o centro de eventos, logs, webhooks, e-mails, reprocessamentos e automações. | Aprovada |
| DEC-016 | Eventos e automações extras não devem ser criados sem backlog ou autorização. | Aprovada |
| DEC-017 | Gateway de pagamento e nota fiscal não são proibidos; serão tratados no momento adequado. | Aprovada |
| DEC-018 | Interface deve usar português do Brasil; código interno pode usar inglês técnico. | Aprovada |
| DEC-019 | O agente deve ler somente o necessário para a tarefa atual, evitando varredura ampla do repositório. | Aprovada |
| DEC-020 | Alterações devem ser pequenas, verificáveis e com resumo objetivo. | Aprovada |
| DEC-021 | O ecossistema usará um único banco Supabase/PostgreSQL para todos os módulos. | Aprovada |
| DEC-022 | A separação de dados por módulo será feita por schemas PostgreSQL, com `core` centralizando empresas, usuários, permissões, módulos contratados e autorização. | Aprovada |
| DEC-023 | Frontends podem ser separados por jornada de uso, como Food e Tracking, mas todos devem usar o mesmo Supabase Auth, o mesmo banco único e o controle central do `core`. | Aprovada |
| DEC-024 | A fundação backend começará como uma aplicação NestJS modular; APIs por módulo só serão extraídas futuramente se houver necessidade real de escala, isolamento ou deploy independente. | Aprovada |
| DEC-025 | A fundação inicial priorizará APIs internas; APIs públicas/externas ficam como capacidade planejada e só serão implementadas com backlog específico ou autorização explícita. | Aprovada |
| DEC-026 | APIs públicas/externas deverão usar namespace/versionamento próprios, autenticação de integração, resolução segura de empresa, idempotência quando aplicável, logs e auditoria. | Aprovada |
| DEC-027 | Webhooks de entrada devem validar origem, assinatura ou token; webhooks de saída, automações, retries e reprocessamentos pertencem preferencialmente ao FP Robots. | Aprovada |
| DEC-028 | FP Monitor será um módulo de plataforma previsto para observar APIs, serviços, integrações, disponibilidade, latência e incidentes; fica deferido para o final do projeto, salvo necessidade operacional antecipada. | Aprovada |
| DEC-029 | A navegação do Admin Console deve agrupar rotas em menus principais recolhíveis, começando por `Cadastro` para cadastros mestres e `Movimentação` para dados operacionais e fluxos com CRUD. | Aprovada |

---

## Como registrar nova decisão

Use o formato:

```text
DEC-XXX — Título da decisão
Status: Proposta | Aprovada | Substituída | Cancelada
Data:
Contexto:
Decisão:
Impacto:
```

---

## Decisões propostas

Nenhuma no momento.

---

## Decisões substituídas ou canceladas

Nenhuma no momento.
