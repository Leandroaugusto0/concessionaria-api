import { beforeEach, describe, expect, it, vi } from "vitest";
import Veiculo from "../../src/models/Veiculo.js";
import supabase from "../../src/config/supabase.js";
import VeiculoRepository from "../../src/repository/VeiculoRepository.js";

vi.mock("../../src/config/supabase.js", () => ({ default: { from: vi.fn() } }));

const veiculoId = "11111111-1111-4111-8111-111111111111";
const marcaId = "22222222-2222-4222-8222-222222222222";
const row = {
  id: veiculoId,
  marca_id: marcaId,
  modelo: "ZZ-Modelo de teste",
  ano: 2024,
  preco: "25000.00",
  km: 50,
  combustivel: "Flex",
  cor: "Azul",
  disponivel: true,
  ativo: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  marcas: { id: marcaId, nome: "ZZ-Marca de teste" },
};

let result: { data: any; error: any };
let query: any;

function setResult(data: any, error: any = null) {
  result = { data, error };
}

describe("VeiculoRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setResult([row]);
    query = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: (resolve: (value: typeof result) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject),
    };
    vi.mocked(supabase.from).mockReturnValue(query);
  });

  it("lista e mapeia registros, aplicando filtros e ordenação", async () => {
    const veiculos = await VeiculoRepository.findAll({ marca_id: marcaId, disponivel: true, busca: "ZZ-Modelo", ordenar: "preco_desc" });
    expect(supabase.from).toHaveBeenCalledWith("veiculos");
    expect(query.select).toHaveBeenCalledWith("*, marcas(id, nome)");
    expect(query.eq).toHaveBeenCalledWith("marca_id", marcaId);
    expect(query.eq).toHaveBeenCalledWith("disponivel", true);
    expect(query.ilike).toHaveBeenCalledWith("modelo", "%ZZ-Modelo%");
    expect(query.order).toHaveBeenCalledWith("preco", { ascending: false });
    expect(veiculos[0]).toBeInstanceOf(Veiculo);
    expect(veiculos[0].getPreco()).toBe(25000);

    await VeiculoRepository.findAll({ ordenar: "preco_asc" });
    expect(query.order).toHaveBeenCalledWith("preco", { ascending: true });
    await VeiculoRepository.findAll();
    expect(query.ilike).toHaveBeenCalledTimes(1);
  });

  it("propaga erro ao listar e buscar por id", async () => {
    const error = new Error("db error");
    setResult(null, error);
    await expect(VeiculoRepository.findAll()).rejects.toBe(error);
    await expect(VeiculoRepository.findById(veiculoId)).rejects.toBe(error);
  });

  it("busca veículo e retorna null quando não existe", async () => {
    setResult(row);
    await expect(VeiculoRepository.findById(veiculoId)).resolves.toBeInstanceOf(Veiculo);
    expect(query.eq).toHaveBeenCalledWith("id", veiculoId);
    setResult(null);
    await expect(VeiculoRepository.findById(veiculoId)).resolves.toBeNull();
  });

  it("cria com classe ou dados e propaga falhas", async () => {
    const veiculo = Veiculo.restore(veiculoId, marcaId, row.modelo, 2024, 25000, 50, "Flex", "Azul", true, true);
    setResult(row);
    await expect(VeiculoRepository.create(veiculo)).resolves.toBeInstanceOf(Veiculo);
    expect(query.insert).toHaveBeenCalledWith({ marca_id: marcaId, modelo: row.modelo, ano: 2024, preco: 25000, km: 50, combustivel: "Flex", cor: "Azul", disponivel: true, ativo: true });

    await VeiculoRepository.create({ marca_id: marcaId, modelo: row.modelo, ano: 2024, preco: 25000 });
    expect(query.insert).toHaveBeenCalledWith({ marca_id: marcaId, modelo: row.modelo, ano: 2024, preco: 25000 });
    setResult(null, new Error("insert error"));
    await expect(VeiculoRepository.create(veiculo)).rejects.toThrow("insert error");
  });

  it("atualiza veículo e propaga falhas", async () => {
    const veiculo = Veiculo.restore(veiculoId, marcaId, row.modelo, 2024, 25000, 50, "Flex", "Azul", true, true);
    setResult(row);
    await expect(VeiculoRepository.update(veiculoId, veiculo)).resolves.toBeInstanceOf(Veiculo);
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ marca_id: marcaId, modelo: row.modelo, updated_at: expect.any(String) }));
    expect(query.eq).toHaveBeenCalledWith("id", veiculoId);
    setResult(null, new Error("update error"));
    await expect(VeiculoRepository.update(veiculoId, veiculo)).rejects.toThrow("update error");
  });

  it("remove, altera disponibilidade e reserva com tratamento de erros", async () => {
    setResult(null);
    await expect(VeiculoRepository.remove(veiculoId)).resolves.toBeUndefined();
    expect(query.delete).toHaveBeenCalled();
    await expect(VeiculoRepository.setDisponivel(veiculoId, false)).resolves.toBeUndefined();
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ disponivel: false, updated_at: expect.any(String) }));

    setResult([{ id: veiculoId }]);
    await expect(VeiculoRepository.reservar(veiculoId)).resolves.toBe(true);
    expect(query.eq).toHaveBeenCalledWith("disponivel", true);
    setResult([]);
    await expect(VeiculoRepository.reservar(veiculoId)).resolves.toBe(false);

    const error = new Error("database error");
    setResult(null, error);
    await expect(VeiculoRepository.remove(veiculoId)).rejects.toBe(error);
    await expect(VeiculoRepository.setDisponivel(veiculoId, true)).rejects.toBe(error);
    await expect(VeiculoRepository.reservar(veiculoId)).rejects.toBe(error);
  });
});
