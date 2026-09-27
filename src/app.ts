import express from "express";
import marcaRoutes from "./routes/marcaRoutes.js";

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

export default app;
