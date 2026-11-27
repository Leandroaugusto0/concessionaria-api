import ClienteRepository from "../repository/ClienteRepository.js";
import Cliente from "../models/Cliente.js";
import Validacao from "../utils/validacao.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ConflictError from "../errors/ConflictError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarDados(dados: any): void {
  const { nome, email, telefone, cpf, ativo } = dados ?? {};

  if (!nome || typeof nome !== "string" || !nome.trim()) {
    throw new ValidationError("O nome do cliente e obrigatorio.");
  }

  if (nome.length > 150) {
    throw new ValidationError("O nome do cliente deve ter no maximo 150 caracteres.");
  }

  if (cpf === undefined || cpf === null || cpf === "") {
    throw new ValidationError("O CPF do cliente e obrigatorio.");
  }

  if (
    !Validacao.isTextoOpcional(email) ||
    !Validacao.isTextoOpcional(telefone) ||
    !Validacao.isTextoOpcional(cpf)
  ) {
    throw new ValidationError("email, telefone e cpf devem ser textos.");
  }

  if (email && !EMAIL_REGEX.test(email)) {
    throw new ValidationError("Email invalido.");
  }

  if (telefone && telefone.length > 20) {
    throw new ValidationError("O telefone deve ter no maximo 20 caracteres.");
  }

  if (cpf.replace(/\D/g, "").length !== 11) {
    throw new ValidationError("CPF invalido. Informe os 11 numeros.");
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

function cpfNormalizado(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

async function validarCpfDisponivel(cpf: string | null | undefined, ignorarId?: string): Promise<void> {
  if (!cpf) return;

  const cpfAlvo = cpfNormalizado(cpf);
  const clientes = await ClienteRepository.findAllWithCpf();
  const duplicado = clientes.some(
    (cliente) => cliente.id !== ignorarId &&
      cliente.cpf !== null &&
      cpfNormalizado(cliente.cpf) === cpfAlvo,
  );

  if (duplicado) {
    throw new ConflictError("Ja existe um cliente cadastrado com este CPF.");
  }
}

async function listar() {
  return ClienteRepository.findAll();
}

async function buscarPorId(id: string) {
  validarId(id);

  const cliente = await ClienteRepository.findById(id);
  if (!cliente) throw new NotFoundError("Cliente nao encontrado.");

  return cliente;
}

async function criar(dados: any) {
  validarDados(dados);
  await validarCpfDisponivel(dados.cpf);

  const cliente = new Cliente(
    dados.nome.trim(),
    dados.email,
    dados.telefone,
    dados.cpf,
    dados.ativo,
  );

  return ClienteRepository.create(cliente.toJSON());
}

async function atualizar(id: string, dados: any) {
  validarId(id);
  validarDados(dados);

  const existente = await ClienteRepository.findById(id);
  if (!existente) throw new NotFoundError("Cliente nao encontrado.");

  const cpfMudou = !existente.getCpf() ||
    cpfNormalizado(dados.cpf) !== cpfNormalizado(existente.getCpf()!);

  if (cpfMudou) await validarCpfDisponivel(dados.cpf, id);

  const cliente = new Cliente(
    dados.nome.trim(),
    dados.email === undefined ? existente.getEmail() : dados.email,
    dados.telefone === undefined ? existente.getTelefone() : dados.telefone,
    dados.cpf,
    dados.ativo === undefined ? existente.isAtivo() : dados.ativo,
  );

  return ClienteRepository.update(id, cliente.toJSON());
}

async function remover(id: string): Promise<void> {
  validarId(id);

  const cliente = await ClienteRepository.findById(id);
  if (!cliente) throw new NotFoundError("Cliente nao encontrado.");

  try {
    await ClienteRepository.remove(id);
  } catch (error) {
    if (Validacao.isErroChaveEstrangeira(error)) {
      throw new ConflictError(
        "Nao e possivel remover o cliente porque existem vendas registradas para ele.",
      );
    }

    throw error;
  }
}

export default { listar, buscarPorId, criar, atualizar, remover };
