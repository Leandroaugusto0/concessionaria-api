import { beforeEach, describe, expect, it, vi } from "vitest";
import Cliente from "../../src/models/Cliente.js";
import ClienteRepository from "../../src/repository/ClienteRepository.js";
import ClienteService from "../../src/services/ClienteService.js";

vi.mock("../../src/repository/ClienteRepository.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findAllWithCpf: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const ID = "11111111-1111-4111-8111-111111111111";
const OUTRO_ID = "22222222-2222-4222-8222-222222222222";

function clienteExemplo(overrides: Partial<{
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  ativo: boolean;
}> = {}) {
  return Cliente.restore(
    ID,
    overrides.nome ?? "ZZ-Cliente Fictício",
    overrides.email === undefined ? "cliente@example.test" : overrides.email,
    overrides.telefone ?? null,
    overrides.cpf ?? null,
    overrides.ativo ?? true,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}

const dadosValidos = {
  nome: "  ZZ-Cliente Novo  ",
  email: "novo@example.test",
  cpf: "123.456.789-01",
};

describe("ClienteService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("criar", () => {
    it("cria cliente válido e remove espaços do nome", async () => {
      vi.mocked(ClienteRepository.findAllWithCpf).mockResolvedValue([]);
      vi.mocked(ClienteRepository.create).mockResolvedValue(clienteExemplo({ nome: "ZZ-Cliente Novo" }));

      const cliente = await ClienteService.criar(dadosValidos);

      expect(cliente.getNome()).toBe("ZZ-Cliente Novo");
      expect(ClienteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ nome: "ZZ-Cliente Novo", cpf: dadosValidos.cpf }),
      );
    });

    it("retorna 409 quando o CPF já está cadastrado, mesmo com pontuação diferente", async () => {
      vi.mocked(ClienteRepository.findAllWithCpf).mockResolvedValue([
        { id: OUTRO_ID, cpf: "12345678901" },
      ]);

      await expect(ClienteService.criar(dadosValidos)).rejects.toMatchObject({
        statusCode: 409,
        message: "Ja existe um cliente cadastrado com este CPF.",
      });
      expect(ClienteRepository.create).not.toHaveBeenCalled();
    });

    it.each([
      [{ nome: "   " }, "O nome do cliente e obrigatorio."],
      [{ nome: "x".repeat(151) }, "O nome do cliente deve ter no maximo 150 caracteres."],
      [{ nome: "ZZ-Cliente", email: "email-invalido" }, "Email invalido."],
      [{ nome: "ZZ-Cliente", telefone: "1".repeat(21) }, "O telefone deve ter no maximo 20 caracteres."],
      [{ nome: "ZZ-Cliente", cpf: "123" }, "CPF invalido. Informe os 11 numeros."],
      [{ nome: "ZZ-Cliente", ativo: "sim" }, "O campo ativo deve ser true ou false."],
      [undefined, "O nome do cliente e obrigatorio."],
    ])("rejeita dados inválidos antes de acessar o banco", async (dados, message) => {
      await expect(ClienteService.criar(dados)).rejects.toMatchObject({ statusCode: 400, message });
      expect(ClienteRepository.create).not.toHaveBeenCalled();
      expect(ClienteRepository.findAllWithCpf).not.toHaveBeenCalled();
    });
  });

  describe("consultar", () => {
    it("busca cliente existente", async () => {
      const cliente = clienteExemplo();
      vi.mocked(ClienteRepository.findById).mockResolvedValue(cliente);

      await expect(ClienteService.buscarPorId(ID)).resolves.toBe(cliente);
    });

    it("retorna 404 para cliente inexistente", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(null);

      await expect(ClienteService.buscarPorId(ID)).rejects.toMatchObject({
        statusCode: 404,
        message: "Cliente nao encontrado.",
      });
    });

    it("rejeita ID inválido sem consultar o banco", async () => {
      await expect(ClienteService.buscarPorId("abc")).rejects.toMatchObject({ statusCode: 400 });
      expect(ClienteRepository.findById).not.toHaveBeenCalled();
    });

    it("lista clientes", async () => {
      const clientes = [clienteExemplo()];
      vi.mocked(ClienteRepository.findAll).mockResolvedValue(clientes);

      await expect(ClienteService.listar()).resolves.toBe(clientes);
    });
  });

  describe("atualizar", () => {
    it("atualiza o nome e preserva campos omitidos", async () => {
      const existente = clienteExemplo({ cpf: "12345678901", telefone: "11999999999" });
      vi.mocked(ClienteRepository.findById).mockResolvedValue(existente);
      vi.mocked(ClienteRepository.update).mockResolvedValue(clienteExemplo({ nome: "ZZ-Cliente Alterado" }));

      await ClienteService.atualizar(ID, { nome: "ZZ-Cliente Alterado" });

      expect(ClienteRepository.update).toHaveBeenCalledWith(ID, expect.objectContaining({
        nome: "ZZ-Cliente Alterado",
        email: "cliente@example.test",
        telefone: "11999999999",
        cpf: "12345678901",
        ativo: true,
      }));
      expect(ClienteRepository.findAllWithCpf).not.toHaveBeenCalled();
    });

    it("permite manter o próprio CPF com outra pontuação", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(clienteExemplo({ cpf: "12345678901" }));
      vi.mocked(ClienteRepository.update).mockResolvedValue(clienteExemplo());

      await ClienteService.atualizar(ID, { nome: "ZZ-Cliente Atualizado", cpf: "123.456.789-01" });

      expect(ClienteRepository.findAllWithCpf).not.toHaveBeenCalled();
      expect(ClienteRepository.update).toHaveBeenCalledOnce();
    });

    it("retorna 404 para atualizar cliente inexistente", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(null);

      await expect(ClienteService.atualizar(ID, dadosValidos)).rejects.toMatchObject({ statusCode: 404 });
      expect(ClienteRepository.update).not.toHaveBeenCalled();
    });

    it("retorna 409 ao trocar para CPF de outro cliente", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(clienteExemplo());
      vi.mocked(ClienteRepository.findAllWithCpf).mockResolvedValue([
        { id: OUTRO_ID, cpf: "12345678901" },
      ]);

      await expect(
        ClienteService.atualizar(ID, { nome: "ZZ-Cliente Atualizado", cpf: "123.456.789-01" }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(ClienteRepository.update).not.toHaveBeenCalled();
    });

    it("rejeita dados inválidos sem consultar o repositório", async () => {
      await expect(ClienteService.atualizar(ID, { nome: "" })).rejects.toMatchObject({ statusCode: 400 });
      expect(ClienteRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("remover", () => {
    it("remove cliente existente", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(clienteExemplo());
      vi.mocked(ClienteRepository.remove).mockResolvedValue(undefined);

      await expect(ClienteService.remover(ID)).resolves.toBeUndefined();
      expect(ClienteRepository.remove).toHaveBeenCalledWith(ID);
    });

    it("retorna 404 ao remover cliente inexistente", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(null);

      await expect(ClienteService.remover(ID)).rejects.toMatchObject({ statusCode: 404 });
      expect(ClienteRepository.remove).not.toHaveBeenCalled();
    });

    it("converte violação de chave estrangeira em conflito 409", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(clienteExemplo());
      vi.mocked(ClienteRepository.remove).mockRejectedValue({ code: "23503" });

      await expect(ClienteService.remover(ID)).rejects.toMatchObject({
        statusCode: 409,
        message: "Nao e possivel remover o cliente porque existem vendas registradas para ele.",
      });
    });
  });
});

describe("Cliente", () => {
  it("restaura uma instância e expõe os dados no JSON do banco", () => {
    const cliente = clienteExemplo();

    expect(cliente.getId()).toBe(ID);
    expect(cliente.toJSON()).toEqual({
      id: ID,
      nome: "ZZ-Cliente Fictício",
      email: "cliente@example.test",
      telefone: null,
      cpf: null,
      ativo: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    cliente.deactivate();
    expect(cliente.isAtivo()).toBe(false);
    cliente.activate();
    expect(cliente.isAtivo()).toBe(true);
  });
});
