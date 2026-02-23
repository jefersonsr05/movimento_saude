import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Cliente, type Plano, type FichaSaude } from '../services/api'
import { InputDataBR } from '../components/InputDataBR'
import { Modal } from '../components/Modal'

const TIPOS = ['Cliente', 'Fornecedor', 'Ambos']
const SEXOS = ['Masculino', 'Feminino', 'Não informado']
const NIVEL = ['Nunca', 'Iniciante', 'Intermediario', 'Avancado']
const FREQ = [
  { value: 'TresPorSemana', label: '3X por semana' },
  { value: 'CincoPorSemana', label: '5X por semana' },
  { value: 'SeisPorSemana', label: '6X por semana' },
]

const OBJETIVOS_OPCOES = [
  { value: 'Emagrecimento', label: 'Emagrecimento' },
  { value: 'GanhoMassaMuscular', label: 'Ganho de massa muscular' },
  { value: 'CondicionamentoFisico', label: 'Condicionamento físico' },
  { value: 'SaudeBemEstar', label: 'Saúde e bem-estar' },
  { value: 'Reabilitacao', label: 'Reabilitação' },
  { value: 'Outro', label: 'Outro' },
]

type ClienteForm = Omit<Partial<Cliente>, 'fichaSaude'> & { fichaSaude?: Partial<FichaSaude> }

function cpfMask(v: string) {
  return v
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

function parseObjetivos(objetivos: string | string[] | undefined): string[] {
  if (!objetivos) return []
  if (Array.isArray(objetivos)) return objetivos
  try {
    const parsed = JSON.parse(objetivos)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return objetivos.trim() ? [objetivos] : []
  }
}

export default function Clientes() {
  const [form, setForm] = useState<ClienteForm>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [contratarPlano, setContratarPlano] = useState<Cliente | null>(null)
  const [planoContratar, setPlanoContratar] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [search, setSearch] = useState('')
  const q = useQueryClient()

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.get<Cliente[]>('/clientes'),
  })
  const { data: planos } = useQuery({
    queryKey: ['planos'],
    queryFn: () => api.get<Plano[]>('/planos'),
  })

  const filtered = useMemo(() => {
    if (!clientes) return []
    const s = search.trim().toLowerCase()
    if (!s) return clientes
    return clientes.filter(
      (c) =>
        c.nomeCompleto.toLowerCase().includes(s) ||
        (c.cpf && c.cpf.replace(/\D/g, '').includes(s.replace(/\D/g, ''))) ||
        (c.tipo && c.tipo.toLowerCase().includes(s))
    )
  }, [clientes, search])

  const create = useMutation({
    mutationFn: (body: unknown) => api.post<Cliente>('/clientes', body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['clientes'] })
      setForm({})
      setEditing(null)
      setModalOpen(false)
    },
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: unknown & { id: string }) => api.put<Cliente>(`/clientes/${id}`, body),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['clientes'] })
      setEditing(null)
      setForm({})
      setModalOpen(false)
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: () => q.invalidateQueries({ queryKey: ['clientes'] }),
  })
  const contratar = useMutation({
    mutationFn: ({
      clienteId,
      planoId,
      dataInicio,
    }: { clienteId: string; planoId: string; dataInicio?: string }) =>
      api.post<Cliente>(`/clientes/${clienteId}/contratar-plano`, {
        planoId,
        dataInicio: dataInicio || undefined,
      }),
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ['clientes'] })
      setContratarPlano(null)
      setPlanoContratar('')
      setDataInicio('')
    },
  })

  const openNew = () => {
    setEditing(null)
    setForm({})
    setModalOpen(true)
  }
  const openEdit = (c: Cliente) => {
    setEditing(c)
    setForm({
      ...c,
      fichaSaude: c.fichaSaude ? { ...c.fichaSaude, objetivos: c.fichaSaude?.objetivos } : undefined,
    })
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm({})
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const cpfLimpo = (form.cpf ?? '').replace(/\D/g, '')
    if (!form.tipo || !form.nomeCompleto || !form.dataNascimento || !form.sexo || !cpfLimpo) return
    const objetivosArr = parseObjetivos(form.fichaSaude?.objetivos)
    const objetivosFinal = JSON.stringify(objetivosArr)
    const payload = {
      ...form,
      cpf: cpfLimpo,
      fichaSaude: form.fichaSaude
        ? { ...form.fichaSaude, objetivos: objetivosFinal }
        : undefined,
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
        <div className="crud-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Pesquisar (nome, CPF ou tipo)..."
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
              <th>Nome</th>
              <th>Tipo</th>
              <th>CPF</th>
              <th>Plano</th>
              <th>Ativo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.nomeCompleto}</td>
                <td>{c.tipo}</td>
                <td>{c.cpf}</td>
                <td>{c.plano?.descricao ?? '-'}</td>
                <td>{c.ativo ? 'Sim' : 'Não'}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => openEdit(c)}>
                    Editar
                  </button>
                  <button className="btn btn-primary" onClick={() => setContratarPlano(c)}>
                    Contratar plano
                  </button>
                  <button className="btn btn-danger" onClick={() => remove.mutate(c.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar cliente' : 'Novo cliente'}>
        <form onSubmit={submit}>
          <div className="form-row form-row-tipo-ativo">
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={form.tipo ?? ''}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
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
            <div className="form-group">
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={form.ativo !== false}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                />
                <span>Ativo</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>Nome completo</label>
            <input
              value={form.nomeCompleto ?? ''}
              onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Data nascimento</label>
            <InputDataBR
              value={form.dataNascimento ? String(form.dataNascimento).slice(0, 10) : ''}
              onChange={(v) => setForm({ ...form, dataNascimento: v })}
              required
            />
          </div>
          <div className="form-group">
            <label>Sexo</label>
            <select
              value={form.sexo ?? ''}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              {SEXOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>CPF</label>
            <input
              value={form.cpf ?? ''}
              onChange={(e) => setForm({ ...form, cpf: cpfMask(e.target.value) })}
              placeholder="000.000.000-00"
              required
            />
          </div>
          <div className="form-group">
            <label>Contato</label>
            <input
              value={form.contato ?? ''}
              onChange={(e) => setForm({ ...form, contato: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Endereço</label>
            <input
              value={form.endereco ?? ''}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Plano</label>
            <select
              value={form.planoId ?? ''}
              onChange={(e) => setForm({ ...form, planoId: e.target.value || undefined })}
            >
              <option value="">Nenhum</option>
              {planos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descricao}
                </option>
              ))}
            </select>
          </div>
          <h3>Ficha de saúde (opcional)</h3>
          <div className="form-group">
            <label>Doença diagnosticada?</label>
            <select
              value={form.fichaSaude?.doencaDiagnosticada ? '1' : '0'}
              onChange={(e) =>
                setForm({
                  ...form,
                  fichaSaude: { ...form.fichaSaude, doencaDiagnosticada: e.target.value === '1' },
                })
              }
            >
              <option value="0">Não</option>
              <option value="1">Sim</option>
            </select>
            {form.fichaSaude?.doencaDiagnosticada && (
              <input
                placeholder="Qual?"
                value={form.fichaSaude?.doencaDiagnosticadaQual ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fichaSaude: { ...form.fichaSaude, doencaDiagnosticadaQual: e.target.value },
                  })
                }
              />
            )}
          </div>
          <div className="form-group">
            <label>Medicamentos contínuos?</label>
            <select
              value={form.fichaSaude?.medicamentosContinuos ? '1' : '0'}
              onChange={(e) =>
                setForm({
                  ...form,
                  fichaSaude: { ...form.fichaSaude, medicamentosContinuos: e.target.value === '1' },
                })
              }
            >
              <option value="0">Não</option>
              <option value="1">Sim</option>
            </select>
            {form.fichaSaude?.medicamentosContinuos && (
              <input
                placeholder="Qual?"
                value={form.fichaSaude?.medicamentosContinuosQual ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fichaSaude: { ...form.fichaSaude, medicamentosContinuosQual: e.target.value },
                  })
                }
              />
            )}
          </div>
          <div className="form-group">
            <label>Lesão/cirurgia/ortopedia?</label>
            <select
              value={form.fichaSaude?.lesaoCirurgiaOrtopedia ? '1' : '0'}
              onChange={(e) =>
                setForm({
                  ...form,
                  fichaSaude: { ...form.fichaSaude, lesaoCirurgiaOrtopedia: e.target.value === '1' },
                })
              }
            >
              <option value="0">Não</option>
              <option value="1">Sim</option>
            </select>
            {form.fichaSaude?.lesaoCirurgiaOrtopedia && (
              <input
                placeholder="Qual?"
                value={form.fichaSaude?.lesaoCirurgiaOrtopediaQual ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fichaSaude: { ...form.fichaSaude, lesaoCirurgiaOrtopediaQual: e.target.value },
                  })
                }
              />
            )}
          </div>
          <div className="form-group">
            <label>Problemas cardíacos/diabetes?</label>
            <select
              value={form.fichaSaude?.problemasCardiacosDiabetes ? '1' : '0'}
              onChange={(e) =>
                setForm({
                  ...form,
                  fichaSaude: { ...form.fichaSaude, problemasCardiacosDiabetes: e.target.value === '1' },
                })
              }
            >
              <option value="0">Não</option>
              <option value="1">Sim</option>
            </select>
            {form.fichaSaude?.problemasCardiacosDiabetes && (
              <input
                placeholder="Qual?"
                value={form.fichaSaude?.problemasCardiacosQual ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fichaSaude: { ...form.fichaSaude, problemasCardiacosQual: e.target.value },
                  })
                }
              />
            )}
          </div>
          <div className="form-group">
            <label>Restrição médica?</label>
            <select
              value={form.fichaSaude?.restricaoMedica ? '1' : '0'}
              onChange={(e) =>
                setForm({
                  ...form,
                  fichaSaude: { ...form.fichaSaude, restricaoMedica: e.target.value === '1' },
                })
              }
            >
              <option value="0">Não</option>
              <option value="1">Sim</option>
            </select>
            {form.fichaSaude?.restricaoMedica && (
              <input
                placeholder="Qual?"
                value={form.fichaSaude?.restricaoMedicaQual ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fichaSaude: { ...form.fichaSaude, restricaoMedicaQual: e.target.value },
                  })
                }
              />
            )}
          </div>
          <div className="form-group">
            <label>Objetivo na academia (múltipla escolha)</label>
            <div className="objetivos-checklist">
              {OBJETIVOS_OPCOES.map((opt) => {
                const objetivosArr = parseObjetivos(form.fichaSaude?.objetivos)
                const checked = objetivosArr.includes(opt.value)
                return (
                  <label key={opt.value} className="form-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const arr = parseObjetivos(form.fichaSaude?.objetivos)
                        const next = e.target.checked
                          ? [...arr.filter((v) => v !== opt.value), opt.value]
                          : arr.filter((v) => v !== opt.value)
                        setForm({
                          ...form,
                          fichaSaude: { ...form.fichaSaude, objetivos: JSON.stringify(next) },
                        })
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                )
              })}
            </div>
            {parseObjetivos(form.fichaSaude?.objetivos).includes('Outro') && (
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label>Se escolheu &quot;Outro&quot;, descreva:</label>
                <input
                  value={form.fichaSaude?.objetivoOutro ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, fichaSaude: { ...form.fichaSaude, objetivoOutro: e.target.value } })
                  }
                  placeholder="Descreva o objetivo"
                />
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Nível atividade</label>
            <select
              value={form.fichaSaude?.nivelAtividade ?? ''}
              onChange={(e) =>
                setForm({ ...form, fichaSaude: { ...form.fichaSaude, nivelAtividade: e.target.value } })
              }
            >
              {NIVEL.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Frequência desejada</label>
            <select
              value={form.fichaSaude?.frequenciaDesejada ?? ''}
              onChange={(e) =>
                setForm({ ...form, fichaSaude: { ...form.fichaSaude, frequenciaDesejada: e.target.value } })
              }
            >
              {FREQ.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
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

      {contratarPlano && (
        <Modal
          open={!!contratarPlano}
          onClose={() => setContratarPlano(null)}
          title={`Contratar plano: ${contratarPlano.nomeCompleto}`}
        >
          <div className="form-group">
            <label>Plano</label>
            <select value={planoContratar} onChange={(e) => setPlanoContratar(e.target.value)}>
              <option value="">Selecione o plano</option>
              {planos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descricao} - R$ {p.valor.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Data início</label>
            <InputDataBR value={dataInicio} onChange={setDataInicio} />
          </div>
          <button
            className="btn btn-primary"
            onClick={() =>
              planoContratar &&
              contratar.mutate({
                clienteId: contratarPlano.id,
                planoId: planoContratar,
                dataInicio: dataInicio || undefined,
              })
            }
          >
            Contratar
          </button>
          <button className="btn btn-secondary" onClick={() => setContratarPlano(null)}>
            Cancelar
          </button>
        </Modal>
      )}
    </div>
  )
}
