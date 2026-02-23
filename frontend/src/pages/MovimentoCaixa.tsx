import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type MovimentoCaixa, type FormaPagamento, type Cliente } from '../services/api'

export default function MovimentoCaixa() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 7) + '-01')
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0, 10))
  const [tipo, setTipo] = useState('')
  const [form, setForm] = useState<Partial<MovimentoCaixa>>({
    data: new Date().toISOString().slice(0, 10),
    tipo: 'Entrada',
    valor: 0,
    descricao: '',
  })
  const q = useQueryClient()

  const { data: movimentos, isLoading } = useQuery({
    queryKey: ['movimento-caixa', dataInicio, dataFim, tipo],
    queryFn: () => {
      const p = new URLSearchParams()
      if (dataInicio) p.set('dataInicio', dataInicio)
      if (dataFim) p.set('dataFim', dataFim)
      if (tipo) p.set('tipo', tipo)
      return api.get<MovimentoCaixa[]>(`/movimento-caixa?${p}`)
    },
  })
  const { data: formasPagamento } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: () => api.get<FormaPagamento[]>('/formas-pagamento'),
  })
  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.get<Cliente[]>('/clientes'),
  })

  const create = useMutation({
    mutationFn: (body: unknown) => api.post<MovimentoCaixa>('/movimento-caixa', body),
    onSuccess: () => { q.invalidateQueries({ queryKey: ['movimento-caixa'] }); setForm({ data: new Date().toISOString().slice(0, 10), tipo: 'Entrada', valor: 0, descricao: '' }); },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.data || !form.descricao || form.valor == null || !form.tipo || !form.formaPagamentoId) return
    create.mutate({
      data: form.data,
      descricao: form.descricao,
      clienteId: form.clienteId || null,
      valor: Number(form.valor),
      tipo: form.tipo,
      formaPagamentoId: form.formaPagamentoId,
      mensalidadeId: form.mensalidadeId || null,
    })
  }

  if (isLoading) return <div className="card">Carregando...</div>

  const totalEntradas = movimentos?.filter((m) => m.tipo === 'Entrada').reduce((s, m) => s + m.valor, 0) ?? 0
  const totalSaidas = movimentos?.filter((m) => m.tipo === 'Saida').reduce((s, m) => s + m.valor, 0) ?? 0
  const saldo = totalEntradas - totalSaidas

  return (
    <div>
      <h1>Movimento de caixa</h1>
      <div className="card">
        <h2>Novo lançamento</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Data</label>
            <input type="date" value={form.data ? String(form.data).slice(0, 10) : ''} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <input value={form.descricao ?? ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Cliente/Fornecedor</label>
            <select value={form.clienteId ?? ''} onChange={(e) => setForm({ ...form, clienteId: e.target.value || undefined })}>
              <option value="">Nenhum</option>
              {clientes?.map((c) => <option key={c.id} value={c.id}>{c.nomeCompleto}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Valor</label>
            <input type="number" step="0.01" value={form.valor ?? ''} onChange={(e) => setForm({ ...form, valor: e.target.value as unknown as number })} required />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.tipo ?? 'Entrada'} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Entrada">Entrada</option>
              <option value="Saida">Saída</option>
            </select>
          </div>
          <div className="form-group">
            <label>Forma de pagamento</label>
            <select value={form.formaPagamentoId ?? ''} onChange={(e) => setForm({ ...form, formaPagamentoId: e.target.value })} required>
              <option value="">Selecione</option>
              {formasPagamento?.map((f) => <option key={f.id} value={f.id}>{f.descricao}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Lançar</button>
        </form>
      </div>

      <div className="card">
        <label>Data início</label>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <label>Data fim</label>
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        <label>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos</option>
          <option value="Entrada">Entrada</option>
          <option value="Saida">Saída</option>
        </select>
      </div>

      <div className="card">
        <p>Total entradas: R$ {totalEntradas.toFixed(2)}</p>
        <p>Total saídas: R$ {totalSaidas.toFixed(2)}</p>
        <p><strong>Saldo período: R$ {saldo.toFixed(2)}</strong></p>
      </div>

      <table>
        <thead>
          <tr><th>Data</th><th>Descrição</th><th>Cliente</th><th>Valor</th><th>Tipo</th><th>Forma pagamento</th></tr>
        </thead>
        <tbody>
          {movimentos?.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.data).toLocaleDateString('pt-BR')}</td>
              <td>{m.descricao}</td>
              <td>{m.cliente?.nomeCompleto ?? '-'}</td>
              <td>R$ {m.valor.toFixed(2)}</td>
              <td>{m.tipo}</td>
              <td>{m.formaPagamento?.descricao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
