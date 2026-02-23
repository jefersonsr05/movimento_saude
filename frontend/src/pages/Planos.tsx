import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Plano } from '../services/api'
import { Modal } from '../components/Modal'

const TIPOS = ['Mensal', 'Trimestral', 'Semestral', 'Anual']

export default function Planos() {
  const [form, setForm] = useState<Partial<Plano>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Plano | null>(null)
  const [search, setSearch] = useState('')
  const q = useQueryClient()

  const { data: planos, isLoading } = useQuery({
    queryKey: ['planos'],
    queryFn: () => api.get<Plano[]>('/planos'),
  })

  const filtered = useMemo(() => {
    if (!planos) return []
    const s = search.trim().toLowerCase()
    if (!s) return planos
    return planos.filter(
      (p) =>
        p.descricao.toLowerCase().includes(s) ||
        p.tipoAssinatura.toLowerCase().includes(s) ||
        String(p.valor).includes(s)
    )
  }, [planos, search])

  const create = useMutation({
    mutationFn: (body: { descricao: string; valor: number; numeroTreinosSemana: number; tipoAssinatura: string }) =>
      api.post<Plano>('/planos', body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['planos'] })
      setForm({})
      setModalOpen(false)
    },
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<Plano> & { id: string }) => api.put<Plano>(`/planos/${id}`, body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['planos'] })
      setEditing(null)
      setForm({})
      setModalOpen(false)
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/planos/${id}`),
    onSuccess: () => q.invalidateQueries({ queryKey: ['planos'] }),
  })

  const openNew = () => {
    setEditing(null)
    setForm({})
    setModalOpen(true)
  }
  const openEdit = (p: Plano) => {
    setEditing(p)
    setForm(p)
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
      if (form.descricao && form.valor != null && form.numeroTreinosSemana != null && form.tipoAssinatura) {
        create.mutate({
          descricao: form.descricao,
          valor: Number(form.valor),
          numeroTreinosSemana: Number(form.numeroTreinosSemana),
          tipoAssinatura: form.tipoAssinatura,
        })
      }
    }
  }

  if (isLoading) return <div className="card">Carregando...</div>

  return (
    <div>
      <h1>Planos</h1>
      <div className="card">
        <div className="crud-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Pesquisar (descrição, tipo, valor)..."
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
              <th>Valor</th>
              <th>Treinos/sem</th>
              <th>Assinatura</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.descricao}</td>
                <td>R$ {p.valor.toFixed(2)}</td>
                <td>{p.numeroTreinosSemana}</td>
                <td>{p.tipoAssinatura}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => openEdit(p)}>
                    Editar
                  </button>
                  <button className="btn btn-danger" onClick={() => remove.mutate(p.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar plano' : 'Novo plano'}>
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
            <label>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.valor ?? ''}
              onChange={(e) => setForm({ ...form, valor: e.target.value as unknown as number })}
              required
            />
          </div>
          <div className="form-group">
            <label>Treinos por semana</label>
            <input
              type="number"
              min={1}
              value={form.numeroTreinosSemana ?? ''}
              onChange={(e) => setForm({ ...form, numeroTreinosSemana: Number(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>Assinatura</label>
            <select
              value={form.tipoAssinatura ?? ''}
              onChange={(e) => setForm({ ...form, tipoAssinatura: e.target.value })}
              required
            >
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
