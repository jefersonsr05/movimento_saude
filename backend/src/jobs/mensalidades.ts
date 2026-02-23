import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { gerarProximasMensalidades } from "../services/mensalidades.js";

export function startMensalidadesJob() {
  cron.schedule("0 6 * * *", async () => {
    try {
      await gerarProximasMensalidades(prisma);
      console.log("[Job] Próximas mensalidades verificadas/geradas.");
    } catch (e) {
      console.error("[Job] Erro ao gerar próximas mensalidades:", e);
    }
  });
}
