import supabase from "../config/supabase.js";
import Marca from "../models/Marca.js";

// Converte uma linha da tabela em um objeto Marca
function paraMarca(linha: any): Marca {
    return Marca.restore(
        linha.id,
        linha.nome,
        linha.pais,
        linha.ativo,
        linha.created_at,
        linha.updated_at
    );
}

async function findAll(): Promise<Marca[]> {
    const { data, error } = await supabase
        .from("marcas")
        .select("*");

    if (error) {
        throw error;
    }

    return data.map(paraMarca);
}

async function findById(id: string): Promise<Marca | null> {
    const { data, error } = await supabase
        .from("marcas")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? paraMarca(data) : null;
}

// Procura uma marca pelo nome, sem diferenciar maiusculas de minusculas.
// % e _ sao curingas do ilike, entao saem escapados.
async function findByNome(nome: string): Promise<Marca | null> {
    const padrao = nome.replace(/[\\%_]/g, "\\$&");

    const { data, error } = await supabase
        .from("marcas")
        .select("*")
        .ilike("nome", padrao)
        .limit(1)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? paraMarca(data) : null;
}

async function create(marca: Marca): Promise<Marca> {
    const { data, error } = await supabase
        .from("marcas")
        .insert({
            nome: marca.getNome(),
            pais: marca.getPais(),
            ativo: marca.isAtivo(),
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraMarca(data);
}

async function update(id: string, marca: Marca): Promise<Marca> {
    const { data, error } = await supabase
        .from("marcas")
        .update({
            nome: marca.getNome(),
            pais: marca.getPais(),
            ativo: marca.isAtivo(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraMarca(data);
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
    findByNome,
    create,
    update,
    remove
}
