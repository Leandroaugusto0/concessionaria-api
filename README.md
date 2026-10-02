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

**Regra de negocio da venda:** ao registrar uma venda, o veiculo passa a ficar indisponivel (`disponivel = false`) e nao pode ser vendido de novo. Se a venda for cancelada (`status: "cancelada"`) ou excluida, o veiculo volta a ficar disponivel.

## Estrutura do projeto

```
src/
├── config/       -> conexao com o supabase
├── controller/   -> regras de cada rota (recebe a requisicao e devolve a resposta)
├── models/       -> acesso ao banco de dados (supabase)
├── routes/       -> definicao das rotas de cada entidade
├── utils/        -> funcoes de validacao usadas pelos controllers
├── app.ts        -> configuracao do express e das rotas
└── server.ts     -> inicializacao do servidor

database/         -> script sql de criacao das tabelas
public/           -> front basico (html/css/js) pra testar a api pelo navegador
```

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
| 409 | Exclusao bloqueada porque existem registros relacionados |
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
