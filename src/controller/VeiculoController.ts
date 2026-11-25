import type { Request, Response, NextFunction } from "express";
import VeiculoService from "../services/VeiculoService.js";

async function getAll(req: Request, res: Response, next: NextFunction) {
  const { marca_id, disponivel, busca, ordenar } = req.query;

  try {
    const veiculos = await VeiculoService.listar({
      marca_id: marca_id as string | undefined,
      disponivel: disponivel === undefined ? undefined : disponivel === "true",
      busca: busca as string | undefined,
      ordenar: ordenar as string | undefined,
    });
    res.status(200).json(veiculos);
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
    const veiculo = await VeiculoService.buscarPorId(req.params.id);
    res.status(200).json(veiculo);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const veiculo = await VeiculoService.criar(req.body);
    res.status(201).json(veiculo);
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
    const veiculo = await VeiculoService.atualizar(req.params.id, req.body);
    res.status(200).json(veiculo);
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
    await VeiculoService.remover(req.params.id);
    res.status(200).json({ message: "Veiculo removido com sucesso." });
  } catch (error) {
    next(error);
  }
}

export default { getAll, getById, create, update, remove };
