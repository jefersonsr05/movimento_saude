import { Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const m = hoje.getMonth() - dataNascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) idade--;
  return idade;
}

export class ClientesController {
  async list(req: Request, res: Response) {
    try {
      const { ativo, planoId, tipo } = req.query;
      const clientes = await prisma.cliente.findMany({
        where: {
          ...(ativo !== undefined && { ativo: ativo === "true" }),
          ...(planoId && typeof planoId === "string" && { planoId }),
          ...(tipo && typeof tipo === "string" && { tipo }),
        },
        include: { plano: true, fichaSaude: true },
        orderBy: { nomeCompleto: "asc" },
      });
      const withIdade = clientes.map((c: (typeof clientes)[number]) => ({
        ...c,
        idade: calcularIdade(c.dataNascimento),
      }));
      return res.json(withIdade);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cliente = await prisma.cliente.findUnique({
        where: { id },
        include: { plano: true, fichaSaude: true },
      });
      if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
      return res.json({
        ...cliente,
        idade: calcularIdade(cliente.dataNascimento),
      });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        tipo,
        nomeCompleto,
        dataNascimento,
        sexo,
        cpf,
        contato,
        endereco,
        planoId,
        ativo,
        fichaSaude,
      } = req.body;
      if (!tipo || !nomeCompleto || !dataNascimento || !sexo || !cpf) {
        return res.status(400).json({ error: "tipo, nomeCompleto, dataNascimento, sexo e cpf são obrigatórios" });
      }
      const cpfLimpo = String(cpf).replace(/\D/g, "");
      const { validarCPF } = await import("../lib/validar-cpf.js");
      if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({ error: "CPF inválido" });
      }
      const cliente = await prisma.cliente.create({
        data: {
          tipo: String(tipo),
          nomeCompleto,
          dataNascimento: new Date(dataNascimento),
          sexo: String(sexo),
          cpf: cpfLimpo,
          contato: contato ?? null,
          endereco: endereco ?? null,
          planoId: planoId ?? null,
          ativo: ativo !== false,
        },
      });
      if (fichaSaude && typeof fichaSaude === "object") {
        const obj = fichaSaude as Record<string, unknown>;
        const objetivos = Array.isArray(obj.objetivos) ? JSON.stringify(obj.objetivos) : String(obj.objetivos ?? "[]");
        await prisma.fichaSaude.create({
          data: {
            clienteId: cliente.id,
            doencaDiagnosticada: !!obj.doencaDiagnosticada,
            doencaDiagnosticadaQual: (obj.doencaDiagnosticadaQual as string) ?? null,
            medicamentosContinuos: !!obj.medicamentosContinuos,
            medicamentosContinuosQual: (obj.medicamentosContinuosQual as string) ?? null,
            lesaoCirurgiaOrtopedia: !!obj.lesaoCirurgiaOrtopedia,
            lesaoCirurgiaOrtopediaQual: (obj.lesaoCirurgiaOrtopediaQual as string) ?? null,
            problemasCardiacosDiabetes: !!obj.problemasCardiacosDiabetes,
            problemasCardiacosQual: (obj.problemasCardiacosQual as string) ?? null,
            restricaoMedica: !!obj.restricaoMedica,
            restricaoMedicaQual: (obj.restricaoMedicaQual as string) ?? null,
            objetivos,
            objetivoOutro: (obj.objetivoOutro as string) ?? null,
            nivelAtividade: String(obj.nivelAtividade ?? "Nunca"),
            frequenciaDesejada: String(obj.frequenciaDesejada ?? "TresPorSemana"),
            dataFicha: obj.dataFicha ? new Date(obj.dataFicha as string) : new Date(),
          },
        });
      }
      const created = await prisma.cliente.findUnique({
        where: { id: cliente.id },
        include: { plano: true, fichaSaude: true },
      });
      return res.status(201).json({
        ...created,
        idade: created ? calcularIdade(created.dataNascimento) : 0,
      });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        tipo,
        nomeCompleto,
        dataNascimento,
        sexo,
        cpf,
        contato,
        endereco,
        planoId,
        ativo,
        fichaSaude,
      } = req.body;
      const cpfLimpo = cpf != null ? String(cpf).replace(/\D/g, "") : undefined;
      if (cpfLimpo) {
        const { validarCPF } = await import("../lib/validar-cpf.js");
        if (!validarCPF(cpfLimpo)) {
          return res.status(400).json({ error: "CPF inválido" });
        }
      }
      const cliente = await prisma.cliente.update({
        where: { id },
        data: {
          ...(tipo != null && { tipo: String(tipo) }),
          ...(nomeCompleto != null && { nomeCompleto }),
          ...(dataNascimento != null && { dataNascimento: new Date(dataNascimento) }),
          ...(sexo != null && { sexo: String(sexo) }),
          ...(cpfLimpo != null && { cpf: cpfLimpo }),
          ...(contato !== undefined && { contato: contato ?? null }),
          ...(endereco !== undefined && { endereco: endereco ?? null }),
          ...(planoId !== undefined && { planoId: planoId ?? null }),
          ...(ativo !== undefined && { ativo }),
        },
      });
      if (fichaSaude && typeof fichaSaude === "object") {
        const obj = fichaSaude as Record<string, unknown>;
        const objetivos = Array.isArray(obj.objetivos) ? JSON.stringify(obj.objetivos) : String(obj.objetivos ?? "[]");
        await prisma.fichaSaude.upsert({
          where: { clienteId: id },
          create: {
            clienteId: id,
            doencaDiagnosticada: !!obj.doencaDiagnosticada,
            doencaDiagnosticadaQual: (obj.doencaDiagnosticadaQual as string) ?? null,
            medicamentosContinuos: !!obj.medicamentosContinuos,
            medicamentosContinuosQual: (obj.medicamentosContinuosQual as string) ?? null,
            lesaoCirurgiaOrtopedia: !!obj.lesaoCirurgiaOrtopedia,
            lesaoCirurgiaOrtopediaQual: (obj.lesaoCirurgiaOrtopediaQual as string) ?? null,
            problemasCardiacosDiabetes: !!obj.problemasCardiacosDiabetes,
            problemasCardiacosQual: (obj.problemasCardiacosQual as string) ?? null,
            restricaoMedica: !!obj.restricaoMedica,
            restricaoMedicaQual: (obj.restricaoMedicaQual as string) ?? null,
            objetivos,
            objetivoOutro: (obj.objetivoOutro as string) ?? null,
            nivelAtividade: String(obj.nivelAtividade ?? "Nunca"),
            frequenciaDesejada: String(obj.frequenciaDesejada ?? "TresPorSemana"),
            dataFicha: obj.dataFicha ? new Date(obj.dataFicha as string) : new Date(),
          },
          update: {
            doencaDiagnosticada: !!obj.doencaDiagnosticada,
            doencaDiagnosticadaQual: (obj.doencaDiagnosticadaQual as string) ?? null,
            medicamentosContinuos: !!obj.medicamentosContinuos,
            medicamentosContinuosQual: (obj.medicamentosContinuosQual as string) ?? null,
            lesaoCirurgiaOrtopedia: !!obj.lesaoCirurgiaOrtopedia,
            lesaoCirurgiaOrtopediaQual: (obj.lesaoCirurgiaOrtopediaQual as string) ?? null,
            problemasCardiacosDiabetes: !!obj.problemasCardiacosDiabetes,
            problemasCardiacosQual: (obj.problemasCardiacosQual as string) ?? null,
            restricaoMedica: !!obj.restricaoMedica,
            restricaoMedicaQual: (obj.restricaoMedicaQual as string) ?? null,
            objetivos,
            objetivoOutro: (obj.objetivoOutro as string) ?? null,
            nivelAtividade: String(obj.nivelAtividade ?? "Nunca"),
            frequenciaDesejada: String(obj.frequenciaDesejada ?? "TresPorSemana"),
            dataFicha: obj.dataFicha ? new Date(obj.dataFicha as string) : new Date(),
          },
        });
      }
      const updated = await prisma.cliente.findUnique({
        where: { id },
        include: { plano: true, fichaSaude: true },
      });
      return res.json({
        ...updated,
        idade: updated ? calcularIdade(updated.dataNascimento) : 0,
      });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.cliente.delete({ where: { id } });
      return res.status(204).send();
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  async contratarPlano(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { planoId, dataInicio } = req.body;
      if (!planoId) return res.status(400).json({ error: "planoId é obrigatório" });
      const cliente = await prisma.cliente.findUnique({ where: { id }, include: { plano: true } });
      if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
      const plano = await prisma.plano.findUnique({ where: { id: planoId } });
      if (!plano) return res.status(404).json({ error: "Plano não encontrado" });
      const { gerarPrimeiraMensalidade } = await import("../services/mensalidades.js");
      const vencimento = dataInicio ? new Date(dataInicio) : new Date();
      await prisma.$transaction(async (tx: Tx) => {
        await tx.cliente.update({ where: { id }, data: { planoId } });
        await gerarPrimeiraMensalidade(tx, cliente.id, plano.id, plano.valor, vencimento);
      });
      const updated = await prisma.cliente.findUnique({
        where: { id },
        include: { plano: true, fichaSaude: true },
      });
      return res.json({
        ...updated,
        idade: updated ? calcularIdade(updated.dataNascimento) : 0,
      });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
}
