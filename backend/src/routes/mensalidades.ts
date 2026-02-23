import { Router } from "express";
import { MensalidadesController } from "../controllers/mensalidades.js";

const mensalidadesRouter = Router();
const controller = new MensalidadesController();

mensalidadesRouter.get("/", (req, res) => controller.list(req, res));
mensalidadesRouter.get("/:id", (req, res) => controller.get(req, res));
mensalidadesRouter.post("/:id/registrar-pagamento", (req, res) => controller.registrarPagamento(req, res));

export { mensalidadesRouter };
