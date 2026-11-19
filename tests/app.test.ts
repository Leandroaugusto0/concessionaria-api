import { describe, it, expect } from "vitest";
import request from "supertest";

// este teste nao acessa o banco, entao basta valores de enfeite
process.env.SUPABASE_URL ??= "http://localhost";
process.env.SUPABASE_SECRET_KEY ??= "chave-de-teste";

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
