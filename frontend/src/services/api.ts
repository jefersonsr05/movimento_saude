const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Erro na requisição');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};

export type Cliente = {
  id: string;
  tipo: string;
  nomeCompleto: string;
  dataNascimento: string;
  idade?: number;
  sexo: string;
  cpf: string;
  contato: string | null;
  endereco: string | null;
  planoId: string | null;
  ativo: boolean;
  plano?: Plano | null;
  fichaSaude?: FichaSaude | null;
};
export type FichaSaude = {
  id: string;
  clienteId: string;
  doencaDiagnosticada: boolean;
  doencaDiagnosticadaQual: string | null;
  medicamentosContinuos: boolean;
  medicamentosContinuosQual: string | null;
  lesaoCirurgiaOrtopedia: boolean;
  lesaoCirurgiaOrtopediaQual: string | null;
  problemasCardiacosDiabetes: boolean;
  problemasCardiacosQual: string | null;
  restricaoMedica: boolean;
  restricaoMedicaQual: string | null;
  objetivos: string;
  objetivoOutro: string | null;
  nivelAtividade: string;
  frequenciaDesejada: string;
  dataFicha: string;
};
export type Plano = {
  id: string;
  descricao: string;
  valor: number;
  numeroTreinosSemana: number;
  tipoAssinatura: string;
};
export type FormaPagamento = {
  id: string;
  descricao: string;
  tipo: string;
};
export type Mensalidade = {
  id: string;
  dataGeracao: string;
  clienteId: string;
  planoId: string;
  valor: number;
  vencimento: string;
  situacao: string;
  cliente?: Cliente;
  plano?: Plano;
};
export type MovimentoCaixa = {
  id: string;
  data: string;
  descricao: string;
  clienteId: string | null;
  valor: number;
  tipo: string;
  formaPagamentoId: string;
  mensalidadeId: string | null;
  cliente?: Cliente | null;
  formaPagamento?: FormaPagamento;
  mensalidade?: Mensalidade | null;
};
