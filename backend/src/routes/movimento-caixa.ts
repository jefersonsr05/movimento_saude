import { Router } from "express";
import { MovimentoCaixaController } from "../controllers/movimento-caixa.js";

const movimentoCaixaRouter = Router();
const controller = new MovimentoCaixaController();

movimentoCaixaRouter.get("/", (req, res) => controller.list(req, res));
movimentoCaixaRouter.get("/:id", (req, res) => controller.get(req, res));
movimentoCaixaRouter.post("/", (req, res) => controller.create(req, res));
movimentoCaixaRouter.put("/:id", (req, res) => controller.update(req, res));
movimentoCaixaRouter.delete("/:id", (req, res) => controller.remove(req, res));

export { movimentoCaixaRouter };
