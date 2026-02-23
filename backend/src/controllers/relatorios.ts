import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class RelatoriosController {
  async previsaoCaixa(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: "dataInicio e dataFim são obrigatórios" });
      }
      const inicio = new Date(dataInicio as string);
      const fim = new Date(dataFim as string);
      fim.setHours(23, 59, 59, 999);

      const [movimentos, mensalidadesARecber] = await Promise.all([
        prisma.movimentoCaixa.findMany({
          where: { data: { gte: inicio, lte: fim } },
        }),
        prisma.mensalidade.findMany({
          where: {
            vencimento: { gte: inicio, lte: fim },
            situacao: "NaoPago",
          },
          include: { cliente: true, plano: true },
        }),
      ]);

      const realizadosEntradas = movimentos
        .filter((m: (typeof movimentos)[number]) => m.tipo === "Entrada")
        .reduce((s: number, m: (typeof movimentos)[number]) => s + m.valor, 0);
      const realizadosSaidas = movimentos
        .filter((m: (typeof movimentos)[number]) => m.tipo === "Saida")
        .reduce((s: number, m: (typeof movimentos)[number]) => s + m.valor, 0);
      const aRealizar = mensalidadesARecber.reduce((s: number, m: (typeof mensalidadesARecber)[number]) => s + m.valor, 0);

      return res.json({
        periodo: { dataInicio: inicio, dataFim: fim },
        realizados: { entradas: realizadosEntradas, saidas: realizadosSaidas, total: realizadosEntradas - realizadosSaidas },
        aRealizar,
        mensalidadesARecber,
        movimentos,
      });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async recebimentos(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: "dataInicio e dataFim são obrigatórios" });
      }
      const inicio = new Date(dataInicio as string);
      const fim = new Date(dataFim as string);
      fim.setHours(23, 59, 59, 999);

      const movimentos = await prisma.movimentoCaixa.findMany({
        where: { data: { gte: inicio, lte: fim } },
        include: { cliente: true, formaPagamento: true },
        orderBy: { data: "asc" },
      });

      const entradas = movimentos.filter((m: (typeof movimentos)[number]) => m.tipo === "Entrada");
      const saidas = movimentos.filter((m: (typeof movimentos)[number]) => m.tipo === "Saida");
      const totalEntradas = entradas.reduce((s: number, m: (typeof movimentos)[number]) => s + m.valor, 0);
      const totalSaidas = saidas.reduce((s: number, m: (typeof movimentos)[number]) => s + m.valor, 0);
      const saldo = totalEntradas - totalSaidas;

      return res.json({
        periodo: { dataInicio: inicio, dataFim: fim },
        recebidos: entradas,
        pagos: saidas,
        totalEntradas,
        totalSaidas,
        saldoCaixa: saldo,
      });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
}
