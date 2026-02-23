import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 7) + '-01')
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0, 10))
  const [aba, setAba] = useState<'previsao' | 'recebimentos'>('previsao')

  const { data: previsao, isLoading: loadPrevisao } = useQuery({
    queryKey: ['relatorio-previsao', dataInicio, dataFim],
    queryFn: () => api.get<{
      periodo: { dataInicio: string; dataFim: string };
      realizados: { entradas: number; saidas: number; total: number };
      aRealizar: number;
      mensalidadesARecber: unknown[];
      movimentos: unknown[];
    }>(`/relatorios/previsao-caixa?dataInicio=${dataInicio}&dataFim=${dataFim}`),
    enabled: aba === 'previsao',
  })

  const { data: recebimentos, isLoading: loadRecebimentos } = useQuery({
    queryKey: ['relatorio-recebimentos', dataInicio, dataFim],
    queryFn: () => api.get<{
      periodo: { dataInicio: string; dataFim: string };
      recebidos: unknown[];
      pagos: unknown[];
      totalEntradas: number;
      totalSaidas: number;
      saldoCaixa: number;
    }>(`/relatorios/recebimentos?dataInicio=${dataInicio}&dataFim=${dataFim}`),
    enabled: aba === 'recebimentos',
  })

  const isLoading = aba === 'previsao' ? loadPrevisao : loadRecebimentos

  return (
    <div>
      <h1>Relatórios</h1>
      <div className="card">
        <label>Data início</label>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <label>Data fim</label>
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        <button className="btn btn-secondary" onClick={() => setAba('previsao')}>Previsão de caixa</button>
        <button className="btn btn-secondary" onClick={() => setAba('recebimentos')}>Recebimentos</button>
      </div>

      {aba === 'previsao' && (
        <div className="card">
          <h2>Previsão de caixa</h2>
          {isLoading && <p>Carregando...</p>}
          {previsao && (
            <>
              <p><strong>Período:</strong> {new Date(previsao.periodo.dataInicio).toLocaleDateString('pt-BR')} a {new Date(previsao.periodo.dataFim).toLocaleDateString('pt-BR')}</p>
              <p>Entradas realizadas: R$ {previsao.realizados.entradas.toFixed(2)}</p>
              <p>Saídas realizadas: R$ {previsao.realizados.saidas.toFixed(2)}</p>
              <p>Total realizado (entradas - saídas): R$ {previsao.realizados.total.toFixed(2)}</p>
              <p><strong>A realizar (mensalidades não pagas no período):</strong> R$ {previsao.aRealizar.toFixed(2)}</p>
              <p>Quantidade de mensalidades a receber: {previsao.mensalidadesARecber?.length ?? 0}</p>
            </>
          )}
        </div>
      )}

      {aba === 'recebimentos' && (
        <div className="card">
          <h2>Recebimentos</h2>
          {isLoading && <p>Carregando...</p>}
          {recebimentos && (
            <>
              <p><strong>Período:</strong> {new Date(recebimentos.periodo.dataInicio).toLocaleDateString('pt-BR')} a {new Date(recebimentos.periodo.dataFim).toLocaleDateString('pt-BR')}</p>
              <p>Total entradas: R$ {recebimentos.totalEntradas.toFixed(2)}</p>
              <p>Total saídas: R$ {recebimentos.totalSaidas.toFixed(2)}</p>
              <p><strong>Saldo do caixa no período:</strong> R$ {recebimentos.saldoCaixa.toFixed(2)}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
