import express from "express";

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

export default app;
