import { Router } from "express";
import VendaController from "../controller/VendaController.js";

const router = Router();

router.get("/", VendaController.getAll);
router.get("/:id", VendaController.getById);
router.post("/", VendaController.create);
router.put("/:id", VendaController.update);
router.delete("/:id", VendaController.remove);

export default router;
