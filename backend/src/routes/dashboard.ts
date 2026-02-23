import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.js";

const dashboardRouter = Router();
const controller = new DashboardController();

dashboardRouter.get("/totalizadores", (req, res) => controller.totalizadores(req, res));

export { dashboardRouter };
