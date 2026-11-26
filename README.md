# Concessionaria API

API REST para gerenciamento de uma concessionaria de veiculos. O sistema permite cadastrar as marcas trabalhadas pela loja, o estoque de veiculos (associados a uma marca), os clientes e registrar as vendas realizadas (relacionando um veiculo a um cliente).

O objetivo principal do projeto e resolver o controle manual (planilhas, cadernos) que muitas concessionarias pequenas ainda usam para saber quais carros tem no patio, pra quem foram vendidos e quais marcas a loja trabalha.

Esse projeto foi desenvolvido como APS da disciplina de Back-End Development, usando como base a estrutura e os conceitos vistos em aula no projeto do restaurante (Categoria/Produto), adaptados para o dominio de uma concessionaria.

## Integrantes

- Leandro Augusto Alencar dos Santos
- João Marcos da Guarda de Castro

## Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- Supabase (PostgreSQL)
- @supabase/supabase-js (cliente do Supabase para Node)
- tsx (executa TypeScript direto no Node em desenvolvimento)
- Vitest e @vitest/coverage-v8 (testes e cobertura)
- Supertest (testes de integracao das rotas)
- Swagger/OpenAPI (swagger-jsdoc e swagger-ui-express)
- GitHub Actions (roda os testes a cada push)
- Git
- HTML, CSS e JavaScript (front basico em `public/`)

## Entidades e relacionamento

### Marca

- id
- nome
- pais
- ativo

### Veiculo

- id
- marca_id
- modelo
- ano
- preco
- km
- combustivel
- cor
- disponivel
- ativo

### Cliente

- id
- nome
- email
- telefone
- cpf
- ativo

### Venda

- id
- veiculo_id
- cliente_id
- vendedor
- preco_venda
- forma_pagamento
- status
- data_venda

**Relacionamentos:**

- Uma Marca pode ter varios Veiculos, e cada Veiculo pertence a uma Marca.
- Um Cliente pode ter varias Vendas, e cada Venda pertence a um Cliente.
- Um Veiculo pode aparecer em Vendas, e cada Venda se refere a um Veiculo.

Os relacionamentos sao feitos por chave estrangeira (`marca_id`, `veiculo_id` e `cliente_id`). Por isso a API nao deixa excluir uma marca que tem veiculos, nem um veiculo ou cliente que tem vendas (retorna `409`).

## Regras de negocio

- **Venda e disponibilidade do veiculo:** ao registrar uma venda, o veiculo passa a ficar indisponivel (`disponivel = false`) e nao pode ser vendido de novo. Se duas vendas do mesmo veiculo chegarem ao mesmo tempo, so uma e aceita, porque o veiculo e reservado numa unica consulta (`update ... where disponivel = true`).
- **Cancelar venda:** mudar o `status` para `cancelada` devolve o veiculo ao estoque. Uma venda cancelada pode ser reativada so se o veiculo ainda estiver disponivel.
- **Excluir venda:** se a venda ainda valia (nao estava cancelada), o veiculo volta a ficar disponivel.
- **Venda registrada:** `veiculo_id` e `cliente_id` nao podem ser alterados. O `status` aceita `pendente`, `concluida` ou `cancelada`, e o `preco_venda` precisa ser maior que zero.
- **Marca:** nao pode haver duas marcas com o mesmo nome (sem diferenciar maiusculas de minusculas). Retorna `409`.
- **Cliente:** nao pode haver dois clientes com o mesmo CPF (com ou sem pontuacao). Retorna `409`. Quando informado, o CPF precisa ter 11 numeros e o email precisa ter formato valido.
- **Veiculo:** o `ano` precisa estar entre 1950 e o ano que vem, o `preco` precisa ser maior que zero e o `km` nao pode ser negativo.
- **Exclusoes protegidas:** nao e possivel excluir uma marca que tem veiculos, nem um veiculo ou cliente que tem vendas. Retorna `409`.
- **Relacionamentos:** um veiculo precisa de uma marca existente e uma venda precisa de um veiculo e um cliente existentes. Caso contrario retorna `400`.

## Estrutura do projeto

```
src/
├── config/       -> conexao com o supabase e configuracao do swagger
├── controller/   -> recebe a requisicao, chama o service e devolve a resposta HTTP
├── errors/       -> erros proprios (AppError, ValidationError, NotFoundError, ConflictError)
├── models/       -> classes das entidades (atributos privados e comportamentos)
├── repository/   -> acesso ao banco (todas as consultas do supabase ficam aqui)
├── routes/       -> definicao das rotas e da documentacao swagger de cada entidade
├── services/     -> regras de negocio e validacoes
├── utils/        -> funcoes de validacao reutilizadas
├── app.ts        -> configuracao do express, das rotas e do tratamento de erros
└── server.ts     -> inicializacao do servidor

tests/
├── unit/         -> testes unitarios de services, controllers, repositories e erros (com mock)
├── integration/  -> testes das rotas com o banco de verdade (supertest)
└── app.test.ts   -> testes do app (404, json invalido e swagger)

database/         -> script sql de criacao das tabelas
public/           -> front basico (html/css/js) pra testar a api pelo navegador
```

O caminho de uma requisicao e: `routes` → `controller` → `service` → `repository` → Supabase.

Quando uma regra e violada, o service lanca um erro proprio (`ValidationError` = 400, `NotFoundError` = 404, `ConflictError` = 409). O controller repassa o erro com `next(erro)` e o `app.ts` transforma no status e na mensagem da resposta.

## Configuração e execução

Clonar o repositorio:

```
git clone https://github.com/Leandroaugusto0/concessionaria-api.git
cd concessionaria-api
```

Instalar as dependencias:

```
npm install
```

Criar as tabelas no Supabase executando o script `database/schema.sql` no SQL Editor.

Criar o arquivo `.env` na raiz (usando o `.env.example` como base) com as credenciais do seu projeto Supabase.

Rodar em modo desenvolvimento:

```
npm run dev
```

O servidor sobe em `http://localhost:3000`. Abrindo essa url no navegador ja da pra usar o front basico que consome a API.

Para gerar a versao de producao:

```
npm run build
npm start
```

## Variáveis de ambiente

| Variavel | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto no Supabase (Project Overview > Project URL) |
| `SUPABASE_SECRET_KEY` | Secret key do projeto (Project Settings > API Keys > Secret keys) |
| `PORT` | Porta do servidor (opcional, padrao 3000) |

Veja o arquivo `.env.example` para o formato esperado. O `.env` com as credenciais reais nunca deve ir pro repositorio.

## Banco de dados

O banco usado e o Postgres do Supabase, com 4 tabelas: `marcas`, `veiculos`, `clientes` e `vendas`.

As tabelas foram criadas direto no SQL Editor do Supabase. O script tambem esta no arquivo `database/schema.sql`:

```sql
create table marcas (
    id uuid primary key default gen_random_uuid(),
    nome varchar(100) not null,
    pais varchar(100),
    ativo boolean not null default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table veiculos (
    id uuid primary key default gen_random_uuid(),
    marca_id uuid not null,
    modelo varchar(150) not null,
    ano integer not null,
    preco numeric(10, 2) not null,
    km integer not null default 0,
    combustivel varchar(30),
    cor varchar(50),
    disponivel boolean not null default true,
    ativo boolean not null default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    constraint fk_veiculos_marca
        foreign key (marca_id)
        references marcas(id)
);

create table clientes (
    id uuid primary key default gen_random_uuid(),
    nome varchar(150) not null,
    email varchar(150),
    telefone varchar(20),
    cpf varchar(20),
    ativo boolean not null default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table vendas (
    id uuid primary key default gen_random_uuid(),
    veiculo_id uuid not null,
    cliente_id uuid not null,
    vendedor varchar(150) not null,
    preco_venda numeric(10, 2) not null,
    forma_pagamento varchar(30),
    status varchar(20) not null default 'pendente',
    data_venda timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    constraint fk_vendas_veiculo
        foreign key (veiculo_id)
        references veiculos(id),

    constraint fk_vendas_cliente
        foreign key (cliente_id)
        references clientes(id)
);
```

## Documentação dos endpoints

### Marcas

| Metodo | Endpoint | Descrição |
|---|---|---|
| GET | /marcas | Lista todas as marcas |
| GET | /marcas/:id | Consulta uma marca pelo id |
| POST | /marcas | Cadastra uma nova marca |
| PUT | /marcas/:id | Atualiza uma marca |
| DELETE | /marcas/:id | Remove uma marca |

### Veiculos

| Metodo | Endpoint | Descrição |
|---|---|---|
| GET | /veiculos | Lista os veiculos (aceita `?marca_id=`, `?disponivel=true/false`, `?busca=` e `?ordenar=preco_asc/preco_desc`) |
| GET | /veiculos/:id | Consulta um veiculo pelo id |
| POST | /veiculos | Cadastra um novo veiculo |
| PUT | /veiculos/:id | Atualiza um veiculo |
| DELETE | /veiculos/:id | Remove um veiculo |

### Clientes

| Metodo | Endpoint | Descrição |
|---|---|---|
| GET | /clientes | Lista todos os clientes |
| GET | /clientes/:id | Consulta um cliente pelo id |
| POST | /clientes | Cadastra um novo cliente |
| PUT | /clientes/:id | Atualiza um cliente |
| DELETE | /clientes/:id | Remove um cliente |

### Vendas

| Metodo | Endpoint | Descrição |
|---|---|---|
| GET | /vendas | Lista todas as vendas |
| GET | /vendas/:id | Consulta uma venda pelo id |
| POST | /vendas | Registra uma nova venda |
| PUT | /vendas/:id | Atualiza uma venda |
| DELETE | /vendas/:id | Remove uma venda |

### Codigos de resposta

| Codigo | Quando acontece |
|---|---|
| 200 | Consulta, atualizacao ou exclusao feita com sucesso |
| 201 | Registro criado com sucesso |
| 400 | Dados invalidos, id em formato invalido ou registro relacionado inexistente (ex: `marca_id` que nao existe, veiculo que ja foi vendido) |
| 404 | Registro ou rota nao encontrado |
| 409 | Conflito: exclusao bloqueada porque existem registros relacionados, ou nome de marca que ja existe |
| 500 | Erro interno do servidor |

Todas as respostas de erro seguem o formato:

```json
{
  "message": "Marca nao encontrada."
}
```

## Exemplos de requisições

**POST /marcas**
```json
{
  "nome": "Toyota",
  "pais": "Japão"
}
```

**POST /veiculos**
```json
{
  "marca_id": "id-da-marca-aqui",
  "modelo": "Corolla",
  "ano": 2023,
  "preco": 145000.00,
  "km": 12000,
  "combustivel": "Flex",
  "cor": "Prata"
}
```

**POST /clientes**
```json
{
  "nome": "Maria da Silva",
  "email": "maria@email.com",
  "telefone": "(11) 99999-0000",
  "cpf": "123.456.789-00"
}
```

**POST /vendas**
```json
{
  "veiculo_id": "id-do-veiculo-aqui",
  "cliente_id": "id-do-cliente-aqui",
  "vendedor": "João Marcos",
  "preco_venda": 140000.00,
  "forma_pagamento": "financiamento"
}
```

**PUT /marcas/:id**
```json
{
  "nome": "Toyota",
  "pais": "Japão",
  "ativo": true
}
```

**PUT /veiculos/:id**
```json
{
  "marca_id": "id-da-marca-aqui",
  "modelo": "Corolla XEi",
  "ano": 2023,
  "preco": 139900.00,
  "km": 15000,
  "combustivel": "Flex",
  "cor": "Prata",
  "disponivel": false,
  "ativo": true
}
```

**PUT /clientes/:id**
```json
{
  "nome": "Maria da Silva Santos",
  "email": "maria.santos@email.com",
  "telefone": "(11) 98888-0000",
  "cpf": "123.456.789-00",
  "ativo": true
}
```

**PUT /vendas/:id**
```json
{
  "vendedor": "João Marcos",
  "preco_venda": 138000.00,
  "forma_pagamento": "financiamento",
  "status": "concluida"
}
```

> Na venda, `veiculo_id` e `cliente_id` nao podem ser alterados. O `status` aceita `pendente`, `concluida` ou `cancelada`. Mudar o status para `cancelada` devolve o veiculo para o estoque.

**Exemplos de filtros de veiculos**
```
GET /veiculos?busca=corolla
GET /veiculos?disponivel=true&ordenar=preco_asc
GET /veiculos?marca_id=id-da-marca-aqui
```

## Testes automatizados e cobertura

Ferramentas: **Vitest** (testes e cobertura com `@vitest/coverage-v8`) e **Supertest** (chama as rotas da API nos testes de integracao).

Organizacao dos arquivos:

| Pasta | O que testa |
|---|---|
| `tests/unit/` | Services, controllers, repositories e erros proprios. A camada de baixo e trocada por uma falsa (`vi.mock`), entao nao usam o banco |
| `tests/integration/` | As rotas de verdade (POST, GET, PUT, DELETE e os erros 400, 404 e 409) usando o banco do Supabase |
| `tests/app.test.ts` | Comportamentos do app: rota inexistente, JSON invalido e documentacao swagger |

Como executar:

```
npm test                 # todos os testes (unitarios e de integracao)
npx vitest run tests/unit          # so os unitarios (nao precisam de banco)
npx vitest run tests/integration   # so os de integracao
npm run test:coverage    # testes + relatorio de cobertura
```

O relatorio de cobertura aparece no terminal e tambem em HTML na pasta `coverage/` (abra `coverage/index.html`). A configuracao esta em `vitest.config.ts`: o minimo exigido e **60%** de linhas, instrucoes, funcoes e branches, e o comando falha se algum ficar abaixo. Ficam de fora da medicao so o `server.ts` (que apenas sobe o servidor) e a pasta `src/config/` (conexao e configuracao); nenhuma camada com regra e excluida.

Cobertura atual:

| Execucao | Linhas | Instrucoes | Funcoes | Branches |
|---|---|---|---|---|
| Todos os testes (com banco) | 90% | 90% | 92% | 92% |
| So os unitarios (sem `.env`) | 84% | 83% | 80% | 86% |

Configuracao necessaria: os testes de integracao precisam do `.env` com `SUPABASE_URL` e `SUPABASE_SECRET_KEY` (banco com as tabelas de `database/schema.sql`). Sem o `.env` esses testes sao pulados e so os unitarios rodam.

Cuidados com o banco de testes:

- Os testes de integracao usam o mesmo banco da aplicacao. Todo registro que eles criam tem nome comecando com `ZZ-` e e apagado, pelo `id`, no final de cada arquivo de teste.
- Nao rode os testes em um banco de producao. Se um teste for interrompido no meio, procure e apague os registros `ZZ-` que sobraram.

No GitHub, o workflow `.github/workflows/ci.yml` roda a compilacao e os testes com cobertura a cada push. As credenciais ficam nos secrets `SUPABASE_URL` e `SUPABASE_SECRET_KEY` do repositorio.

## Documentacao Swagger

A documentacao interativa da API (OpenAPI 3) fica em:

```
http://localhost:3000/api-docs
```

A especificacao em JSON esta em `http://localhost:3000/api-docs.json`.

Na pagina, cada rota mostra a finalidade, os parametros, o formato do corpo da requisicao, um exemplo e as respostas possiveis (200, 201, 400, 404 e 409). Para testar, clique em uma rota, depois em **Try it out**, preencha o corpo ou o `id` e clique em **Execute**: a requisicao e feita de verdade no banco.

A documentacao fica nos comentarios `@openapi` de cada arquivo em `src/routes/`, ao lado das rotas que ela descreve.
