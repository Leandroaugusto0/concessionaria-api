import type { Request, Response } from "express";
import Cliente from "../models/Cliente.js";
import Validacao from "../utils/validacao.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida os dados recebidos no corpo da requisicao.
// Retorna a mensagem de erro, ou null se estiver tudo certo.
function validarCliente(body: any): string | null {
  const { nome, email, telefone, cpf, ativo } = body;

  if (!nome || typeof nome !== "string" || !nome.trim()) {
    return "O nome do cliente e obrigatorio.";
  }

  if (nome.length > 150) {
    return "O nome do cliente deve ter no maximo 150 caracteres.";
  }

  if (
    !Validacao.isTextoOpcional(email) ||
    !Validacao.isTextoOpcional(telefone) ||
    !Validacao.isTextoOpcional(cpf)
  ) {
    return "email, telefone e cpf devem ser textos.";
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return "Email invalido.";
  }

  if (telefone && telefone.length > 20) {
    return "O telefone deve ter no maximo 20 caracteres.";
  }

  // aceita o cpf com ou sem pontuacao, mas precisa ter 11 numeros
  if (cpf && cpf.replace(/\D/g, "").length !== 11) {
    return "CPF invalido. Informe os 11 numeros.";
  }

  if (!Validacao.isBooleanOpcional(ativo)) {
    return "O campo ativo deve ser true ou false.";
  }

  return null;
}

async function getAll(req: Request, res: Response) {
  try {
    const clientes = await Cliente.findAll();

    res.status(200).json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes: ", error);

    res.status(500).json({
      message: "Erro ao buscar clientes.",
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
    const cliente = await Cliente.findById(id);

    if (!cliente) {
      res.status(404).json({
        message: "Cliente nao encontrado.",
      });

      return;
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente: ", error);

    res.status(500).json({
      message: "Erro ao buscar cliente.",
    });
  }
}

async function create(req: Request, res: Response) {
  const erro = validarCliente(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  const { nome, email, telefone, cpf, ativo } = req.body;

  try {
    const cliente = await Cliente.create({
      nome: nome.trim(),
      email,
      telefone,
      cpf,
      ativo,
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error("Erro ao criar cliente: ", error);

    res.status(500).json({
      message: "Erro ao criar cliente.",
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

  const erro = validarCliente(req.body);

  if (erro) {
    res.status(400).json({
      message: erro,
    });

    return;
  }

  const { nome, email, telefone, cpf, ativo } = req.body;

  try {
    const existe = await Cliente.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Cliente nao encontrado.",
      });

      return;
    }

    const cliente = await Cliente.update(id, {
      nome: nome.trim(),
      email,
      telefone,
      cpf,
      ativo,
    });

    res.status(200).json(cliente);
  } catch (error) {
    console.error("Erro ao atualizar cliente: ", error);

    res.status(500).json({
      message: "Erro ao atualizar cliente.",
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
    const existe = await Cliente.findById(id);

    if (!existe) {
      res.status(404).json({
        message: "Cliente nao encontrado.",
      });

      return;
    }

    await Cliente.remove(id);

    res.status(200).json({
      message: "Cliente removido com sucesso.",
    });
  } catch (error) {
    if (Validacao.isErroChaveEstrangeira(error)) {
      res.status(409).json({
        message:
          "Nao e possivel remover o cliente porque existem vendas registradas para ele.",
      });

      return;
    }

    console.error("Erro ao remover cliente: ", error);

    res.status(500).json({
      message: "Erro ao remover cliente.",
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