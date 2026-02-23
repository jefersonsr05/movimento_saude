import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type FormaPagamento } from '../services/api'
import { Modal } from '../components/Modal'

const TIPOS = ['Dinheiro', 'CartaoCredito', 'CartaoDebito', 'PIX', 'Transferencia']

export default function FormasPagamento() {
  const [form, setForm] = useState<Partial<FormaPagamento>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FormaPagamento | null>(null)
  const [search, setSearch] = useState('')
  const q = useQueryClient()

  const { data: formas, isLoading } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: () => api.get<FormaPagamento[]>('/formas-pagamento'),
  })

  const filtered = useMemo(() => {
    if (!formas) return []
    const s = search.trim().toLowerCase()
    if (!s) return formas
    return formas.filter(
      (f) => f.descricao.toLowerCase().includes(s) || f.tipo.toLowerCase().includes(s)
    )
  }, [formas, search])

  const create = useMutation({
    mutationFn: (body: { descricao: string; tipo: string }) =>
      api.post<FormaPagamento>('/formas-pagamento', body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['formas-pagamento'] })
      setForm({})
      setModalOpen(false)
    },
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<FormaPagamento> & { id: string }) =>
      api.put<FormaPagamento>(`/formas-pagamento/${id}`, body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['formas-pagamento'] })
      setEditing(null)
      setForm({})
      setModalOpen(false)
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/formas-pagamento/${id}`),
    onSuccess: () => q.invalidateQueries({ queryKey: ['formas-pagamento'] }),
  })

  const openNew = () => {
    setEditing(null)
    setForm({})
    setModalOpen(true)
  }
  const openEdit = (f: FormaPagamento) => {
    setEditing(f)
    setForm(f)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm({})
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      update.mutate({ id: editing.id, ...form })
    } else {
      if (form.descricao && form.tipo) create.mutate({ descricao: form.descricao, tipo: form.tipo })
    }
  }

  if (isLoading) return <div className="card">Carregando...</div>

  return (
    <div>
      <h1>Formas de pagamento</h1>
      <div className="card">
        <div className="crud-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Pesquisar (descrição ou tipo)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={openNew}>
            Incluir
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td>{f.descricao}</td>
                <td>{f.tipo}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => openEdit(f)}>
                    Editar
                  </button>
                  <button className="btn btn-danger" onClick={() => remove.mutate(f.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar forma de pagamento' : 'Nova forma de pagamento'}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Descrição</label>
            <input
              value={form.descricao ?? ''}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.tipo ?? ''} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required>
              <option value="">Selecione</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Salvar
          </button>
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cancelar
          </button>
        </form>
      </Modal>
    </div>
  )
}
