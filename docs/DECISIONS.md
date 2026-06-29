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
| DEC-036 | O primeiro super-admin deve nascer de um usuario criado manualmente no Supabase Auth e ser promovido no `core.profiles` por seed SQL idempotente. | Aprovada |
| DEC-037 | Resets operacionais devem preservar catalogos nativos do sistema, como modulos, planos, roles, permissions e vinculos role-permission. | Aprovada |
| DEC-038 | Otimizacoes de consulta devem preservar seguranca acima de performance, mantendo autorizacao no backend/banco, escopo por empresa, soft delete, `select` explicito, paginacao em listagens novas e indices alinhados a queries reais. | Aprovada |
| DEC-039 | Convites de usuarios do Admin Console devem ser enviados server-side pelo Nest com Supabase Auth `inviteUserByEmail`, usando `FP_WEB_URL` para redirecionar a `/login/atualizar-senha`; ao definir senha, o servidor ativa perfil e vinculos pendentes no `core`; reenvio so e permitido para usuarios pendentes. | Aprovada |
| DEC-040 | Rotas do Admin Console devem declarar policy explicitamente: rotas globais como `super-admin only` e rotas por empresa com permissao granular e contexto de empresa. | Aprovada |
| DEC-041 | Endpoints internos dos produtos operacionais devem usar guard comum de modulo, validando usuario ativo, empresa ativa, modulo contratado ativo e permissao; `super_admin` nao ignora modulo contratado. | Aprovada |
| DEC-042 | Listagens administrativas principais podem usar paginacao `page`/`pageSize` com totalizador; cursor/keyset fica reservado para listagens de alto volume ou ordenacao temporal sensivel. | Aprovada |
| DEC-043 | Formularios e acoes em lote devem bloquear novo submit enquanto processam, usando feedback visual simples no botao; modal/overlay fica reservado para operacoes longas ou criticas. | Aprovada |
| DEC-044 | FP Robots deve orquestrar eventos, regras e execucoes; o futuro FP Gateway deve encapsular provedores externos como WhatsApp, Instagram, Facebook, Ads, Mercado Pago, PagSeguro e canais equivalentes. | Aprovada |
| DEC-045 | O acesso do usuario deve separar identidade, acesso de plataforma, vinculos empresariais, permissoes de modulo e carteira operacional de suporte; usuarios podem atuar em varias empresas e operadores do Console podem ser vinculados como suporte com poder administrativo auditavel na empresa atendida. | Aprovada |
| DEC-046 | O site institucional FPWebTech sera tratado como projeto isolado, fora do escopo operacional dos modulos SaaS do ecossistema. | Aprovada |
| DEC-047 | Portal ou Area do Cliente externo sera desconsiderado por enquanto, sem backlog proprio nesta fase; o Portal atual do FP Console continua como entrada autenticada do ecossistema. | Aprovada |
| DEC-048 | EixoGuard deixa de existir como modulo independente e sera absorvido pelo futuro FP Router. | Aprovada |
| DEC-049 | FP Gateway sera o modulo oficial para integracoes externas, credenciais, OAuth, pagamentos, Mercado Pago, futuros provedores de pagamento, WhatsApp e Meta. | Aprovada |
| DEC-050 | LinkedIn e gov.br ficam fora do escopo inicial do FP Gateway. | Aprovada |
| DEC-051 | FP Fiscal sera modulo proprio, com prioridade funcional voltada inicialmente ao FP Food. | Aprovada |
| DEC-052 | FP Router sera baixa prioridade e atuara como complemento futuro do FP Tracking, com roteirizacao inteligente e apoio logistico/fiscal. | Aprovada |
| DEC-053 | FP Sign sera modulo futuro para aceite de propostas, contratos simples e arquivamento documental, sem assinatura digital avancada no MVP. | Aprovada |
| DEC-054 | FP BI sera modulo futuro de indicadores e dashboards, com inicio simples e evolucao apos maturidade dos modulos transacionais. | Aprovada |
| DEC-055 | Papeis do Console ficam separados entre `super_admin`, `fp_admin`, `support` e `company_user`; usuarios internos possuem CRUD proprio, usuarios de empresa sao administrados no contexto da empresa, e `fp_admin` pode convidar/vincular apenas `support` no modelo inicial. | Aprovada |
| DEC-056 | Menus e links devem apontar diretamente para a tela final; paginas usadas apenas como redirecionamento devem ser removidas em limpeza futura. | Aprovada |
| DEC-057 | Eventos novos do FP Food devem usar namespace `food.*`; referencias antigas `menu.*` em backlogs ficam como legado documental ate revisao futura e nao devem guiar codigo novo. | Aprovada |
| DEC-058 | Modulo contratado em `implementation` ou `active` pode ser acessado operacionalmente por usuarios com permissao; `suspended` e `cancelled` continuam bloqueados. | Aprovada |
| DEC-059 | Schemas de modulo consultados pela API Nest via Supabase/PostgREST devem ser expostos na configuracao de API do Supabase; isso nao substitui guards, RLS, policies e service role server-side. | Aprovada |
| DEC-060 | FP Robots pode usar acao `internal_log` como primeira automacao interna, mantendo a cadeia evento, regra e execucao independente de SMTP, webhook, Food, Tracking ou Gateway reais. | Aprovada |
| DEC-061 | Reprocessamento V0 do FP Robots fica limitado a execucoes falhadas de `internal_log`; conectores reais devem implementar retry/reprocessamento especifico quando SMTP, webhook ou Gateway entrarem. | Aprovada |
| DEC-062 | FP Food nasce como frontend separado em `apps/food`, consumindo a API interna central `apps/api`, o Supabase Auth unico, o banco unico e o controle de acesso do `core`. | Aprovada |
| DEC-063 | Alteracoes operacionais relevantes do FP Food devem publicar eventos `food.*` no FP Robots; a primeira integracao oficial e `food.store.configured`. | Aprovada |
| DEC-064 | O cardapio operacional do FP Food deriva de categorias ativas e produtos disponiveis; a vitrine publica sera uma camada posterior sobre o mesmo catalogo. | Aprovada |
| DEC-065 | Pedido interno V0 do FP Food serve para validar fluxo transacional antes da vitrine publica; cria pedidos manualmente, altera status simples e publica eventos no FP Robots. | Aprovada |
| DEC-066 | A vitrine publica V0 do FP Food deve ser servida pelo frontend Food em `/l/[slug]`, consumindo API interna protegida por token servidor-servidor; pedidos publicos nao exigem usuario autenticado e continuam recalculando precos no backend antes da gravacao. | Aprovada |
| DEC-067 | O acompanhamento publico V0 do pedido Food usa rota `/l/[slug]/pedido/[orderNumber]`, expondo apenas o status simples e os itens do pedido; token dedicado de rastreio fica para a fase Tracking/checkout avancado. | Aprovada |
| DEC-068 | O painel interno de pedidos do FP Food usa polling leve de 30 segundos no MVP; realtime fica reservado para fase posterior, quando houver token publico de pedido, RLS/policies e volume real para justificar. | Aprovada |
| DEC-069 | A Cozinha V0 do FP Food deve reutilizar os pedidos e status existentes, sem nova tabela; a tela operacional filtra pedidos `accepted` e `preparing`, usando polling de 30 segundos e acoes rapidas de preparo. | Aprovada |
| DEC-070 | Atualizacoes em tempo real do FP Food ficam previstas para fase posterior; no MVP, telas operacionais podem usar refresh manual, `router.refresh()` e polling leve apenas como solucao provisoria de validacao. | Aprovada |
| DEC-071 | A Entrega simples V0 do FP Food reutiliza o status do pedido, sem tabela propria de tracking; a tela operacional filtra pedidos `ready` e `out_for_delivery`, permitindo marcar `out_for_delivery` e `delivered`. FP Tracking permanece dono futuro de entregador, rota, ocorrencias e rastreamento publico dedicado. | Aprovada |
| DEC-072 | O historico simples de status do pedido pertence ao FP Food em `food.order_status_history`, para auditoria operacional do pedido; FP Robots permanece como log/event bus de automacoes e nao substitui a timeline de negocio do pedido. | Aprovada |
| DEC-073 | Pagamento manual V0 do FP Food registra status, forma, observacao, usuario e data no proprio pedido; pagamentos online, conciliacao, webhooks e credenciais externas permanecem responsabilidade futura do FP Gateway. | Aprovada |
| DEC-074 | Dashboard operacional V0 do FP Food pode existir dentro do proprio modulo com indicadores simples de pedidos, pagamentos e filas; FP BI permanece futuro para analises consolidadas e cruzadas entre modulos. | Aprovada |
| DEC-075 | O proximo ciclo deve priorizar FP Gateway real/teste e FP Tracking, deixando configuracoes avancadas do FP Food serem modeladas conforme os contratos reais de pagamento, mensagens e entrega nascerem nesses modulos. | Aprovada |
| DEC-076 | FP Gateway nasce primeiro como shell operacional no FP Console, com acesso protegido por modulo contratado e permissao; frontend separado so sera avaliado quando volume, operacao ou isolamento justificarem. | Aprovada |
| DEC-077 | SMTP entra como primeiro provedor configuravel do FP Gateway para validar catalogo, credenciais server-side, teste de conexao e evento `gateway.smtp.validated`; envio transacional completo fica para integracao posterior com FP Robots. | Aprovada |
| DEC-078 | FP Gateway pode enviar e-mail SMTP de teste pela propria tela do modulo para validar credenciais ponta a ponta; disparos transacionais automatizados devem ser solicitados posteriormente pelo FP Robots via acao `gateway_external_action`. | Aprovada |
| DEC-079 | Timeouts SMTP em provedores/rede ficam como pendencia operacional; o FP Gateway deve seguir evoluindo por contratos internos e provedores via HTTPS quando possivel, sem travar o MVP em portas SMTP. | Aprovada |
| DEC-080 | O primeiro contrato de pagamento do FP Gateway sera uma solicitacao interna idempotente por empresa, com origem, referencia, valor, provedor pretendido e eventos `gateway.payment.*`; a chamada real ao Mercado Pago entra depois sobre o mesmo contrato. | Aprovada |
| DEC-081 | Mercado Pago deve ser conectado por OAuth por empresa: o cliente autoriza a integracao, o FP Gateway troca o `code` por tokens server-side e os modulos consumidores nunca recebem credenciais do provedor. | Aprovada |
| DEC-082 | Enquanto OAuth/webhook exigirem URL publica, o FP Gateway pode oferecer modo sandbox manual por empresa com Access Token de teste server-side para validar pagamentos PIX via Checkout Transparente em localhost. | Aprovada |
| DEC-083 | PIX Mercado Pago no FP Gateway deve seguir Checkout Transparente via Orders API (`POST /v1/orders`), guardando o ID `ORD...`, `ticket_url`, QR Code e payload completo em `gateway.payment_requests` para conciliacao e futuras notificacoes. | Aprovada |
| DEC-084 | No modo sandbox manual Mercado Pago, o FP Gateway pode enviar `payer.first_name = APRO` no payload da order PIX para seguir o roteiro oficial de teste e obter status `action_required/waiting_transfer`. | Aprovada |
| DEC-085 | A correlacao FP Gateway -> Mercado Pago Orders deve usar `external_reference` com o ID da `gateway.payment_requests`; campos internos customizados nao devem ser enviados em `additional_info`, pois a Orders API rejeita propriedades nao suportadas. | Aprovada |
| DEC-086 | No sandbox manual Mercado Pago, o FP Gateway deve validar e-mail de pagador com dominio `@testuser.com` antes da chamada externa, evitando falha `invalid_email_for_sandbox`. | Aprovada |
| DEC-087 | Ao criar uma order Mercado Pago, o FP Gateway deve normalizar o status retornado imediatamente; se a order ja nascer paga no sandbox, grava `paid` e emite `gateway.payment.requested` seguido de `gateway.payment.paid`. | Aprovada |
| DEC-088 | Cartoes de credito/debito Mercado Pago no FP Gateway devem usar Checkout Transparente via Orders API com token gerado por MercadoPago.js/Card Payment Brick; o FP Console e a API nao devem coletar nem armazenar numero, validade ou CVV do cartao. | Aprovada |
| DEC-089 | O cadastro/entrada de dados de cartao do comprador deve acontecer no checkout do produto consumidor, inicialmente FP Food, usando Card Payment Brick como caminho preferencial; FP Gateway recebe apenas token e metadados para criar a order e normalizar status. | Aprovada |
| DEC-090 | SMTP por socket permanece como capacidade V0/laboratorio do FP Gateway; para producao, o caminho preferencial de e-mail transacional sera provedor por API HTTPS no Gateway, reduzindo dependencia de portas SMTP bloqueadas ou instaveis em PaaS/serverless. | Aprovada |
| DEC-091 | A evolucao imediata passa a tratar Food, Gateway, Robots e Console com mentalidade de entrega para producao: melhorar UX, regras, validacoes, observabilidade e processos reais antes de iniciar FP Tracking como modulo operacional completo. | Aprovada |
| DEC-092 | FP Tracking entra somente depois que os fluxos base de pedido, pagamento, eventos, permissoes e operacao estiverem suficientemente estabilizados; ate la, a entrega simples do Food segue como fallback operacional do MVP. | Aprovada |
| DEC-093 | Modulos com areas internas devem usar navegacao superior em cards (`module-subnav`) como padrao visual, seguindo FP Robots/Gateway: um card por area, descricao curta e destaque no item ativo. | Aprovada |
| DEC-094 | A vitrine publica do FP Food deve nascer preparada para dominio proprio por loja como rota principal futura (`lojaA.com.br`), mantendo `/l/[slug]` como fallback tecnico; rotas e links publicos devem evoluir para usar resolucao de loja por `host + path`, sem acoplar componentes permanentemente ao prefixo `/l`. | Aprovada |
| DEC-095 | DEC-091 e DEC-092 prevalecem sobre DEC-004 e DEC-075 para a fase atual: Console, Food, Gateway e Robots devem ser estabilizados para operacao antes de iniciar FP Tracking completo. | Aprovada |
| DEC-096 | A vitrine publica do FP Food permite navegacao anonima, mas criacao de pedido, checkout e retentativa de pagamento exigem usuario autenticado, cadastro de consumidor completo e vinculo server-side do pedido ao consumidor/loja. | Aprovada |
| DEC-097 | O ecossistema mantem Supabase Auth unico nesta fase, com senha global por identidade, mas as sessoes e jornadas devem ser isoladas entre Console/Food operacional e vitrine publica; na vitrine, a sessao do consumidor deve ser contextual por loja. CPF entra como dado previsto do cadastro Food, sem obrigar unicidade ou deduplicacao nesta fase. | Aprovada |
| DEC-098 | O consumidor do FP Food pode manter multiplos enderecos por loja/empresa, escolhendo um como padrao; no checkout de entrega, o usuario deve poder escolher o endereco de destino e o pedido deve guardar uma fotografia historica do endereco usado. A revalidacao atual do carrinho cobre itens/precos/disponibilidade basica, mas a validacao de estoque fica pendente ate a implementacao do estoque direto/reserva. | Aprovada |
| DEC-099 | Logins operacionais devem validar o contrato de acesso imediatamente apos o Supabase Auth aceitar as credenciais; usuarios sem acesso interno ao portal devem ter a sessao descartada e continuar usando somente a vitrine publica contextual da loja. | Aprovada |
| DEC-100 | Imagens publicas de produtos do FP Food ficam em bucket Supabase Storage publico para leitura, mas uploads devem passar pelo backend interno validado por empresa, modulo e permissao; JPG, PNG e WEBP de entrada sao convertidos para WEBP otimizado antes do storage, o limite funcional do arquivo original e 3 MB e os limites tecnicos de Server Action/API devem acomodar o overhead do upload. O produto guarda apenas a URL publica em `food.products.image_url`. | Aprovada |

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
