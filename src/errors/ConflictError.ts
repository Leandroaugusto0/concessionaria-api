import AppError from "./AppError.js";

// 409 - conflito, ex: excluir algo que tem registros vinculados
export default class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
