import { Router } from "express";
import { ClientesController } from "../controllers/clientes.js";

const clientesRouter = Router();
const controller = new ClientesController();

clientesRouter.get("/", (req, res) => controller.list(req, res));
clientesRouter.get("/:id", (req, res) => controller.get(req, res));
clientesRouter.post("/", (req, res) => controller.create(req, res));
clientesRouter.put("/:id", (req, res) => controller.update(req, res));
clientesRouter.delete("/:id", (req, res) => controller.remove(req, res));
clientesRouter.post("/:id/contratar-plano", (req, res) => controller.contratarPlano(req, res));

export { clientesRouter };
