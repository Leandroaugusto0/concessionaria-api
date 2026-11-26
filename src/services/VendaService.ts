import Venda from "../models/Venda.js";
import VendaRepository from "../repository/VendaRepository.js";
import VeiculoRepository from "../repository/VeiculoRepository.js";
import ClienteRepository from "../repository/ClienteRepository.js";
import Validacao from "../utils/validacao.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";

const STATUS_VALIDOS = ["pendente", "concluida", "cancelada"];

// Valida os campos que podem ser enviados tanto no create quanto no update
function validarDados(dados: any): void {
  const { vendedor, preco_venda, forma_pagamento, status } = dados ?? {};

  if (vendedor === undefined || preco_venda === undefined) {
    throw new ValidationError("vendedor e preco_venda sao obrigatorios.");
  }

  if (typeof vendedor !== "string" || !vendedor.trim()) {
    throw new ValidationError("O vendedor e obrigatorio.");
  }

  if (vendedor.length > 150) {
    throw new ValidationError("O vendedor deve ter no maximo 150 caracteres.");
  }

  if (typeof preco_venda !== "number" || preco_venda <= 0) {
    throw new ValidationError("preco_venda tem que ser maior que zero.");
  }

  if (!Validacao.isTextoOpcional(forma_pagamento)) {
    throw new ValidationError("forma_pagamento deve ser um texto.");
  }

  if (forma_pagamento && forma_pagamento.length > 30) {
    throw new ValidationError("forma_pagamento deve ter no maximo 30 caracteres.");
  }

  if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
    throw new ValidationError(`Status invalido. Use: ${STATUS_VALIDOS.join(", ")}.`);
  }
}

function validarId(id: string): void {
  if (!Validacao.isUuid(id)) {
    throw new ValidationError("Id invalido.");
  }
}

async function listar() {
  return VendaRepository.findAll();
}

async function buscarPorId(id: string) {
  validarId(id);

  const venda = await VendaRepository.findById(id);

  if (!venda) {
    throw new NotFoundError("Venda nao encontrada.");
  }

  return venda;
}

async function criar(dados: any) {
  const { veiculo_id, cliente_id } = dados ?? {};

  if (!veiculo_id || !cliente_id) {
    throw new ValidationError("veiculo_id e cliente_id sao obrigatorios.");
  }

  if (!Validacao.isUuid(veiculo_id) || !Validacao.isUuid(cliente_id)) {
    throw new ValidationError("veiculo_id ou cliente_id invalido.");
  }

  validarDados(dados);

  const veiculo = await VeiculoRepository.findById(veiculo_id);

  if (!veiculo) {
    throw new ValidationError("O veiculo informado nao existe.");
  }

  // um veiculo so pode ser vendido se ainda estiver disponivel
  if (!veiculo.isDisponivel()) {
    throw new ValidationError("O veiculo informado nao esta disponivel para venda.");
  }

  const cliente = await ClienteRepository.findById(cliente_id);

  if (!cliente) {
    throw new ValidationError("O cliente informado nao existe.");
  }

  const venda = new Venda(
    veiculo_id,
    cliente_id,
    dados.vendedor.trim(),
    dados.preco_venda,
    dados.forma_pagamento,
    dados.status
  );

  // venda cancelada nao prende o veiculo
  if (venda.isCancelada()) {
    return VendaRepository.create(venda);
  }

  // reserva o veiculo antes de gravar a venda. Se duas vendas chegarem
  // juntas, so uma consegue reservar
  const reservou = await VeiculoRepository.reservar(veiculo_id);

  if (!reservou) {
    throw new ValidationError("O veiculo informado nao esta disponivel para venda.");
  }

  try {
    return await VendaRepository.create(venda);
  } catch (error) {
    // a venda nao foi gravada, entao o veiculo volta para o estoque
    await VeiculoRepository.setDisponivel(veiculo_id, true);

    throw error;
  }
}

async function atualizar(id: string, dados: any) {
  validarId(id);
  validarDados(dados);

  // veiculo_id e cliente_id nao podem ser alterados depois da venda registrada
  const venda = await VendaRepository.findById(id);

  if (!venda) {
    throw new NotFoundError("Venda nao encontrada.");
  }

  const statusNovo = dados.status ?? venda.getStatus();
  const reativando = venda.isCancelada() && statusNovo !== "cancelada";
  const cancelando = !venda.isCancelada() && statusNovo === "cancelada";

  // se a venda cancelada for reativada, o veiculo precisa estar livre
  if (reativando) {
    const reservou = await VeiculoRepository.reservar(venda.getVeiculoId());

    if (!reservou) {
      throw new ValidationError(
        "Nao e possivel reativar a venda porque o veiculo nao esta mais disponivel."
      );
    }
  }

  // so muda o que veio no corpo da requisicao
  venda.changeVendedor(dados.vendedor.trim());
  venda.changePrecoVenda(dados.preco_venda);

  if (dados.forma_pagamento !== undefined) {
    venda.changeFormaPagamento(dados.forma_pagamento);
  }

  if (dados.status === "cancelada") {
    venda.cancel();
  } else if (dados.status === "concluida") {
    venda.conclude();
  } else if (dados.status === "pendente") {
    venda.reopen();
  }

  let atualizada: Venda;

  try {
    atualizada = await VendaRepository.update(id, venda);
  } catch (error) {
    // a reativacao nao foi gravada, entao o veiculo volta como estava
    if (reativando) {
      await VeiculoRepository.setDisponivel(venda.getVeiculoId(), true);
    }

    throw error;
  }

  // venda cancelada devolve o veiculo para o estoque
  if (cancelando) {
    await VeiculoRepository.setDisponivel(venda.getVeiculoId(), true);
  }

  return atualizada;
}

async function remover(id: string) {
  validarId(id);

  const venda = await VendaRepository.findById(id);

  if (!venda) {
    throw new NotFoundError("Venda nao encontrada.");
  }

  await VendaRepository.remove(id);

  // se a venda ainda valia, o veiculo volta a ficar disponivel
  if (!venda.isCancelada()) {
    await VeiculoRepository.setDisponivel(venda.getVeiculoId(), true);
  }
}

export default {
  listar,
  buscarPorId,
  criar,
  atualizar,
  remover,
};
