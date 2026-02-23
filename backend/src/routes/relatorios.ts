import { Router } from "express";
import { RelatoriosController } from "../controllers/relatorios.js";

const relatoriosRouter = Router();
const controller = new RelatoriosController();

relatoriosRouter.get("/previsao-caixa", (req, res) => controller.previsaoCaixa(req, res));
relatoriosRouter.get("/recebimentos", (req, res) => controller.recebimentos(req, res));

export { relatoriosRouter };
