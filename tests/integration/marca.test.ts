import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

// so roda quando o .env tem as credenciais do supabase
const temBanco =
  process.env.SUPABASE_URL?.startsWith("https://") === true &&
  !process.env.SUPABASE_SECRET_KEY?.includes("xxxxxxxx");

const { default: app } = temBanco
  ? await import("../../src/app.js")
  : { default: undefined };

const ID_QUE_NAO_EXISTE = "00000000-0000-4000-8000-000000000010";

const marcaIds: string[] = [];
const veiculoIds: string[] = [];

async function criarMarca() {
  const resposta = await request(app!)
    .post("/marcas")
    .send({ nome: `ZZ-Marca ${Date.now()}`, pais: "Brasil" });

  expect(resposta.status).toBe(201);
  marcaIds.push(resposta.body.id);

  return resposta.body;
}

describe.skipIf(!temBanco)("integracao de marcas", () => {
  // apaga o que os testes criaram, primeiro os veiculos por causa da chave estrangeira
  afterAll(async () => {
    for (const id of veiculoIds) await request(app!).delete(`/veiculos/${id}`);
    for (const id of marcaIds) await request(app!).delete(`/marcas/${id}`);
  });

  it("cadastra uma marca", async () => {
    const marca = await criarMarca();

    expect(marca.id).toBeDefined();
    expect(marca.pais).toBe("Brasil");
    expect(marca.ativo).toBe(true);
  });

  it("lista as marcas", async () => {
    const marca = await criarMarca();

    const resposta = await request(app!).get("/marcas");

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((m: { id: string }) => m.id)).toContain(marca.id);
  });

  it("busca uma marca pelo id", async () => {
    const marca = await criarMarca();

    const resposta = await request(app!).get(`/marcas/${marca.id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe(marca.nome);
  });

  it("atualiza uma marca", async () => {
    const marca = await criarMarca();

    const resposta = await request(app!)
      .put(`/marcas/${marca.id}`)
      .send({ nome: `${marca.nome} nova`, pais: "Italia", ativo: false });

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe(`${marca.nome} nova`);
    expect(resposta.body.pais).toBe("Italia");
    expect(resposta.body.ativo).toBe(false);
  });

  it("exclui uma marca", async () => {
    const marca = await criarMarca();

    const excluida = await request(app!).delete(`/marcas/${marca.id}`);
    const busca = await request(app!).get(`/marcas/${marca.id}`);

    expect(excluida.status).toBe(200);
    expect(busca.status).toBe(404);
  });

  it("nao aceita marca sem nome nem com id invalido", async () => {
    const semNome = await request(app!).post("/marcas").send({ pais: "Brasil" });
    const idInvalido = await request(app!).get("/marcas/abc");

    expect(semNome.status).toBe(400);
    expect(idInvalido.status).toBe(400);
  });

  it("responde 404 para marca que nao existe", async () => {
    const rota = `/marcas/${ID_QUE_NAO_EXISTE}`;

    expect((await request(app!).get(rota)).status).toBe(404);
    expect((await request(app!).put(rota).send({ nome: "ZZ-Marca" })).status).toBe(404);
    expect((await request(app!).delete(rota)).status).toBe(404);
  });

  it("nao deixa repetir o nome", async () => {
    const marca = await criarMarca();

    const resposta = await request(app!).post("/marcas").send({ nome: marca.nome.toUpperCase() });

    expect(resposta.status).toBe(409);
  });

  it("nao exclui marca que tem veiculo", async () => {
    const marca = await criarMarca();
    const veiculo = await request(app!)
      .post("/veiculos")
      .send({ marca_id: marca.id, modelo: "ZZ-Modelo da marca", ano: 2024, preco: 30000 });

    expect(veiculo.status).toBe(201);
    veiculoIds.push(veiculo.body.id);

    const resposta = await request(app!).delete(`/marcas/${marca.id}`);

    expect(resposta.status).toBe(409);
  });
});
