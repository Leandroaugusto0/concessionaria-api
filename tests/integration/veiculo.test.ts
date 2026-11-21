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

const marcaIds: string[] = [];
const veiculoIds: string[] = [];
const clienteIds: string[] = [];
const vendaIds: string[] = [];

const novoVeiculo = (marcaId: string, modelo: string) => ({
  marca_id: marcaId,
  modelo,
  ano: 2024,
  preco: 25000,
  km: 0,
  combustivel: "Flex",
  cor: "Azul",
  disponivel: true,
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

describe.skipIf(!supabaseConfigurado)("integração de veículos (Supabase)", () => {
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
    if (erros.length) throw new AggregateError(erros, "Falha ao limpar os dados de teste de veículos.");
  });

  it("cadastra e lista um veículo", async () => {
    const marca = await request(app).post("/marcas").send({ nome: "ZZ-Marca Cadastro Veículo" });
    expect(marca.status).toBe(201);
    marcaIds.push(marca.body.id);

    const criado = await request(app).post("/veiculos").send(novoVeiculo(marca.body.id, "ZZ-Modelo Cadastro"));
    expect(criado.status).toBe(201);
    veiculoIds.push(criado.body.id);
    expect(criado.body.modelo).toBe("ZZ-Modelo Cadastro");

    const lista = await request(app).get("/veiculos");
    expect(lista.status).toBe(200);
    expect(lista.body.some((veiculo: { id: string }) => veiculo.id === criado.body.id)).toBe(true);
  });

  it("atualiza e exclui um veículo sem vínculos", async () => {
    const marca = await request(app).post("/marcas").send({ nome: "ZZ-Marca Atualização Veículo" });
    expect(marca.status).toBe(201);
    marcaIds.push(marca.body.id);

    const criado = await request(app).post("/veiculos").send(novoVeiculo(marca.body.id, "ZZ-Modelo Antes"));
    expect(criado.status).toBe(201);
    veiculoIds.push(criado.body.id);

    const atualizado = await request(app)
      .put(`/veiculos/${criado.body.id}`)
      .send({ ...novoVeiculo(marca.body.id, "ZZ-Modelo Atualizado"), preco: 27000 });
    expect(atualizado.status).toBe(200);
    expect(atualizado.body.modelo).toBe("ZZ-Modelo Atualizado");
    expect(Number(atualizado.body.preco)).toBe(27000);

    const excluido = await request(app).delete(`/veiculos/${criado.body.id}`);
    expect(excluido.status).toBe(200);
    expect(excluido.body.message).toBe("Veiculo removido com sucesso.");
    veiculoIds.splice(veiculoIds.indexOf(criado.body.id), 1);
  });

  it("retorna 400 para dados inválidos e 404 para veículo inexistente", async () => {
    const invalido = await request(app).post("/veiculos").send({ modelo: "ZZ-Incompleto" });
    expect(invalido.status).toBe(400);

    const inexistente = "00000000-0000-4000-8000-000000000002";
    expect((await request(app).get(`/veiculos/${inexistente}`)).status).toBe(404);
    const atualizado = await request(app)
      .put(`/veiculos/${inexistente}`)
      .send(novoVeiculo("00000000-0000-4000-8000-000000000003", "ZZ-Modelo Inexistente"));
    expect(atualizado.status).toBe(404);

    const excluido = await request(app).delete(`/veiculos/${inexistente}`);
    expect(excluido.status).toBe(404);
  });

  it("retorna 409 ao excluir veículo com venda vinculada", async () => {
    const marca = await request(app).post("/marcas").send({ nome: "ZZ-Marca Vínculo Veículo" });
    expect(marca.status).toBe(201);
    marcaIds.push(marca.body.id);

    const veiculo = await request(app)
      .post("/veiculos")
      .send(novoVeiculo(marca.body.id, "ZZ-Modelo Vinculado"));
    expect(veiculo.status).toBe(201);
    veiculoIds.push(veiculo.body.id);

    const cliente = await request(app).post("/clientes").send({ nome: "ZZ-Cliente para vínculo veículo" });
    expect(cliente.status).toBe(201);
    clienteIds.push(cliente.body.id);

    const venda = await request(app).post("/vendas").send({
      veiculo_id: veiculo.body.id,
      cliente_id: cliente.body.id,
      vendedor: "ZZ-Vendedor de teste",
      preco_venda: 25000,
    });
    expect(venda.status).toBe(201);
    vendaIds.push(venda.body.id);

    const resposta = await request(app).delete(`/veiculos/${veiculo.body.id}`);
    expect(resposta.status).toBe(409);
    expect(resposta.body.message).toBe(
      "Nao e possivel remover o veiculo porque existem vendas registradas para ele.",
    );
  });
});
