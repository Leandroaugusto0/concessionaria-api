// Erro base da aplicacao.
// Carrega o status HTTP, entao o app.ts sabe qual resposta devolver.
export default class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}
