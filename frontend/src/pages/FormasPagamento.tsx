import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type FormaPagamento } from '../services/api'

const TIPOS = ['Dinheiro', 'CartaoCredito', 'CartaoDebito', 'PIX', 'Transferencia']

export default function FormasPagamento() {
  const [form, setForm] = useState<Partial<FormaPagamento>>({})
  const [editing, setEditing] = useState<FormaPagamento | null>(null)
  const q = useQueryClient()

  const { data: formas, isLoading } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: () => api.get<FormaPagamento[]>('/formas-pagamento'),
  })

  const create = useMutation({
    mutationFn: (body: { descricao: string; tipo: string }) => api.post<FormaPagamento>('/formas-pagamento', body),
    onSuccess: () => { q.invalidateQueries({ queryKey: ['formas-pagamento'] }); setForm({}); },
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<FormaPagamento> & { id: string }) => api.put<FormaPagamento>(`/formas-pagamento/${id}`, body),
    onSuccess: () => { q.invalidateQueries({ queryKey: ['formas-pagamento'] }); setEditing(null); setForm({}); },
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/formas-pagamento/${id}`),
    onSuccess: () => q.invalidateQueries({ queryKey: ['formas-pagamento'] }),
  })

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
        <h2>{editing ? 'Editar' : 'Nova'} forma</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Descrição</label>
            <input value={form.descricao ?? ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.tipo ?? ''} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required>
              <option value="">Selecione</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Salvar</button>
          {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm({}); }}>Cancelar</button>}
        </form>
      </div>
      <table>
        <thead>
          <tr><th>Descrição</th><th>Tipo</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {formas?.map((f) => (
            <tr key={f.id}>
              <td>{f.descricao}</td>
              <td>{f.tipo}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => { setEditing(f); setForm(f); }}>Editar</button>
                <button className="btn btn-danger" onClick={() => remove.mutate(f.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
