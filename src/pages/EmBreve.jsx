import { Link } from 'react-router-dom'
import BarraTitulo from '../components/BarraTitulo.jsx'
import CaixaAzul from '../components/CaixaAzul.jsx'

// Tela provisória para as rotas que ainda serão construídas.
export default function EmBreve({ titulo, etapa }) {
  return (
    <main className="tela tela--estreita">
      <BarraTitulo grande as="h1">{titulo}</BarraTitulo>
      <CaixaAzul>
        <p>{etapa ? `Esta tela será construída na etapa ${etapa}.` : 'Não encontramos esta página.'}</p>
        <Link to="/amostra" style={{ color: 'var(--branco)' }}>Voltar para a amostra</Link>
      </CaixaAzul>
    </main>
  )
}
