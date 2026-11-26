import { describe, it, expect, vi, beforeEach } from "vitest";
import Venda from "../../src/models/Venda.js";
import VendaRepository from "../../src/repository/VendaRepository.js";
import VeiculoRepository from "../../src/repository/VeiculoRepository.js";
import Veiculo from "../../src/models/Veiculo.js";
import ClienteRepository from "../../src/repository/ClienteRepository.js";
import VendaService from "../../src/services/VendaService.js";

// repository, veiculo e cliente sao trocados por falsos, entao nao usa o banco
vi.mock("../../src/repository/VendaRepository.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("../../src/repository/VeiculoRepository.js", () => ({
  default: {
    findById: vi.fn(),
    setDisponivel: vi.fn(),
    reservar: vi.fn(),
  },
}));

vi.mock("../../src/repository/ClienteRepository.js", () => ({
  default: {
    findById: vi.fn(),
    findAllWithCpf: vi.fn(),
  },
}));

const ID = "11111111-1111-4111-8111-111111111111";
const VEICULO_ID = "22222222-2222-4222-8222-222222222222";
const CLIENTE_ID = "33333333-3333-4333-8333-333333333333";

const dadosValidos = {
  veiculo_id: VEICULO_ID,
  cliente_id: CLIENTE_ID,
  vendedor: "  Maria  ",
  preco_venda: 50000,
};

function vendaExemplo(status: "pendente" | "concluida" | "cancelada" = "pendente") {
  return Venda.restore(ID, VEICULO_ID, CLIENTE_ID, "Maria", 50000, null, status);
}

function veiculoExemplo(disponivel = true) {
  return Veiculo.restore(
    VEICULO_ID,
    "44444444-4444-4444-8444-444444444444",
    "ZZ-Veiculo de teste",
    2024,
    50000,
    0,
    null,
    null,
    disponivel,
    true,
  );
}

describe("VendaService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(VendaRepository.create).mockImplementation(async (v) => v);
    vi.mocked(VendaRepository.update).mockImplementation(async (_id, v) => v);
  });

  describe("criar", () => {
    beforeEach(() => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(veiculoExemplo(true));
      vi.mocked(ClienteRepository.findById).mockResolvedValue({ id: CLIENTE_ID });
      vi.mocked(VeiculoRepository.reservar).mockResolvedValue(true);
    });

    it("cria a venda e reserva o veiculo", async () => {
      const venda = await VendaService.criar(dadosValidos);

      expect(venda.getVendedor()).toBe("Maria");
      expect(venda.getStatus()).toBe("pendente");
      expect(VeiculoRepository.reservar).toHaveBeenCalledWith(VEICULO_ID);
    });

    it("venda cancelada nao reserva o veiculo", async () => {
      const venda = await VendaService.criar({ ...dadosValidos, status: "cancelada" });

      expect(venda.isCancelada()).toBe(true);
      expect(VeiculoRepository.reservar).not.toHaveBeenCalled();
    });

    it("recusa quando o veiculo ja esta indisponivel", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(veiculoExemplo(false));

      await expect(VendaService.criar(dadosValidos)).rejects.toMatchObject({ statusCode: 400 });
      expect(VendaRepository.create).not.toHaveBeenCalled();
    });

    it("recusa quando outra venda reservou o veiculo primeiro", async () => {
      vi.mocked(VeiculoRepository.reservar).mockResolvedValue(false);

      await expect(VendaService.criar(dadosValidos)).rejects.toMatchObject({ statusCode: 400 });
      expect(VendaRepository.create).not.toHaveBeenCalled();
    });

    it("devolve o veiculo ao estoque se nao conseguir gravar a venda", async () => {
      vi.mocked(VendaRepository.create).mockRejectedValue(new Error("caiu"));

      await expect(VendaService.criar(dadosValidos)).rejects.toThrow("caiu");
      expect(VeiculoRepository.setDisponivel).toHaveBeenCalledWith(VEICULO_ID, true);
    });

    it("recusa veiculo que nao existe", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(null);

      await expect(VendaService.criar(dadosValidos)).rejects.toMatchObject({ statusCode: 400 });
    });

    it("recusa cliente que nao existe", async () => {
      vi.mocked(ClienteRepository.findById).mockResolvedValue(null);

      await expect(VendaService.criar(dadosValidos)).rejects.toMatchObject({ statusCode: 400 });
      expect(VeiculoRepository.reservar).not.toHaveBeenCalled();
    });

    it.each([
      [undefined],
      [{}],
      [{ ...dadosValidos, veiculo_id: "abc" }],
      [{ ...dadosValidos, vendedor: " " }],
      [{ ...dadosValidos, vendedor: "a".repeat(151) }],
      [{ ...dadosValidos, preco_venda: 0 }],
      [{ ...dadosValidos, preco_venda: "10" }],
      [{ ...dadosValidos, forma_pagamento: 5 }],
      [{ ...dadosValidos, forma_pagamento: "a".repeat(31) }],
      [{ ...dadosValidos, status: "outro" }],
      [{ veiculo_id: VEICULO_ID, cliente_id: CLIENTE_ID }],
    ])("recusa dados invalidos (%o)", async (dados) => {
      await expect(VendaService.criar(dados)).rejects.toMatchObject({ statusCode: 400 });
      expect(VendaRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("atualizar", () => {
    const dadosAtualizar = { vendedor: "Joao", preco_venda: 45000 };

    it("atualiza so o que foi enviado", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo());

      const venda = await VendaService.atualizar(ID, dadosAtualizar);

      expect(venda.getVendedor()).toBe("Joao");
      expect(venda.getPrecoVenda()).toBe(45000);
      expect(venda.getStatus()).toBe("pendente");
      expect(VeiculoRepository.setDisponivel).not.toHaveBeenCalled();
    });

    it("conclui a venda sem mexer no veiculo", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo());

      const venda = await VendaService.atualizar(ID, { ...dadosAtualizar, status: "concluida" });

      expect(venda.getStatus()).toBe("concluida");
      expect(VeiculoRepository.setDisponivel).not.toHaveBeenCalled();
    });

    it("troca a forma de pagamento", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo());

      const venda = await VendaService.atualizar(ID, { ...dadosAtualizar, forma_pagamento: "pix" });

      expect(venda.getFormaPagamento()).toBe("pix");
    });

    it("cancelar devolve o veiculo ao estoque", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo());

      const venda = await VendaService.atualizar(ID, { ...dadosAtualizar, status: "cancelada" });

      expect(venda.isCancelada()).toBe(true);
      expect(VeiculoRepository.setDisponivel).toHaveBeenCalledWith(VEICULO_ID, true);
    });

    it("reativar reserva o veiculo de novo", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo("cancelada"));
      vi.mocked(VeiculoRepository.reservar).mockResolvedValue(true);

      const venda = await VendaService.atualizar(ID, { ...dadosAtualizar, status: "pendente" });

      expect(venda.getStatus()).toBe("pendente");
      expect(VeiculoRepository.reservar).toHaveBeenCalledWith(VEICULO_ID);
    });

    it("nao reativa se o veiculo ja foi vendido para outro", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo("cancelada"));
      vi.mocked(VeiculoRepository.reservar).mockResolvedValue(false);

      await expect(
        VendaService.atualizar(ID, { ...dadosAtualizar, status: "pendente" })
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(VendaRepository.update).not.toHaveBeenCalled();
    });

    it("venda cancelada continua cancelada se nao mandar status", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo("cancelada"));

      const venda = await VendaService.atualizar(ID, dadosAtualizar);

      expect(venda.isCancelada()).toBe(true);
      expect(VeiculoRepository.reservar).not.toHaveBeenCalled();
    });

    it("libera o veiculo se a reativacao nao for gravada", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo("cancelada"));
      vi.mocked(VeiculoRepository.reservar).mockResolvedValue(true);
      vi.mocked(VendaRepository.update).mockRejectedValue(new Error("caiu"));

      await expect(
        VendaService.atualizar(ID, { ...dadosAtualizar, status: "pendente" })
      ).rejects.toThrow("caiu");
      expect(VeiculoRepository.setDisponivel).toHaveBeenCalledWith(VEICULO_ID, true);
    });

    it("da 404 quando a venda nao existe", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(null);

      await expect(VendaService.atualizar(ID, dadosAtualizar)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("da 400 com id ou dados invalidos", async () => {
      await expect(VendaService.atualizar("abc", dadosAtualizar)).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(VendaService.atualizar(ID, {})).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("remover", () => {
    it("remove venda ativa e devolve o veiculo", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo());

      await VendaService.remover(ID);

      expect(VendaRepository.remove).toHaveBeenCalledWith(ID);
      expect(VeiculoRepository.setDisponivel).toHaveBeenCalledWith(VEICULO_ID, true);
    });

    it("remove venda cancelada sem mexer no veiculo", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo("cancelada"));

      await VendaService.remover(ID);

      expect(VendaRepository.remove).toHaveBeenCalledWith(ID);
      expect(VeiculoRepository.setDisponivel).not.toHaveBeenCalled();
    });

    it("da 404 quando a venda nao existe", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(null);

      await expect(VendaService.remover(ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("listar e buscar", () => {
    it("lista as vendas", async () => {
      vi.mocked(VendaRepository.findAll).mockResolvedValue([vendaExemplo()]);

      expect(await VendaService.listar()).toHaveLength(1);
    });

    it("busca venda por id", async () => {
      vi.mocked(VendaRepository.findById).mockResolvedValue(vendaExemplo());

      const venda = await VendaService.buscarPorId(ID);

      expect(venda.getVendedor()).toBe("Maria");
    });

    it("da 400 para id invalido e 404 para venda inexistente", async () => {
      await expect(VendaService.buscarPorId("abc")).rejects.toMatchObject({ statusCode: 400 });

      vi.mocked(VendaRepository.findById).mockResolvedValue(null);
      await expect(VendaService.buscarPorId(ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
