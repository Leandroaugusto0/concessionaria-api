import supabase from "../config/supabase.js";

async function findAll() {
    const { data, error } = await supabase
        .from("marcas")
        .select("*");

    if (error) {
        throw error;
    }

    return data;
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("marcas")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

async function create(marca: {
    nome: string;
    pais?: string;
    ativo?: boolean;
}) {
    const { data, error } = await supabase
        .from("marcas")
        .insert(marca)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function update(id: string, marca: {
    nome: string;
    pais?: string;
    ativo?: boolean;
}) {
    const { data, error } = await supabase
        .from("marcas")
        .update({
            ...marca,
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
        .from("marcas")
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