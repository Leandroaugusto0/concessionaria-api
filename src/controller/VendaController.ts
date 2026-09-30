import type { Request, Response } from "express";
import Venda from "../models/Venda.js";

async function getAll(req: Request, res: Response) {
    try {
        const vendas = await Venda.findAll();

        res.status(200).json(vendas);
    } catch (error) {
        console.error("Erro ao buscar vendas: ", error);

        res.status(500).json({
            message: "Erro ao buscar vendas.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
        const venda = await Venda.findById(id);

        res.status(200).json(venda);
    } catch (error) {
        console.error("Erro ao buscar venda: ", error);

        res.status(404).json({
            message: "Venda nao encontrada.",
        });
    }
}

async function create(req: Request, res: Response) {
    const { veiculo_id, cliente_id, vendedor, preco_venda } = req.body;

    if (!veiculo_id || !cliente_id || !vendedor || !preco_venda) {
        res.status(400).json({
            message: "veiculo_id, cliente_id, vendedor e preco_venda sao obrigatorios."
        });
        return;
    }

    if (typeof preco_venda !== "number" || preco_venda <= 0) {
        res.status(400).json({
            message: "preco_venda tem que ser maior que zero."
        });
        return;
    }

    try {
        const venda = await Venda.create(req.body);

        res.status(201).json(venda);
    } catch (error) {
        console.error("Erro ao criar venda: ", error);

        res.status(500).json({
            message: "Erro ao criar venda.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
        const venda = await Venda.update(id, req.body);

        res.status(200).json(venda);
    } catch (error) {
        console.error("Erro ao atualizar venda: ", error);

        res.status(500).json({
            message: "Erro ao atualizar venda.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
        await Venda.remove(id);

        res.status(200).json({
            message: "Venda removida com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao remover venda: ", error);

        res.status(500).json({
            message: "Erro ao remover venda.",
        });
    }
}

export default {
    getAll,
    getById,
    create,
    update,
    remove
}
