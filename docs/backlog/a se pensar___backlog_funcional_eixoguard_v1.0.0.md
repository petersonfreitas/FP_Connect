# Backlog Funcional — EixoGuard

**Produto:** EixoGuard  
**Tipo:** Sistema SaaS multiempresa para controle logístico simples de viagens, documentos, pedágios, ocorrências e evidências  
**Empresa/Marca:** FPWebtech / FPMG  
**Versão:** v1.0.0  
**Status:** MVP simplificado aprovado para refinamento funcional e posterior execução  
**Data:** 2026-06-10  
**Escopo:** Regras de negócio, fluxos, papéis, viagens, documentos, status, custos/pedágios manuais, ocorrências, anexos, dashboard básico e critérios de aceite  
**Fora do escopo deste documento:** modelagem Supabase, tabelas, migrations, deploy, stack técnica detalhada, estrutura de código, conciliação avançada, telemetria obrigatória e automações fiscais  

---

## Histórico de versões

| Versão | Data | Status | Descrição |
|---|---:|---|---|
| v1.0.0 | 2026-06-10 | Inicial | Criação do backlog funcional simplificado do EixoGuard, com foco em controle manual/logístico básico e evolução futura. |

---

# 1. Visão Geral

O **EixoGuard** será, neste primeiro momento, um módulo simples para controle logístico de viagens, documentos, pedágios/custos, ocorrências e evidências.

A ideia original do EixoGuard possui potencial para evoluir para um produto mais robusto de controle fiscal-logístico, MDF-e, pedágio, retorno vazio, telemetria e conciliação. Porém, para o MVP inicial do ecossistema FPWebtech, o sistema será modelado de forma enxuta, sem dependência de integrações complexas.

O EixoGuard começa como um controle organizado de viagens e evidências, podendo evoluir depois.

---

# 2. Objetivo do Produto

O objetivo do MVP do EixoGuard é permitir que uma empresa registre e acompanhe viagens de forma simples, mantendo histórico, documentos, status, custos, pedágios, ocorrências e informações operacionais básicas.

O sistema deve ajudar a responder:

```text
Quais viagens estão em andamento?
Quais viagens foram concluídas?
Qual veículo/motorista participou da viagem?
Existe MDF-e ou documento vinculado?
Quais pedágios/custos foram registrados?
Houve alguma ocorrência?
Quais viagens estão com pendências?
Quais documentos/anexos foram enviados?
```

---

# 3. Princípio Central do MVP

```text
O EixoGuard MVP não automatiza a operação.
Ele organiza, registra e evidencia a operação.
```

Regra de produto:

```text
Começar simples.
Registrar bem.
Evoluir depois para conciliação, telemetria e automações.
```

---

# 4. Relação com Outros Sistemas do Ecossistema

## 4.1 FP Tracking

No MVP, a integração com FP Tracking não é obrigatória.

Futuro:

```text
FP Tracking informa início, localização, chegada e conclusão.
EixoGuard usa essas evidências para análise fiscal/logística.
```

No MVP:

```text
Usuário registra a viagem manualmente.
Usuário atualiza status manualmente.
Usuário anexa evidências manualmente.
```

---

## 4.2 FP Router

O FP Router planeja rotas; o EixoGuard não roteiriza.

Futuro:

```text
Uma rota planejada/executada pode gerar uma viagem de controle no EixoGuard.
```

No MVP, não há dependência direta.

---

## 4.3 FP Sales

O FP Sales pode identificar clientes com interesse no EixoGuard.

Futuro:

```text
Cliente ativo no FP Sales pode aparecer como cliente relacionado no EixoGuard.
```

No MVP, esse vínculo pode ser manual ou preparado.

---

## 4.4 FP Tickets

O FP Tickets pode receber chamados relacionados a viagens ou divergências.

Futuro:

```text
Uma ocorrência crítica no EixoGuard pode gerar chamado no FP Tickets.
```

No MVP, a ligação é apenas conceitual.

---

## 4.5 FP Robots

O FP Robots poderá consumir eventos simples do EixoGuard.

Exemplos:

```text
Viagem criada
Viagem iniciada
Viagem concluída
Ocorrência registrada
Documento anexado
Pendência registrada
```

O FP Robots será responsável por notificações, e-mails, webhooks e automações futuras.

---

## 4.6 FP Connect Admin Console

Responsável por:

```text
Empresas
Usuários
Permissões
Sistemas contratados
Status da empresa
Acesso ao EixoGuard
```

O EixoGuard respeita empresa, permissões e status definidos no Admin Console.

---

# 5. O Que o EixoGuard Faz no MVP

O EixoGuard deve cuidar de:

```text
Cadastro manual de viagens
Registro de origem e destino
Registro de veículo
Registro de motorista
Registro de cliente/transportadora, quando aplicável
Registro de MDF-e/chave/documento, quando houver
Anexos de documentos
Controle de status da viagem
Registro manual de pedágios/custos
Registro de ocorrências
Checklist simples da viagem
Pendências operacionais
Histórico da viagem
Dashboard básico
Eventos simples para FP Robots
```

---

# 6. O Que o EixoGuard Não Faz no MVP

| Não deve fazer no MVP | Observação |
|---|---|
| Não roteiriza viagens | FP Router planeja rotas |
| Não rastreia em tempo real | FP Tracking faz rastreamento |
| Não calcula tarifa oficial de pedágio | Futuro |
| Não faz conciliação automática avançada | Futuro |
| Não importa fatura complexa de pedágio | Futuro |
| Não lê PDF automaticamente | Futuro |
| Não integra TMS/ERP/Datapar | Futuro |
| Não encerra MDF-e automaticamente | Futuro |
| Não emite MDF-e | Futuro/fora do escopo |
| Não detecta eixo erguido fisicamente | Futuro/hardware |
| Não contesta cobrança automaticamente | Futuro |
| Não depende de telemetria obrigatória | Futuro |

---

# 7. Papéis do Sistema

## 7.1 Super Admin FPWebtech

Usuário global do ecossistema.

### Pode

```text
Visualizar empresas que usam EixoGuard
Apoiar suporte
Acompanhar uso do módulo
Consultar falhas de integração futura
Configurar recursos globais, quando permitido
```

---

## 7.2 Admin da Empresa

Usuário responsável pela configuração e gestão do EixoGuard dentro da empresa.

### Pode

```text
Cadastrar viagens
Editar viagens
Cadastrar veículos básicos
Cadastrar motoristas básicos
Cadastrar clientes/transportadoras relacionados
Alterar status da viagem
Registrar pedágios/custos
Registrar ocorrências
Adicionar anexos
Consultar dashboard
Configurar categorias simples
```

---

## 7.3 Operador Logístico

Usuário operacional que acompanha viagens.

### Pode

```text
Criar viagem, se autorizado
Atualizar status
Registrar ocorrência
Adicionar anexos
Registrar pedágios/custos
Preencher checklist
Consultar viagens
```

---

## 7.4 Visualizador

Usuário com acesso somente leitura.

### Pode

```text
Consultar viagens permitidas
Ver documentos permitidos
Ver dashboard permitido
Ver histórico
```

### Não pode

```text
Criar viagem
Alterar status
Registrar custo
Registrar ocorrência
Excluir anexo
```

---

# 8. Conceitos Funcionais

## 8.1 Viagem

Registro principal do EixoGuard.

Representa uma operação logística básica.

### Dados funcionais sugeridos

```text
Código da viagem
Cliente/transportadora
Origem
Destino
Data prevista de saída
Data prevista de chegada
Data real de saída
Data real de chegada
Veículo
Motorista
Status
Observações
Documentos vinculados
Custos/pedágios
Ocorrências
Checklist
```

### Regras

```text
Viagem deve pertencer a uma empresa.
Viagem deve ter origem e destino.
Viagem deve ter status.
Viagem pode ter veículo.
Viagem pode ter motorista.
Viagem pode ter documentos.
Viagem pode ter custos/pedágios.
Viagem pode ter ocorrências.
```

---

## 8.2 Documento da Viagem

Documento relacionado à viagem.

Exemplos:

```text
MDF-e
Chave MDF-e
CT-e
NF-e
Comprovante
Fatura
Recibo
PDF
Imagem
Outro
```

### Regras

```text
Documento pode ser cadastrado manualmente.
Documento pode ter anexo.
Documento pode ter tipo.
Documento pode estar vinculado a uma viagem.
Upload de XML MDF-e pode ficar como simples anexo no MVP.
Leitura automática do XML fica para evolução futura.
```

---

## 8.3 Veículo

Representa o veículo usado na viagem.

### Dados básicos

```text
Placa
Tipo
Modelo
Identificação interna
Status
Observações
```

### Regras

```text
Veículo pode ser cadastrado de forma simples.
Veículo pode ser vinculado à viagem.
Veículo inativo não deve ser sugerido em novas viagens.
```

---

## 8.4 Motorista

Pessoa responsável pela condução da viagem.

### Dados básicos

```text
Nome
Telefone
Documento, se necessário
Status
Observações
```

### Regras

```text
Motorista pode ser cadastrado de forma simples.
Motorista pode ser vinculado à viagem.
Motorista inativo não deve ser sugerido em novas viagens.
```

---

## 8.5 Pedágio / Custo Manual

Registro manual de custo associado à viagem.

Exemplos:

```text
Pedágio
Combustível
Estacionamento
Diária
Outros custos
```

### Regras

```text
Custo deve estar vinculado a uma viagem.
Custo deve ter tipo.
Custo deve ter valor.
Custo pode ter data.
Custo pode ter observação.
Custo pode ter anexo/comprovante.
Conciliação automática fica para pós-MVP.
```

---

## 8.6 Ocorrência

Registro de evento ou problema durante a viagem.

Exemplos:

```text
Atraso
Problema com veículo
Problema documental
Parada não prevista
Pedágio divergente
Cliente não recebeu
Carga recusada
Acidente
Outro
```

### Regras

```text
Ocorrência deve estar vinculada a uma viagem.
Ocorrência deve ter tipo.
Ocorrência deve ter descrição.
Ocorrência deve aparecer no histórico.
Ocorrência pode gerar evento para FP Robots.
```

---

## 8.7 Checklist Simples da Viagem

Lista simples para controle operacional.

Sugestão inicial:

```text
Documento conferido?
Veículo conferido?
Motorista confirmado?
Saída registrada?
Chegada registrada?
Comprovantes anexados?
Pedágios/custos lançados?
Ocorrências registradas?
Viagem revisada?
```

### Regras

```text
Checklist é simples no MVP.
Checklist ajuda na organização.
Checklist não executa regra fiscal automática.
```

---

# 9. Estados Funcionais

## 9.1 Status da Viagem

```text
Planejada
Em andamento
Chegou ao destino
Concluída
Com pendência
Cancelada
```

---

## 9.2 Status do Documento

```text
Pendente
Anexado
Conferido
Rejeitado
```

---

## 9.3 Status da Ocorrência

```text
Aberta
Em análise
Resolvida
Cancelada
```

---

## 9.4 Status do Veículo

```text
Ativo
Inativo
Em manutenção
```

---

## 9.5 Status do Motorista

```text
Ativo
Inativo
Indisponível
```

---

# 10. Fluxos Funcionais

## 10.1 Fluxo — Criar Viagem

```text
Usuário acessa EixoGuard
↓
Cria nova viagem
↓
Informa origem
↓
Informa destino
↓
Seleciona veículo, se houver
↓
Seleciona motorista, se houver
↓
Informa datas previstas
↓
Salva viagem como Planejada
```

### Critérios de aceite

```text
Viagem pode ser criada manualmente.
Viagem deve ter origem e destino.
Viagem deve ter status inicial.
Viagem pertence à empresa correta.
```

---

## 10.2 Fluxo — Iniciar Viagem

```text
Usuário abre viagem planejada
↓
Confirma início
↓
Sistema registra data/hora de saída
↓
Status muda para Em andamento
```

### Critérios de aceite

```text
Viagem planejada pode ser iniciada.
Início registra data/hora.
Histórico registra ação.
```

---

## 10.3 Fluxo — Registrar Chegada

```text
Usuário abre viagem em andamento
↓
Confirma chegada ao destino
↓
Sistema registra data/hora de chegada
↓
Status muda para Chegou ao destino
```

### Critérios de aceite

```text
Chegada pode ser registrada manualmente.
Data/hora de chegada ficam registradas.
Histórico registra ação.
```

---

## 10.4 Fluxo — Concluir Viagem

```text
Usuário revisa documentos, custos e ocorrências
↓
Marca viagem como Concluída
↓
Sistema registra conclusão
↓
Viagem fica no histórico
```

### Critérios de aceite

```text
Viagem pode ser concluída.
Conclusão registra data/hora.
Viagem concluída fica disponível para consulta.
```

---

## 10.5 Fluxo — Registrar Documento

```text
Usuário abre viagem
↓
Adiciona documento
↓
Seleciona tipo
↓
Informa número/chave, se houver
↓
Anexa arquivo, se houver
↓
Salva documento
```

### Critérios de aceite

```text
Documento pode ser vinculado à viagem.
Documento pode ter tipo.
Documento pode ter anexo.
Chave MDF-e pode ser registrada manualmente.
XML MDF-e pode ser anexado sem leitura automática no MVP.
```

---

## 10.6 Fluxo — Registrar Pedágio/Custo

```text
Usuário abre viagem
↓
Seleciona adicionar custo
↓
Define tipo: pedágio ou outro
↓
Informa valor
↓
Informa data
↓
Anexa comprovante, se houver
↓
Salva custo
```

### Critérios de aceite

```text
Custo manual entra no MVP.
Pedágio manual entra no MVP.
Custo exige valor.
Custo aparece no resumo da viagem.
```

---

## 10.7 Fluxo — Registrar Ocorrência

```text
Usuário abre viagem
↓
Seleciona registrar ocorrência
↓
Escolhe tipo
↓
Informa descrição
↓
Salva ocorrência
↓
Sistema registra no histórico
```

### Critérios de aceite

```text
Ocorrência entra no MVP.
Ocorrência deve ter tipo e descrição.
Ocorrência aparece no histórico.
Ocorrência pode gerar evento para FP Robots.
```

---

## 10.8 Fluxo — Preencher Checklist

```text
Usuário abre viagem
↓
Visualiza checklist simples
↓
Marca itens conferidos
↓
Salva checklist
```

### Critérios de aceite

```text
Checklist simples entra no MVP.
Checklist é manual.
Checklist ajuda a revisar a viagem.
```

---

# 11. Regras de Negócio

## 11.1 Regras de Viagem

```text
Viagem deve pertencer a uma empresa.
Viagem deve possuir origem.
Viagem deve possuir destino.
Viagem deve possuir status.
Viagem pode ter veículo.
Viagem pode ter motorista.
Viagem pode ter documentos.
Viagem pode ter custos.
Viagem pode ter ocorrências.
```

---

## 11.2 Regras de Documento

```text
Documento pode ser cadastrado manualmente.
Documento pode ter anexo.
Documento pode ter chave/número.
Documento pode ser MDF-e, CT-e, NF-e, fatura, recibo ou outro.
Leitura automática de XML fica para evolução futura.
```

---

## 11.3 Regras de Custo/Pedágio

```text
Custo manual entra no MVP.
Pedágio manual entra no MVP.
Custo deve ter tipo.
Custo deve ter valor.
Custo pode ter comprovante.
Conciliação automática fica fora do MVP.
```

---

## 11.4 Regras de Ocorrência

```text
Ocorrência deve estar vinculada à viagem.
Ocorrência deve ter tipo.
Ocorrência deve ter descrição.
Ocorrência deve aparecer no histórico.
```

---

## 11.5 Regras de Checklist

```text
Checklist simples entra no MVP.
Checklist é manual.
Checklist não bloqueia obrigatoriamente conclusão da viagem no MVP.
Checklist pode evoluir para regras obrigatórias no futuro.
```

---

## 11.6 Regras de Evolução Futura

```text
Telemetria fica para pós-MVP.
Integração com FP Tracking fica para pós-MVP.
Conciliação avançada de pedágio fica para pós-MVP.
Importação estruturada de faturas fica para pós-MVP.
Leitura de PDF fica para pós-MVP.
TMS/ERP/Datapar ficam para pós-MVP.
Automação fiscal fica para pós-MVP.
Detecção física de eixo erguido fica para pós-MVP.
```

---

# 12. Eventos Emitidos pelo EixoGuard

## Eventos de viagem

```text
eixoguard.trip.created
eixoguard.trip.started
eixoguard.trip.arrived
eixoguard.trip.completed
eixoguard.trip.cancelled
eixoguard.trip.pending_marked
```

## Eventos de documento

```text
eixoguard.document.added
eixoguard.document.checked
eixoguard.document.rejected
```

## Eventos de custo/pedágio

```text
eixoguard.cost.added
eixoguard.toll.added
```

## Eventos de ocorrência

```text
eixoguard.occurrence.created
eixoguard.occurrence.resolved
```

## Eventos de checklist

```text
eixoguard.checklist.updated
```

---

# 13. Eventos Recebidos pelo EixoGuard

## Do FP Connect Admin Console

```text
core.company.suspended
core.company.reactivated
core.application.activated_for_company
core.application.suspended_for_company
```

## Do FP Robots

```text
robots.notification.sent
robots.action.failed
robots.webhook.failed
robots.action.reprocessed
```

## Do FP Tracking Futuro

```text
tracking.route.started
tracking.route.completed
tracking.location.updated
tracking.occurrence.created
```

---

# 14. Telas Funcionais

## 14.1 Dashboard EixoGuard

### Indicadores

```text
Viagens planejadas
Viagens em andamento
Viagens concluídas
Viagens com pendência
Viagens canceladas
Total de custos registrados
Total de pedágios registrados
Ocorrências abertas
Documentos pendentes
```

---

## 14.2 Viagens

### Funcionalidades

```text
Listar viagens
Filtrar por status
Filtrar por veículo
Filtrar por motorista
Filtrar por período
Criar viagem
Editar viagem
Abrir detalhe
Iniciar viagem
Registrar chegada
Concluir viagem
Cancelar viagem
```

---

## 14.3 Detalhe da Viagem

### Deve exibir

```text
Código da viagem
Origem
Destino
Datas previstas
Datas reais
Veículo
Motorista
Status
Documentos
Custos/pedágios
Ocorrências
Checklist
Histórico
Anexos
```

---

## 14.4 Documentos

### Funcionalidades

```text
Adicionar documento
Selecionar tipo
Informar chave/número
Anexar arquivo
Marcar como conferido
Marcar como rejeitado
```

---

## 14.5 Custos / Pedágios

### Funcionalidades

```text
Adicionar custo
Selecionar tipo
Informar valor
Informar data
Anexar comprovante
Listar custos da viagem
Totalizar custos da viagem
```

---

## 14.6 Ocorrências

### Funcionalidades

```text
Criar ocorrência
Selecionar tipo
Informar descrição
Alterar status
Resolver ocorrência
Consultar ocorrências da viagem
```

---

## 14.7 Checklist

### Funcionalidades

```text
Visualizar checklist simples
Marcar item como conferido
Desmarcar item
Salvar checklist
```

---

# 15. Backlog Funcional por Épicos

---

## EPIC EIXO-01 — Fundação do Módulo

### Objetivo

Permitir que empresas autorizadas usem o EixoGuard.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-01.01 | Acessar EixoGuard como empresa autorizada | Alta | Sim |
| EIXO-01.02 | Exibir dashboard inicial | Alta | Sim |
| EIXO-01.03 | Respeitar status da empresa/sistema contratado | Alta | Sim |
| EIXO-01.04 | Exibir menus por perfil | Alta | Sim |
| EIXO-01.05 | Bloquear empresa suspensa conforme regra | Média | Sim |

### Critérios de aceite

```text
Somente empresa autorizada acessa EixoGuard.
Dados são isolados por empresa.
Dashboard exibe dados da própria empresa.
```

---

## EPIC EIXO-02 — Viagens

### Objetivo

Permitir cadastro e acompanhamento simples de viagens.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-02.01 | Criar viagem manualmente | Alta | Sim |
| EIXO-02.02 | Editar viagem | Alta | Sim |
| EIXO-02.03 | Listar viagens | Alta | Sim |
| EIXO-02.04 | Filtrar viagens por status | Média | Sim |
| EIXO-02.05 | Iniciar viagem | Alta | Sim |
| EIXO-02.06 | Registrar chegada | Alta | Sim |
| EIXO-02.07 | Concluir viagem | Alta | Sim |
| EIXO-02.08 | Cancelar viagem | Média | Sim |
| EIXO-02.09 | Marcar viagem com pendência | Média | Sim |

### Critérios de aceite

```text
Viagem entra no MVP.
Viagem possui origem e destino.
Viagem possui status.
Viagem pode ser iniciada, concluída ou cancelada.
```

---

## EPIC EIXO-03 — Veículos e Motoristas Simples

### Objetivo

Permitir vínculo básico de veículo e motorista à viagem.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-03.01 | Cadastrar veículo simples | Média | Sim |
| EIXO-03.02 | Editar veículo | Média | Sim |
| EIXO-03.03 | Cadastrar motorista simples | Média | Sim |
| EIXO-03.04 | Editar motorista | Média | Sim |
| EIXO-03.05 | Vincular veículo à viagem | Alta | Sim |
| EIXO-03.06 | Vincular motorista à viagem | Alta | Sim |

### Critérios de aceite

```text
Veículo pode ser vinculado à viagem.
Motorista pode ser vinculado à viagem.
Cadastro é simples no MVP.
```

---

## EPIC EIXO-04 — Documentos da Viagem

### Objetivo

Permitir registrar documentos e anexos relacionados à viagem.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-04.01 | Adicionar documento à viagem | Alta | Sim |
| EIXO-04.02 | Selecionar tipo de documento | Alta | Sim |
| EIXO-04.03 | Informar chave/número | Média | Sim |
| EIXO-04.04 | Anexar arquivo | Alta | Sim |
| EIXO-04.05 | Marcar documento como conferido | Média | Sim |
| EIXO-04.06 | Marcar documento como rejeitado | Média | Sim |
| EIXO-04.07 | Registrar XML MDF-e como anexo simples | Média | Sim |

### Critérios de aceite

```text
Documento entra no MVP.
Documento pode ter anexo.
Chave MDF-e pode ser registrada manualmente.
XML MDF-e é anexo simples, sem leitura automática no MVP.
```

---

## EPIC EIXO-05 — Custos e Pedágios Manuais

### Objetivo

Permitir registro manual de custos da viagem.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-05.01 | Registrar custo manual | Alta | Sim |
| EIXO-05.02 | Registrar pedágio manual | Alta | Sim |
| EIXO-05.03 | Informar valor | Alta | Sim |
| EIXO-05.04 | Informar data do custo | Média | Sim |
| EIXO-05.05 | Anexar comprovante | Média | Sim |
| EIXO-05.06 | Totalizar custos da viagem | Média | Sim |

### Critérios de aceite

```text
Custos manuais entram no MVP.
Pedágios manuais entram no MVP.
Custo deve ter valor.
Total da viagem deve ser exibido.
```

---

## EPIC EIXO-06 — Ocorrências

### Objetivo

Registrar eventos e problemas durante a viagem.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-06.01 | Criar ocorrência | Alta | Sim |
| EIXO-06.02 | Selecionar tipo de ocorrência | Alta | Sim |
| EIXO-06.03 | Informar descrição | Alta | Sim |
| EIXO-06.04 | Alterar status da ocorrência | Média | Sim |
| EIXO-06.05 | Resolver ocorrência | Média | Sim |
| EIXO-06.06 | Exibir ocorrência no histórico | Alta | Sim |

### Critérios de aceite

```text
Ocorrência entra no MVP.
Ocorrência tem tipo e descrição.
Ocorrência fica vinculada à viagem.
```

---

## EPIC EIXO-07 — Checklist Simples

### Objetivo

Apoiar revisão manual da viagem.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-07.01 | Exibir checklist simples da viagem | Média | Sim |
| EIXO-07.02 | Marcar item como conferido | Média | Sim |
| EIXO-07.03 | Desmarcar item | Baixa | Sim |
| EIXO-07.04 | Salvar checklist | Média | Sim |
| EIXO-07.05 | Exibir checklist no detalhe da viagem | Média | Sim |

### Critérios de aceite

```text
Checklist simples entra no MVP.
Checklist é manual.
Checklist não bloqueia conclusão no MVP.
```

---

## EPIC EIXO-08 — Histórico da Viagem

### Objetivo

Garantir rastreabilidade das ações.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-08.01 | Registrar criação da viagem | Alta | Sim |
| EIXO-08.02 | Registrar mudança de status | Alta | Sim |
| EIXO-08.03 | Registrar documentos adicionados | Média | Sim |
| EIXO-08.04 | Registrar custos adicionados | Média | Sim |
| EIXO-08.05 | Registrar ocorrências | Média | Sim |
| EIXO-08.06 | Registrar conclusão/cancelamento | Alta | Sim |

### Critérios de aceite

```text
Histórico entra no MVP.
Ações relevantes são registradas.
Histórico informa usuário e data/hora.
```

---

## EPIC EIXO-09 — Dashboard Básico

### Objetivo

Fornecer indicadores simples do EixoGuard.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-09.01 | Ver viagens por status | Média | Sim |
| EIXO-09.02 | Ver viagens em andamento | Média | Sim |
| EIXO-09.03 | Ver viagens com pendência | Média | Sim |
| EIXO-09.04 | Ver ocorrências abertas | Média | Sim |
| EIXO-09.05 | Ver documentos pendentes | Média | Sim |
| EIXO-09.06 | Ver total de custos registrados | Média | Sim |
| EIXO-09.07 | Ver total de pedágios registrados | Média | Sim |

### Critérios de aceite

```text
Dashboard básico entra no MVP.
Indicadores respeitam empresa do usuário.
Dados são simples e operacionais.
```

---

## EPIC EIXO-10 — Eventos e FP Robots

### Objetivo

Emitir eventos simples para o ecossistema.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-10.01 | Emitir evento de viagem criada | Média | Sim |
| EIXO-10.02 | Emitir evento de viagem iniciada | Média | Sim |
| EIXO-10.03 | Emitir evento de viagem concluída | Média | Sim |
| EIXO-10.04 | Emitir evento de documento adicionado | Baixa | Sim |
| EIXO-10.05 | Emitir evento de custo adicionado | Baixa | Sim |
| EIXO-10.06 | Emitir evento de ocorrência criada | Média | Sim |

### Critérios de aceite

```text
Eventos simples entram no MVP.
FP Robots pode consumir eventos.
Falhas de emissão podem ser registradas.
```

---

## EPIC EIXO-11 — Evoluções Futuras

### Objetivo

Registrar funcionalidades futuras sem sobrecarregar o MVP.

| Código | História | Prioridade | MVP |
|---|---|---:|---:|
| EIXO-11.01 | Integração com FP Tracking | Média | Pós-MVP |
| EIXO-11.02 | Telemetria/localização automática | Média | Pós-MVP |
| EIXO-11.03 | Importação CSV de fatura de pedágio | Média | Pós-MVP |
| EIXO-11.04 | Leitura assistida de PDF de fatura | Média | Pós-MVP |
| EIXO-11.05 | Conciliação cobrado x esperado | Média | Pós-MVP |
| EIXO-11.06 | Baseline interno de cobrança | Média | Pós-MVP |
| EIXO-11.07 | Findings/divergências automáticas | Média | Pós-MVP |
| EIXO-11.08 | Dashboard de dor financeira/economia potencial | Média | Pós-MVP |
| EIXO-11.09 | Controle avançado de retorno vazio | Média | Pós-MVP |
| EIXO-11.10 | Integração TMS/ERP/Datapar | Média | Pós-MVP |
| EIXO-11.11 | Detecção física de eixo erguido | Baixa | Pós-MVP |
| EIXO-11.12 | Contestação automática de cobrança | Baixa | Pós-MVP |

---

# 16. MVP Recomendado

O MVP simplificado do EixoGuard deve conter:

```text
Acesso por empresa autorizada
Cadastro manual de viagens
Origem e destino
Veículo básico
Motorista básico
Status da viagem
Documentos da viagem
Chave/número de MDF-e, quando houver
XML MDF-e como anexo simples, sem leitura automática
Anexos
Custos e pedágios manuais
Ocorrências
Checklist simples
Histórico da viagem
Dashboard básico
Eventos simples para FP Robots
```

---

# 17. Fora do Escopo do MVP

```text
Telemetria automática
Integração obrigatória com FP Tracking
Conciliação avançada de pedágio
Importação estruturada de fatura
Leitura de PDF
Cálculo oficial de tarifa de pedágio
Encerramento automático de MDF-e
Emissão de MDF-e
Integração TMS/ERP/Datapar
Retorno vazio avançado
Dashboard de economia potencial
Detecção física de eixo erguido
Contestação automática de cobrança
IA para identificar divergências
```

---

# 18. Critérios Gerais de Aceite do Módulo

```text
Empresa autorizada acessa EixoGuard.
Viagem pode ser criada manualmente.
Viagem possui origem, destino e status.
Viagem pode ter veículo e motorista.
Viagem pode ter documentos.
Viagem pode ter chave/número de MDF-e.
XML MDF-e pode ser anexado como arquivo simples.
Viagem pode ter custos e pedágios manuais.
Viagem pode ter ocorrências.
Checklist simples entra no MVP.
Histórico registra ações relevantes.
Dashboard básico exibe viagens, pendências, custos e ocorrências.
Eventos simples são enviados ao FP Robots.
Funcionalidades avançadas ficam para pós-MVP.
```

---

# 19. Ordem Recomendada de Desenvolvimento Funcional

## Sprint 1 — Fundação e Viagens

```text
Acesso ao módulo
Dashboard inicial
Criar viagem
Listar viagens
Detalhe da viagem
Status da viagem
```

## Sprint 2 — Veículos e Motoristas

```text
Cadastro simples de veículo
Cadastro simples de motorista
Vínculo com viagem
Filtros básicos
```

## Sprint 3 — Documentos e Anexos

```text
Documento da viagem
Tipo de documento
Chave/número
Anexo
XML MDF-e como anexo simples
```

## Sprint 4 — Custos e Pedágios

```text
Custo manual
Pedágio manual
Valor
Data
Comprovante
Total da viagem
```

## Sprint 5 — Ocorrências e Checklist

```text
Ocorrência
Tipo
Descrição
Status
Checklist simples
Histórico
```

## Sprint 6 — Dashboard e Eventos

```text
Indicadores básicos
Eventos para FP Robots
Histórico final
```

---

# 20. Definição Comercial Resumida

```text
O EixoGuard é um módulo simples para controle logístico de viagens, documentos, pedágios manuais, custos, ocorrências e evidências. No MVP, ele não faz conciliação automática, telemetria, emissão fiscal ou integração com TMS/ERP. Ele começa como uma base organizada de controle e histórico, preparada para evoluir futuramente para análises fiscais/logísticas mais avançadas.
```

---

# 21. Próximo Módulo Recomendado

Após o EixoGuard, o próximo módulo recomendado é:

```text
Billing
```

Motivo:

```text
Depois de estruturar os sistemas comerciais, operacionais e de suporte, o Billing poderá organizar planos, cobrança SaaS, vencimentos, contratos e relação financeira dos módulos contratados.
```

---

**Fim do documento — v1.0.0**
