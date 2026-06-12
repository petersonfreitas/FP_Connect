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
- vinculo usuario x empresa;
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

Pendencias de fundacao antes dos modulos operacionais:

- guards/policies completos por usuario, empresa, permissao e modulo;
- bloqueio efetivo por modulo contratado nas rotas sensiveis;
- soft delete/inativacao exposto na UI quando autorizado;
- smoke test manual dos fluxos principais.

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

Itens:

- guards/policies nas rotas sensiveis;
- resolucao de empresa/contexto ativo;
- revisao de bloqueios por empresa, permissao e modulo contratado;
- smoke test de empresas, usuarios, permissoes, modulos e auditoria.

### Bloco B - Shell dos modulos prioritarios

Objetivo: criar estrutura visual e de navegacao para os modulos.

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

1. **FP Billing**
   - planos;
   - modulos contratados;
   - cobrancas;
   - pagamentos;
   - inadimplencia;
   - suspensao/reativacao.

2. **FP Tickets**
   - suporte;
   - implantacao/onboarding;
   - chamados;
   - vinculo com empresa, cliente e modulo.

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

5. **FP Monitor**
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
