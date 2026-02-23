import { Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class MensalidadesController {
  async list(req: Request, res: Response) {
    try {
      const { clienteId, situacao, dataInicio, dataFim } = req.query;
      const where: Record<string, unknown> = {};
      if (clienteId && typeof clienteId === "string") where.clienteId = clienteId;
      if (situacao && typeof situacao === "string") where.situacao = situacao;
      if (dataInicio && typeof dataInicio === "string") {
        where.vencimento = { ...((where.vencimento as object) || {}), gte: new Date(dataInicio) };
      }
      if (dataFim && typeof dataFim === "string") {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        where.vencimento = { ...((where.vencimento as object) || {}), lte: fim };
      }
      const mensalidades = await prisma.mensalidade.findMany({
        where: where as never,
        include: { cliente: true, plano: true },
        orderBy: { vencimento: "asc" },
      });
      return res.json(mensalidades);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const m = await prisma.mensalidade.findUnique({
        where: { id },
        include: { cliente: true, plano: true },
      });
      if (!m) return res.status(404).json({ error: "Mensalidade não encontrada" });
      return res.json(m);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async registrarPagamento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { valor, formaPagamentoId, data } = req.body;
      if (!formaPagamentoId) return res.status(400).json({ error: "formaPagamentoId é obrigatório" });
      const mensalidade = await prisma.mensalidade.findUnique({
        where: { id },
        include: { cliente: true, plano: true },
      });
      if (!mensalidade) return res.status(404).json({ error: "Mensalidade não encontrada" });
      if (mensalidade.situacao === "Pago") {
        return res.status(400).json({ error: "Mensalidade já está paga" });
      }
      const valorLancamento = valor != null ? Number(valor) : mensalidade.valor;
      const dataLancamento = data ? new Date(data) : new Date();
      await prisma.$transaction(async (tx: Tx) => {
        await tx.mensalidade.update({
          where: { id },
          data: { situacao: "Pago" },
        });
        await tx.movimentoCaixa.create({
          data: {
            data: dataLancamento,
            descricao: `Mensalidade ${mensalidade.plano.descricao} - ${mensalidade.cliente.nomeCompleto}`,
            clienteId: mensalidade.clienteId,
            valor: valorLancamento,
            tipo: "Entrada",
            formaPagamentoId,
            mensalidadeId: id,
          },
        });
      });
      const updated = await prisma.mensalidade.findUnique({
        where: { id },
        include: { cliente: true, plano: true },
      });
      return res.json(updated);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
}
