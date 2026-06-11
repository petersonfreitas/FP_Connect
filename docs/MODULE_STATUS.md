# MODULE_STATUS.md — Status dos Módulos FP WebTech

Este arquivo controla o avanço dos módulos do ecossistema.

## Níveis de maturidade

| Nível | Nome | Significado |
|---|---|---|
| 0 | Não iniciado | Módulo ainda não possui base validada. |
| 1 | Shell criado | Rotas, menu, layout e proteção básica existem. |
| 2 | Base funcional | Entidades, APIs e telas mínimas existem. |
| 3 | Integração necessária | Módulo chegou até a função necessária para outro fluxo. |
| 4 | MVP do módulo | Escopo MVP do backlog foi concluído e validado. |

---

## Status geral

| Módulo | Prioridade atual | Nível | Status | Observação |
|---|---:|---:|---|---|
| FP Connect Admin Console | Alta | 0 | A confirmar no repositório | Base obrigatória do ecossistema. |
| FP Robots | Alta | 0 | A confirmar no repositório | Necessário para eventos e automações. |
| FP Food | Alta | 0 | A confirmar no repositório | Primeiro produto operacional. |
| FP Tracking | Alta | 0 | A confirmar no repositório | Complemento operacional do Food. |
| FP Billing | Futura | 0 | Aguardando fase posterior | Entrará após base operacional. |
| FP Tickets | Futura | 0 | Aguardando fase posterior | Entrará após base operacional. |
| FP Sales | Futura | 0 | Aguardando fase posterior | Entrará após base operacional. |
| FP Marketing | Futura | 0 | Aguardando fase posterior | Entrará após base operacional. |
| FP Monitor | Plataforma/Futura | 0 | Deferido | Módulo de observabilidade de APIs, serviços, integrações e incidentes; pode antecipar se houver necessidade operacional. |

---

## Checklist — FP Connect Admin Console

- [ ] Empresas
- [ ] Usuários
- [ ] Vínculo usuário/empresa
- [ ] Perfis/permissões
- [ ] Catálogo de módulos
- [ ] Módulos contratados por empresa
- [ ] Bloqueio por empresa/módulo
- [ ] Layout administrativo base
- [ ] Auditoria básica
- [ ] Soft delete

---

## Checklist — FP Robots

- [ ] Estrutura do módulo
- [ ] Registro de eventos
- [ ] Outbox/event log
- [ ] Payload
- [ ] Status do processamento
- [ ] Logs de erro
- [ ] Listagem de eventos
- [ ] Detalhe de evento
- [ ] Reprocessamento básico
- [ ] Integração inicial com Food/Tracking

---

## Checklist — FP Food

- [ ] Configuração da loja
- [ ] Categorias
- [ ] Produtos
- [ ] Cardápio
- [ ] Vitrine pública
- [ ] Criação de pedido
- [ ] Painel de pedidos
- [ ] Status do pedido
- [ ] Pagamento manual, se previsto
- [ ] Eventos para Robots
- [ ] Integração com Tracking

---

## Checklist — FP Tracking

- [ ] Estrutura do módulo
- [ ] Entregadores
- [ ] Veículos, se previsto
- [ ] Entregas
- [ ] Status da entrega
- [ ] Vínculo com pedido de origem
- [ ] Criação de entrega a partir do Food
- [ ] Tela básica de entregas
- [ ] Tela/PWA inicial do entregador, se previsto
- [ ] Link público de rastreamento
- [ ] Eventos para Robots
- [ ] Retorno de status para Food

---

## Como atualizar

Atualize este arquivo sempre que um módulo mudar de nível.

Formato recomendado:

```text
Módulo:
Nível anterior:
Novo nível:
Data:
Motivo:
Arquivos/migrations principais:
Pendências:
```
