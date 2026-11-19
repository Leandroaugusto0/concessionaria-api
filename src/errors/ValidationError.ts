import AppError from "./AppError.js";

// 400 - dados invalidos ou regra de negocio violada
export default class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
