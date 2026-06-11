# ARCHITECTURE.md — Arquitetura FP WebTech

## 1. Objetivo

Este documento define a arquitetura técnica base do ecossistema SaaS da FP WebTech.

Ele deve orientar o desenvolvimento sem substituir:

- `AGENTS.md`;
- `ROADMAP.md`;
- `DECISIONS.md`;
- `MODULE_STATUS.md`;
- backlogs funcionais.

Use este arquivo como contrato técnico enxuto para manter consistência entre módulos.

---

## 2. Stack oficial

O ecossistema usa:

- Monorepo;
- Next.js no frontend;
- NestJS no backend;
- Supabase/PostgreSQL como banco;
- Supabase Storage para arquivos;
- Vercel para frontend;
- Visual Studio Code com Codex.

Siga sempre o padrão real já existente no repositório.

---

## 3. Módulos do ecossistema

Módulos prioritários nesta fase:

1. FP Connect Admin Console;
2. FP Robots;
3. FP Food;
4. FP Tracking.

Módulos futuros:

1. FP Billing;
2. FP Tickets;
3. FP Sales;
4. FP Marketing.

Módulo de plataforma previsto:

1. FP Monitor.

O FP Monitor deve observar disponibilidade, latência, falhas, saúde de APIs, integrações e incidentes operacionais. Ele fica deferido para o final do projeto, salvo se uma necessidade operacional justificar antecipação.

Os módulos devem ser independentes em responsabilidade, mas integráveis por contratos claros, eventos e APIs internas.

---

## 4. Organização geral esperada

A estrutura real do monorepo deve prevalecer.

Na fundação, manter separação semelhante a:

```text
apps/
  web/
  api/

packages/
  shared/
  config/
  types/
```

Frontend:

```text
apps/web/
```

`apps/web` é o shell inicial do ecossistema, responsável pelo portal/admin principal.

Módulos com jornada pública ou operacional própria podem nascer em frontends separados quando entrarem em desenvolvimento, sem mudar a regra de banco único. Exemplos previstos:

```text
apps/food-web/
apps/tracking-web/
```

Mesmo com frontend separado, o módulo deve usar a mesma autenticação do Supabase Auth, o mesmo controle central de empresas/permissões/módulos contratados e as APIs/backend definidos para o ecossistema.

Backend:

```text
apps/api/
```

`apps/api` é a aplicação backend inicial. Os módulos devem ser separados internamente por domínio, por exemplo:

```text
modules/
  admin-console/
  robots/
  food/
  tracking/
  marketing/
  sales/
  tickets/
  billing/
  monitoring/
```

APIs por módulo podem ser extraídas no futuro se houver necessidade real de escala, isolamento operacional ou deploy independente. Até lá, a separação deve ser feita por módulos internos, contratos, rotas, services, DTOs, policies e migrations.

Código compartilhado:

```text
packages/
```

Não reestruture o monorepo sem autorização explícita.

---

## 5. Separação de responsabilidades

### Next.js

Responsável por:

- interface administrativa;
- telas públicas;
- portal de módulos;
- formulários;
- experiência do usuário;
- chamadas para APIs;
- proteção visual por permissão e módulo contratado.

O frontend não deve ser a única camada de validação de regra crítica.

### NestJS

Responsável por:

- APIs (internas e externas);
- regras de aplicação;
- validações críticas;
- permissões;
- integração entre módulos;
- orquestração de eventos;
- acesso controlado ao banco;
- auditoria quando aplicável.

Na fase atual, a prioridade é construir APIs internas para os frontends e para a comunicação controlada entre módulos do ecossistema.

APIs públicas/externas para clientes, parceiros ou sistemas terceiros são uma capacidade planejada, mas não fazem parte da fundação inicial sem backlog específico ou autorização explícita.

### Supabase/PostgreSQL

Responsável por:

- persistência;
- constraints;
- índices;
- migrations;
- storage quando houver arquivos;
- RLS.

O ecossistema deve usar um único banco Supabase/PostgreSQL.

---

## 6. Padrão de módulo

Cada módulo deve manter responsabilidade própria.

Exemplo de organização possível no backend:

```text
modules/
  admin-console/
  robots/
  food/
  tracking/
  shared/
```

Dentro de cada módulo, usar apenas o necessário:

```text
controllers/
services/
dto/
repositories/
guards/
events/
tests/
```

Controllers devem ser simples.

Services concentram regra de aplicação.

DTOs validam entrada.

Guards/policies validam acesso.

Repositories/data-access isolam banco quando esse padrão existir no projeto.

---

## 7. Multiempresa

O sistema é SaaS multiempresa.

Toda entidade de negócio deve ter `company_id`, salvo entidade claramente global.

Entidades normalmente globais:

- catálogo de módulos/sistemas;
- permissões globais;
- planos-base globais;
- configurações globais do super admin.

Entidades normalmente por empresa:

- usuários vinculados à empresa;
- clientes;
- contatos;
- pedidos;
- produtos;
- entregas;
- tickets;
- cobranças;
- pagamentos;
- eventos;
- logs operacionais.

Nenhuma empresa pode acessar dados de outra empresa.

Consultas, APIs e regras devem sempre respeitar o escopo da empresa.

---

## 8. Permissões e módulos contratados

Toda ação sensível deve validar:

1. usuário autenticado;
2. empresa ativa;
3. vínculo do usuário com a empresa;
4. permissão do usuário;
5. módulo contratado/liberado, quando aplicável;
6. escopo por `company_id`.

Menus podem ser ocultados no frontend, mas segurança real deve estar no backend, no banco ou em ambos.

---

## 9. Soft delete

Toda exclusão de registro de negócio deve usar soft delete.

Padrão recomendado:

```text
deleted_at
deleted_by
delete_reason
```

`deleted_by` e `delete_reason` devem ser usados quando fizer sentido para auditoria.

Consultas padrão devem ignorar registros com `deleted_at` preenchido.

Hard delete só deve ser usado para:

- dados temporários;
- dados descartáveis;
- seeds de desenvolvimento;
- casos autorizados explicitamente.

---

## 10. Banco e migrations

Toda alteração de schema deve ser feita por migration versionada.

O banco é único para todo o ecossistema. A separação de módulos deve ser feita por schemas PostgreSQL, não por bancos separados.

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

`auth` é gerenciado pelo Supabase Auth.

`core` é o schema central do Admin Console e deve concentrar a base comum do ecossistema:

```text
empresas
perfis de usuário
vínculos usuário x empresa
catálogo de módulos/sistemas
módulos contratados por empresa
papéis e permissões
auditoria administrativa
funções auxiliares de autorização
```

Cada módulo deve armazenar suas entidades próprias no schema do módulo. Exemplo:

```text
food.orders
tracking.deliveries
robots.events
sales.opportunities
billing.charges
monitoring.api_checks
```

Schemas por módulo não substituem segurança. Toda entidade de negócio continua exigindo `company_id`, RLS, escopo por empresa, validação de módulo contratado e validação de permissão.

As policies dos schemas de módulo devem reutilizar, sempre que possível, funções centralizadas em `core`, por exemplo:

```text
core.user_has_company_access(...)
core.company_has_module(...)
core.user_has_permission(...)
```

Regras:

- tabelas e colunas em `snake_case`;
- usar UUID quando esse for o padrão do projeto;
- usar `created_at`;
- usar `updated_at`;
- usar `deleted_at` em entidades de negócio;
- incluir `company_id` em entidades de negócio;
- criar índices para `company_id`, status e relacionamentos frequentes;
- criar tabelas no schema correto do módulo;
- evitar duplicar tabelas de usuário, empresa, permissões ou módulos fora do `core`;
- evitar migrations duplicadas;
- não apagar dados em migration sem autorização.

---

## 11. Eventos e FP Robots

O FP Robots é o centro de eventos, logs, webhooks, e-mails, reprocessamentos e automações.

Eventos devem ser criados somente quando estiverem no backlog da etapa atual ou quando houver autorização explícita.

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

Quando possível, usar padrão outbox/event log:

```text
ação principal
→ grava evento
→ Robots processa
→ logs registram sucesso ou falha
```

---

## 12. Comunicação entre módulos

Módulos não devem acessar regras internas uns dos outros diretamente sem contrato claro.

Formas aceitáveis de integração:

- service interno bem definido;
- API interna;
- evento;
- outbox/event log;
- contrato compartilhado em types, quando existir.

Ao transitar entre módulos por dependência:

- construir base mínima coerente;
- implementar apenas até a função necessária;
- retornar ao fluxo original.

Não criar função isolada em outro módulo sem base de domínio.

---

## 13. APIs internas, APIs públicas e integrações externas

O backend deve diferenciar claramente APIs internas, APIs públicas/externas e webhooks.

### APIs internas

APIs internas são usadas pelos frontends do ecossistema e por módulos internos.

Exemplos conceituais:

```text
/api/admin-console/...
/api/robots/...
/api/food/...
/api/tracking/...
```

Regras:

- exigem usuário autenticado, empresa ativa, vínculo, permissão, módulo contratado e escopo por `company_id`;
- não devem confiar em `company_id` enviado livremente pelo frontend;
- devem aplicar regras críticas no backend, banco ou ambos;
- devem usar contratos compartilhados quando houver acoplamento relevante entre módulos.

### APIs públicas/externas

APIs públicas/externas são endpoints expostos para clientes, parceiros ou sistemas terceiros integrarem com o ecossistema.

Elas devem ser preparadas arquiteturalmente, mas não devem ser implementadas na fundação inicial sem backlog específico ou autorização explícita.

Quando forem criadas, devem usar namespace e versionamento próprios, por exemplo:

```text
/public-api/v1/...
/integrations/v1/...
```

Regras obrigatórias para API pública/externa:

- versionamento explícito;
- autenticação própria por chave, token, assinatura ou credencial de integração;
- resolução da empresa pela credencial/domínio/integração, nunca por `company_id` livre;
- validação de módulo contratado e permissões da integração;
- rate limit quando aplicável;
- idempotência para criação de registros, eventos, pedidos, entregas ou cobranças;
- logs e auditoria;
- respostas de erro claras, sem vazamento de dados sensíveis;
- contrato documentado antes da implementação.

### Webhooks e eventos externos

Webhooks de entrada devem validar origem, assinatura ou token antes de processar dados.

Quando possível, a entrada externa deve registrar um evento bruto ou outbox antes de executar regra de negócio sensível.

Webhooks de saída, automações, e-mails, retries e reprocessamentos pertencem ao FP Robots, salvo exceção autorizada.

Nenhum endpoint público, webhook ou integração externa deve ser criado apenas por conveniência local de um módulo.

---

## 14. Observabilidade e FP Monitor

O FP Monitor é um módulo de plataforma previsto para observabilidade operacional do ecossistema.

Responsabilidades previstas:

- monitorar disponibilidade das APIs internas;
- acompanhar latência, status e falhas por módulo;
- registrar checks, estados de saúde e incidentes operacionais;
- exibir saúde de serviços no Admin Console;
- futuramente monitorar integrações externas e APIs públicas.

Separação de responsabilidades:

- FP Robots executa eventos, automações, webhooks, retries e reprocessamentos.
- FP Monitor observa saúde, disponibilidade, incidentes, latência e degradação.

O FP Monitor deve usar o schema `monitoring` quando for implementado, mantendo o banco único Supabase/PostgreSQL. A primeira versão deve evitar armazenar logs brutos de alto volume no Supabase; priorize resumos, checks, incidentes e estados. Logs pesados, tracing e métricas de alta cardinalidade podem ser integrados futuramente com ferramenta especializada.

---

## 15. Frontend

Interface deve usar português do Brasil.

Código interno pode usar inglês técnico.

Telas devem prever, quando aplicável:

- loading;
- vazio;
- erro;
- sucesso;
- confirmação de ação destrutiva;
- bloqueio por permissão;
- bloqueio por módulo contratado.

Formulários devem respeitar o mesmo contrato do banco:

- campos textuais com limite explícito por constraint;
- validação equivalente no backend;
- `maxLength` no frontend;
- validação de documentos oficiais quando aplicável, como CPF e CNPJ.

No Admin Console, a navegação principal deve usar grupos recolhíveis. Os grupos iniciais são:

- `Cadastro`: cadastros mestres e configurações estruturais, como empresas, usuários, planos, módulos, papéis e permissões;
- `Movimentação`: dados operacionais, fluxos de trabalho e registros já cadastrados que podem evoluir por CRUD ou mudança de status.

Não criar telas fora do backlog atual sem autorização.

---

## 16. Arquivos e anexos

Arquivos devem usar storage adequado.

Todo arquivo sensível deve considerar:

- `company_id`;
- recurso dono;
- permissão de acesso;
- tipo de arquivo;
- tamanho máximo;
- auditoria quando aplicável.

Evite URLs públicas para arquivos sensíveis.

---

## 17. Convenções

Preferir inglês técnico para:

- nomes de tabelas;
- colunas;
- variáveis;
- funções;
- classes;
- DTOs;
- eventos;
- rotas de API.

Preferir português do Brasil para:

- labels;
- títulos;
- botões;
- mensagens;
- validações exibidas ao usuário.

---

## 18. Evitar

Evite:

- regra crítica apenas no frontend;
- acesso entre empresas;
- hard delete em dados de negócio;
- entidades sem `company_id`;
- migrations sem necessidade;
- eventos sem backlog ou autorização;
- endpoint público sem backlog/autorização;
- misturar API interna com API pública;
- webhook sem validação de origem, assinatura ou token;
- integração externa sem autorização;
- bibliotecas sem justificativa;
- reestruturação global sem autorização;
- duplicação de regra entre módulos;
- função isolada sem base de domínio.

---

## 19. Diretriz final

A arquitetura deve favorecer:

- modularidade;
- segurança;
- multiempresa;
- soft delete;
- permissões;
- eventos controlados;
- baixo acoplamento;
- implementação incremental;
- integração progressiva por fluxo real.
