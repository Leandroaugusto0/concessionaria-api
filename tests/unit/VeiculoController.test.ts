import { beforeEach, describe, expect, it, vi } from "vitest";
import VeiculoService from "../../src/services/VeiculoService.js";
import VeiculoController from "../../src/controller/VeiculoController.js";

vi.mock("../../src/services/VeiculoService.js", () => ({
  default: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    remover: vi.fn(),
  },
}));

function http(dados: { params?: Record<string, string>; query?: Record<string, unknown>; body?: unknown } = {}) {
  const req = { params: {}, query: {}, body: undefined, ...dados };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  return { req: req as any, res, next };
}

describe("VeiculoController", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lista e converte filtros de consulta", async () => {
    const veiculos = [{ id: "v1" }];
    vi.mocked(VeiculoService.listar).mockResolvedValue(veiculos as any);
    const { req, res, next } = http({ query: { marca_id: "m1", disponivel: "true", busca: "ZZ-Modelo", ordenar: "preco_asc" } });

    await VeiculoController.getAll(req, res as any, next);

    expect(VeiculoService.listar).toHaveBeenCalledWith({ marca_id: "m1", disponivel: true, busca: "ZZ-Modelo", ordenar: "preco_asc" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(veiculos);
    expect(next).not.toHaveBeenCalled();
  });

  it("encaminha erros de listagem e busca", async () => {
    const erro = new Error("falha");
    vi.mocked(VeiculoService.listar).mockRejectedValueOnce(erro);
    const listagem = http();
    await VeiculoController.getAll(listagem.req, listagem.res as any, listagem.next);
    expect(listagem.next).toHaveBeenCalledWith(erro);

    vi.mocked(VeiculoService.buscarPorId).mockRejectedValueOnce(erro);
    const busca = http({ params: { id: "id-1" } });
    await VeiculoController.getById(busca.req, busca.res as any, busca.next);
    expect(busca.next).toHaveBeenCalledWith(erro);
  });

  it("busca, cadastra, atualiza e remove usando os status HTTP esperados", async () => {
    const veiculo = { id: "v1" } as any;
    vi.mocked(VeiculoService.buscarPorId).mockResolvedValue(veiculo);
    const busca = http({ params: { id: "v1" } });
    await VeiculoController.getById(busca.req, busca.res as any, busca.next);
    expect(busca.res.status).toHaveBeenCalledWith(200);
    expect(busca.res.json).toHaveBeenCalledWith(veiculo);

    vi.mocked(VeiculoService.criar).mockResolvedValue(veiculo);
    const cadastro = http({ body: { modelo: "ZZ-Modelo" } });
    await VeiculoController.create(cadastro.req, cadastro.res as any, cadastro.next);
    expect(VeiculoService.criar).toHaveBeenCalledWith(cadastro.req.body);
    expect(cadastro.res.status).toHaveBeenCalledWith(201);

    vi.mocked(VeiculoService.atualizar).mockResolvedValue(veiculo);
    const atualizacao = http({ params: { id: "v1" }, body: { modelo: "ZZ-Atualizado" } });
    await VeiculoController.update(atualizacao.req, atualizacao.res as any, atualizacao.next);
    expect(VeiculoService.atualizar).toHaveBeenCalledWith("v1", atualizacao.req.body);
    expect(atualizacao.res.status).toHaveBeenCalledWith(200);

    vi.mocked(VeiculoService.remover).mockResolvedValue(undefined);
    const remocao = http({ params: { id: "v1" } });
    await VeiculoController.remove(remocao.req, remocao.res as any, remocao.next);
    expect(VeiculoService.remover).toHaveBeenCalledWith("v1");
    expect(remocao.res.status).toHaveBeenCalledWith(200);
    expect(remocao.res.json).toHaveBeenCalledWith({ message: "Veiculo removido com sucesso." });
  });

  it("encaminha erros das operações de escrita", async () => {
    const erro = new Error("falha");
    vi.mocked(VeiculoService.criar).mockRejectedValueOnce(erro);
    vi.mocked(VeiculoService.atualizar).mockRejectedValueOnce(erro);
    vi.mocked(VeiculoService.remover).mockRejectedValueOnce(erro);

    const cadastro = http();
    await VeiculoController.create(cadastro.req, cadastro.res as any, cadastro.next);
    expect(cadastro.next).toHaveBeenCalledWith(erro);
    const atualizacao = http({ params: { id: "v1" } });
    await VeiculoController.update(atualizacao.req, atualizacao.res as any, atualizacao.next);
    expect(atualizacao.next).toHaveBeenCalledWith(erro);
    const remocao = http({ params: { id: "v1" } });
    await VeiculoController.remove(remocao.req, remocao.res as any, remocao.next);
    expect(remocao.next).toHaveBeenCalledWith(erro);
  });
});
