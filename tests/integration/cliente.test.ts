import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

const supabaseConfigurado =
  process.env.SUPABASE_URL?.startsWith("https://") === true &&
  process.env.SUPABASE_URL.includes(".supabase.co") &&
  Boolean(process.env.SUPABASE_SECRET_KEY) &&
  !process.env.SUPABASE_SECRET_KEY.includes("xxxxxxxx");

const { default: app } = supabaseConfigurado
  ? await import("../../src/app.js")
  : { default: undefined };

const clienteIds: string[] = [];
const veiculoIds: string[] = [];
const vendaIds: string[] = [];
const marcaIds: string[] = [];

const clienteValido = (nome: string) => ({
  nome,
  email: `${nome.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.test`,
  // o cpf nao pode repetir, entao cada cliente usa um numero diferente
  cpf: String(Date.now()).slice(-11),
  ativo: true,
});

async function removerRegistros(caminho: string, ids: string[]) {
  const erros: unknown[] = [];
  for (const id of [...ids].reverse()) {
    try {
      const resposta = await request(app!).delete(`/${caminho}/${id}`);
      expect([200, 404]).toContain(resposta.status);
    } catch (erro) {
      erros.push(erro);
    }
  }
  if (erros.length) throw new AggregateError(erros, `Falha ao limpar ${caminho}.`);
}

describe.skipIf(!supabaseConfigurado)("integração de clientes (Supabase)", () => {
  afterAll(async () => {
    const erros: unknown[] = [];
    for (const [caminho, ids] of [
      ["vendas", vendaIds],
      ["veiculos", veiculoIds],
      ["clientes", clienteIds],
      ["marcas", marcaIds],
    ] as const) {
      try {
        await removerRegistros(caminho, ids);
      } catch (erro) {
        erros.push(erro);
      }
    }
    if (erros.length) throw new AggregateError(erros, "Falha ao limpar os dados de teste de clientes.");
  });

  it("cadastra e lista um cliente", async () => {
    const criado = await request(app).post("/clientes").send(clienteValido("ZZ-Cliente Integração"));

    expect(criado.status).toBe(201);
    expect(criado.body.nome).toBe("ZZ-Cliente Integração");
    clienteIds.push(criado.body.id);

    const lista = await request(app).get("/clientes");
    expect(lista.status).toBe(200);
    expect(lista.body.some((cliente: { id: string }) => cliente.id === criado.body.id)).toBe(true);
  });

  it("busca um cliente pelo id", async () => {
    const criado = await request(app).post("/clientes").send(clienteValido("ZZ-Cliente Busca"));
    expect(criado.status).toBe(201);
    clienteIds.push(criado.body.id);

    const resposta = await request(app).get(`/clientes/${criado.body.id}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(criado.body.id);
    expect(resposta.body.nome).toBe("ZZ-Cliente Busca");
  });

  it("atualiza e exclui um cliente sem vínculos", async () => {
    const criado = await request(app).post("/clientes").send(clienteValido("ZZ-Cliente Para Atualizar"));
    expect(criado.status).toBe(201);
    clienteIds.push(criado.body.id);

    const atualizado = await request(app)
      .put(`/clientes/${criado.body.id}`)
      .send({ ...clienteValido("ZZ-Cliente Atualizado"), ativo: false });
    expect(atualizado.status).toBe(200);
    expect(atualizado.body.nome).toBe("ZZ-Cliente Atualizado");
    expect(atualizado.body.ativo).toBe(false);

    const excluido = await request(app).delete(`/clientes/${criado.body.id}`);
    expect(excluido.status).toBe(200);
    expect(excluido.body.message).toBe("Cliente removido com sucesso.");
    clienteIds.splice(clienteIds.indexOf(criado.body.id), 1);
  });

  it("retorna 400 para dados inválidos e 404 para cliente inexistente", async () => {
    const invalido = await request(app).post("/clientes").send({ nome: "   " });
    expect(invalido.status).toBe(400);

    const inexistente = "00000000-0000-4000-8000-000000000001";
    expect((await request(app).get(`/clientes/${inexistente}`)).status).toBe(404);
    const atualizado = await request(app)
      .put(`/clientes/${inexistente}`)
      .send(clienteValido("ZZ-Cliente Inexistente"));
    expect(atualizado.status).toBe(404);

    const excluido = await request(app).delete(`/clientes/${inexistente}`);
    expect(excluido.status).toBe(404);
  });

  it("retorna 409 ao excluir cliente com venda vinculada", async () => {
    const marca = await request(app).post("/marcas").send({ nome: "ZZ-Marca Teste Cliente" });
    expect(marca.status).toBe(201);
    marcaIds.push(marca.body.id);

    const veiculo = await request(app).post("/veiculos").send({
      marca_id: marca.body.id,
      modelo: "ZZ-Modelo para vínculo cliente",
      ano: 2024,
      preco: 10000,
    });
    expect(veiculo.status).toBe(201);
    veiculoIds.push(veiculo.body.id);

    const cliente = await request(app).post("/clientes").send(clienteValido("ZZ-Cliente Vinculado"));
    expect(cliente.status).toBe(201);
    clienteIds.push(cliente.body.id);

    const venda = await request(app).post("/vendas").send({
      veiculo_id: veiculo.body.id,
      cliente_id: cliente.body.id,
      vendedor: "ZZ-Vendedor de teste",
      preco_venda: 10000,
    });
    expect(venda.status).toBe(201);
    vendaIds.push(venda.body.id);

    const resposta = await request(app).delete(`/clientes/${cliente.body.id}`);
    expect(resposta.status).toBe(409);
    expect(resposta.body.message).toBe(
      "Nao e possivel remover o cliente porque existem vendas registradas para ele.",
    );
  });
});
