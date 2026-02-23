import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Cliente, type Plano, type FichaSaude } from '../services/api'

const TIPOS = ['Cliente', 'Fornecedor', 'Ambos']
const SEXOS = ['M', 'F', 'Outro']
const NIVEL = ['Nunca', 'Iniciante', 'Intermediario', 'Avancado']
const FREQ = ['TresPorSemana', 'CincoPorSemana', 'SeisPorSemana']

type ClienteForm = Omit<Partial<Cliente>, 'fichaSaude'> & { fichaSaude?: Partial<FichaSaude> }

function cpfMask(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14)
}

export default function Clientes() {
  const [form, setForm] = useState<ClienteForm>({})
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [contratarPlano, setContratarPlano] = useState<Cliente | null>(null)
  const [planoContratar, setPlanoContratar] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const q = useQueryClient()

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.get<Cliente[]>('/clientes'),
  })
  const { data: planos } = useQuery({
    queryKey: ['planos'],
    queryFn: () => api.get<Plano[]>('/planos'),
  })

  const create = useMutation({
    mutationFn: (body: unknown) => api.post<Cliente>('/clientes', body),
    onSuccess: () => { q.invalidateQueries({ queryKey: ['clientes'] }); setForm({}); setEditing(null); },
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: unknown & { id: string }) => api.put<Cliente>(`/clientes/${id}`, body),
    onSuccess: () => { q.invalidateQueries({ queryKey: ['clientes'] }); setEditing(null); setForm({}); },
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: () => q.invalidateQueries({ queryKey: ['clientes'] }),
  })
  const contratar = useMutation({
    mutationFn: ({ clienteId, planoId, dataInicio }: { clienteId: string; planoId: string; dataInicio?: string }) =>
      api.post<Cliente>(`/clientes/${clienteId}/contratar-plano`, { planoId, dataInicio: dataInicio || undefined }),
    onSuccess: () => { q.invalidateQueries({ queryKey: ['clientes'] }); setContratarPlano(null); setPlanoContratar(''); setDataInicio(''); },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const cpfLimpo = (form.cpf ?? '').replace(/\D/g, '')
    if (!form.tipo || !form.nomeCompleto || !form.dataNascimento || !form.sexo || !cpfLimpo) return
    let objetivosFinal = '[]'
    if (form.fichaSaude?.objetivos) {
      try {
        const o = form.fichaSaude.objetivos
        objetivosFinal = typeof o === 'string' ? (o.trim().startsWith('[') ? o : JSON.stringify([o])) : JSON.stringify(Array.isArray(o) ? o : [])
      } catch {
        objetivosFinal = JSON.stringify([String(form.fichaSaude.objetivos)])
      }
    }
    const payload = {
      ...form,
      cpf: cpfLimpo,
      fichaSaude: form.fichaSaude ? {
        ...form.fichaSaude,
        objetivos: objetivosFinal,
      } : undefined,
    }
    if (editing) {
      update.mutate({ id: editing.id, ...payload })
    } else {
      create.mutate(payload)
    }
  }

  if (isLoading) return <div className="card">Carregando...</div>

  return (
    <div>
      <h1>Clientes</h1>
      <div className="card">
        <h2>{editing ? 'Editar' : 'Novo'} cliente</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.tipo ?? ''} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required>
              <option value="">Selecione</option>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Nome completo</label>
            <input value={form.nomeCompleto ?? ''} onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Data nascimento</label>
            <input type="date" value={form.dataNascimento ? form.dataNascimento.toString().slice(0, 10) : ''} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Sexo</label>
            <select value={form.sexo ?? ''} onChange={(e) => setForm({ ...form, sexo: e.target.value })} required>
              <option value="">Selecione</option>
              {SEXOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>CPF</label>
            <input value={form.cpf ?? ''} onChange={(e) => setForm({ ...form, cpf: cpfMask(e.target.value) })} placeholder="000.000.000-00" required />
          </div>
          <div className="form-group">
            <label>Contato</label>
            <input value={form.contato ?? ''} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Endereço</label>
            <input value={form.endereco ?? ''} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Plano</label>
            <select value={form.planoId ?? ''} onChange={(e) => setForm({ ...form, planoId: e.target.value || undefined })}>
              <option value="">Nenhum</option>
              {planos?.map((p) => <option key={p.id} value={p.id}>{p.descricao}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><input type="checkbox" checked={form.ativo !== false} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Ativo</label>
          </div>
          <h3>Ficha de saúde (opcional)</h3>
          <div className="form-group">
            <label>Doença diagnosticada?</label>
            <select value={form.fichaSaude?.doencaDiagnosticada ? '1' : '0'} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, doencaDiagnosticada: e.target.value === '1' } })}>
              <option value="0">Não</option><option value="1">Sim</option>
            </select>
            {form.fichaSaude?.doencaDiagnosticada && <input placeholder="Qual?" value={form.fichaSaude?.doencaDiagnosticadaQual ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, doencaDiagnosticadaQual: e.target.value } })} />}
          </div>
          <div className="form-group">
            <label>Medicamentos contínuos?</label>
            <select value={form.fichaSaude?.medicamentosContinuos ? '1' : '0'} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, medicamentosContinuos: e.target.value === '1' } })}>
              <option value="0">Não</option><option value="1">Sim</option>
            </select>
            {form.fichaSaude?.medicamentosContinuos && <input placeholder="Qual?" value={form.fichaSaude?.medicamentosContinuosQual ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, medicamentosContinuosQual: e.target.value } })} />}
          </div>
          <div className="form-group">
            <label>Lesão/cirurgia/ortopedia?</label>
            <select value={form.fichaSaude?.lesaoCirurgiaOrtopedia ? '1' : '0'} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, lesaoCirurgiaOrtopedia: e.target.value === '1' } })}>
              <option value="0">Não</option><option value="1">Sim</option>
            </select>
            {form.fichaSaude?.lesaoCirurgiaOrtopedia && <input placeholder="Qual?" value={form.fichaSaude?.lesaoCirurgiaOrtopediaQual ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, lesaoCirurgiaOrtopediaQual: e.target.value } })} />}
          </div>
          <div className="form-group">
            <label>Problemas cardíacos/diabetes?</label>
            <select value={form.fichaSaude?.problemasCardiacosDiabetes ? '1' : '0'} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, problemasCardiacosDiabetes: e.target.value === '1' } })}>
              <option value="0">Não</option><option value="1">Sim</option>
            </select>
            {form.fichaSaude?.problemasCardiacosDiabetes && <input placeholder="Qual?" value={form.fichaSaude?.problemasCardiacosQual ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, problemasCardiacosQual: e.target.value } })} />}
          </div>
          <div className="form-group">
            <label>Restrição médica?</label>
            <select value={form.fichaSaude?.restricaoMedica ? '1' : '0'} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, restricaoMedica: e.target.value === '1' } })}>
              <option value="0">Não</option><option value="1">Sim</option>
            </select>
            {form.fichaSaude?.restricaoMedica && <input placeholder="Qual?" value={form.fichaSaude?.restricaoMedicaQual ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, restricaoMedicaQual: e.target.value } })} />}
          </div>
          <div className="form-group">
            <label>Objetivo (múltipla escolha - use checkboxes no backend ou texto)</label>
            <input placeholder='Ex: ["Emagrecimento"]' value={typeof form.fichaSaude?.objetivos === 'string' ? form.fichaSaude.objetivos : JSON.stringify(form.fichaSaude?.objetivos ?? [])} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, objetivos: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Objetivo outro</label>
            <input value={form.fichaSaude?.objetivoOutro ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, objetivoOutro: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Nível atividade</label>
            <select value={form.fichaSaude?.nivelAtividade ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, nivelAtividade: e.target.value } })}>
              {NIVEL.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Frequência desejada</label>
            <select value={form.fichaSaude?.frequenciaDesejada ?? ''} onChange={(e) => setForm({ ...form, fichaSaude: { ...form.fichaSaude, frequenciaDesejada: e.target.value } })}>
              {FREQ.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Salvar</button>
          {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm({}); }}>Cancelar</button>}
        </form>
      </div>

      {contratarPlano && (
        <div className="card">
          <h2>Contratar plano: {contratarPlano.nomeCompleto}</h2>
          <select value={planoContratar} onChange={(e) => setPlanoContratar(e.target.value)}>
            <option value="">Selecione o plano</option>
            {planos?.map((p) => <option key={p.id} value={p.id}>{p.descricao} - R$ {p.valor.toFixed(2)}</option>)}
          </select>
          <label>Data início</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <button className="btn btn-primary" onClick={() => planoContratar && contratar.mutate({ clienteId: contratarPlano.id, planoId: planoContratar, dataInicio: dataInicio || undefined })}>Contratar</button>
          <button className="btn btn-secondary" onClick={() => setContratarPlano(null)}>Cancelar</button>
        </div>
      )}

      <table>
        <thead>
          <tr><th>Nome</th><th>Tipo</th><th>CPF</th><th>Plano</th><th>Ativo</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {clientes?.map((c) => (
            <tr key={c.id}>
              <td>{c.nomeCompleto}</td>
              <td>{c.tipo}</td>
              <td>{c.cpf}</td>
              <td>{c.plano?.descricao ?? '-'}</td>
              <td>{c.ativo ? 'Sim' : 'Não'}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => { setEditing(c); setForm({ ...c, fichaSaude: c.fichaSaude ? { ...c.fichaSaude, objetivos: c.fichaSaude?.objetivos } : undefined }); }}>Editar</button>
                <button className="btn btn-primary" onClick={() => setContratarPlano(c)}>Contratar plano</button>
                <button className="btn btn-danger" onClick={() => remove.mutate(c.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
