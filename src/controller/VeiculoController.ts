import type { Request, Response } from "express";
import Veiculo from "../models/Veiculo.js";

async function getAll(req: Request, res: Response) {
    try {
        const veiculos = await Veiculo.findAll();

        res.status(200).json(veiculos);
    } catch (error) {
        console.error("Erro ao buscar veiculos: ", error);

        res.status(500).json({
            message: "Erro ao buscar veiculos.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
        const veiculo = await Veiculo.findById(id);

        res.status(200).json(veiculo);
    } catch (error) {
        console.error("Erro ao buscar veiculo: ", error);

        res.status(404).json({
            message: "Veiculo nao encontrado.",
        });
    }
}

async function create(req: Request, res: Response) {
    const { marca_id, modelo, ano, preco } = req.body;

    if (!marca_id || !modelo || !ano || !preco) {
        res.status(400).json({
            message: "marca_id, modelo, ano e preco sao obrigatorios."
        });
        return;
    }

    try {
        const veiculo = await Veiculo.create(req.body);

        res.status(201).json(veiculo);
    } catch (error) {
        console.error("Erro ao criar veiculo: ", error);

        res.status(500).json({
            message: "Erro ao criar veiculo.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const { marca_id, modelo, ano, preco } = req.body;

    if (!marca_id || !modelo || !ano || !preco) {
        res.status(400).json({
            message: "marca_id, modelo, ano e preco sao obrigatorios."
        });
        return;
    }

    try {
        const veiculo = await Veiculo.update(id, req.body);

        res.status(200).json(veiculo);
    } catch (error) {
        console.error("Erro ao atualizar veiculo: ", error);

        res.status(500).json({
            message: "Erro ao atualizar veiculo.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
        await Veiculo.remove(id);

        res.status(200).json({
            message: "Veiculo removido com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao remover veiculo: ", error);

        res.status(500).json({
            message: "Erro ao remover veiculo.",
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
