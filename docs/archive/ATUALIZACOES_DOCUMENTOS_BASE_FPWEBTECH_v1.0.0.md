# Plano de Atualização — Documentos-base FPWebTech

**Projeto:** Ecossistema FPWebTech  
**Versão:** v1.0.0  
**Data:** 2026-06-15  
**Status:** Plano de atualização documental  

---

# 1. Objetivo

Este documento orienta as alterações necessárias nos documentos-base do ecossistema FPWebTech após a criação dos novos backlogs pendentes:

```text
FP Gateway
FP Fiscal
FP Router
FP Sign
FP BI
```

---

# 2. Decisões que devem entrar em DECISIONS.md

Adicionar novas decisões:

| Código sugerido | Decisão | Status |
|---|---|---|
| DEC-045 | O site institucional FPWebTech será tratado como projeto isolado, fora do escopo operacional dos módulos SaaS do ecossistema. | Aprovada |
| DEC-046 | Portal / Área do Cliente será desconsiderado por enquanto, sem backlog próprio nesta fase. | Aprovada |
| DEC-047 | EixoGuard deixa de existir como módulo independente e será absorvido pelo futuro FP Router. | Aprovada |
| DEC-048 | FP Gateway será o módulo oficial para integrações externas, credenciais, OAuth, pagamentos, Mercado Pago, futuros provedores de pagamento, WhatsApp e Meta. | Aprovada |
| DEC-049 | LinkedIn e gov.br ficam fora do escopo inicial do FP Gateway. | Aprovada |
| DEC-050 | FP Fiscal será módulo próprio, com prioridade funcional voltada inicialmente ao FP Food. | Aprovada |
| DEC-051 | FP Router será baixa prioridade e atuará como complemento futuro do FP Tracking, com roteirização inteligente e apoio logístico/fiscal. | Aprovada |
| DEC-052 | FP Sign será módulo futuro para aceite de propostas, contratos simples e arquivamento documental, sem assinatura digital avançada no MVP. | Aprovada |
| DEC-053 | FP BI será módulo futuro de indicadores e dashboards, devendo começar simples e evoluir após maturidade dos módulos transacionais. | Aprovada |

---

# 3. Atualizações em ARCHITECTURE.md

## 3.1 Remover ou ajustar referências antigas

Substituir:

```text
EixoGuard
```

Por:

```text
FP Router
```

Quando a referência tratar de fiscalização/logística/viagem, usar:

```text
Recursos logísticos/fiscais futuros do FP Router
```

---

## 3.2 Padronizar FP Gateway

Substituir descrições antigas do Gateway por:

```text
O FP Gateway é o módulo responsável por centralizar integrações externas do ecossistema FPWebTech, incluindo credenciais, OAuth, pagamentos via Mercado Pago, futuros provedores de pagamento, WhatsApp e Meta.
```

Remover do escopo inicial do FP Gateway:

```text
LinkedIn
gov.br
```

---

## 3.3 Separação FP Gateway x FP Robots

Adicionar ou reforçar:

```text
O FP Robots decide quando uma ação deve acontecer, com base em eventos, regras e automações.
O FP Gateway executa a comunicação com provedores externos e normaliza as respostas.
```

Exemplo:

```text
FP Robots recebe evento food.order.confirmed.
FP Robots decide enviar mensagem.
FP Robots solicita envio ao FP Gateway.
FP Gateway executa envio no provedor externo.
FP Gateway devolve status.
```

---

## 3.4 Inserir FP Fiscal

Adicionar seção curta:

```text
O FP Fiscal será responsável por configuração fiscal, emissão, controle e histórico de documentos fiscais do ecossistema. Seu primeiro foco será a evolução fiscal do FP Food, mantendo o FP Food como dono do pedido e o FP Fiscal como dono da emissão e controle fiscal.
```

---

## 3.5 Inserir FP Router

Adicionar seção curta:

```text
O FP Router será um módulo futuro de baixa prioridade, complementar ao FP Tracking. Ele será responsável por planejamento de rotas, roteirização inteligente, aprovação humana de planos e apoio logístico/fiscal. O antigo conceito EixoGuard será absorvido por este módulo.
```

---

## 3.6 Inserir FP Sign

Adicionar seção curta:

```text
O FP Sign será responsável por aceite simples, contratos, propostas e arquivamento documental. No MVP, não deve ser tratado como assinatura digital juridicamente forte.
```

---

## 3.7 Inserir FP BI

Adicionar seção curta:

```text
O FP BI será responsável por indicadores, dashboards e relatórios do ecossistema. Inicialmente, os módulos podem possuir dashboards internos; o FP BI central deve evoluir quando houver necessidade de análise cruzada.
```

---

# 4. Atualizações em ROADMAP.md

## 4.1 Ajustar ordem dos módulos pendentes

Sugestão de roadmap atualizado:

```text
Fase 1 — Base e operação inicial
1. FP Connect Admin Console
2. FP Robots
3. FP Food
4. FP Tracking

Fase 2 — Integrações e expansão operacional
5. FP Gateway
6. FP Fiscal, com foco no FP Food
7. FP Sales
8. FP Marketing
9. FP Tickets
10. FP Billing

Fase 3 — Formalização, análise e evolução logística
11. FP Sign
12. FP BI
13. FP Router
```

## 4.2 Observação sobre Router

Adicionar:

```text
FP Router fica em baixa prioridade e absorve o antigo EixoGuard. Sua implementação deve ocorrer apenas após maturidade mínima do FP Tracking e necessidade real de roteirização inteligente.
```

## 4.3 Observação sobre Site Institucional

Adicionar:

```text
O site institucional da FPWebTech será tratado como projeto isolado e não entra no roadmap operacional dos módulos SaaS.
```

---

# 5. Atualizações em MODULE_STATUS.md

Adicionar ou ajustar linhas:

| Módulo | Prioridade | Nível sugerido | Status | Observação |
|---|---:|---:|---|---|
| FP Gateway | Alta | 0 | Backlog criado | Integrações externas, credenciais, OAuth, pagamentos, Mercado Pago, WhatsApp e Meta. |
| FP Fiscal | Alta/Média | 0 | Backlog criado | Foco inicial na evolução fiscal do FP Food. |
| FP Sign | Média | 0 | Backlog criado | Aceite simples, contratos e arquivamento documental. |
| FP BI | Média/Baixa | 0 | Backlog criado | Indicadores e dashboards; evoluir após maturidade dos módulos. |
| FP Router | Baixa | 0 | Backlog criado | Absorve EixoGuard; complemento futuro do FP Tracking. |

Remover linha independente de:

```text
EixoGuard
```

Ou alterar observação para:

```text
EixoGuard absorvido pelo FP Router.
```

---

# 6. Atualizações nos backlogs existentes

## 6.1 FP Food

Atualizar referências:

| Antes | Depois |
|---|---|
| Gateway de pagamento futuro | FP Gateway |
| Módulo Fiscal Futuro | FP Fiscal |
| Roteirizador | FP Router |

Adicionar relação oficial:

```text
FP Food pode solicitar pagamentos online ao FP Gateway em fase futura.
FP Food pode solicitar emissão fiscal ao FP Fiscal em fase futura.
FP Food pode enviar entregas para FP Tracking e, futuramente, se beneficiar de planos do FP Router.
```

---

## 6.2 FP Robots

Atualizar fronteira:

```text
FP Robots não deve armazenar credenciais externas permanentes quando o FP Gateway existir.
FP Robots orquestra eventos e ações.
FP Gateway executa chamadas externas.
```

Substituir referências a EixoGuard por FP Router.

---

## 6.3 FP Tracking

Adicionar:

```text
FP Tracking é dono da execução e rastreamento.
FP Router será dono do planejamento de rotas no futuro.
```

---

## 6.4 FP Billing

Adicionar:

```text
FP Billing poderá usar FP Gateway para cobranças automáticas futuras.
FP Billing poderá usar FP Sign para formalização de contrato simples.
FP Billing poderá usar FP Fiscal em fase futura para emissão fiscal da mensalidade SaaS.
```

---

## 6.5 FP Sales

Adicionar:

```text
FP Sales poderá usar FP Sign para aceite de proposta e arquivamento de evidências.
```

---

# 7. Ordem de aplicação recomendada

```text
1. Atualizar DECISIONS.md
2. Atualizar ARCHITECTURE.md
3. Atualizar ROADMAP.md
4. Atualizar MODULE_STATUS.md
5. Adicionar 09.backlog_funcional_fp_gateway_v1.0.0.md
6. Adicionar 10.backlog_funcional_fp_fiscal_v1.0.0.md
7. Adicionar 11.backlog_funcional_fp_router_v1.0.0.md
8. Adicionar 12.backlog_funcional_fp_sign_v1.0.0.md
9. Adicionar 13.backlog_funcional_fp_bi_v1.0.0.md
10. Revisar referências antigas nos backlogs existentes
```

---

# 8. Checklist final

```text
[ ] Site institucional marcado como projeto isolado
[ ] Portal / Área do Cliente removido/desconsiderado por enquanto
[ ] EixoGuard absorvido pelo FP Router
[ ] FP Gateway sem LinkedIn e sem gov.br no escopo inicial
[ ] FP Gateway com Mercado Pago, futuros pagamentos, WhatsApp e Meta
[ ] FP Fiscal vinculado inicialmente ao FP Food
[ ] FP Router classificado como baixa prioridade
[ ] FP Sign formalizado como aceite simples
[ ] FP BI formalizado como camada analítica futura
[ ] Backlogs existentes sem nomenclatura antiga conflitante
```

---

# 9. Conclusão

Com essas atualizações, o ecossistema FPWebTech passa a ter uma arquitetura documental mais coerente:

```text
FP Gateway centraliza integrações externas.
FP Fiscal centraliza regras fiscais.
FP Router absorve EixoGuard e complementa Tracking.
FP Sign formaliza aceite e documentos.
FP BI consolida indicadores.
```

A execução deve começar pelo FP Gateway, pois ele reduz acoplamento e prepara o ecossistema para pagamentos, WhatsApp e Meta.
