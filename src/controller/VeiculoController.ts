import type { Request, Response } from "express";
import Veiculo from "../models/Veiculo.js";
import Marca from "../models/Marca.js";
import Validacao from "../utils/validacao.js";

// Valida os dados recebidos no corpo da requisicao.
// Retorna a mensagem de erro, ou null se estiver tudo certo.
function validarVeiculo(body: any): string | null {
  const {
    marca_id,
    modelo,
    ano,
    preco,
    km,
    combustivel,
    cor,
    disponivel,
    ativo,
  } = body;

  const anoMaximo = new Date().getFullYear() + 1;

  if (
    marca_id === undefined ||
    modelo === undefined ||
    ano === undefined ||
    preco === undefined
  ) {
    return "marca_id, modelo, ano e preco sao obrigatorios.";
  }

  if (!Validacao.isUuid(marca_id)) {
    return "marca_id invalido.";
  }

  if (typeof modelo !== "string" || !modelo.trim()) {
    return "O modelo e obrigatorio.";
  }

  if (modelo.length > 150) {
    return "O modelo deve ter no maximo 150 caracteres.";
  }

  if (!Number.isInteger(ano) || ano < 1950 || ano > anoMaximo) {
    return `Ano invalido. Informe um ano entre 1950 e ${anoMaximo}.`;
  }

  if (typeof preco !== "number" || preco <= 0) {
    return "Preco tem que ser maior que zero.";
  }

  if (km !== undefined && (!Number.isInteger(km) || km < 0)) {
    return "km deve ser um numero inteiro maior ou igual a zero.";
  }

  if (
    !Validacao.isTextoOpcional(combustivel) ||
    !Validacao.isTextoOpcional(cor)
  ) {
    return "combustivel e cor devem ser textos.";
  }

  if (
    !Validacao.isBooleanOpcional(disponivel) ||
    !Validacao.isBooleanOpcional(ativo)
  ) {
    return "Os campos disponivel e ativo devem ser true ou false.";
  }

  return null;
}

async function getAll(req: Request, res: Response) {
  const { marca_id, disponivel, busca, ordenar } = req.query;

  if (marca_id !== undefined && !Validacao.isUuid(marca_id)) {
    res.status(400).json({
      message: "marca_id invalido.",
    });

    return;
  }

  try {
    const veiculos = await Veiculo.findAll({
      marca_id: marca_id as string | undefined,
      disponivel:
        disponivel === undefined ? undefined : disponivel === "true",
      busca: busca as string | undefined,
      ordenar: ordenar as string | undefined,
    });

    res.status(200).json(veiculos);
  } catch (error) {
    console.error("Erro ao buscar veiculos: ", error);

    res.status(500).json({
      message: "Erro ao buscar veiculos.",
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
    const veiculo = await Veiculo.findById(id);

    if (!veiculo) {
      res.status(404).json({
        message: "Veiculo nao encontrado.",
      });

      return;
    }

    res.status(200).json(veiculo);
  } catch (error) {
    console.error("Erro ao buscar veiculo: ", error);

    res.status(500).json({
      message: "Erro ao buscar veiculo.",
    });
  }
}

async function create(req: Request, res: Response) {
  const erro = validarVeiculo(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  const {
    marca_id,
    modelo,
    ano,
    preco,
    km,
    combustivel,
    cor,
    disponivel,
    ativo,
  } = req.body;

  try {
    const marca = await Marca.findById(marca_id);

    if (!marca) {
      res.status(400).json({
        message: "A marca informada nao existe.",
      });

      return;
    }

    const veiculo = await Veiculo.create({
      marca_id,
      modelo: modelo.trim(),
      ano,
      preco,
      km,
      combustivel,
      cor,
      disponivel,
      ativo,
    });

    res.status(201).json(veiculo);
  } catch (error) {
    console.error("Erro ao criar veiculo: ", error);

    res.status(500).json({
      message: "Erro ao criar veiculo.",
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

  const erro = validarVeiculo(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  const {
    marca_id,
    modelo,
    ano,
    preco,
    km,
    combustivel,
    cor,
    disponivel,
    ativo,
  } = req.body;

  try {
    const existe = await Veiculo.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Veiculo nao encontrado.",
      });

      return;
    }

    const marca = await Marca.findById(marca_id);

    if (!marca) {
      res.status(400).json({
        message: "A marca informada nao existe.",
      });

      return;
    }

    const veiculo = await Veiculo.update(id, {
      marca_id,
      modelo: modelo.trim(),
      ano,
      preco,
      km,
      combustivel,
      cor,
      disponivel,
      ativo,
    });

    res.status(200).json(veiculo);
  } catch (error) {
    console.error("Erro ao atualizar veiculo: ", error);

    res.status(500).json({
      message: "Erro ao atualizar veiculo.",
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
    const existe = await Veiculo.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Veiculo nao encontrado.",
      });

      return;
    }

    await Veiculo.remove(id);

    res.status(200).json({
      message: "Veiculo removido com sucesso.",
    });
  } catch (error) {
    if (Validacao.isErroChaveEstrangeira(error)) {
      res.status(409).json({
        message:
          "Nao e possivel remover o veiculo porque existem vendas registradas para ele.",
      });

      return;
    }

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
  remove,
};