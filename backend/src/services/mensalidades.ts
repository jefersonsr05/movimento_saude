import { PrismaClient, Prisma } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function proximoVencimento(vencimentoAtual: Date, tipoAssinatura: string): Date {
  const next = new Date(vencimentoAtual);
  switch (tipoAssinatura) {
    case "Mensal":
      next.setMonth(next.getMonth() + 1);
      break;
    case "Trimestral":
      next.setMonth(next.getMonth() + 3);
      break;
    case "Semestral":
      next.setMonth(next.getMonth() + 6);
      break;
    case "Anual":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function gerarPrimeiraMensalidade(
  tx: Tx,
  clienteId: string,
  planoId: string,
  valor: number,
  vencimento: Date
) {
  await tx.mensalidade.create({
    data: {
      clienteId,
      planoId,
      valor,
      vencimento,
      situacao: "NaoPago",
    },
  });
}

export async function gerarProximasMensalidades(db: Tx) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const emCincoDias = new Date(hoje);
  emCincoDias.setDate(emCincoDias.getDate() + 5);
  emCincoDias.setHours(23, 59, 59, 999);

  const mensalidadesQueVencemEmCinco = await db.mensalidade.findMany({
    where: {
      vencimento: { gte: hoje, lte: emCincoDias },
      situacao: "NaoPago",
      cliente: { ativo: true, planoId: { not: null } },
    },
    include: { plano: true, cliente: true },
  });

  for (const m of mensalidadesQueVencemEmCinco) {
    if (!m.planoId || !m.cliente.planoId) continue;
    const proximoVen = proximoVencimento(m.vencimento, m.plano.tipoAssinatura);
    const existe = await db.mensalidade.findUnique({
      where: {
        clienteId_planoId_vencimento: {
          clienteId: m.clienteId,
          planoId: m.planoId,
          vencimento: proximoVen,
        },
      },
    });
    if (!existe) {
      await db.mensalidade.create({
        data: {
          clienteId: m.clienteId,
          planoId: m.planoId,
          valor: m.plano.valor,
          vencimento: proximoVen,
          situacao: "NaoPago",
        },
      });
    }
  }
}
