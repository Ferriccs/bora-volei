import BarraTitulo from '../components/BarraTitulo.jsx'
import CaixaAzul from '../components/CaixaAzul.jsx'

// Aparece se o arquivo .env.local estiver faltando, para não ficar uma tela branca.
export default function SemChaves() {
  return (
    <main className="tela tela--estreita">
      <BarraTitulo grande as="h1">Falta configurar</BarraTitulo>
      <CaixaAzul>
        <p>O app não achou as chaves do Supabase.</p>
        <p>Confira se o arquivo <strong>.env.local</strong> existe na pasta do projeto e rode <strong>npm run dev</strong> de novo.</p>
      </CaixaAzul>
    </main>
  )
}
