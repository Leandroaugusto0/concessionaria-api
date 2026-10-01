import express from "express";
import marcaRoutes from "./routes/marcaRoutes.js";
import veiculoRoutes from "./routes/veiculoRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import vendaRoutes from "./routes/vendaRoutes.js";

const app = express();
app.use(express.json());
app.use(express.static("public"));

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

export default app;
