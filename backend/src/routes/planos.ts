import { Router } from "express";
import { PlanosController } from "../controllers/planos.js";

const planosRouter = Router();
const controller = new PlanosController();

planosRouter.get("/", (req, res) => controller.list(req, res));
planosRouter.get("/:id", (req, res) => controller.get(req, res));
planosRouter.post("/", (req, res) => controller.create(req, res));
planosRouter.put("/:id", (req, res) => controller.update(req, res));
planosRouter.delete("/:id", (req, res) => controller.remove(req, res));

export { planosRouter };
