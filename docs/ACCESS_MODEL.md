# ACCESS_MODEL.md - Modelo de acesso FP WebTech

Este documento define o modelo conceitual de acesso do ecossistema FP WebTech.

Ele orienta a evolucao do FP Connect Admin Console antes das proximas alteracoes de CRUD, menus e autorizacao visual.

---

## 1. Principio central

O ecossistema deve usar identidade unica.

Um usuario existe uma unica vez no Supabase Auth e no `core.profiles`.

O que muda entre usuarios nao e o login, mas os acessos vinculados a essa identidade:

- acesso de plataforma;
- acesso empresarial;
- acesso a modulos;
- vinculo operacional de suporte.

---

## 2. Conceitos

### Identidade

Representa a pessoa autenticada.

Origem:

- Supabase Auth;
- `core.profiles`.

Uma identidade pode ter varios acessos simultaneos.

### Acesso de plataforma

Representa permissoes globais no FP Connect Admin Console.

Exemplos:

- superadmin;
- admin do console;
- suporte do console;
- implantacao;
- financeiro;
- comercial.

Esses acessos permitem atuar em funcoes internas da plataforma, conforme permissao.

O acesso de plataforma nao substitui vinculo empresarial. Ele define o que a pessoa pode fazer no Console como operador interno.

### Acesso empresarial

Representa o vinculo de uma identidade com uma empresa.

Origem atual:

- `core.company_memberships`.

Um usuario pode estar vinculado a varias empresas ao mesmo tempo.

Exemplo:

```text
Usuario: Joao
Empresas:
- Matriz
- Filial SP
- Filial RJ
```

Cada vinculo empresarial deve ter status e permissoes proprias.

### Acesso a modulos

Representa o que o usuario pode fazer dentro de um modulo contratado por uma empresa.

Origem atual:

- papeis;
- permissoes;
- modulos contratados;
- vinculos usuario x empresa x modulo.

Exemplos:

- administrar Food na Empresa A;
- operar Tracking na Filial SP;
- consultar Robots na Matriz.

### Vinculo operacional de suporte

Representa a relacao entre um usuario interno da plataforma e uma empresa atendida.

Esse vinculo existe para permitir suporte, implantacao, acompanhamento de carteira e futura integracao com o modulo FP Suporte.

Ele concede poder administrativo dentro da empresa atendida para que o suporte consiga executar ajustes necessarios.

Esse poder deve ser auditavel e identificado como suporte, nao como usuario comum da empresa.

Exemplos:

```text
Usuario: Maria
Acesso de plataforma: admin_console
Vinculo operacional:
- Suporte da Empresa A
- Suporte da Empresa B
```

---

## 3. Regras aprovadas

### Usuario pode estar em varias empresas

Permitido.

O modelo deve aceitar que a mesma identidade atue em matriz, filiais ou empresas relacionadas.

Cada empresa deve ter seu proprio vinculo, status e permissoes.

### Superadmin pode participar de empresas

Permitido.

O superadmin possui acesso total de plataforma, mas tambem pode ter vinculos empresariais operacionais.

Ao cadastrar uma empresa, o superadmin deve entrar automaticamente como suporte dessa empresa.

Esse vinculo automatico serve para garantir acompanhamento inicial, implantacao e rastreabilidade de atendimento.

### Admin do Console pode participar de empresas

Permitido.

O superadmin pode cadastrar ou promover um admin do Console e vincula-lo como suporte de empresas especificas.

Esse desenho permite distribuir carteiras de suporte por cliente.

No futuro, o FP Suporte podera usar esses vinculos para direcionar chamados, filas, SLA, implantacao e relacionamento com a empresa.

### Suporte da empresa tem poder administrativo

O papel de suporte representa atendimento interno da plataforma.

Ele deve permitir atuar nos ajustes necessarios da empresa atendida, incluindo:

- ajustar dados cadastrais;
- apoiar gestao de usuarios;
- revisar permissoes;
- apoiar configuracao de modulos contratados;
- consultar informacoes necessarias para atendimento.

Esse acesso deve continuar passando por policy especifica, auditoria e contexto de atuacao `support`.

Quando houver risco operacional alto, como cancelamento de modulo, exclusao logica sensivel, mudanca financeira ou acesso a dados operacionais sensiveis, a policy pode exigir permissao adicional mesmo para suporte.

---

## 4. Tipos de usuario na UI

O cadastro de usuarios deve ser separado por contexto.

### Usuarios do Console

CRUD previsto no Admin Console para usuarios internos da plataforma.

Exemplos:

- superadmin;
- admin do console;
- suporte;
- implantacao;
- financeiro;
- comercial.

Esse CRUD deve permitir:

- cadastrar usuario interno;
- definir acesso de plataforma;
- vincular ou remover empresas da carteira de suporte;
- inativar usuario interno;
- auditar alteracoes.

### Usuarios da empresa

CRUD previsto dentro do detalhe da empresa.

Exemplos:

- admin da empresa;
- operador da empresa;
- usuario de modulo;
- gestor de filial.

Esse CRUD deve permitir:

- cadastrar usuario vinculado a empresa atual;
- vincular usuario existente a empresa atual;
- definir papel/permissao por modulo;
- remover ou inativar vinculo empresarial;
- auditar alteracoes.

---

## 5. Contexto ativo

A interface deve diferenciar o contexto em que o usuario esta atuando.

Contextos previstos:

- plataforma;
- empresa;
- modulo.

Exemplos:

```text
Modo plataforma: Admin Console
Modo empresa: Empresa A
Modo modulo: FP Robots / Empresa A
```

O contexto ativo deve orientar:

- menus visiveis;
- chamadas de API;
- escopo de auditoria;
- bloqueio visual;
- mensagens de erro.

---

## 6. Menu e portal inicial

Menus nao devem ser estaticos para todos os usuarios autenticados.

O frontend deve montar a navegacao a partir de um resumo server-side de acesso.

Exemplos de comportamento:

```text
Superadmin:
- Portal
- Cadastro
- Movimentacao
- Auditoria
- Sistemas

Admin do Console:
- Portal
- secoes permitidas conforme papel de plataforma
- empresas de sua carteira de suporte, com acoes administrativas permitidas pelo papel de suporte

Usuario de empresa:
- Portal
- empresas vinculadas
- modulos contratados e permitidos

Usuario sem acesso liberado:
- Portal com aviso de acesso pendente
```

O backend continua sendo a camada real de seguranca. O menu permissionado melhora experiencia e reduz exposicao visual desnecessaria.

---

## 7. Auditoria

Toda acao deve registrar quem agiu e em qual contexto.

Campos conceituais recomendados:

```text
actor_user_id
acting_context
company_id
application_key
target_user_id
source
```

Exemplos de `acting_context`:

- `platform`;
- `company`;
- `module`;
- `support`.

Exemplos de `source`:

- `platform_role`;
- `company_membership`;
- `support_assignment`;
- `system_auto_assignment`.

---

## 8. Implicacoes para implementacao

Antes de codar, o plano recomendado e:

1. criar contrato de acesso do usuario atual; [iniciado]
2. trocar a home global por portal contextual; [iniciado]
3. gerar menus pelo contrato de acesso; [iniciado]
4. separar CRUD de usuarios do Console e usuarios da empresa; [iniciado com cadastro contextual no detalhe da empresa]
5. modelar vinculos de suporte por empresa;
6. automatizar vinculo de suporte para superadmin ao cadastrar empresa;
7. permitir delegacao de suporte por carteira para admins do Console;
8. manter backend/policies como fonte real de seguranca.

---

## 9. Pendencias de modelagem

Pontos ainda a detalhar antes da migration definitiva:

- nome final da tabela de acesso de plataforma;
- nome final da tabela ou atributo para carteira de suporte;
- se suporte sera um tipo de `company_membership` ou uma tabela propria de atribuicao;
- quais papeis globais entram no MVP do Console;
- quais acoes de alto risco exigem permissao adicional mesmo para suporte;
- como o futuro FP Suporte consumira a carteira de atendimento.
