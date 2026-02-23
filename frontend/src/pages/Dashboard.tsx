import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-totalizadores'],
    queryFn: () => api.get<{ porPlano: { planoId: string; descricao: string; tipoAssinatura: string; totalClientes: number }[]; totalClientesAtivos: number }>('/dashboard/totalizadores'),
  })

  if (isLoading) return <div className="card">Carregando...</div>
  if (error) return <div className="card">Erro: {(error as Error).message}</div>

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Total de clientes ativos: {data?.totalClientesAtivos ?? 0}</h2>
      </div>
      <h2>Clientes por tipo de plano</h2>
      <div className="grid grid-4">
        {data?.porPlano?.map((p) => (
          <div key={p.planoId} className="card">
            <strong>{p.descricao}</strong>
            <p>{p.tipoAssinatura}</p>
            <p>{p.totalClientes} cliente(s)</p>
          </div>
        ))}
      </div>
    </div>
  )
}
