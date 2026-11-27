import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

// so roda quando o .env tem as credenciais do supabase
const temBanco =
  process.env.SUPABASE_URL?.startsWith("https://") === true &&
  !process.env.SUPABASE_SECRET_KEY?.includes("xxxxxxxx");

const { default: app } = temBanco
  ? await import("../../src/app.js")
  : { default: undefined };

const ID_QUE_NAO_EXISTE = "00000000-0000-4000-8000-000000000020";
const dadosVenda = { vendedor: "ZZ-Vendedor", preco_venda: 45000 };

const marcaIds: string[] = [];
const veiculoIds: string[] = [];
const clienteIds: string[] = [];
const vendaIds: string[] = [];

async function criar(rota: string, dados: object, ids: string[]) {
  const resposta = await request(app!).post(rota).send(dados);

  expect(resposta.status).toBe(201);
  ids.push(resposta.body.id);

  return resposta.body;
}

// toda venda precisa de um veiculo disponivel e de um cliente
async function prepararVenda() {
  const marca = await criar("/marcas", { nome: `ZZ-Marca Venda ${Date.now()}` }, marcaIds);
  const veiculo = await criar(
    "/veiculos",
    { marca_id: marca.id, modelo: "ZZ-Modelo Venda", ano: 2024, preco: 50000 },
    veiculoIds
  );
  const cliente = await criar(
    "/clientes",
    { nome: "ZZ-Cliente Venda", cpf: String(Date.now()).slice(-11) },
    clienteIds
  );

  return { ...dadosVenda, veiculo_id: veiculo.id, cliente_id: cliente.id };
}

async function veiculoDisponivel(id: string) {
  const resposta = await request(app!).get(`/veiculos/${id}`);

  return resposta.body.disponivel;
}

describe.skipIf(!temBanco)("integracao de vendas", () => {
  // a ordem importa por causa das chaves estrangeiras
  afterAll(async () => {
    for (const id of vendaIds) await request(app!).delete(`/vendas/${id}`);
    for (const id of veiculoIds) await request(app!).delete(`/veiculos/${id}`);
    for (const id of clienteIds) await request(app!).delete(`/clientes/${id}`);
    for (const id of marcaIds) await request(app!).delete(`/marcas/${id}`);
  });

  it("registra a venda e deixa o veiculo indisponivel", async () => {
    const dados = await prepararVenda();

    const venda = await criar("/vendas", dados, vendaIds);

    expect(venda.status).toBe("pendente");
    expect(venda.vendedor).toBe("ZZ-Vendedor");
    expect(await veiculoDisponivel(dados.veiculo_id)).toBe(false);
  });

  it("lista as vendas com o veiculo e o cliente", async () => {
    const venda = await criar("/vendas", await prepararVenda(), vendaIds);

    const resposta = await request(app!).get("/vendas");
    const encontrada = resposta.body.find((v: { id: string }) => v.id === venda.id);

    expect(resposta.status).toBe(200);
    expect(encontrada.veiculos.modelo).toBe("ZZ-Modelo Venda");
    expect(encontrada.clientes.nome).toBe("ZZ-Cliente Venda");
  });

  it("busca uma venda pelo id", async () => {
    const venda = await criar("/vendas", await prepararVenda(), vendaIds);

    const resposta = await request(app!).get(`/vendas/${venda.id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(venda.id);
    expect(Number(resposta.body.preco_venda)).toBe(45000);
  });

  it("atualiza uma venda", async () => {
    const venda = await criar("/vendas", await prepararVenda(), vendaIds);

    const resposta = await request(app!)
      .put(`/vendas/${venda.id}`)
      .send({ vendedor: "ZZ-Outro vendedor", preco_venda: 44000, status: "concluida" });

    expect(resposta.status).toBe(200);
    expect(resposta.body.vendedor).toBe("ZZ-Outro vendedor");
    expect(resposta.body.status).toBe("concluida");
  });

  it("devolve o veiculo ao estoque quando a venda e cancelada", async () => {
    const dados = await prepararVenda();
    const venda = await criar("/vendas", dados, vendaIds);

    const resposta = await request(app!)
      .put(`/vendas/${venda.id}`)
      .send({ ...dadosVenda, status: "cancelada" });

    expect(resposta.status).toBe(200);
    expect(await veiculoDisponivel(dados.veiculo_id)).toBe(true);
  });

  it("exclui a venda e libera o veiculo", async () => {
    const dados = await prepararVenda();
    const venda = await criar("/vendas", dados, vendaIds);

    const excluida = await request(app!).delete(`/vendas/${venda.id}`);
    const busca = await request(app!).get(`/vendas/${venda.id}`);

    expect(excluida.status).toBe(200);
    expect(busca.status).toBe(404);
    expect(await veiculoDisponivel(dados.veiculo_id)).toBe(true);
  });

  it("vende o veiculo uma vez so, mesmo com pedidos ao mesmo tempo", async () => {
    const dados = await prepararVenda();

    const respostas = await Promise.all([
      request(app!).post("/vendas").send(dados),
      request(app!).post("/vendas").send(dados),
    ]);
    for (const r of respostas) if (r.status === 201) vendaIds.push(r.body.id);

    expect(respostas.map((r) => r.status).sort()).toEqual([201, 400]);
  });

  it("nao aceita venda com dados invalidos", async () => {
    const resposta = await request(app!).post("/vendas").send({ vendedor: "ZZ-Vendedor" });

    expect(resposta.status).toBe(400);
  });

  it("responde 404 para venda que nao existe", async () => {
    const rota = `/vendas/${ID_QUE_NAO_EXISTE}`;

    expect((await request(app!).get(rota)).status).toBe(404);
    expect((await request(app!).put(rota).send(dadosVenda)).status).toBe(404);
    expect((await request(app!).delete(rota)).status).toBe(404);
  });
});
