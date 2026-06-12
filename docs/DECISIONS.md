# DECISIONS.md - Decisoes do Ecossistema FP WebTech

Este arquivo registra decisoes arquiteturais e operacionais para evitar retrabalho e manter coerencia no desenvolvimento.

## Decisoes ativas

| ID | Decisao | Status |
|---|---|---|
| DEC-001 | O projeto sera desenvolvido em monorepo com Next.js, NestJS e Supabase/PostgreSQL. | Aprovada |
| DEC-002 | O `AGENTS.md` sera mantido enxuto e operacional, evitando documentacao excessiva. | Aprovada |
| DEC-003 | Backlogs sao a fonte principal de escopo. | Aprovada |
| DEC-004 | Na fase atual, priorizar Admin Console, Robots, Food e Tracking. | Aprovada |
| DEC-005 | Backlogs orientam prioridade, mas fluxos reais orientam implementacao. | Aprovada |
| DEC-006 | Dependencias reais autorizam transicao entre modulos. | Aprovada |
| DEC-007 | Transicao entre modulos exige base minima coerente antes da funcao dependente. | Aprovada |
| DEC-008 | Ao transitar, implementar so ate o ponto necessario e depois retornar ao fluxo original. | Aprovada |
| DEC-009 | Toda entidade de negocio deve possuir `company_id`, salvo entidade claramente global. | Aprovada |
| DEC-010 | Toda exclusao de dado de negocio deve usar soft delete. | Aprovada |
| DEC-011 | Hard delete so e permitido para dados temporarios, descartaveis, seeds ou com autorizacao explicita. | Aprovada |
| DEC-012 | Toda alteracao de schema deve usar migration versionada. | Aprovada |
| DEC-013 | Regra critica deve ficar no backend, no banco ou em ambos; nunca apenas no frontend. | Aprovada |
| DEC-014 | Acesso deve validar autenticacao, empresa, vinculo, permissao, modulo contratado e escopo por `company_id`. | Aprovada |
| DEC-015 | FP Robots sera o centro de eventos, logs, webhooks, e-mails, reprocessamentos e automacoes. | Aprovada |
| DEC-016 | Eventos e automacoes extras nao devem ser criados sem backlog ou autorizacao. | Aprovada |
| DEC-017 | Gateway de pagamento e nota fiscal nao sao proibidos; serao tratados no momento adequado. | Aprovada |
| DEC-018 | Interface deve usar portugues do Brasil; codigo interno pode usar ingles tecnico. | Aprovada |
| DEC-019 | O agente deve ler somente o necessario para a tarefa atual, evitando varredura ampla do repositorio. | Aprovada |
| DEC-020 | Alteracoes devem ser pequenas, verificaveis e com resumo objetivo. | Aprovada |
| DEC-021 | O ecossistema usara um unico banco Supabase/PostgreSQL para todos os modulos. | Aprovada |
| DEC-022 | A separacao de dados por modulo sera feita por schemas PostgreSQL, com `core` centralizando empresas, usuarios, permissoes, modulos contratados e autorizacao. | Aprovada |
| DEC-023 | Frontends podem ser separados por jornada de uso, como Food e Tracking, mas todos devem usar o mesmo Supabase Auth, o mesmo banco unico e o controle central do `core`. | Aprovada |
| DEC-024 | A fundacao backend comeca como uma aplicacao NestJS modular; APIs por modulo so serao extraidas futuramente se houver necessidade real de escala, isolamento ou deploy independente. | Aprovada |
| DEC-025 | A fundacao inicial prioriza APIs internas; APIs publicas/externas ficam como capacidade planejada e so serao implementadas com backlog especifico ou autorizacao explicita. | Aprovada |
| DEC-026 | APIs publicas/externas deverao usar namespace/versionamento proprios, autenticacao de integracao, resolucao segura de empresa, idempotencia quando aplicavel, logs e auditoria. | Aprovada |
| DEC-027 | Webhooks de entrada devem validar origem, assinatura ou token; webhooks de saida, automacoes, retries e reprocessamentos pertencem preferencialmente ao FP Robots. | Aprovada |
| DEC-028 | FP Monitor sera um modulo de plataforma previsto para observar APIs, servicos, integracoes, disponibilidade, latencia e incidentes; fica deferido para o final do projeto, salvo necessidade operacional antecipada. | Aprovada |
| DEC-029 | A navegacao do Admin Console deve agrupar rotas em menus principais recolhiveis: `Cadastro`, `Movimentacao` e `Auditoria`. | Aprovada |
| DEC-030 | Formularios devem limitar caracteres conforme o contrato do banco; campos textuais precisam de constraint no banco, validacao no backend e `maxLength` no frontend. | Aprovada |
| DEC-031 | Auditoria deve ser uma categoria propria no Admin Console, com visoes por escopo como empresas, usuarios, modulos e sistema. | Aprovada |
| DEC-032 | Variaveis sensiveis devem permanecer server-side. `SUPABASE_SERVICE_ROLE_KEY` e `FP_INTERNAL_API_TOKEN` nunca podem ser expostos ao navegador. | Aprovada |
| DEC-033 | O frontend web atual nao deve expor Supabase diretamente ao navegador; se isso mudar, somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem ser usados com RLS obrigatoria. | Aprovada |
| DEC-034 | Food e Tracking podem nascer como frontends separados, mas continuam usando o banco unico, Supabase Auth unico e controle central do `core`. | Aprovada |
| DEC-035 | O Admin Console deve autenticar pelo Supabase Auth no server-side do Next, armazenar sessao em cookie HttpOnly e enviar contexto interno de usuario para a API Nest. | Aprovada |

---

## Como registrar nova decisao

Use o formato:

```text
DEC-XXX - Titulo da decisao
Status: Proposta | Aprovada | Substituida | Cancelada
Data:
Contexto:
Decisao:
Impacto:
```

---

## Decisoes propostas

Nenhuma no momento.

---

## Decisoes substituidas ou canceladas

Nenhuma no momento.
