import Veiculo from "../models/Veiculo.js";
import VeiculoRepository from "../repository/VeiculoRepository.js";
import MarcaRepository from "../repository/MarcaRepository.js";
import Validacao from "../utils/validacao.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ConflictError from "../errors/ConflictError.js";

type FiltrosVeiculo = {
  marca_id?: string;
  disponivel?: boolean;
  busca?: string;
  ordenar?: string;
};

function validarDados(dados: any): void {
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
  } = dados ?? {};

  const anoMaximo = new Date().getFullYear() + 1;

  if (
    marca_id === undefined ||
    modelo === undefined ||
    ano === undefined ||
    preco === undefined
  ) {
    throw new ValidationError("marca_id, modelo, ano e preco sao obrigatorios.");
  }

  if (!Validacao.isUuid(marca_id)) {
    throw new ValidationError("marca_id invalido.");
  }

  if (typeof modelo !== "string" || !modelo.trim()) {
    throw new ValidationError("O modelo e obrigatorio.");
  }

  if (modelo.length > 150) {
    throw new ValidationError("O modelo deve ter no maximo 150 caracteres.");
  }

  if (!Number.isInteger(ano) || ano < 1950 || ano > anoMaximo) {
    throw new ValidationError(`Ano invalido. Informe um ano entre 1950 e ${anoMaximo}.`);
  }

  if (typeof preco !== "number" || preco <= 0) {
    throw new ValidationError("Preco tem que ser maior que zero.");
  }

  if (km !== undefined && (!Number.isInteger(km) || km < 0)) {
    throw new ValidationError("km deve ser um numero inteiro maior ou igual a zero.");
  }

  if (
    !Validacao.isTextoOpcional(combustivel) ||
    !Validacao.isTextoOpcional(cor)
  ) {
    throw new ValidationError("combustivel e cor devem ser textos.");
  }

  if (
    !Validacao.isBooleanOpcional(disponivel) ||
    !Validacao.isBooleanOpcional(ativo)
  ) {
    throw new ValidationError("Os campos disponivel e ativo devem ser true ou false.");
  }
}

function validarId(id: string): void {
  if (!Validacao.isUuid(id)) {
    throw new ValidationError("Id invalido.");
  }
}

async function validarMarca(marcaId: string): Promise<void> {
  const marca = await MarcaRepository.findById(marcaId);
  if (!marca) throw new ValidationError("A marca informada nao existe.");
}

async function listar(filtros?: FiltrosVeiculo) {
  if (filtros?.marca_id !== undefined && !Validacao.isUuid(filtros.marca_id)) {
    throw new ValidationError("marca_id invalido.");
  }
  return VeiculoRepository.findAll(filtros);
}

async function buscarPorId(id: string) {
  validarId(id);

  const veiculo = await VeiculoRepository.findById(id);
  if (!veiculo) throw new NotFoundError("Veiculo nao encontrado.");

  return veiculo;
}

async function criar(dados: any) {
  validarDados(dados);
  await validarMarca(dados.marca_id);

  const veiculo = new Veiculo(
    dados.marca_id,
    dados.modelo.trim(),
    dados.ano,
    dados.preco,
    dados.km,
    dados.combustivel,
    dados.cor,
    dados.disponivel,
    dados.ativo,
  );

  return VeiculoRepository.create(veiculo);
}

async function atualizar(id: string, dados: any) {
  validarId(id);
  validarDados(dados);

  const veiculo = await VeiculoRepository.findById(id);
  if (!veiculo) throw new NotFoundError("Veiculo nao encontrado.");

  await validarMarca(dados.marca_id);

  veiculo.changeMarca(dados.marca_id);
  veiculo.rename(dados.modelo.trim());
  veiculo.changeAno(dados.ano);
  veiculo.changePreco(dados.preco);

  if (dados.km !== undefined) veiculo.changeKm(dados.km);
  if (dados.combustivel !== undefined) veiculo.changeCombustivel(dados.combustivel);
  if (dados.cor !== undefined) veiculo.changeCor(dados.cor);
  if (dados.disponivel === true) veiculo.markAvailable();
  else if (dados.disponivel === false) veiculo.markUnavailable();
  if (dados.ativo === true) veiculo.activate();
  else if (dados.ativo === false) veiculo.deactivate();

  return VeiculoRepository.update(id, veiculo);
}

async function remover(id: string): Promise<void> {
  validarId(id);

  const veiculo = await VeiculoRepository.findById(id);
  if (!veiculo) throw new NotFoundError("Veiculo nao encontrado.");

  try {
    await VeiculoRepository.remove(id);
  } catch (error) {
    if (Validacao.isErroChaveEstrangeira(error)) {
      throw new ConflictError(
        "Nao e possivel remover o veiculo porque existem vendas registradas para ele.",
      );
    }
    throw error;
  }
}

export default { listar, buscarPorId, criar, atualizar, remover };
