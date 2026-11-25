import supabase from "../config/supabase.js";
import Veiculo from "../models/Veiculo.js";

function paraVeiculo(linha: any): Veiculo {
    return Veiculo.restore(
        linha.id,
        linha.marca_id,
        linha.modelo,
        linha.ano,
        Number(linha.preco),
        linha.km,
        linha.combustivel,
        linha.cor,
        linha.disponivel,
        linha.ativo,
        linha.created_at,
        linha.updated_at,
        linha.marcas
    );
}

async function findAll(filtros?: {
    marca_id?: string;
    disponivel?: boolean;
    busca?: string;
    ordenar?: string;
}) {
    let query = supabase
        .from("veiculos")
        .select("*, marcas(id, nome)");

    if (filtros?.marca_id) {
        query = query.eq("marca_id", filtros.marca_id);
    }

    if (filtros?.disponivel !== undefined) {
        query = query.eq("disponivel", filtros.disponivel);
    }

    if (filtros?.busca) {
        query = query.ilike("modelo", `%${filtros.busca}%`);
    }

    if (filtros?.ordenar === "preco_asc") {
        query = query.order("preco", { ascending: true });
    } else if (filtros?.ordenar === "preco_desc") {
        query = query.order("preco", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return data.map(paraVeiculo);
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("veiculos")
        .select("*, marcas(id, nome)")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? paraVeiculo(data) : null;
}

async function create(veiculo: {
    marca_id: string;
    modelo: string;
    ano: number;
    preco: number;
    km?: number;
    combustivel?: string;
    cor?: string;
    disponivel?: boolean;
    ativo?: boolean;
}) {
    const { data, error } = await supabase
        .from("veiculos")
        .insert(veiculo)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraVeiculo(data);
}

async function update(id: string, veiculo: {
    marca_id: string;
    modelo: string;
    ano: number;
    preco: number;
    km?: number;
    combustivel?: string;
    cor?: string;
    disponivel?: boolean;
    ativo?: boolean;
}) {
    const { data, error } = await supabase
        .from("veiculos")
        .update({
            ...veiculo,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return paraVeiculo(data);
}

// Marca o veiculo como disponivel ou indisponivel (usado quando uma venda e registrada, cancelada ou removida)
async function setDisponivel(id: string, disponivel: boolean) {
    const { error } = await supabase
        .from("veiculos")
        .update({
            disponivel,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        throw error;
    }
}

// Reserva o veiculo para uma venda: so marca como indisponivel se ele ainda estiver disponivel.
// E uma consulta so, entao duas vendas ao mesmo tempo nao conseguem pegar o mesmo carro.
// Retorna false se alguem ja tinha reservado.
async function reservar(id: string): Promise<boolean> {
    const { data, error } = await supabase
        .from("veiculos")
        .update({
            disponivel: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("disponivel", true)
        .select("id");

    if (error) {
        throw error;
    }

    return data.length > 0;
}

async function remove(id: string) {
    const { error } = await supabase
        .from("veiculos")
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
    remove,
    setDisponivel,
    reservar
}
