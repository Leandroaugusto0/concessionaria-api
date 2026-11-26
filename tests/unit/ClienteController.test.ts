import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import ValidationError from "../../src/errors/ValidationError.js";
import NotFoundError from "../../src/errors/NotFoundError.js";
import ConflictError from "../../src/errors/ConflictError.js";

const service = vi.hoisted(() => ({
  listar: vi.fn(),
  buscarPorId: vi.fn(),
  criar: vi.fn(),
  atualizar: vi.fn(),
  remover: vi.fn(),
}));

vi.mock("../../src/services/ClienteService.js", () => ({ default: service }));

process.env.SUPABASE_URL ||= "http://localhost";
process.env.SUPABASE_SECRET_KEY ||= "chave-de-teste";

const { default: app } = await import("../../src/app.js");
const ID = "11111111-1111-4111-8111-111111111111";
const cliente = {
  id: ID,
  nome: "ZZ-Cliente Unitário",
  email: null,
  telefone: null,
  cpf: null,
  ativo: true,
  created_at: null,
  updated_at: null,
};

describe("ClienteController", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lista clientes com status 200", async () => {
    vi.mocked(service.listar).mockResolvedValue([cliente]);

    const resposta = await request(app).get("/clientes");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([cliente]);
  });

  it("encaminha erro inesperado da listagem para o tratamento global", async () => {
    vi.mocked(service.listar).mockRejectedValue(new Error("falha"));

    const resposta = await request(app).get("/clientes");

    expect(resposta.status).toBe(500);
    expect(resposta.body.message).toBe("Erro interno do servidor.");
  });

  it("busca cliente por id", async () => {
    vi.mocked(service.buscarPorId).mockResolvedValue(cliente);

    const resposta = await request(app).get(`/clientes/${ID}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(cliente);
    expect(service.buscarPorId).toHaveBeenCalledWith(ID);
  });

  it("encaminha cliente inexistente para o middleware de erros", async () => {
    vi.mocked(service.buscarPorId).mockRejectedValue(new NotFoundError("Cliente nao encontrado."));

    const resposta = await request(app).get(`/clientes/${ID}`);

    expect(resposta.status).toBe(404);
  });

  it("cadastra cliente com status 201", async () => {
    vi.mocked(service.criar).mockResolvedValue(cliente);

    const resposta = await request(app).post("/clientes").send({ nome: "ZZ-Cliente Unitário" });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual(cliente);
    expect(service.criar).toHaveBeenCalledWith({ nome: "ZZ-Cliente Unitário" });
  });

  it("encaminha validação de cadastro para o middleware", async () => {
    vi.mocked(service.criar).mockRejectedValue(new ValidationError("dados invalidos"));

    const resposta = await request(app).post("/clientes").send({ nome: "ZZ-Cliente Unitário" });

    expect(resposta.status).toBe(400);
  });

  it("atualiza cliente com status 200", async () => {
    vi.mocked(service.atualizar).mockResolvedValue(cliente);

    const resposta = await request(app)
      .put(`/clientes/${ID}`)
      .send({ nome: "ZZ-Cliente Atualizado" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(cliente);
    expect(service.atualizar).toHaveBeenCalledWith(ID, { nome: "ZZ-Cliente Atualizado" });
  });

  it("encaminha conflito na atualização", async () => {
    vi.mocked(service.atualizar).mockRejectedValue(new ConflictError("CPF duplicado."));

    const resposta = await request(app)
      .put(`/clientes/${ID}`)
      .send({ nome: "ZZ-Cliente Atualizado" });

    expect(resposta.status).toBe(409);
  });

  it("remove cliente e responde com mensagem de sucesso", async () => {
    vi.mocked(service.remover).mockResolvedValue(undefined);

    const resposta = await request(app).delete(`/clientes/${ID}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe("Cliente removido com sucesso.");
    expect(service.remover).toHaveBeenCalledWith(ID);
  });

  it("encaminha conflito de exclusão", async () => {
    vi.mocked(service.remover).mockRejectedValue(new ConflictError("Cliente possui vendas."));

    const resposta = await request(app).delete(`/clientes/${ID}`);

    expect(resposta.status).toBe(409);
  });
});
