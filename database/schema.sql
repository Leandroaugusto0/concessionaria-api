-- Script de criacao das tabelas da concessionaria-api
-- Executar no SQL Editor do Supabase, nesta ordem (as tabelas com FK dependem das anteriores)

create table marcas (
    id uuid primary key default gen_random_uuid(),
    nome varchar(100) not null,
    pais varchar(100),
    ativo boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table veiculos (
    id uuid primary key default gen_random_uuid(),
    marca_id uuid not null references marcas(id),
    modelo varchar(150) not null,
    ano integer not null,
    preco numeric(12,2) not null,
    km integer,
    combustivel varchar(50),
    cor varchar(50),
    disponivel boolean default true,
    ativo boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table clientes (
    id uuid primary key default gen_random_uuid(),
    nome varchar(150) not null,
    email varchar(150),
    telefone varchar(20),
    cpf varchar(20),
    ativo boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table vendas (
    id uuid primary key default gen_random_uuid(),
    veiculo_id uuid not null references veiculos(id),
    cliente_id uuid not null references clientes(id),
    vendedor varchar(150) not null,
    preco_venda numeric(12,2) not null,
    forma_pagamento varchar(30),
    status varchar(20) default 'pendente',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
