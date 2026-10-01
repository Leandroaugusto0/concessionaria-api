import type { Request, Response } from "express";
import Marca from "../models/Marca.js";
import Validacao from "../utils/validacao.js";

// Valida os dados recebidos no corpo da requisicao.
// Retorna a mensagem de erro, ou null se estiver tudo certo.
function validarMarca(body: any): string | null {
  const { nome, pais, ativo } = body;

  if (!nome || typeof nome !== "string" || !nome.trim()) {
    return "O nome da marca e obrigatorio.";
  }

  if (nome.length > 100) {
    return "O nome da marca deve ter no maximo 100 caracteres.";
  }

  if (!Validacao.isTextoOpcional(pais)) {
    return "O pais deve ser um texto.";
  }

  if (!Validacao.isBooleanOpcional(ativo)) {
    return "O campo ativo deve ser true ou false.";
  }

  return null;
}

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

async function getById(
  req: Request<{ id: string }>,
  res: Response
) {
  const { id } = req.params;

  if (!Validacao.isUuid(id)) {
    res.status(400).json({
      message: "Id invalido.",
    });

    return;
  }

  try {
    const marca = await Marca.findById(id);

    if (!marca) {
      res.status(404).json({
        message: "Marca nao encontrada.",
      });

      return;
    }

    res.status(200).json(marca);
  } catch (error) {
    console.error("Erro ao buscar marca: ", error);

    res.status(500).json({
      message: "Erro ao buscar marca.",
    });
  }
}

async function create(req: Request, res: Response) {
  const erro = validarMarca(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  const { nome, pais, ativo } = req.body;

  try {
    const marca = await Marca.create({
      nome: nome.trim(),
      pais,
      ativo,
    });

    res.status(201).json(marca);
  } catch (error) {
    console.error("Erro ao criar marca: ", error);

    res.status(500).json({
      message: "Erro ao criar marca.",
    });
  }
}

async function update(
  req: Request<{ id: string }>,
  res: Response
) {
  const { id } = req.params;

  if (!Validacao.isUuid(id)) {
    res.status(400).json({
      message: "Id invalido.",
    });

    return;
  }

  const erro = validarMarca(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  const { nome, pais, ativo } = req.body;

  try {
    const existe = await Marca.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Marca nao encontrada.",
      });

      return;
    }

    const marca = await Marca.update(id, {
      nome: nome.trim(),
      pais,
      ativo,
    });

    res.status(200).json(marca);
  } catch (error) {
    console.error("Erro ao atualizar marca: ", error);

    res.status(500).json({
      message: "Erro ao atualizar marca.",
    });
  }
}

async function remove(
  req: Request<{ id: string }>,
  res: Response
) {
  const { id } = req.params;

  if (!Validacao.isUuid(id)) {
    res.status(400).json({
      message: "Id invalido.",
    });

    return;
  }

  try {
    const existe = await Marca.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Marca nao encontrada.",
      });

      return;
    }

    await Marca.remove(id);

    res.status(200).json({
      message: "Marca removida com sucesso.",
    });
  } catch (error) {
    if (Validacao.isErroChaveEstrangeira(error)) {
      res.status(409).json({
        message:
          "Nao e possivel remover a marca porque existem veiculos cadastrados nela.",
      });

      return;
    }

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
  remove,
};