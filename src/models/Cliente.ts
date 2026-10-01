import supabase from "../config/supabase.js";

async function findAll() {
    const { data, error } = await supabase
        .from("clientes")
        .select("*");

    if (error) {
        throw error;
    }

    return data;
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

    return data;
}

async function create(cliente: {
    nome: string;
    email?: string;
    telefone?: string;
    cpf?: string;
    ativo?: boolean;
}) {
    const { data, error } = await supabase
        .from("clientes")
        .insert(cliente)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function update(id: string, cliente: {
    nome: string;
    email?: string;
    telefone?: string;
    cpf?: string;
    ativo?: boolean;
}) {
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

    return data;
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
    create,
    update,
    remove
}