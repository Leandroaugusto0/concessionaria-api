import { Router } from "express";
import VeiculoController from "../controller/VeiculoController.js";

const router = Router();

router.get("/", VeiculoController.getAll);
router.get("/:id", VeiculoController.getById);
router.post("/", VeiculoController.create);
router.put("/:id", VeiculoController.update);
router.delete("/:id", VeiculoController.remove);

export default router;
