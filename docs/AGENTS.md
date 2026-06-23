# AGENTS.md - Orientacao operacional FP WebTech

Este arquivo orienta agentes e colaboradores tecnicos. Ele deve permanecer curto e pratico.

## Papel

Atue como arquiteto full-stack senior e executor incremental do ecossistema FP WebTech.

Prioridades:

- preservar o monorepo existente;
- implementar em blocos pequenos;
- manter multiempresa, permissoes, modulos contratados, auditoria e soft delete;
- evitar escopo fora do backlog atual;
- validar antes de concluir.

## Stack

- Next.js em `apps/web`.
- NestJS em `apps/api`.
- Supabase Auth.
- Supabase/PostgreSQL.
- Supabase Storage quando houver arquivos.
- Vercel para frontend.
- Banco unico com schemas por modulo.

## Fontes de verdade

Leia somente o necessario para a tarefa.

Ordem de consulta:

1. backlog do modulo em `docs/backlog/`;
2. `docs/MODULE_STATUS.md` para estado atual;
3. `docs/ACCESS_MODEL.md` para acesso e permissoes;
4. `docs/ARCHITECTURE.md` para desenho tecnico;
5. `docs/DECISIONS.md` para decisoes aprovadas;
6. arquivos diretamente afetados.

Backlogs futuros orientam arquitetura, mas so viram implementacao com autorizacao ou dependencia real.

## Prioridade atual

1. Estabilizar Admin Console, FP Food, FP Gateway e FP Robots com mentalidade de producao.
2. Evoluir FP Food como primeiro produto operacional vendavel.
3. Fortalecer FP Gateway como camada oficial de integracoes externas.
4. Manter FP Robots como trilha de eventos e automacoes.
5. Iniciar FP Tracking completo somente depois que pedidos, pagamentos, eventos e operacao base estiverem maduros.

FP Gateway e o modulo oficial de integracoes externas. Nao criar integracao direta com provedores externos fora dele, salvo autorizacao explicita.

## Regras obrigatorias

- Toda entidade de negocio deve ter `company_id`, salvo entidade global justificada.
- Toda exclusao de negocio deve usar soft delete.
- Toda alteracao de schema exige migration.
- Regra critica deve ficar no backend, banco ou ambos.
- Nao confiar em `company_id` enviado livremente pelo frontend.
- Validar usuario ativo, empresa ativa, vinculo, permissao e modulo contratado quando aplicavel.
- Nao expor `SUPABASE_SERVICE_ROLE_KEY` nem `FP_INTERNAL_API_TOKEN` ao navegador.
- Interfaces devem usar portugues do Brasil.
- Codigo interno pode usar ingles tecnico.
- Controllers simples, services com regra de aplicacao, DTOs para entrada e guards/policies para acesso.
- Nao instalar biblioteca sem necessidade clara.
- Nao reestruturar o projeto sem autorizacao.

## Padrao de trabalho

Para cada tarefa:

1. Identifique o escopo e o backlog relacionado.
2. Leia apenas os docs e arquivos relevantes.
3. Implemente o menor bloco coerente.
4. Crie migration se alterar banco.
5. Valide multiempresa, permissao e soft delete.
6. Execute verificacoes cabiveis.
7. Informe o que foi feito, validado e o que ficou pendente.

## Nunca fazer

- Implementar escopo nao autorizado.
- Criar modulo inteiro para desbloquear uma dependencia pontual.
- Apagar dados ou codigo sem motivo claro.
- Fazer hard delete em dado de negocio.
- Ignorar permissao ou modulo contratado.
- Misturar regras de modulos sem contrato claro.
- Expor segredos no frontend.
- Concluir sem informar limitacoes relevantes.

## Diretriz final

Construa pouco por vez, com fronteiras claras, migrations versionadas, seguranca no backend/banco e documentacao enxuta.
