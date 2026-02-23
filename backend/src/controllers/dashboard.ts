import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class DashboardController {
  async totalizadores(req: Request, res: Response) {
    try {
      const clientesPorPlano = await prisma.cliente.groupBy({
        by: ["planoId"],
        where: { ativo: true, planoId: { not: null } },
        _count: { id: true },
      });

      const planos = await prisma.plano.findMany({
        select: { id: true, descricao: true, tipoAssinatura: true },
      });

      const totalizadores = planos.map((p: (typeof planos)[number]) => ({
        planoId: p.id,
        descricao: p.descricao,
        tipoAssinatura: p.tipoAssinatura,
        totalClientes: clientesPorPlano.find((c: (typeof clientesPorPlano)[number]) => c.planoId === p.id)?._count.id ?? 0,
      }));

      const totalGeral = totalizadores.reduce((s: number, t: (typeof totalizadores)[number]) => s + t.totalClientes, 0);

      return res.json({
        porPlano: totalizadores,
        totalClientesAtivos: totalGeral,
      });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
}
