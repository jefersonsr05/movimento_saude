import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Planos from './pages/Planos'
import FormasPagamento from './pages/FormasPagamento'
import Clientes from './pages/Clientes'
import Mensalidades from './pages/Mensalidades'
import MovimentoCaixa from './pages/MovimentoCaixa'
import Relatorios from './pages/Relatorios'

function App() {
  return (
    <HashRouter>
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/planos">Planos</NavLink>
        <NavLink to="/formas-pagamento">Formas de pagamento</NavLink>
        <NavLink to="/clientes">Clientes</NavLink>
        <NavLink to="/mensalidades">Mensalidades</NavLink>
        <NavLink to="/movimento-caixa">Movimento de caixa</NavLink>
        <NavLink to="/relatorios">Relatórios</NavLink>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/formas-pagamento" element={<FormasPagamento />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/mensalidades" element={<Mensalidades />} />
          <Route path="/movimento-caixa" element={<MovimentoCaixa />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>
      </main>
    </HashRouter>
  )
}

export default App
