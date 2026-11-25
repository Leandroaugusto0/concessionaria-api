import supabase from "../config/supabase.js";
import Cliente from "../models/Cliente.js";

type ClienteDados = {
    nome: string;
    email?: string | null;
    telefone?: string | null;
    cpf?: string | null;
    ativo?: boolean;
};

function paraCliente(linha: any): Cliente {
    return Cliente.restore(
        linha.id,
        linha.nome,
        linha.email,
        linha.telefone,
        linha.cpf,
        linha.ativo,
        linha.created_at,
        linha.updated_at
    );
}

async function findAll() {
    const { data, error } = await supabase
        .from("clientes")
        .select("*");

    if (error) {
        throw error;
    }

    return data.map(paraCliente);
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? paraCliente(data) : null;
}

async function findAllWithCpf() {
    const { data, error } = await supabase
        .from("clientes")
        .select("id, cpf")
        .not("cpf", "is", null);

    if (error) {
        throw error;
    }

    return data;
}

async function create(cliente: ClienteDados): Promise<Cliente> {
    const { data, error } = await supabase
        .from("clientes")
        .insert(cliente)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraCliente(data);
}

async function update(id: string, cliente: ClienteDados): Promise<Cliente> {
    const { data, error } = await supabase
        .from("clientes")
        .update({
            ...cliente,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraCliente(data);
}

async function remove(id: string) {
    const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id);

    if (error) {
        throw error;
    }
}

export default {
    findAll,
    findById,
    findAllWithCpf,
    create,
    update,
    remove
}
