import { Router } from "express";
import { FormasPagamentoController } from "../controllers/formas-pagamento.js";

const formasPagamentoRouter = Router();
const controller = new FormasPagamentoController();

formasPagamentoRouter.get("/", (req, res) => controller.list(req, res));
formasPagamentoRouter.get("/:id", (req, res) => controller.get(req, res));
formasPagamentoRouter.post("/", (req, res) => controller.create(req, res));
formasPagamentoRouter.put("/:id", (req, res) => controller.update(req, res));
formasPagamentoRouter.delete("/:id", (req, res) => controller.remove(req, res));

export { formasPagamentoRouter };
