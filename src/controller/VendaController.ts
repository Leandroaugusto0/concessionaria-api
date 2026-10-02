import type { Request, Response } from "express";
import Venda from "../models/Venda.js";
import Veiculo from "../models/Veiculo.js";
import Cliente from "../models/Cliente.js";
import Validacao from "../utils/validacao.js";

const STATUS_VALIDOS = ["pendente", "concluida", "cancelada"];

// Valida os campos que podem ser enviados tanto no create quanto no update.
// Retorna a mensagem de erro, ou null se estiver tudo certo.
function validarDadosVenda(body: any): string | null {
  const { vendedor, preco_venda, forma_pagamento, status } = body;

  if (vendedor === undefined || preco_venda === undefined) {
    return "vendedor e preco_venda sao obrigatorios.";
  }

  if (typeof vendedor !== "string" || !vendedor.trim()) {
    return "O vendedor e obrigatorio.";
  }

  if (vendedor.length > 150) {
    return "O vendedor deve ter no maximo 150 caracteres.";
  }

  if (typeof preco_venda !== "number" || preco_venda <= 0) {
    return "preco_venda tem que ser maior que zero.";
  }

  if (!Validacao.isTextoOpcional(forma_pagamento)) {
    return "forma_pagamento deve ser um texto.";
  }

  if (forma_pagamento && forma_pagamento.length > 30) {
    return "forma_pagamento deve ter no maximo 30 caracteres.";
  }

  if (
    status !== undefined &&
    !STATUS_VALIDOS.includes(status)
  ) {
    return `Status invalido. Use: ${STATUS_VALIDOS.join(", ")}.`;
  }

  return null;
}

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
    const venda = await Venda.findById(id);

    if (!venda) {
      res.status(404).json({
        message: "Venda nao encontrada.",
      });

      return;
    }

    res.status(200).json(venda);
  } catch (error) {
    console.error("Erro ao buscar venda: ", error);

    res.status(500).json({
      message: "Erro ao buscar venda.",
    });
  }
}

async function create(req: Request, res: Response) {
  const {
    veiculo_id,
    cliente_id,
    vendedor,
    preco_venda,
    forma_pagamento,
    status,
  } = req.body;

  if (!veiculo_id || !cliente_id) {
    res.status(400).json({
      message: "veiculo_id e cliente_id sao obrigatorios.",
    });

    return;
  }

  if (
    !Validacao.isUuid(veiculo_id) ||
    !Validacao.isUuid(cliente_id)
  ) {
    res.status(400).json({
      message: "veiculo_id ou cliente_id invalido.",
    });

    return;
  }

  const erro = validarDadosVenda(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  try {
    const veiculo = await Veiculo.findById(veiculo_id);

    if (!veiculo) {
      res.status(400).json({
        message: "O veiculo informado nao existe.",
      });

      return;
    }

    // um veiculo so pode ser vendido se ainda estiver disponivel
    if (!veiculo.disponivel) {
      res.status(400).json({
        message: "O veiculo informado nao esta disponivel para venda.",
      });

      return;
    }

    const cliente = await Cliente.findById(cliente_id);

    if (!cliente) {
      res.status(400).json({
        message: "O cliente informado nao existe.",
      });

      return;
    }

    const venda = await Venda.create({
      veiculo_id,
      cliente_id,
      vendedor: vendedor.trim(),
      preco_venda,
      forma_pagamento,
      status,
    });

    // depois de vender, o veiculo deixa de ficar disponivel
    if (status !== "cancelada") {
      await Veiculo.setDisponivel(veiculo_id, false);
    }

    res.status(201).json(venda);
  } catch (error) {
    console.error("Erro ao criar venda: ", error);

    res.status(500).json({
      message: "Erro ao criar venda.",
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

  const erro = validarDadosVenda(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  // veiculo_id e cliente_id nao podem ser alterados depois da venda registrada
  const {
    vendedor,
    preco_venda,
    forma_pagamento,
    status,
  } = req.body;

  try {
    const existe = await Venda.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Venda nao encontrada.",
      });

      return;
    }

    // se a venda cancelada for reativada, o veiculo precisa estar livre
    if (existe.status === "cancelada" && status !== "cancelada") {
      const veiculo = await Veiculo.findById(existe.veiculo_id);

      if (!veiculo || !veiculo.disponivel) {
        res.status(400).json({
          message: "Nao e possivel reativar a venda porque o veiculo nao esta mais disponivel.",
        });

        return;
      }
    }

    const venda = await Venda.update(id, {
      vendedor: vendedor.trim(),
      preco_venda,
      forma_pagamento,
      status,
    });

    // venda cancelada devolve o veiculo para o estoque; as outras mantem ele vendido
    await Veiculo.setDisponivel(existe.veiculo_id, status === "cancelada");

    res.status(200).json(venda);
  } catch (error) {
    console.error("Erro ao atualizar venda: ", error);

    res.status(500).json({
      message: "Erro ao atualizar venda.",
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
    const existe = await Venda.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Venda nao encontrada.",
      });

      return;
    }

    await Venda.remove(id);

    // se a venda ainda valia, o veiculo volta a ficar disponivel
    if (existe.status !== "cancelada") {
      await Veiculo.setDisponivel(existe.veiculo_id, true);
    }

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
  remove,
};