import express from "express";
import marcaRoutes from "./routes/marcaRoutes.js";
import veiculoRoutes from "./routes/veiculoRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import vendaRoutes from "./routes/vendaRoutes.js";

const app = express();
app.use(express.json());

// =================
// Root
// =================
app.get("/", (req, res) => {
    res.status(200).json({
        message: "API Concessionária",
        version: "1.0.0"
    });
});

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
