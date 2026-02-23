import express from "express";
import cors from "cors";
import { planosRouter } from "./routes/planos.js";
import { formasPagamentoRouter } from "./routes/formas-pagamento.js";
import { clientesRouter } from "./routes/clientes.js";
import { mensalidadesRouter } from "./routes/mensalidades.js";
import { movimentoCaixaRouter } from "./routes/movimento-caixa.js";
import { relatoriosRouter } from "./routes/relatorios.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { startMensalidadesJob } from "./jobs/mensalidades.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/api/planos", planosRouter);
app.use("/api/formas-pagamento", formasPagamentoRouter);
app.use("/api/clientes", clientesRouter);
app.use("/api/mensalidades", mensalidadesRouter);
app.use("/api/movimento-caixa", movimentoCaixaRouter);
app.use("/api/relatorios", relatoriosRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

startMensalidadesJob();

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
