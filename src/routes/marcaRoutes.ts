import { Router } from "express";
import MarcaController from "../controller/MarcaController.js";

const router = Router();

router.get("/", MarcaController.getAll);
router.get("/:id", MarcaController.getById);
router.post("/", MarcaController.create);
router.put("/:id", MarcaController.update);
router.delete("/:id", MarcaController.remove);

export default router;
