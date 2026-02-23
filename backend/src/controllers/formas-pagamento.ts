import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class FormasPagamentoController {
  async list(req: Request, res: Response) {
    try {
      const formas = await prisma.formaPagamento.findMany({ orderBy: { descricao: "asc" } });
      return res.json(formas);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const forma = await prisma.formaPagamento.findUnique({ where: { id } });
      if (!forma) return res.status(404).json({ error: "Forma de pagamento não encontrada" });
      return res.json(forma);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { descricao, tipo } = req.body;
      if (!descricao || !tipo) {
        return res.status(400).json({ error: "descricao e tipo são obrigatórios" });
      }
      const forma = await prisma.formaPagamento.create({
        data: { descricao, tipo: String(tipo) },
      });
      return res.status(201).json(forma);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { descricao, tipo } = req.body;
      const forma = await prisma.formaPagamento.update({
        where: { id },
        data: {
          ...(descricao != null && { descricao }),
          ...(tipo != null && { tipo: String(tipo) }),
        },
      });
      return res.json(forma);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.formaPagamento.delete({ where: { id } });
      return res.status(204).send();
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
}
