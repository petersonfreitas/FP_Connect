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

O modelo detalhado de identidade, acesso de plataforma, vinculos empresariais e suporte operacional fica em `docs/ACCESS_MODEL.md`.

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
4. FP Marketing;
5. FP Gateway;
6. FP Fiscal;
7. FP Sign;
8. FP BI;
9. FP Router.

O FP Gateway possui backlog proprio e deve ser tratado como modulo oficial de integracoes externas, credenciais, OAuth, pagamentos, Mercado Pago, futuros provedores de pagamento, WhatsApp e Meta.

O FP Fiscal sera modulo proprio para configuracao, emissao, controle e historico fiscal, com foco inicial na evolucao fiscal do FP Food.

O FP Sign sera modulo futuro para aceite simples, contratos, propostas e arquivamento documental, sem assinatura digital avancada no MVP.

O FP BI sera modulo futuro de indicadores, dashboards e relatorios do ecossistema, evoluindo quando houver maturidade dos modulos transacionais.

O FP Router sera modulo futuro de baixa prioridade, complementar ao FP Tracking, responsavel por planejamento de rotas, roteirizacao inteligente e apoio logistico/fiscal. O conceito antigo de EixoGuard fica absorvido pelo FP Router e nao deve ser tratado como modulo independente.

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
gateway
fiscal
router
sign
bi
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

## 7. Performance e seguranca em consultas

Performance nunca deve reduzir seguranca.

Consultas devem seguir o contrato detalhado em `docs/PERFORMANCE_SECURITY.md`.

Regras obrigatorias:

- validar autenticacao, empresa, vinculo, permissao, modulo contratado e escopo antes de dados sensiveis;
- nao confiar em `company_id` enviado livremente pelo frontend;
- usar `select` explicito;
- filtrar `deleted_at is null` em entidades com soft delete;
- usar indices alinhados a filtros e ordenacoes reais;
- criar listagens novas com paginacao e limite maximo no backend;
- evitar N+1, buscando dados relacionados em lote quando possivel;
- cachear apenas dados globais ou nao sensiveis com justificativa clara.

No estado atual, a API Nest usa `SUPABASE_SERVICE_ROLE_KEY` server-side. Portanto, guards/policies no backend sao obrigatorios antes de qualquer otimizacao em dados sensiveis; RLS permanece como defesa em profundidade e contrato para futuros clientes Supabase diretos.

Rotas internas passam por rate limit global antes de consultar Supabase. O MVP usa controle em memoria por usuario/empresa/metodo ou IP/metodo, retorna headers `X-RateLimit-*` e HTTP 429 com `Retry-After` quando o limite e excedido. Quando houver multiplas instancias ou alto volume, esse contrato deve migrar para Redis/Upstash ou componente equivalente.

O Admin Console exige `X-FP-Internal-Token` valido e `X-FP-Actor-User-Id` de usuario ativo antes de permitir acesso as rotas internas. `super_admin` possui bypass global. Rotas com contexto de empresa podem usar policies granulares por permissao; rotas globais continuam restritas a super-admin para evitar exposicao entre empresas.

Os produtos operacionais possuem endpoints internos de acesso no formato `/api/<modulo>/access`. Esses endpoints tambem exigem `X-FP-Internal-Token`, `X-FP-Actor-User-Id` e `X-FP-Company-Id`, e passam pelo guard comum de modulo, que valida usuario ativo, empresa ativa, modulo contratado ativo e permissao do modulo. `super_admin` pode ignorar permissao granular, mas nao ignora a obrigatoriedade de modulo contratado ativo para a empresa.

---

## 8. Multiempresa, permissoes e modulos contratados

O sistema e SaaS multiempresa.

Toda entidade de negocio deve ter `company_id`, salvo entidade claramente global.

Identidade, acesso de plataforma, vinculos empresariais e permissoes de modulo sao conceitos separados. Um usuario pode ter acesso global ao Console, estar vinculado a uma ou mais empresas e possuir permissoes diferentes por empresa/modulo.

Usuarios internos do Console sao administrados em rota propria e podem ter papel `super_admin`, `fp_admin` ou `support`. Usuarios de clientes devem nascer e ser administrados no contexto da empresa, mantendo `company_user` como papel global e deixando as permissoes efetivas para vinculo, modulo e papel de aplicacao. Como regra inicial, `fp_admin` pode convidar e vincular apenas usuarios `support`; criacao/promocao de `super_admin` e `fp_admin` permanece restrita ao superadmin.

Superadmins e admins do Console podem ser vinculados operacionalmente como suporte de empresas especificas. Esse vinculo de suporte serve para atendimento, implantacao e futura integracao com FP Suporte, e concede poder administrativo auditavel dentro da empresa atendida. Acoes de alto risco podem exigir permissao adicional mesmo para suporte.

Toda acao sensivel deve validar:

1. usuario autenticado;
2. empresa ativa;
3. vinculo do usuario com a empresa;
4. permissao do usuario;
5. modulo contratado/liberado, quando aplicavel;
6. escopo por `company_id`.

Menus podem ser ocultados no frontend, mas seguranca real deve estar no backend, no banco ou em ambos.

A navegacao do frontend deve evoluir para ser derivada do acesso real do usuario atual, evitando expor menus globais para usuarios que possuem apenas vinculos empresariais ou modulos especificos.

Para `fp_admin`, a navegacao do Admin Console expõe a gestao de usuarios internos apenas como gestao de suporte. A edicao/promocao global de usuarios internos permanece reservada ao superadmin.

Links de navegacao devem apontar diretamente para a tela final. Rotas que existem apenas para redirecionar devem ser removidas quando nao houver mais referencias ativas.

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

## 9. Variaveis de ambiente e fronteira navegador/servidor

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

Convites de usuarios do Admin Console devem ser enviados server-side pelo Nest com `inviteUserByEmail`, usando a `SUPABASE_SERVICE_ROLE_KEY` apenas no backend. O `redirectTo` deve ser derivado de `FP_WEB_URL` e apontar para `/login/atualizar-senha`, reaproveitando a mesma tela para definicao da senha inicial. Ao definir a senha, o servidor deve ativar o perfil e os vinculos pendentes no `core`. Reenvio de convite so deve ser permitido para usuario e vinculo ainda pendentes.

Se futuramente houver cliente Supabase direto no navegador, a exposicao deve ser explicita e limitada a:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Nesse caso, a seguranca deve depender de RLS, policies, permissoes e escopo por empresa. A service role continua proibida no frontend.

---

## 10. APIs internas, publicas e integracoes

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

No estagio atual, os endpoints de acesso dos modulos (`/api/food/access`, `/api/tracking/access`, `/api/robots/access` e equivalentes futuros ja registrados) servem como contrato minimo para shells e frontends separados confirmarem se a empresa e o usuario podem acessar o produto antes de carregar dados operacionais.

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

## 11. FP Robots e eventos

O FP Robots e o centro de eventos, logs, webhooks, e-mails, reprocessamentos e automacoes.

O FP Robots deve atuar como orquestrador de automacoes: ele recebe eventos, avalia regras, cria acoes, acompanha execucoes, registra falhas e permite reprocessamento. Ele nao deve incorporar diretamente detalhes operacionais de provedores externos quando houver um modulo proprio para isso.

O FP Gateway devera encapsular integracoes com provedores externos como WhatsApp, Meta, Mercado Pago, futuros provedores de pagamento e canais equivalentes. Nesse desenho, o FP Robots decide quando uma acao deve acontecer, enquanto o FP Gateway executa a comunicacao com o provedor externo, normaliza respostas e devolve status operacional.

Fluxo conceitual recomendado:

```text
Sistema de origem
-> emite evento
-> FP Robots valida catalogo e avalia regras
-> FP Robots cria acao padronizada
-> FP Gateway executa a chamada externa, quando o destino for provedor externo
-> FP Robots registra sucesso, falha ou reprocessamento
```

Exemplos de acoes futuras que devem ser padronizadas pelo FP Robots sem acoplamento direto ao provedor:

```text
gateway.whatsapp.send_message
gateway.instagram.send_message
gateway.facebook.publish_event
gateway.ads.sync_audience
gateway.payments.create_charge
gateway.payments.check_status
```

LinkedIn e gov.br ficam fora do escopo inicial do FP Gateway. Integracoes futuras podem ser avaliadas em novas versoes, com backlog especifico.

O FP Robots pode manter conectores simples previstos no backlog enquanto o FP Gateway nao for implementado, mas deve evitar modelagens que misturem regra de automacao com credenciais, APIs e detalhes especificos de provedores externos.

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

## 12. FP Monitor

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

## 13. Frontend

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

## 14. Soft delete

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

## 15. Arquivos e anexos

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

## 16. Convencoes

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

## 17. Evitar

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

## 18. Diretriz final

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
