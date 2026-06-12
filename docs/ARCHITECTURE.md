# ARCHITECTURE.md - Arquitetura FP WebTech

## 1. Objetivo

Este documento define a arquitetura tecnica base do ecossistema SaaS da FP WebTech.

Ele deve orientar o desenvolvimento sem substituir:

- `AGENTS.md`;
- `ROADMAP.md`;
- `DECISIONS.md`;
- `MODULE_STATUS.md`;
- backlogs funcionais.

Use este arquivo como contrato tecnico enxuto para manter consistencia entre modulos.

---

## 2. Stack oficial

O ecossistema usa:

- monorepo;
- Next.js no frontend;
- NestJS no backend;
- Supabase/PostgreSQL como banco unico;
- Supabase Storage para arquivos quando necessario;
- Vercel para frontend;
- Visual Studio Code com Codex.

Siga sempre o padrao real ja existente no repositorio.

---

## 3. Modulos do ecossistema

Modulos prioritarios nesta fase:

1. FP Connect Admin Console;
2. FP Robots;
3. FP Food;
4. FP Tracking.

Modulos futuros:

1. FP Billing;
2. FP Tickets;
3. FP Sales;
4. FP Marketing.

Modulo de plataforma previsto:

1. FP Monitor.

O FP Monitor deve observar disponibilidade, latencia, falhas, saude de APIs, integracoes e incidentes operacionais. Ele fica deferido para o final do projeto, salvo necessidade operacional antecipada.

---

## 4. Organizacao do monorepo

A estrutura real do monorepo prevalece.

Estrutura base:

```text
apps/
  web/
  api/

packages/
  shared/
  config/
  types/
```

`apps/web` e o shell inicial do ecossistema e hospeda o Admin Console.

`apps/api` e a API Nest inicial. Os modulos devem ser separados internamente por dominio, contratos, controllers, services, DTOs, policies e migrations.

Modulos com jornada publica ou operacional propria podem nascer como frontends separados quando entrarem em desenvolvimento. Exemplos previstos:

```text
apps/food-web/
apps/tracking-web/
```

Mesmo com frontend separado, cada modulo deve usar:

- o mesmo banco Supabase/PostgreSQL;
- o mesmo Supabase Auth;
- o controle central de empresas, permissoes e modulos contratados no schema `core`;
- APIs/backend definidos para o ecossistema.

APIs por modulo podem ser extraidas no futuro se houver necessidade real de escala, isolamento operacional ou deploy independente. Ate la, a separacao fica dentro da aplicacao Nest modular.

---

## 5. Separacao de responsabilidades

### Next.js

Responsavel por:

- interface administrativa;
- telas publicas quando existirem;
- portal de modulos;
- formularios;
- experiencia do usuario;
- chamadas server-side para APIs internas;
- protecao visual por permissao e modulo contratado.

O frontend nao deve ser a unica camada de validacao de regra critica.

### NestJS

Responsavel por:

- APIs internas e, futuramente, APIs publicas/externas;
- regras de aplicacao;
- validacoes criticas;
- permissoes;
- integracao entre modulos;
- orquestracao de eventos;
- acesso controlado ao banco;
- auditoria quando aplicavel.

Na fase atual, a prioridade e construir APIs internas para os frontends e para comunicacao controlada entre modulos.

APIs publicas/externas para clientes, parceiros ou sistemas terceiros sao capacidade planejada, mas nao fazem parte da fundacao inicial sem backlog especifico ou autorizacao explicita.

### Supabase/PostgreSQL

Responsavel por:

- persistencia;
- constraints;
- indices;
- migrations;
- storage quando houver arquivos;
- RLS.

O ecossistema deve usar um unico banco Supabase/PostgreSQL.

---

## 6. Banco, schemas e migrations

Toda alteracao de schema deve ser feita por migration versionada.

A separacao de modulos deve ser feita por schemas PostgreSQL, nao por bancos separados.

Schemas previstos:

```text
core
robots
food
tracking
marketing
sales
tickets
billing
monitoring
```

`auth` e gerenciado pelo Supabase Auth.

`core` e o schema central do Admin Console e deve concentrar:

```text
empresas
perfis de usuario
vinculos usuario x empresa
catalogo de modulos/sistemas
modulos contratados por empresa
papeis e permissoes
auditoria administrativa
funcoes auxiliares de autorizacao
```

Cada modulo deve armazenar suas entidades proprias no schema do modulo. Exemplos:

```text
food.orders
tracking.deliveries
robots.events
sales.opportunities
billing.charges
monitoring.api_checks
```

Schemas por modulo nao substituem seguranca. Toda entidade de negocio continua exigindo `company_id`, RLS, escopo por empresa, validacao de modulo contratado e validacao de permissao.

Regras:

- tabelas e colunas em `snake_case`;
- usar UUID quando esse for o padrao do projeto;
- usar `created_at`;
- usar `updated_at`;
- usar `deleted_at` em entidades de negocio;
- incluir `company_id` em entidades de negocio;
- criar indices para `company_id`, status e relacionamentos frequentes;
- criar tabelas no schema correto do modulo;
- evitar duplicar usuarios, empresas, permissoes ou modulos fora do `core`;
- evitar migrations duplicadas;
- nao apagar dados em migration sem autorizacao.

---

## 7. Multiempresa, permissoes e modulos contratados

O sistema e SaaS multiempresa.

Toda entidade de negocio deve ter `company_id`, salvo entidade claramente global.

Toda acao sensivel deve validar:

1. usuario autenticado;
2. empresa ativa;
3. vinculo do usuario com a empresa;
4. permissao do usuario;
5. modulo contratado/liberado, quando aplicavel;
6. escopo por `company_id`.

Menus podem ser ocultados no frontend, mas seguranca real deve estar no backend, no banco ou em ambos.

Entidades normalmente globais:

- catalogo de modulos/sistemas;
- permissoes globais;
- planos-base globais;
- configuracoes globais do super admin.

Entidades normalmente por empresa:

- usuarios vinculados a empresa;
- clientes;
- contatos;
- pedidos;
- produtos;
- entregas;
- tickets;
- cobrancas;
- pagamentos;
- eventos;
- logs operacionais.

Nenhuma empresa pode acessar dados de outra empresa.

---

## 8. Variaveis de ambiente e fronteira navegador/servidor

Variaveis sensiveis devem ficar server-side.

Regra atual:

- `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser exposta ao navegador;
- `FP_INTERNAL_API_TOKEN` nunca pode ser exposto ao navegador;
- `SUPABASE_URL` fica server-side no estado atual do projeto;
- `SUPABASE_ANON_KEY` nao e usada pelo frontend no navegador no estado atual;
- variaveis sem prefixo `NEXT_PUBLIC_` nao devem ser usadas por codigo client-side.

O frontend web atual consome a API interna pelo server-side do Next usando `apps/web/src/lib/internal-api.ts`, que usa `server-only`.

O Admin Console autentica pelo Supabase Auth no server-side do Next. A sessao e armazenada em cookies HttpOnly. Mutacoes server-side para a API interna devem enviar o usuario autenticado como contexto interno para auditoria e autorizacao.

Recuperacao de senha deve usar o fluxo do Supabase Auth com redirect autorizado para `/login/atualizar-senha`. O link pode carregar token de recovery no hash da URL; a pagina de atualizacao deve remover o hash do historico do navegador depois de ler o token.

Se futuramente houver cliente Supabase direto no navegador, a exposicao deve ser explicita e limitada a:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Nesse caso, a seguranca deve depender de RLS, policies, permissoes e escopo por empresa. A service role continua proibida no frontend.

---

## 9. APIs internas, publicas e integracoes

### APIs internas

APIs internas sao usadas pelos frontends do ecossistema e por modulos internos.

Exemplos:

```text
/api/admin-console/...
/api/robots/...
/api/food/...
/api/tracking/...
```

Regras:

- exigem usuario autenticado, empresa ativa, vinculo, permissao, modulo contratado e escopo por `company_id`;
- nao devem confiar em `company_id` enviado livremente pelo frontend;
- devem aplicar regras criticas no backend, banco ou ambos;
- devem usar contratos compartilhados quando houver acoplamento relevante entre modulos.

### APIs publicas/externas

APIs publicas/externas sao endpoints expostos para clientes, parceiros ou sistemas terceiros integrarem com o ecossistema.

Elas devem ser preparadas arquiteturalmente, mas nao implementadas na fundacao inicial sem backlog especifico ou autorizacao explicita.

Quando forem criadas, devem usar namespace e versionamento proprios:

```text
/public-api/v1/...
/integrations/v1/...
```

Regras obrigatorias:

- versionamento explicito;
- autenticacao propria por chave, token, assinatura ou credencial de integracao;
- resolucao da empresa pela credencial/dominio/integracao, nunca por `company_id` livre;
- validacao de modulo contratado e permissoes da integracao;
- rate limit quando aplicavel;
- idempotencia para criacao de registros, eventos, pedidos, entregas ou cobrancas;
- logs e auditoria;
- respostas de erro claras, sem vazamento de dados sensiveis;
- contrato documentado antes da implementacao.

### Webhooks e eventos externos

Webhooks de entrada devem validar origem, assinatura ou token antes de processar dados.

Quando possivel, a entrada externa deve registrar um evento bruto ou outbox antes de executar regra de negocio sensivel.

Webhooks de saida, automacoes, e-mails, retries e reprocessamentos pertencem ao FP Robots, salvo excecao autorizada.

---

## 10. FP Robots e eventos

O FP Robots e o centro de eventos, logs, webhooks, e-mails, reprocessamentos e automacoes.

Eventos devem ser criados somente quando estiverem no backlog da etapa atual ou quando houver autorizacao explicita.

Formato conceitual recomendado:

```json
{
  "event_name": "fp.module.resource.action",
  "company_id": "uuid",
  "module": "fp_module",
  "aggregate_type": "resource",
  "aggregate_id": "uuid",
  "actor_user_id": "uuid",
  "payload": {},
  "occurred_at": "timestamp"
}
```

Quando possivel, usar padrao outbox/event log:

```text
acao principal
-> grava evento
-> Robots processa
-> logs registram sucesso ou falha
```

---

## 11. FP Monitor

O FP Monitor e um modulo de plataforma previsto para observabilidade operacional do ecossistema.

Responsabilidades previstas:

- monitorar disponibilidade das APIs internas;
- acompanhar latencia, status e falhas por modulo;
- registrar checks, estados de saude e incidentes operacionais;
- exibir saude de servicos no Admin Console;
- futuramente monitorar integracoes externas e APIs publicas.

FP Robots executa eventos, automacoes, webhooks, retries e reprocessamentos.

FP Monitor observa saude, disponibilidade, incidentes, latencia e degradacao.

O FP Monitor deve usar o schema `monitoring` quando for implementado. A primeira versao deve evitar logs brutos de alto volume no Supabase; priorize resumos, checks, incidentes e estados.

---

## 12. Frontend

Interface deve usar portugues do Brasil.

Codigo interno pode usar ingles tecnico.

Telas devem prever, quando aplicavel:

- loading;
- vazio;
- erro;
- sucesso;
- confirmacao de acao destrutiva;
- bloqueio por permissao;
- bloqueio por modulo contratado.

Formularios devem respeitar o mesmo contrato do banco:

- campos textuais com limite explicito por constraint;
- validacao equivalente no backend;
- `maxLength` no frontend;
- validacao de documentos oficiais quando aplicavel, como CPF e CNPJ;
- normalizacao de telefone/celular quando aplicavel.
- mascaras visuais podem ser usadas no frontend para CPF, CNPJ, telefone, celular e CEP, mas o banco deve manter valores normalizados.

No Admin Console, a navegacao principal deve usar grupos recolhiveis:

- `Cadastro`: cadastros mestres e configuracoes estruturais, como empresas, usuarios, planos, modulos, papeis e permissoes;
- `Movimentacao`: dados operacionais, fluxos de trabalho e registros ja cadastrados que podem evoluir por CRUD ou mudanca de status;
- `Auditoria`: trilhas e analises por escopo, como empresas, usuarios, modulos e sistema.

Nao criar telas fora do backlog atual sem autorizacao.

---

## 13. Soft delete

Toda exclusao de registro de negocio deve usar soft delete.

Padrao recomendado:

```text
deleted_at
deleted_by
delete_reason
```

Consultas padrao devem ignorar registros com `deleted_at` preenchido.

Hard delete so deve ser usado para:

- dados temporarios;
- dados descartaveis;
- seeds de desenvolvimento;
- casos autorizados explicitamente.

---

## 14. Arquivos e anexos

Arquivos devem usar storage adequado.

Todo arquivo sensivel deve considerar:

- `company_id`;
- recurso dono;
- permissao de acesso;
- tipo de arquivo;
- tamanho maximo;
- auditoria quando aplicavel.

Evite URLs publicas para arquivos sensiveis.

---

## 15. Convencoes

Preferir ingles tecnico para:

- nomes de tabelas;
- colunas;
- variaveis;
- funcoes;
- classes;
- DTOs;
- eventos;
- rotas de API.

Preferir portugues do Brasil para:

- labels;
- titulos;
- botoes;
- mensagens;
- validacoes exibidas ao usuario.

---

## 16. Evitar

Evite:

- regra critica apenas no frontend;
- acesso entre empresas;
- hard delete em dados de negocio;
- entidades sem `company_id`;
- migrations sem necessidade;
- eventos sem backlog ou autorizacao;
- endpoint publico sem backlog/autorizacao;
- misturar API interna com API publica;
- webhook sem validacao de origem, assinatura ou token;
- integracao externa sem autorizacao;
- variavel sensivel no navegador;
- service role no frontend;
- biblioteca sem justificativa;
- reestruturacao global sem autorizacao;
- duplicacao de regra entre modulos;
- funcao isolada sem base de dominio.

---

## 17. Diretriz final

A arquitetura deve favorecer:

- modularidade;
- seguranca;
- multiempresa;
- soft delete;
- permissoes;
- eventos controlados;
- baixo acoplamento;
- implementacao incremental;
- integracao progressiva por fluxo real.
