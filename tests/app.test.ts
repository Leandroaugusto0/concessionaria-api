import { describe, it, expect } from "vitest";
import request from "supertest";

// este teste nao acessa o banco, entao basta valores de enfeite
process.env.SUPABASE_URL ||= "http://localhost";
process.env.SUPABASE_SECRET_KEY ||= "chave-de-teste";

const { default: app } = await import("../src/app.js");

describe("app", () => {
    it("responde 404 em rota que nao existe", async () => {
        const resposta = await request(app).get("/rota-que-nao-existe");

        expect(resposta.status).toBe(404);
    });
});

describe("tratamento de erros", () => {
  it("responde 400 quando o JSON do corpo e invalido", async () => {
    const resposta = await request(app)
      .post("/marcas")
      .set("Content-Type", "application/json")
      .send("{ invalido");

    expect(resposta.status).toBe(400);
  });
});

describe("documentacao", () => {
  it("serve a pagina do swagger em /api-docs", async () => {
    const resposta = await request(app).get("/api-docs/");

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain("swagger-ui");
  });

  it("serve a especificacao openapi em /api-docs.json", async () => {
    const resposta = await request(app).get("/api-docs.json");

    expect(resposta.status).toBe(200);
    expect(resposta.body.openapi).toBe("3.0.3");
    expect(resposta.body.components.schemas.Erro).toBeDefined();
    expect(resposta.body.paths["/marcas"]).toBeDefined();
    expect(resposta.body.paths["/marcas/{id}"].delete).toBeDefined();
    expect(resposta.body.paths["/vendas"].post).toBeDefined();
    expect(resposta.body.paths["/vendas/{id}"].put).toBeDefined();
  });
});
