import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class MovimentoCaixaController {
  async list(req: Request, res: Response) {
    try {
      const { tipo, dataInicio, dataFim, clienteId } = req.query;
      const where: Record<string, unknown> = {};
      if (tipo && typeof tipo === "string") where.tipo = tipo;
      if (clienteId && typeof clienteId === "string") where.clienteId = clienteId;
      if (dataInicio && typeof dataInicio === "string") {
        where.data = { ...((where.data as object) || {}), gte: new Date(dataInicio) };
      }
      if (dataFim && typeof dataFim === "string") {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        where.data = { ...((where.data as object) || {}), lte: fim };
      }
      const movimentos = await prisma.movimentoCaixa.findMany({
        where: where as never,
        include: { cliente: true, formaPagamento: true, mensalidade: true },
        orderBy: { data: "desc" },
      });
      return res.json(movimentos);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const mov = await prisma.movimentoCaixa.findUnique({
        where: { id },
        include: { cliente: true, formaPagamento: true, mensalidade: true },
      });
      if (!mov) return res.status(404).json({ error: "Movimento não encontrado" });
      return res.json(mov);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { data, descricao, clienteId, valor, tipo, formaPagamentoId, mensalidadeId } = req.body;
      if (!data || !descricao || valor == null || !tipo || !formaPagamentoId) {
        return res.status(400).json({
          error: "data, descricao, valor, tipo e formaPagamentoId são obrigatórios",
        });
      }
      const movimento = await prisma.movimentoCaixa.create({
        data: {
          data: new Date(data),
          descricao,
          clienteId: clienteId ?? null,
          valor: Number(valor),
          tipo: String(tipo),
          formaPagamentoId,
          mensalidadeId: mensalidadeId ?? null,
        },
        include: { cliente: true, formaPagamento: true, mensalidade: true },
      });
      return res.status(201).json(movimento);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { data, descricao, clienteId, valor, tipo, formaPagamentoId, mensalidadeId } = req.body;
      const movimento = await prisma.movimentoCaixa.update({
        where: { id },
        data: {
          ...(data != null && { data: new Date(data) }),
          ...(descricao != null && { descricao }),
          ...(clienteId !== undefined && { clienteId: clienteId ?? null }),
          ...(valor != null && { valor: Number(valor) }),
          ...(tipo != null && { tipo: String(tipo) }),
          ...(formaPagamentoId != null && { formaPagamentoId }),
          ...(mensalidadeId !== undefined && { mensalidadeId: mensalidadeId ?? null }),
        },
        include: { cliente: true, formaPagamento: true, mensalidade: true },
      });
      return res.json(movimento);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.movimentoCaixa.delete({ where: { id } });
      return res.status(204).send();
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
}
