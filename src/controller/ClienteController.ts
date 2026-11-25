import type { Request, Response, NextFunction } from "express";
import ClienteService from "../services/ClienteService.js";

async function getAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const clientes = await ClienteService.listar();
    res.status(200).json(clientes);
  } catch (error) {
    next(error);
  }
}

async function getById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const cliente = await ClienteService.buscarPorId(req.params.id);
    res.status(200).json(cliente);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const cliente = await ClienteService.criar(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
}

async function update(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const cliente = await ClienteService.atualizar(req.params.id, req.body);
    res.status(200).json(cliente);
  } catch (error) {
    next(error);
  }
}

async function remove(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    await ClienteService.remover(req.params.id);
    res.status(200).json({ message: "Cliente removido com sucesso." });
  } catch (error) {
    next(error);
  }
}

export default { getAll, getById, create, update, remove };
