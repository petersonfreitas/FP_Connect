# ROADMAP.md — FP WebTech Ecosystem

## 1. Objetivo

Este roadmap orienta a construção inicial do ecossistema SaaS da FP WebTech com foco em produtividade, segurança e integração progressiva entre módulos.

A regra central é:

```text
Backlogs orientam a prioridade.
Fluxos reais orientam a implementação.
Dependências autorizam transição.
Transição exige base mínima coerente.
Implementação deve ir só até o ponto necessário.
Depois retorna ao fluxo original.
```

---

## 2. Foco atual

Nesta fase, priorizar os módulos:

1. **FP Connect Admin Console**
2. **FP Robots**
3. **FP Food**
4. **FP Tracking**

Os demais módulos entram depois, integrando com a base criada.

---

## 3. Macrofluxo inicial desejado

```text
Admin Console
→ libera empresa, usuários, permissões e módulos contratados
→ Food permite loja/cardápio/pedido
→ Tracking permite entrega/rastreamento
→ Robots registra eventos e prepara automações
```

Primeiro fluxo operacional integrado:

```text
Empresa ativa
→ módulo Food contratado
→ loja configurada
→ cliente faz pedido
→ pedido é aceito
→ entrega é criada no Tracking
→ status da entrega evolui
→ eventos são registrados no Robots
→ cliente acompanha rastreamento público
```

---

## 4. Etapas recomendadas

### Etapa 1 — Base comum/Admin Console mínimo

Objetivo: criar a base que todos os módulos usarão.

Itens principais:

- empresas;
- usuários;
- vínculo usuário/empresa;
- permissões;
- sistemas/módulos disponíveis;
- módulos contratados por empresa;
- bloqueio por empresa/módulo;
- layout administrativo base;
- soft delete;
- auditoria básica.

---

### Etapa 2 — Shell dos módulos prioritários

Objetivo: criar a estrutura visual e de navegação dos módulos prioritários.

Módulos:

- Admin Console;
- Robots;
- Food;
- Tracking.

Cada shell deve ter:

- rota;
- menu;
- página inicial;
- proteção por login;
- proteção por empresa;
- proteção por módulo contratado;
- estado vazio;
- estrutura inicial de pastas/componentes.

---

### Etapa 3 — Robots mínimo

Objetivo: preparar o registro de eventos do ecossistema.

Itens principais:

- estrutura do módulo Robots;
- tabela/event log ou outbox;
- evento com `company_id`;
- módulo de origem;
- tipo de recurso;
- recurso de origem;
- payload;
- status;
- erro/log básico;
- listagem simples;
- detalhe simples;
- reprocessamento básico, se previsto no backlog.

---

### Etapa 4 — Food até pedido funcional

Objetivo: criar o primeiro produto operacional.

Itens principais:

- configuração básica da loja;
- categorias;
- produtos;
- cardápio;
- vitrine pública;
- criação de pedido;
- painel de pedidos;
- status do pedido;
- pagamento manual, se previsto no backlog;
- eventos necessários para Robots.

---

### Etapa 5 — Tracking até entrega funcional

Objetivo: criar a base mínima coerente para atender o fluxo de entrega do Food.

Itens principais:

- estrutura do módulo Tracking;
- entregadores;
- veículos, se previsto no backlog;
- entregas;
- status de entrega;
- vínculo com pedido de origem;
- criação de entrega a partir de pedido;
- tela básica de entregas;
- tela/PWA inicial do entregador, se previsto no backlog;
- link público de rastreamento;
- eventos necessários para Robots.

---

### Etapa 6 — Integração Food → Tracking → Robots

Objetivo: validar o primeiro fluxo integrado do ecossistema.

Fluxo:

```text
Pedido criado no Food
→ evento registrado no Robots
→ pedido aceito no Food
→ entrega criada no Tracking
→ evento registrado no Robots
→ entregador altera status
→ Tracking atualiza entrega
→ Food consulta/enxerga status da entrega
→ cliente acompanha link público
```

---

### Etapa 7 — Consolidação

Objetivo: estabilizar a base antes de trazer novos módulos.

Validar:

- multiempresa;
- permissões;
- módulos contratados;
- soft delete;
- migrations;
- eventos;
- auditoria;
- telas básicas;
- APIs principais;
- erros e estados vazios;
- build/lint/testes disponíveis.

---

## 5. Módulos futuros

Depois da base Admin Console + Robots + Food + Tracking, integrar progressivamente:

1. **FP Billing**
   - planos;
   - módulos contratados;
   - cobranças;
   - pagamentos;
   - inadimplência;
   - suspensão/reativação.

2. **FP Tickets**
   - suporte;
   - implantação/onboarding;
   - chamados;
   - vínculo com empresa, cliente e módulo.

3. **FP Sales**
   - clientes;
   - oportunidades;
   - propostas;
   - visão 360º.

4. **FP Marketing**
   - campanhas;
   - leads;
   - qualificação;
   - conversão para Sales.

5. **FP Monitor** — módulo de plataforma/deferido
   - disponibilidade de APIs internas;
   - latência e falhas por módulo;
   - checks de saúde e incidentes;
   - observabilidade de integrações externas quando existirem;
   - visual inicial dentro do Admin Console.

O FP Monitor fica planejado para o final do projeto. Pode ser antecipado apenas se a operação exigir visibilidade de saúde das APIs antes da conclusão dos módulos principais.

---

## 6. Funcionalidades sensíveis

Gateway de pagamento, nota fiscal, integrações externas, BI avançado e recursos complexos não são proibidos.

Devem ser implementados no momento adequado, quando estiverem no backlog da etapa atual ou quando houver autorização explícita.
