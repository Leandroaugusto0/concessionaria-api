import type { Request, Response, NextFunction } from "express";
import VendaService from "../services/VendaService.js";

// O controller so cuida do HTTP: le a requisicao, chama o service
// e devolve a resposta. Os erros vao para o tratamento do app.ts.

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const vendas = await VendaService.listar();

    res.status(200).json(vendas);
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
    const venda = await VendaService.buscarPorId(req.params.id);

    res.status(200).json(venda);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const venda = await VendaService.criar(req.body);

    res.status(201).json(venda);
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
    const venda = await VendaService.atualizar(req.params.id, req.body);

    res.status(200).json(venda);
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
    await VendaService.remover(req.params.id);

    res.status(200).json({
      message: "Venda removida com sucesso.",
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
