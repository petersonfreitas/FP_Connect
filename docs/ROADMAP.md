# ROADMAP.md - FP WebTech Ecosystem

## 1. Objetivo

Este roadmap orienta a construcao inicial do ecossistema SaaS da FP WebTech com foco em produtividade, seguranca e integracao progressiva entre modulos.

A regra central e:

```text
Backlogs orientam a prioridade.
Fluxos reais orientam a implementacao.
Dependencias autorizam transicao.
Transicao exige base minima coerente.
Implementacao deve ir so ate o ponto necessario.
Depois retorna ao fluxo original.
```

---

## 2. Foco atual

Prioridade atual:

1. fechar a fundacao do **FP Connect Admin Console**;
2. preparar o shell e contratos iniciais do **FP Robots**;
3. iniciar **FP Food** como primeiro produto operacional;
4. iniciar **FP Tracking** como complemento operacional do Food.

Food e Tracking podem nascer com frontends separados, mas sempre usando o mesmo banco Supabase/PostgreSQL, o mesmo Supabase Auth e o controle central do schema `core`.

---

## 3. Estagio atual

O Admin Console esta em **Nivel 2 - Base funcional**.

Ja foram implementados:

- API Nest interna com Supabase server-side;
- consumo server-side pelo Next;
- painel principal com dados reais do `core`;
- empresas: cadastro, listagem, detalhe e edicao;
- empresas: contato, celular, documentos e endereco estruturado normalizados;
- usuarios: cadastro, listagem e edicao;
- usuarios: papel de plataforma (`company_user`, `support`, `fp_admin`, `super_admin`) exposto no CRUD central;
- vinculo usuario x empresa;
- usuarios da empresa podem ser cadastrados diretamente pelo detalhe da empresa;
- papeis/permissoes por usuario, empresa e modulo;
- concessao/revogacao de papeis em lote por usuario;
- catalogo de planos e modulos;
- modulos contratados por empresa;
- acao em lote para modulos contratados por empresa;
- auditoria administrativa com categoria propria;
- menu administrativo em `Cadastro`, `Movimentacao` e `Auditoria`;
- login/logout server-side com Supabase Auth e cookies HttpOnly;
- recuperacao de senha por e-mail;
- refresh de sessao por refresh token HttpOnly no proxy do Next;
- seed inicial de super-admin a partir de Auth manual;
- reset SQL de dados operacionais preservando catalogos nativos;
- propagacao do usuario autenticado para a API interna;
- auditoria com `actor_user_id` real em mutacoes do Admin Console;
- validacoes de formulario alinhadas ao banco em pontos ja implementados;
- regra documentada para API interna, API publica futura e variaveis server-side.
- contrato de performance/seguranca para consultas Supabase;
- indices complementares do `core` para listagens, auditoria e relacoes atuais.
- guard inicial do Admin Console exigindo usuario ativo;
- policies granulares iniciais por permissao em rotas com contexto de empresa.
- convite e reenvio de ativacao de usuarios por e-mail via Supabase Auth.
- policies explicitas em rotas globais, empresas, usuarios, permissoes e modulos do Admin Console.
- bloqueio efetivo por modulo contratado nos endpoints internos de acesso dos produtos operacionais.
- inativacao operacional de empresas e usuarios pela UI administrativa.
- paginacao nas listagens principais de empresas e usuarios.
- bloqueio visual de botoes enquanto formularios e acoes em lote estao processando.

Pendencias de fundacao antes dos modulos operacionais:

- smoke test manual dos fluxos principais, pendente enquanto o acesso ao Supabase estiver instavel.
- refinamento do modelo de acesso do Console conforme `docs/ACCESS_MODEL.md`.

---

## 4. Macrofluxo desejado

```text
Admin Console
-> libera empresa, usuarios, permissoes e modulos contratados
-> Food permite loja/cardapio/pedido
-> Tracking permite entrega/rastreamento
-> Robots registra eventos e prepara automacoes
```

Primeiro fluxo operacional integrado:

```text
Empresa ativa
-> modulo Food contratado
-> loja configurada
-> cliente faz pedido
-> pedido e aceito
-> entrega e criada no Tracking
-> status da entrega evolui
-> eventos sao registrados no Robots
-> cliente acompanha rastreamento publico
```

---

## 5. Proximos blocos recomendados

### Bloco A - Hardening final do Admin Console

Objetivo: transformar a base funcional em fundacao segura para escalar.

Status: praticamente concluido; falta validacao manual integrada.

Itens concluidos:

- guards/policies nas rotas sensiveis;
- resolucao de empresa/contexto ativo;
- revisao de bloqueios por empresa, permissao e modulo contratado;
- paginacao nas listagens principais;
- bloqueio visual de botoes durante processamento.
- contrato inicial do usuario atual para portal contextual;
- menu gerado pelo contrato de acesso.

Item pendente:

- smoke test de empresas, usuarios, permissoes, modulos e auditoria.

### Bloco A.1 - Modelo de acesso e UX permissionada

Objetivo: separar acesso de plataforma, acesso empresarial, permissoes de modulo e carteira operacional de suporte antes de evoluir os produtos operacionais.

Itens:

- criar contrato server-side do usuario atual com escopos permitidos;
- trocar a home global por portal contextual;
- gerar menus conforme permissoes reais;
- separar CRUD de usuarios do Console e usuarios da empresa;
- permitir usuario vinculado a varias empresas;
- vincular superadmin automaticamente como suporte ao cadastrar empresa;
- permitir delegacao de suporte por carteira para admins do Console;
- preparar o modelo para futura referencia no FP Suporte.

Status inicial:

- contrato `GET /api/admin-console/users/me/access` criado;
- home evita `overview` global para usuarios que nao sao superadmin;
- menu lateral usa a navegacao retornada pelo backend.
- CRUD central de usuarios ja permite ajustar papel de plataforma; CRUD separado por contexto ainda deve ser refinado.
- cadastro de usuario da empresa ja nasce no detalhe da empresa, mantendo `/cadastro/usuarios` como gestao central de perfis.

### Bloco B - Shell dos modulos prioritarios

Objetivo: criar estrutura visual e de navegacao para os modulos.

Status: iniciado com o shell V0 do FP Robots.

Modulos:

- Admin Console;
- Robots;
- Food;
- Tracking.

Cada shell deve ter:

- rota;
- menu;
- pagina inicial;
- protecao por login;
- protecao por empresa;
- protecao por modulo contratado;
- estado vazio;
- estrutura inicial de pastas/componentes.

Para o FP Robots, o shell V0 deve nascer preparado para a separacao futura com o FP Gateway: Robots orquestra eventos, regras e execucoes; Gateway, quando definido, encapsula provedores externos e canais como WhatsApp, Instagram, Facebook, Ads e pagamentos.

FP Robots V0 ja possui rota `/robots`, entrada no menu, visao inicial, secoes planejadas, estado vazio e nota visual sobre a fronteira futura com o FP Gateway.

### Bloco C - Robots minimo

Objetivo: preparar o registro de eventos do ecossistema.

Itens:

- schema/tabelas do modulo Robots;
- event log ou outbox;
- evento com `company_id`;
- modulo de origem;
- tipo e id do recurso de origem;
- payload;
- status;
- erro/log basico;
- listagem e detalhe simples.

O Robots minimo deve evitar acoplamento direto com APIs externas especificas. Acoes destinadas a provedores externos devem ser modeladas como comandos padronizados, deixando credenciais, chamadas externas, normalizacao de resposta e detalhes do provedor para o futuro FP Gateway quando ele for detalhado.

### Bloco D - Food ate pedido funcional

Objetivo: criar o primeiro produto operacional.

Itens:

- frontend Food separado quando iniciar;
- configuracao basica da loja;
- categorias;
- produtos;
- cardapio;
- vitrine publica;
- criacao de pedido;
- painel de pedidos;
- status do pedido;
- eventos necessarios para Robots.

### Bloco E - Tracking ate entrega funcional

Objetivo: criar a base minima para atender o fluxo de entrega do Food.

Itens:

- frontend Tracking separado quando iniciar;
- entregadores;
- veiculos, se previsto;
- entregas;
- status de entrega;
- vinculo com pedido de origem;
- criacao de entrega a partir de pedido;
- tela basica de entregas;
- tela/PWA inicial do entregador, se previsto;
- link publico de rastreamento;
- eventos necessarios para Robots.

### Bloco F - Integracao Food -> Tracking -> Robots

Objetivo: validar o primeiro fluxo integrado do ecossistema.

```text
Pedido criado no Food
-> evento registrado no Robots
-> pedido aceito no Food
-> entrega criada no Tracking
-> evento registrado no Robots
-> entregador altera status
-> Tracking atualiza entrega
-> Food consulta/enxerga status da entrega
-> cliente acompanha link publico
```

---

## 6. Modulos futuros

Depois da base Admin Console + Robots + Food + Tracking, integrar progressivamente:

### Fase 2 - Integracoes e expansao operacional

1. **FP Gateway**
   - integracoes externas;
   - credenciais e OAuth por empresa;
   - Mercado Pago e futuros provedores de pagamento;
   - WhatsApp e Meta;
   - execucao de chamadas externas solicitadas por automacoes do FP Robots;
   - normalizacao de respostas e status operacionais.

2. **FP Fiscal**
   - configuracao fiscal por empresa;
   - emissao, controle e historico fiscal;
   - foco inicial na evolucao fiscal do FP Food;
   - integracao futura com provedores fiscais quando aprovado.

3. **FP Sales**
   - clientes;
   - oportunidades;
   - propostas;
   - visao 360.

4. **FP Marketing**
   - campanhas;
   - leads;
   - qualificacao;
   - conversao para Sales.

5. **FP Tickets**
   - suporte;
   - implantacao/onboarding;
   - chamados;
   - vinculo com empresa, cliente e modulo.

6. **FP Billing**
   - planos;
   - modulos contratados;
   - cobrancas;
   - pagamentos;
   - inadimplencia;
   - suspensao/reativacao.

### Fase 3 - Formalizacao, analise e evolucao logistica

7. **FP Sign**
   - aceite simples de propostas;
   - contratos simples;
   - arquivamento documental;
   - evidencias basicas de aceite;
   - sem assinatura digital avancada no MVP.

8. **FP BI**
   - indicadores;
   - dashboards;
   - relatorios;
   - leitura analitica cross-module quando houver dados suficientes.

9. **FP Router**
   - planejamento de rotas;
   - roteirizacao inteligente;
   - aprovacao humana de planos;
   - apoio logistico/fiscal;
   - complemento futuro do FP Tracking;
   - absorve o antigo conceito EixoGuard.

10. **FP Monitor**
   - disponibilidade de APIs internas;
   - latencia e falhas por modulo;
   - checks de saude e incidentes;
   - observabilidade de integracoes externas quando existirem;
   - visual inicial dentro do Admin Console.

O FP Monitor fica planejado para o final do projeto. Pode ser antecipado apenas se a operacao exigir visibilidade de saude das APIs antes da conclusao dos modulos principais.

---

## 7. Funcionalidades sensiveis

Gateway de pagamento, nota fiscal, integracoes externas, BI avancado e recursos complexos nao sao proibidos.

Devem ser implementados no momento adequado, quando estiverem no backlog da etapa atual ou quando houver autorizacao explicita.

O FP Gateway deve ser priorizado antes de integracoes automaticas de pagamento, WhatsApp e Meta. LinkedIn e gov.br ficam fora do escopo inicial.

O FP Router fica em baixa prioridade e absorve o antigo EixoGuard. Sua implementacao deve ocorrer apenas apos maturidade minima do FP Tracking e necessidade real de roteirizacao inteligente.

O site institucional da FPWebTech sera tratado como projeto isolado e nao entra no roadmap operacional dos modulos SaaS.
