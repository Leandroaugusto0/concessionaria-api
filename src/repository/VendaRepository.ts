import supabase from "../config/supabase.js";
import Venda from "../models/Venda.js";

// a consulta traz junto o modelo do veiculo e o nome do cliente
const COLUNAS = "*, veiculos(id, modelo), clientes(id, nome)";

// Converte uma linha da tabela em um objeto Venda
function paraVenda(linha: any): Venda {
    return Venda.restore(
        linha.id,
        linha.veiculo_id,
        linha.cliente_id,
        linha.vendedor,
        linha.preco_venda,
        linha.forma_pagamento,
        linha.status,
        linha.data_venda,
        linha.created_at,
        linha.updated_at,
        linha.veiculos,
        linha.clientes
    );
}

async function findAll(): Promise<Venda[]> {
    const { data, error } = await supabase
        .from("vendas")
        .select(COLUNAS);

    if (error) {
        throw error;
    }

    return data.map(paraVenda);
}

async function findById(id: string): Promise<Venda | null> {
    const { data, error } = await supabase
        .from("vendas")
        .select(COLUNAS)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? paraVenda(data) : null;
}

async function create(venda: Venda): Promise<Venda> {
    const { data, error } = await supabase
        .from("vendas")
        .insert({
            veiculo_id: venda.getVeiculoId(),
            cliente_id: venda.getClienteId(),
            vendedor: venda.getVendedor(),
            preco_venda: venda.getPrecoVenda(),
            forma_pagamento: venda.getFormaPagamento(),
            status: venda.getStatus(),
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraVenda(data);
}

async function update(id: string, venda: Venda): Promise<Venda> {
    const { data, error } = await supabase
        .from("vendas")
        .update({
            vendedor: venda.getVendedor(),
            preco_venda: venda.getPrecoVenda(),
            forma_pagamento: venda.getFormaPagamento(),
            status: venda.getStatus(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraVenda(data);
}

async function remove(id: string) {
    const { error } = await supabase
        .from("vendas")
        .delete()
        .eq("id", id);

    if (error) {
        throw error;
    }
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
}
