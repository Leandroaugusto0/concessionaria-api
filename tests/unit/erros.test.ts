import { describe, it, expect } from "vitest";
import AppError from "../../src/errors/AppError.js";
import ValidationError from "../../src/errors/ValidationError.js";
import NotFoundError from "../../src/errors/NotFoundError.js";
import ConflictError from "../../src/errors/ConflictError.js";

describe("erros proprios", () => {
  it("ValidationError usa status 400", () => {
    const erro = new ValidationError("dados invalidos");

    expect(erro).toBeInstanceOf(AppError);
    expect(erro.statusCode).toBe(400);
    expect(erro.message).toBe("dados invalidos");
  });

  it("NotFoundError usa status 404", () => {
    expect(new NotFoundError("nao achei").statusCode).toBe(404);
  });

  it("ConflictError usa status 409", () => {
    expect(new ConflictError("tem vinculo").statusCode).toBe(409);
  });
});
