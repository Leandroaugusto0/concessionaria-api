import type { Request, Response } from "express";
import Marca from "../models/Marca.js";

async function getAll(req: Request, res: Response) {
    try {
        const marcas = await Marca.findAll();

        res.status(200).json(marcas);
    } catch (error) {
        console.error("Erro ao buscar marcas: ", error);

        res.status(500).json({
            message: "Erro ao buscar marcas.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
        const marca = await Marca.findById(id);

        res.status(200).json(marca);
    } catch (error) {
        console.error("Erro ao buscar marca: ", error);

        res.status(404).json({
            message: "Marca nao encontrada.",
        });
    }
}

async function create(req: Request, res: Response) {
    const { nome } = req.body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
        res.status(400).json({
            message: "O nome da marca e obrigatorio."
        });
        return;
    }

    try {
        const marca = await Marca.create(req.body);

        res.status(201).json(marca);
    } catch (error) {
        console.error("Erro ao criar marca: ", error);

        res.status(500).json({
            message: "Erro ao criar marca.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
        res.status(400).json({
            message: "O nome da marca e obrigatorio."
        });
        return;
    }

    try {
        const marca = await Marca.update(id, req.body);

        res.status(200).json(marca);
    } catch (error) {
        console.error("Erro ao atualizar marca: ", error);

        res.status(500).json({
            message: "Erro ao atualizar marca.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    try {
        await Marca.remove(id);

        res.status(200).json({
            message: "Marca removida com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao remover marca: ", error);

        res.status(500).json({
            message: "Erro ao remover marca.",
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
