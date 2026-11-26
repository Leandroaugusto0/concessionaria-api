import { beforeEach, describe, expect, it, vi } from "vitest";
import ClienteRepository from "../../src/repository/ClienteRepository.js";

const supabase = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("../../src/config/supabase.js", () => ({ default: supabase }));

const ID = "11111111-1111-4111-8111-111111111111";
const registro = {
  id: ID,
  nome: "ZZ-Cliente Repositório",
  email: "cliente@example.test",
  telefone: null,
  cpf: null,
  ativo: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("ClienteRepository", () => {
  let resposta: { data: any; error: any };
  let query: any;

  beforeEach(() => {
    vi.resetAllMocks();
    resposta = { data: null, error: null };
    query = {};
    for (const metodo of ["select", "eq", "maybeSingle", "not", "insert", "single", "update", "delete"]) {
      query[metodo] = vi.fn(() => query);
    }
    query.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
      Promise.resolve(resposta).then(resolve, reject);
    supabase.from.mockReturnValue(query);
  });

  it("lista clientes e restaura as instâncias", async () => {
    resposta.data = [registro];

    const clientes = await ClienteRepository.findAll();

    expect(clientes[0].getId()).toBe(ID);
    expect(clientes[0].getNome()).toBe("ZZ-Cliente Repositório");
  });

  it("propaga erro ao listar", async () => {
    resposta.error = new Error("falha ao listar");

    await expect(ClienteRepository.findAll()).rejects.toThrow("falha ao listar");
  });

  it("busca cliente por id", async () => {
    resposta.data = registro;

    const cliente = await ClienteRepository.findById(ID);

    expect(query.eq).toHaveBeenCalledWith("id", ID);
    expect(cliente?.getEmail()).toBe("cliente@example.test");
  });

  it("retorna null quando o id não existe", async () => {
    resposta.data = null;

    await expect(ClienteRepository.findById(ID)).resolves.toBeNull();
  });

  it("propaga erro ao buscar por id", async () => {
    resposta.error = new Error("falha ao buscar");

    await expect(ClienteRepository.findById(ID)).rejects.toThrow("falha ao buscar");
  });

  it("consulta ids e CPFs cadastrados", async () => {
    resposta.data = [{ id: ID, cpf: "12345678901" }];

    await expect(ClienteRepository.findAllWithCpf()).resolves.toEqual(resposta.data);
    expect(query.not).toHaveBeenCalledWith("cpf", "is", null);
  });

  it("propaga erro ao consultar CPFs", async () => {
    resposta.error = new Error("falha ao buscar CPFs");

    await expect(ClienteRepository.findAllWithCpf()).rejects.toThrow("falha ao buscar CPFs");
  });

  it("cadastra cliente e devolve uma instância", async () => {
    resposta.data = registro;

    const cliente = await ClienteRepository.create({ nome: registro.nome });

    expect(query.insert).toHaveBeenCalledWith({ nome: registro.nome });
    expect(cliente.getId()).toBe(ID);
  });

  it("propaga erro ao cadastrar", async () => {
    resposta.error = new Error("falha ao cadastrar");

    await expect(ClienteRepository.create({ nome: registro.nome })).rejects.toThrow("falha ao cadastrar");
  });

  it("atualiza cliente e devolve uma instância", async () => {
    resposta.data = { ...registro, nome: "ZZ-Cliente Atualizado" };

    const cliente = await ClienteRepository.update(ID, { nome: "ZZ-Cliente Atualizado" });

    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ nome: "ZZ-Cliente Atualizado" }));
    expect(cliente.getNome()).toBe("ZZ-Cliente Atualizado");
  });

  it("propaga erro ao atualizar", async () => {
    resposta.error = new Error("falha ao atualizar");

    await expect(ClienteRepository.update(ID, { nome: registro.nome })).rejects.toThrow("falha ao atualizar");
  });

  it("remove cliente", async () => {
    resposta.data = null;

    await expect(ClienteRepository.remove(ID)).resolves.toBeUndefined();
    expect(query.delete).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("id", ID);
  });

  it("propaga erro ao remover", async () => {
    resposta.error = new Error("falha ao remover");

    await expect(ClienteRepository.remove(ID)).rejects.toThrow("falha ao remover");
  });
});
