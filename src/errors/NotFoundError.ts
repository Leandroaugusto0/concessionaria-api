import AppError from "./AppError.js";

// 404 - registro nao encontrado
export default class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}
