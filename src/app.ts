import express from "express";
import type { Request, Response, NextFunction } from "express";

import marcaRoutes from "./routes/marcaRoutes.js";
import veiculoRoutes from "./routes/veiculoRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import vendaRoutes from "./routes/vendaRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import AppError from "./errors/AppError.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

// =================
// Documentacao (Swagger)
// =================

app.get("/api-docs.json", (req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =================
// Marcas
// =================

app.use("/marcas", marcaRoutes);

// =================
// Veiculos
// =================

app.use("/veiculos", veiculoRoutes);

// =================
// Clientes
// =================

app.use("/clientes", clienteRoutes);

// =================
// Vendas
// =================

app.use("/vendas", vendaRoutes);

// =================
// Rota nao encontrada
// =================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Rota nao encontrada.",
  });
});

// =================
// Tratamento de erros
// =================

app.use(
  (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error.type === "entity.parse.failed") {
      res.status(400).json({
        message: "JSON invalido no corpo da requisicao.",
      });

      return;
    }

    // erros proprios (ValidationError, NotFoundError, ConflictError...)
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        message: error.message,
      });

      return;
    }

    console.error("Erro inesperado: ", error);

    res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
);

export default app;