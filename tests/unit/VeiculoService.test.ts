import { beforeEach, describe, expect, it, vi } from "vitest";
import Veiculo from "../../src/models/Veiculo.js";
import Marca from "../../src/models/Marca.js";
import VeiculoRepository from "../../src/repository/VeiculoRepository.js";
import MarcaRepository from "../../src/repository/MarcaRepository.js";
import VeiculoService from "../../src/services/VeiculoService.js";

vi.mock("../../src/repository/VeiculoRepository.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setDisponivel: vi.fn(),
    reservar: vi.fn(),
  },
}));

vi.mock("../../src/repository/MarcaRepository.js", () => ({
  default: {
    findById: vi.fn(),
  },
}));

const ID = "11111111-1111-4111-8111-111111111111";
const MARCA_ID = "22222222-2222-4222-8222-222222222222";
const OUTRA_MARCA_ID = "33333333-3333-4333-8333-333333333333";

function marcaExemplo() {
  return Marca.restore(MARCA_ID, "ZZ-Marca Fictícia", null, true);
}

function veiculoExemplo(overrides: Partial<{
  marcaId: string;
  modelo: string;
  ano: number;
  preco: number;
  km: number;
  combustivel: string | null;
  cor: string | null;
  disponivel: boolean;
  ativo: boolean;
}> = {}) {
  return Veiculo.restore(
    ID,
    overrides.marcaId ?? MARCA_ID,
    overrides.modelo ?? "ZZ-Modelo Fictício",
    overrides.ano ?? 2024,
    overrides.preco ?? 25000,
    overrides.km ?? 100,
    overrides.combustivel === undefined ? "Flex" : overrides.combustivel,
    overrides.cor === undefined ? "Azul" : overrides.cor,
    overrides.disponivel ?? true,
    overrides.ativo ?? true,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
    { id: MARCA_ID, nome: "ZZ-Marca Fictícia" },
  );
}

const dadosValidos = {
  marca_id: MARCA_ID,
  modelo: "  ZZ-Modelo Novo  ",
  ano: 2024,
  preco: 30000,
  km: 0,
  combustivel: "Flex",
  cor: "Preto",
  disponivel: true,
  ativo: true,
};

describe("VeiculoService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listar e buscar", () => {
    it("lista veículos com os filtros", async () => {
      const veiculos = [veiculoExemplo()];
      vi.mocked(VeiculoRepository.findAll).mockResolvedValue(veiculos);

      await expect(VeiculoService.listar({ marca_id: MARCA_ID, disponivel: true })).resolves.toBe(veiculos);
      expect(VeiculoRepository.findAll).toHaveBeenCalledWith({ marca_id: MARCA_ID, disponivel: true });
    });

    it("rejeita filtro marca_id inválido", async () => {
      await expect(VeiculoService.listar({ marca_id: "abc" })).rejects.toMatchObject({ statusCode: 400 });
      expect(VeiculoRepository.findAll).not.toHaveBeenCalled();
    });

    it("busca veículo existente", async () => {
      const veiculo = veiculoExemplo();
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(veiculo);

      await expect(VeiculoService.buscarPorId(ID)).resolves.toBe(veiculo);
    });

    it("retorna 404 para veículo inexistente", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(null);

      await expect(VeiculoService.buscarPorId(ID)).rejects.toMatchObject({
        statusCode: 404,
        message: "Veiculo nao encontrado.",
      });
    });

    it("rejeita id inválido sem consultar o Repository", async () => {
      await expect(VeiculoService.buscarPorId("abc")).rejects.toMatchObject({ statusCode: 400 });
      expect(VeiculoRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("criar", () => {
    it("cria instância Veiculo após validar a marca", async () => {
      const criado = veiculoExemplo({ modelo: "ZZ-Modelo Novo" });
      vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
      vi.mocked(VeiculoRepository.create).mockResolvedValue(criado);

      const veiculo = await VeiculoService.criar(dadosValidos);

      expect(veiculo.getModelo()).toBe("ZZ-Modelo Novo");
      expect(MarcaRepository.findById).toHaveBeenCalledWith(MARCA_ID);
      expect(VeiculoRepository.create).toHaveBeenCalledWith(expect.any(Veiculo));
    });

    it("retorna 400 se a marca informada não existe", async () => {
      vi.mocked(MarcaRepository.findById).mockResolvedValue(null);

      await expect(VeiculoService.criar(dadosValidos)).rejects.toMatchObject({
        statusCode: 400,
        message: "A marca informada nao existe.",
      });
      expect(VeiculoRepository.create).not.toHaveBeenCalled();
    });

    it.each([
      [{ modelo: "ZZ-Sem dados" }, "marca_id, modelo, ano e preco sao obrigatorios."],
      [{ ...dadosValidos, marca_id: "abc" }, "marca_id invalido."],
      [{ ...dadosValidos, modelo: "   " }, "O modelo e obrigatorio."],
      [{ ...dadosValidos, modelo: "x".repeat(151) }, "O modelo deve ter no maximo 150 caracteres."],
      [{ ...dadosValidos, ano: 1949 }, /^Ano invalido/],
      [{ ...dadosValidos, ano: new Date().getFullYear() + 2 }, /^Ano invalido/],
      [{ ...dadosValidos, ano: "2024" }, /^Ano invalido/],
      [{ ...dadosValidos, preco: 0 }, "Preco tem que ser maior que zero."],
      [{ ...dadosValidos, preco: "30000" }, "Preco tem que ser maior que zero."],
      [{ ...dadosValidos, km: -1 }, "km deve ser um numero inteiro maior ou igual a zero."],
      [{ ...dadosValidos, km: 1.5 }, "km deve ser um numero inteiro maior ou igual a zero."],
      [{ ...dadosValidos, combustivel: 4 }, "combustivel e cor devem ser textos."],
      [{ ...dadosValidos, cor: 4 }, "combustivel e cor devem ser textos."],
      [{ ...dadosValidos, disponivel: "sim" }, "Os campos disponivel e ativo devem ser true ou false."],
      [{ ...dadosValidos, ativo: "sim" }, "Os campos disponivel e ativo devem ser true ou false."],
      [undefined, "marca_id, modelo, ano e preco sao obrigatorios."],
    ])("rejeita dados inválidos antes das consultas", async (dados, mensagem) => {
      await expect(VeiculoService.criar(dados)).rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(mensagem) });
      expect(MarcaRepository.findById).not.toHaveBeenCalled();
      expect(VeiculoRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("atualizar", () => {
    it("atualiza dados enviados e preserva opcionais omitidos", async () => {
      const existente = veiculoExemplo({ km: 900, cor: "Prata", disponivel: false, ativo: false });
      const atualizado = veiculoExemplo({ modelo: "ZZ-Modelo Atualizado" });
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(existente);
      vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
      vi.mocked(VeiculoRepository.update).mockResolvedValue(atualizado);

      const resultado = await VeiculoService.atualizar(ID, {
        marca_id: MARCA_ID,
        modelo: "ZZ-Modelo Atualizado",
        ano: 2025,
        preco: 32000,
      });

      expect(resultado).toBe(atualizado);
      const atualizadoNoRepo = vi.mocked(VeiculoRepository.update).mock.calls[0][1];
      expect(atualizadoNoRepo).toBeInstanceOf(Veiculo);
      expect(atualizadoNoRepo.getKm()).toBe(900);
      expect(atualizadoNoRepo.getCor()).toBe("Prata");
      expect(atualizadoNoRepo.isDisponivel()).toBe(false);
      expect(atualizadoNoRepo.isAtivo()).toBe(false);
    });

    it("retorna 404 antes de consultar a marca para veículo inexistente", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(null);

      await expect(VeiculoService.atualizar(ID, dadosValidos)).rejects.toMatchObject({ statusCode: 404 });
      expect(MarcaRepository.findById).not.toHaveBeenCalled();
      expect(VeiculoRepository.update).not.toHaveBeenCalled();
    });

    it("retorna 400 se a marca da atualização não existe", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(veiculoExemplo());
      vi.mocked(MarcaRepository.findById).mockResolvedValue(null);

      await expect(VeiculoService.atualizar(ID, dadosValidos)).rejects.toMatchObject({ statusCode: 400 });
      expect(VeiculoRepository.update).not.toHaveBeenCalled();
    });

    it("retorna 400 para id ou dados inválidos", async () => {
      await expect(VeiculoService.atualizar("abc", dadosValidos)).rejects.toMatchObject({ statusCode: 400 });
      await expect(VeiculoService.atualizar(ID, { modelo: "ZZ-Incompleto" })).rejects.toMatchObject({ statusCode: 400 });
      expect(VeiculoRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("remover", () => {
    it("remove veículo existente", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(veiculoExemplo());
      vi.mocked(VeiculoRepository.remove).mockResolvedValue(undefined);

      await expect(VeiculoService.remover(ID)).resolves.toBeUndefined();
      expect(VeiculoRepository.remove).toHaveBeenCalledWith(ID);
    });

    it("retorna 404 para remover veículo inexistente", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(null);

      await expect(VeiculoService.remover(ID)).rejects.toMatchObject({ statusCode: 404 });
      expect(VeiculoRepository.remove).not.toHaveBeenCalled();
    });

    it("converte vínculo com venda em conflito 409", async () => {
      vi.mocked(VeiculoRepository.findById).mockResolvedValue(veiculoExemplo());
      vi.mocked(VeiculoRepository.remove).mockRejectedValue({ code: "23503" });

      await expect(VeiculoService.remover(ID)).rejects.toMatchObject({
        statusCode: 409,
        message: "Nao e possivel remover o veiculo porque existem vendas registradas para ele.",
      });
    });
  });
});

describe("Veiculo", () => {
  it("restaura veículo, mantém a saída da API e altera estados", () => {
    const veiculo = Veiculo.restore(
      ID,
      MARCA_ID,
      "ZZ-Modelo Fictício",
      2024,
      25000,
      100,
      "Flex",
      "Azul",
      true,
      true,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
      { id: MARCA_ID, nome: "ZZ-Marca Fictícia" },
    );

    expect(veiculo.getId()).toBe(ID);
    expect(veiculo.toJSON()).toEqual({
      id: ID,
      marca_id: MARCA_ID,
      modelo: "ZZ-Modelo Fictício",
      ano: 2024,
      preco: 25000,
      km: 100,
      combustivel: "Flex",
      cor: "Azul",
      disponivel: true,
      ativo: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      marcas: { id: MARCA_ID, nome: "ZZ-Marca Fictícia" },
    });

    veiculo.markUnavailable();
    veiculo.deactivate();
    expect(veiculo.isDisponivel()).toBe(false);
    expect(veiculo.isAtivo()).toBe(false);
    veiculo.markAvailable();
    veiculo.activate();
    expect(veiculo.isDisponivel()).toBe(true);
    expect(veiculo.isAtivo()).toBe(true);
  });
});
