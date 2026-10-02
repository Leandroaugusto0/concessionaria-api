-- Script de criacao das tabelas da concessionaria-api
-- Rodar no SQL Editor do Supabase, nesta ordem (veiculos e vendas dependem das tabelas de cima)

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
