import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class PlanosController {
  async list(req: Request, res: Response) {
    try {
      const planos = await prisma.plano.findMany({ orderBy: { descricao: "asc" } });
      return res.json(planos);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plano = await prisma.plano.findUnique({ where: { id } });
      if (!plano) return res.status(404).json({ error: "Plano não encontrado" });
      return res.json(plano);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { descricao, valor, numeroTreinosSemana, tipoAssinatura } = req.body;
      if (!descricao || valor == null || numeroTreinosSemana == null || !tipoAssinatura) {
        return res.status(400).json({ error: "descricao, valor, numeroTreinosSemana e tipoAssinatura são obrigatórios" });
      }
      const plano = await prisma.plano.create({
        data: {
          descricao,
          valor: Number(valor),
          numeroTreinosSemana: Number(numeroTreinosSemana),
          tipoAssinatura: String(tipoAssinatura),
        },
      });
      return res.status(201).json(plano);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { descricao, valor, numeroTreinosSemana, tipoAssinatura } = req.body;
      const plano = await prisma.plano.update({
        where: { id },
        data: {
          ...(descricao != null && { descricao }),
          ...(valor != null && { valor: Number(valor) }),
          ...(numeroTreinosSemana != null && { numeroTreinosSemana: Number(numeroTreinosSemana) }),
          ...(tipoAssinatura != null && { tipoAssinatura: String(tipoAssinatura) }),
        },
      });
      return res.json(plano);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.plano.delete({ where: { id } });
      return res.status(204).send();
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
}
