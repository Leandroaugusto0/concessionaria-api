import type { Request, Response, NextFunction } from "express";
import MarcaService from "../services/MarcaService.js";

// O controller so cuida do HTTP: le a requisicao, chama o service
// e devolve a resposta. Os erros vao para o tratamento do app.ts.

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const marcas = await MarcaService.listar();

    res.status(200).json(marcas);
  } catch (error) {
    next(error);
  }
}

async function getById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const marca = await MarcaService.buscarPorId(req.params.id);

    res.status(200).json(marca);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const marca = await MarcaService.criar(req.body);

    res.status(201).json(marca);
  } catch (error) {
    next(error);
  }
}

async function update(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const marca = await MarcaService.atualizar(req.params.id, req.body);

    res.status(200).json(marca);
  } catch (error) {
    next(error);
  }
}

async function remove(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    await MarcaService.remover(req.params.id);

    res.status(200).json({
      message: "Marca removida com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
