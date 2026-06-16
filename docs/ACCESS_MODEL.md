# ACCESS_MODEL.md - Modelo de acesso FP WebTech

Este documento define o modelo ativo de identidade, papeis, vinculos empresariais e permissoes. Status de implementacao fica em `docs/MODULE_STATUS.md`.

## Principio central

Um usuario possui uma identidade unica, mas pode ter acessos diferentes conforme o contexto.

O sistema separa:

- identidade: quem e o usuario;
- acesso de plataforma: papel no FP Console;
- acesso empresarial: empresas em que o usuario atua;
- acesso a modulos: o que a empresa contratou e o que o usuario pode executar;
- carteira de suporte: quais empresas um operador interno pode atender.

## Entidades conceituais

### Identidade

Representa a pessoa autenticada pelo Supabase Auth e pelo perfil interno do `core`.

Regras:

- o mesmo e-mail nao deve criar identidades duplicadas;
- perfil inativo nao acessa o Console;
- convite pendente so vira acesso ativo apos aceite e ativacao.

### Acesso de plataforma

Define se o usuario pertence ao FP Console.

Papeis atuais:

- `super_admin`: controle total da plataforma;
- `fp_admin`: administrador interno delegado;
- `support`: suporte interno vinculado a empresas especificas;
- `company_user`: usuario de empresa, sem administracao global do Console.

### Acesso empresarial

Define em quais empresas o usuario atua.

Regras:

- um usuario pode estar em varias empresas;
- o papel pode variar por empresa;
- vinculo empresarial pode ser ativo, pendente ou inativo;
- usuarios de empresa sao administrados no cadastro da empresa.

### Acesso a modulos

Depende de:

- empresa ativa;
- modulo contratado ativo;
- permissao do usuario no contexto da empresa;
- policy backend/banco coerente com o modulo.

`super_admin` ignora permissoes granulares globais, mas produtos operacionais devem continuar respeitando modulo contratado quando o fluxo depende de contratacao real.

### Carteira de suporte

Permite que operadores internos atendam empresas especificas.

Regras:

- `super_admin`, `fp_admin` e `support` podem ser vinculados como suporte administrativo;
- suporte possui poder administrativo dentro da empresa atendida;
- esse poder deve ser auditavel e restrito a empresas da carteira;
- ao criar empresa, o `super_admin` criador deve ser vinculado automaticamente como suporte.

## Matriz de acesso do Console

| Papel | Escopo | Pode gerir usuarios do Console | Pode gerir empresas | Pode atuar como suporte |
|---|---|---:|---:|---:|
| `super_admin` | Plataforma inteira | Sim | Sim | Sim |
| `fp_admin` | Plataforma delegada | Apenas `support` | Empresas permitidas | Sim |
| `support` | Empresas da carteira | Nao | Apenas empresas vinculadas | Sim |
| `company_user` | Empresa vinculada | Nao | Nao no Console global | Nao |

## Cadastro de usuarios

### Usuarios do Console

Devem ter CRUD proprio no Admin Console.

Uso:

- criar ou convidar operadores internos;
- definir papel de plataforma;
- ativar/inativar acesso;
- vincular `fp_admin` ou `support` a carteiras de empresa;
- auditar delegacoes.

Restricao inicial:

- `fp_admin` pode convidar/vincular apenas usuarios `support`.

### Usuarios de empresa

Devem ser geridos dentro do cadastro da empresa.

Uso:

- vincular usuario a empresa;
- definir papel dentro da empresa;
- ativar, inativar ou ajustar permissoes do vinculo;
- liberar acesso a modulos contratados conforme papel/permissao.

## Portal e menu

Ao entrar, o usuario deve receber um contexto inicial valido.

Regras:

- `super_admin`: ve a plataforma inteira;
- `fp_admin`: ve areas delegadas e empresas permitidas;
- `support`: ve apenas empresas da carteira;
- `company_user`: ve apenas funcionalidades pertinentes a suas empresas e modulos.

Menus devem vir de regras do backend ou contrato derivado delas. Tela sem permissao nao deve aparecer como opcao navegavel.

## Auditoria

Acoes sensiveis devem registrar:

- usuario executor;
- papel usado;
- empresa afetada, quando houver;
- usuario alvo, quando houver;
- acao executada;
- data/hora;
- origem operacional.

Prioridade de auditoria:

- convite e ativacao de usuario;
- alteracao de papel;
- vinculo e inativacao empresarial;
- liberacao de modulo;
- atribuicao ou remocao de suporte;
- acoes administrativas dentro de empresa atendida.

## Regras obrigatorias

- Nao confiar em `company_id` enviado livremente pelo frontend.
- Validar usuario ativo antes de qualquer rota sensivel.
- Validar empresa ativa e vinculo antes de dados empresariais.
- Validar modulo contratado antes de endpoint operacional.
- Validar permissao granular quando a acao exigir.
- Manter regra critica no backend, banco ou ambos.
- Ocultar menus sem permissao e bloquear acesso direto por rota/API.
