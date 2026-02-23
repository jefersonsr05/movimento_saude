import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type MovimentoCaixa, type FormaPagamento, type Cliente } from '../services/api'
import { InputDataBR } from '../components/InputDataBR'
import { formatarDataBR } from '../utils/date'
import { Modal } from '../components/Modal'

const defaultForm = (): Partial<MovimentoCaixa> => ({
  data: new Date().toISOString().slice(0, 10),
  tipo: 'Entrada',
  valor: 0,
  descricao: '',
})

export default function MovimentoCaixa() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 7) + '-01')
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0, 10))
  const [tipo, setTipo] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MovimentoCaixa | null>(null)
  const [form, setForm] = useState<Partial<MovimentoCaixa>>(defaultForm())
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

  const filtered = useMemo(() => {
    if (!movimentos) return []
    const s = search.trim().toLowerCase()
    if (!s) return movimentos
    return movimentos.filter(
      (m) =>
        m.descricao.toLowerCase().includes(s) ||
        (m.cliente?.nomeCompleto && m.cliente.nomeCompleto.toLowerCase().includes(s))
    )
  }, [movimentos, search])

  const create = useMutation({
    mutationFn: (body: unknown) => api.post<MovimentoCaixa>('/movimento-caixa', body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['movimento-caixa'] })
      setForm(defaultForm())
      setModalOpen(false)
    },
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<MovimentoCaixa> & { id: string }) =>
      api.put<MovimentoCaixa>(`/movimento-caixa/${id}`, body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['movimento-caixa'] })
      setEditing(null)
      setForm(defaultForm())
      setModalOpen(false)
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/movimento-caixa/${id}`),
    onSuccess: () => q.invalidateQueries({ queryKey: ['movimento-caixa'] }),
  })

  const openNew = () => {
    setEditing(null)
    setForm(defaultForm())
    setModalOpen(true)
  }
  const openEdit = (m: MovimentoCaixa) => {
    setEditing(m)
    setForm({
      ...m,
      data: m.data ? String(m.data).slice(0, 10) : defaultForm().data,
    })
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(defaultForm())
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.data || !form.descricao || form.valor == null || !form.tipo || !form.formaPagamentoId) return
    const payload = {
      data: form.data,
      descricao: form.descricao,
      clienteId: form.clienteId || null,
      valor: Number(form.valor),
      tipo: form.tipo,
      formaPagamentoId: form.formaPagamentoId,
      mensalidadeId: form.mensalidadeId || null,
    }
    if (editing) {
      update.mutate({ id: editing.id, ...payload })
    } else {
      create.mutate(payload)
    }
  }

  if (isLoading) return <div className="card">Carregando...</div>

  const totalEntradas = movimentos?.filter((m) => m.tipo === 'Entrada').reduce((s, m) => s + m.valor, 0) ?? 0
  const totalSaidas = movimentos?.filter((m) => m.tipo === 'Saida').reduce((s, m) => s + m.valor, 0) ?? 0
  const saldo = totalEntradas - totalSaidas

  return (
    <div>
      <h1>Movimento de caixa</h1>
      <div className="card">
        <div className="crud-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Pesquisar (descrição ou cliente)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="crud-toolbar-filters">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data início</label>
              <InputDataBR value={dataInicio} onChange={setDataInicio} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data fim</label>
              <InputDataBR value={dataFim} onChange={setDataFim} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todos</option>
                <option value="Entrada">Entrada</option>
                <option value="Saida">Saída</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={openNew}>
              Incluir
            </button>
          </div>
        </div>
        <div className="card" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          <p>Total entradas: R$ {totalEntradas.toFixed(2)}</p>
          <p>Total saídas: R$ {totalSaidas.toFixed(2)}</p>
          <p><strong>Saldo período: R$ {saldo.toFixed(2)}</strong></p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Forma pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>{formatarDataBR(m.data)}</td>
                <td>{m.descricao}</td>
                <td>{m.cliente?.nomeCompleto ?? '-'}</td>
                <td>R$ {m.valor.toFixed(2)}</td>
                <td>{m.tipo}</td>
                <td>{m.formaPagamento?.descricao}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => openEdit(m)}>
                    Editar
                  </button>
                  <button className="btn btn-danger" onClick={() => remove.mutate(m.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar lançamento' : 'Novo lançamento'}
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Data</label>
            <InputDataBR
              value={form.data ? String(form.data).slice(0, 10) : ''}
              onChange={(v) => setForm({ ...form, data: v })}
              required
            />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <input
              value={form.descricao ?? ''}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Cliente/Fornecedor</label>
            <select
              value={form.clienteId ?? ''}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value || undefined })}
            >
              <option value="">Nenhum</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeCompleto}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Valor</label>
            <input
              type="number"
              step="0.01"
              value={form.valor ?? ''}
              onChange={(e) => setForm({ ...form, valor: e.target.value as unknown as number })}
              required
            />
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
            <select
              value={form.formaPagamentoId ?? ''}
              onChange={(e) => setForm({ ...form, formaPagamentoId: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              {formasPagamento?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.descricao}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            {editing ? 'Salvar' : 'Lançar'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cancelar
          </button>
        </form>
      </Modal>
    </div>
  )
}
