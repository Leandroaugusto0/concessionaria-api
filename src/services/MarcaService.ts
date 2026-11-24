import Marca from "../models/Marca.js";
import MarcaRepository from "../repository/MarcaRepository.js";
import Validacao from "../utils/validacao.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ConflictError from "../errors/ConflictError.js";

// Valida os dados recebidos no corpo da requisicao
function validarDados(dados: any): void {
  const { nome, pais, ativo } = dados ?? {};

  if (!nome || typeof nome !== "string" || !nome.trim()) {
    throw new ValidationError("O nome da marca e obrigatorio.");
  }

  if (nome.length > 100) {
    throw new ValidationError("O nome da marca deve ter no maximo 100 caracteres.");
  }

  if (!Validacao.isTextoOpcional(pais)) {
    throw new ValidationError("O pais deve ser um texto.");
  }

  if (!Validacao.isBooleanOpcional(ativo)) {
    throw new ValidationError("O campo ativo deve ser true ou false.");
  }
}

function validarId(id: string): void {
  if (!Validacao.isUuid(id)) {
    throw new ValidationError("Id invalido.");
  }
}

async function listar() {
  return MarcaRepository.findAll();
}

async function buscarPorId(id: string) {
  validarId(id);

  const marca = await MarcaRepository.findById(id);

  if (!marca) {
    throw new NotFoundError("Marca nao encontrada.");
  }

  return marca;
}

async function criar(dados: any) {
  validarDados(dados);

  const nome = dados.nome.trim();

  // nao pode ter duas marcas com o mesmo nome
  if (await MarcaRepository.findByNome(nome)) {
    throw new ConflictError("Ja existe uma marca com esse nome.");
  }

  const marca = new Marca(nome, dados.pais, dados.ativo);

  return MarcaRepository.create(marca);
}

async function atualizar(id: string, dados: any) {
  validarId(id);
  validarDados(dados);

  const marca = await MarcaRepository.findById(id);

  if (!marca) {
    throw new NotFoundError("Marca nao encontrada.");
  }

  const nome = dados.nome.trim();

  // o nome pode repetir so se for da propria marca
  const mesmoNome = await MarcaRepository.findByNome(nome);

  if (mesmoNome && mesmoNome.getId() !== id) {
    throw new ConflictError("Ja existe uma marca com esse nome.");
  }

  // so muda o que veio no corpo da requisicao
  marca.rename(nome);

  if (dados.pais !== undefined) {
    marca.changePais(dados.pais);
  }

  if (dados.ativo === true) {
    marca.activate();
  } else if (dados.ativo === false) {
    marca.deactivate();
  }

  return MarcaRepository.update(id, marca);
}

async function remover(id: string) {
  validarId(id);

  const marca = await MarcaRepository.findById(id);

  if (!marca) {
    throw new NotFoundError("Marca nao encontrada.");
  }

  try {
    await MarcaRepository.remove(id);
  } catch (error) {
    if (Validacao.isErroChaveEstrangeira(error)) {
      throw new ConflictError(
        "Nao e possivel remover a marca porque existem veiculos cadastrados nela."
      );
    }

    throw error;
  }
}

export default {
  listar,
  buscarPorId,
  criar,
  atualizar,
  remover,
};
