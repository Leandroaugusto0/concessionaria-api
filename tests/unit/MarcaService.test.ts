import { describe, it, expect, vi, beforeEach } from "vitest";
import Marca from "../../src/models/Marca.js";
import MarcaRepository from "../../src/repository/MarcaRepository.js";
import MarcaService from "../../src/services/MarcaService.js";

// o repository e trocado por um falso, entao nao usa o banco
vi.mock("../../src/repository/MarcaRepository.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByNome: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const ID = "11111111-1111-4111-8111-111111111111";

function marcaExemplo() {
  return Marca.restore(ID, "Fiat", "Italia", true);
}

describe("MarcaService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lista as marcas", async () => {
    vi.mocked(MarcaRepository.findAll).mockResolvedValue([marcaExemplo()]);

    const marcas = await MarcaService.listar();

    expect(marcas).toHaveLength(1);
  });

  it("busca marca por id", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());

    const marca = await MarcaService.buscarPorId(ID);

    expect(marca.getNome()).toBe("Fiat");
  });

  it("nao busca com id invalido", async () => {
    await expect(MarcaService.buscarPorId("abc")).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(MarcaRepository.findById).not.toHaveBeenCalled();
  });

  it("da 404 quando a marca nao existe", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(null);

    await expect(MarcaService.buscarPorId(ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("cria a marca com o nome sem espacos sobrando", async () => {
    vi.mocked(MarcaRepository.create).mockImplementation(async (m) => m);

    const marca = await MarcaService.criar({ nome: "  Honda  ", pais: "Japao" });

    expect(marca.getNome()).toBe("Honda");
    expect(marca.isAtivo()).toBe(true);
    expect(MarcaRepository.create).toHaveBeenCalledOnce();
  });

  it.each([
    [{ nome: "   " }],
    [{}],
    [undefined],
    [{ nome: "a".repeat(101) }],
    [{ nome: "Fiat", pais: 5 }],
    [{ nome: "Fiat", ativo: "sim" }],
  ])("nao cria com dados invalidos (%o)", async (dados) => {
    await expect(MarcaService.criar(dados)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(MarcaRepository.create).not.toHaveBeenCalled();
  });

  it("da 409 ao criar marca com nome que ja existe", async () => {
    vi.mocked(MarcaRepository.findByNome).mockResolvedValue(marcaExemplo());

    await expect(MarcaService.criar({ nome: "fiat" })).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(MarcaRepository.create).not.toHaveBeenCalled();
  });

  it("da 409 ao renomear para o nome de outra marca", async () => {
    const outra = Marca.restore("99999999-9999-4999-8999-999999999999", "Honda", null, true);
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
    vi.mocked(MarcaRepository.findByNome).mockResolvedValue(outra);

    await expect(MarcaService.atualizar(ID, { nome: "Honda" })).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(MarcaRepository.update).not.toHaveBeenCalled();
  });

  it("deixa manter o proprio nome ao atualizar", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
    vi.mocked(MarcaRepository.findByNome).mockResolvedValue(marcaExemplo());
    vi.mocked(MarcaRepository.update).mockImplementation(async (_id, m) => m);

    const marca = await MarcaService.atualizar(ID, { nome: "Fiat", pais: "Brasil" });

    expect(marca.getPais()).toBe("Brasil");
  });

  it("atualiza so o que foi enviado", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
    vi.mocked(MarcaRepository.update).mockImplementation(async (_id, m) => m);

    const marca = await MarcaService.atualizar(ID, { nome: "Fiat Novo" });

    expect(marca.getNome()).toBe("Fiat Novo");
    expect(marca.getPais()).toBe("Italia");
    expect(marca.isAtivo()).toBe(true);
  });

  it("atualiza pais e desativa a marca", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
    vi.mocked(MarcaRepository.update).mockImplementation(async (_id, m) => m);

    const marca = await MarcaService.atualizar(ID, {
      nome: "Fiat",
      pais: "Brasil",
      ativo: false,
    });

    expect(marca.getPais()).toBe("Brasil");
    expect(marca.isAtivo()).toBe(false);
  });

  it("reativa uma marca inativa", async () => {
    const inativa = Marca.restore(ID, "Fiat", null, false);
    vi.mocked(MarcaRepository.findById).mockResolvedValue(inativa);
    vi.mocked(MarcaRepository.update).mockImplementation(async (_id, m) => m);

    const marca = await MarcaService.atualizar(ID, { nome: "Fiat", ativo: true });

    expect(marca.isAtivo()).toBe(true);
  });

  it("da 404 ao atualizar marca que nao existe", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(null);

    await expect(
      MarcaService.atualizar(ID, { nome: "Fiat" })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(MarcaRepository.update).not.toHaveBeenCalled();
  });

  it("remove a marca", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());

    await MarcaService.remover(ID);

    expect(MarcaRepository.remove).toHaveBeenCalledWith(ID);
  });

  it("da 404 ao remover marca que nao existe", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(null);

    await expect(MarcaService.remover(ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("da 409 ao remover marca que tem veiculos", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
    vi.mocked(MarcaRepository.remove).mockRejectedValue({ code: "23503" });

    await expect(MarcaService.remover(ID)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("repassa outros erros do banco", async () => {
    vi.mocked(MarcaRepository.findById).mockResolvedValue(marcaExemplo());
    vi.mocked(MarcaRepository.remove).mockRejectedValue(new Error("caiu"));

    await expect(MarcaService.remover(ID)).rejects.toThrow("caiu");
  });
});
