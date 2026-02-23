import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Mensalidade, type FormaPagamento } from '../services/api'
import { InputDataBR } from '../components/InputDataBR'
import { formatarDataBR } from '../utils/date'

export default function Mensalidades() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 7) + '-01')
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0, 10))
  const [situacao, setSituacao] = useState('')
  const [pagamentoModal, setPagamentoModal] = useState<Mensalidade | null>(null)
  const [formaPagamentoId, setFormaPagamentoId] = useState('')
  const [valor, setValor] = useState('')
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10))
  const q = useQueryClient()

  const { data: mensalidades, isLoading } = useQuery({
    queryKey: ['mensalidades', dataInicio, dataFim, situacao],
    queryFn: () => {
      const p = new URLSearchParams()
      if (dataInicio) p.set('dataInicio', dataInicio)
      if (dataFim) p.set('dataFim', dataFim)
      if (situacao) p.set('situacao', situacao)
      return api.get<Mensalidade[]>(`/mensalidades?${p}`)
    },
  })
  const { data: formasPagamento } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: () => api.get<FormaPagamento[]>('/formas-pagamento'),
  })

  const registrarPagamento = useMutation({
    mutationFn: ({ id, valor: v, formaPagamentoId: fp, data }: { id: string; valor: number; formaPagamentoId: string; data: string }) =>
      api.post<Mensalidade>(`/mensalidades/${id}/registrar-pagamento`, { valor: v, formaPagamentoId: fp, data }),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['mensalidades'] })
      setPagamentoModal(null)
      setFormaPagamentoId('')
      setValor('')
    },
  })

  if (isLoading) return <div className="card">Carregando...</div>

  return (
    <div>
      <h1>Mensalidades</h1>
      <div className="card">
        <label>Data início</label>
        <InputDataBR value={dataInicio} onChange={setDataInicio} />
        <label>Data fim</label>
        <InputDataBR value={dataFim} onChange={setDataFim} />
        <label>Situação</label>
        <select value={situacao} onChange={(e) => setSituacao(e.target.value)}>
          <option value="">Todas</option>
          <option value="NaoPago">Não pago</option>
          <option value="Pago">Pago</option>
          <option value="Bonificada">Bonificada</option>
        </select>
      </div>

      {pagamentoModal && (
        <div className="card">
          <h2>Registrar pagamento</h2>
          <p>{pagamentoModal.cliente?.nomeCompleto} - {pagamentoModal.plano?.descricao} - R$ {pagamentoModal.valor.toFixed(2)}</p>
          <div className="form-group">
            <label>Forma de pagamento</label>
            <select value={formaPagamentoId} onChange={(e) => setFormaPagamentoId(e.target.value)} required>
              <option value="">Selecione</option>
              {formasPagamento?.map((f) => <option key={f.id} value={f.id}>{f.descricao} ({f.tipo})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Valor</label>
            <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={String(pagamentoModal.valor)} />
          </div>
          <div className="form-group">
            <label>Data pagamento</label>
            <InputDataBR value={dataPagamento} onChange={setDataPagamento} />
          </div>
          <button className="btn btn-primary" onClick={() => formaPagamentoId && registrarPagamento.mutate({
            id: pagamentoModal.id,
            valor: valor ? Number(valor) : pagamentoModal.valor,
            formaPagamentoId,
            data: dataPagamento,
          })}>Registrar</button>
          <button className="btn btn-secondary" onClick={() => setPagamentoModal(null)}>Cancelar</button>
        </div>
      )}

      <table>
        <thead>
          <tr><th>Cliente</th><th>Plano</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {mensalidades?.map((m) => (
            <tr key={m.id}>
              <td>{m.cliente?.nomeCompleto}</td>
              <td>{m.plano?.descricao}</td>
              <td>{formatarDataBR(m.vencimento)}</td>
              <td>R$ {m.valor.toFixed(2)}</td>
              <td>{m.situacao}</td>
              <td>
                {m.situacao === 'NaoPago' && (
                  <button className="btn btn-primary" onClick={() => { setPagamentoModal(m); setValor(''); setDataPagamento(new Date().toISOString().slice(0, 10)); }}>Registrar pagamento</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
