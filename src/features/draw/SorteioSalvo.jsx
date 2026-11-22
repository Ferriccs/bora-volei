import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import ResultadoSorteio from './ResultadoSorteio.jsx'

// Mostra um sorteio que o dono/admin salvou (todos do grupo podem ver).
export default function SorteioSalvo() {
  const { id } = useParams()
  const [dados, setDados] = useState(undefined)
  const [outras, setOutras] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    setDados(undefined)
    supabase.from('draws')
      .select('*, encontro:meetings(*), jogadores:draw_players(*, perfil:profiles(nome), convidado:guests(nome))')
      .eq('id', id).maybeSingle()
      .then(async ({ data, error }) => {
        if (error) setErro(traduzirErro(error))
        setDados(data ?? null)
        if (data) {
          const r = await supabase.from('draws').select('id, rodada').eq('meeting_id', data.meeting_id).order('rodada')
          setOutras(r.data || [])
        }
      })
  }, [id])

  if (dados === undefined) return <Carregando />
  if (!dados) {
    return (
      <main className="tela tela--media">
        <BarraTitulo grande as="h1">Sorteio</BarraTitulo>
        <Aviso>{erro}</Aviso>
        <CaixaAzul><p>Sorteio não encontrado.</p></CaixaAzul>
      </main>
    )
  }

  // Monta os times a partir das linhas salvas
  const paraJogador = (j) => ({
    chave: j.user_id ? `u:${j.user_id}` : `g:${j.guest_id}`,
    nome: j.perfil?.nome || j.convidado?.nome || '?', nota: Number(j.nota), convidado: Boolean(j.guest_id),
  })
  const letras = [...new Set(dados.jogadores.map((j) => j.time).filter((t) => t !== 'R'))].sort()
  const times = letras.map((letra) => {
    const jogadores = dados.jogadores.filter((j) => j.time === letra).map(paraJogador)
    return { letra, jogadores, media: jogadores.reduce((s, j) => s + j.nota, 0) / jogadores.length }
  })
  const reservas = dados.jogadores.filter((j) => j.time === 'R').map(paraJogador)

  return (
    <main className="tela tela--media">
      <BarraTitulo grande as="h1">Resultado do sorteio</BarraTitulo>
      <ResultadoSorteio encontro={dados.encontro} times={times} reservas={reservas} rodada={dados.rodada} />
      {outras.length > 1 && (
        <div className="acoes-grupo">
          {outras.map((o) => (
            <Link key={o.id} to={`/sorteio/${o.id}`} className={`botao ${o.id === id ? 'botao--azul' : 'botao--claro'}`}
              style={{ padding: '6px 14px', fontSize: 13 }}>{o.rodada}ª rodada</Link>
          ))}
        </div>
      )}
      <div className="centro"><Link to={`/encontros/${dados.meeting_id}`} className="link-escuro">Voltar para o encontro</Link></div>
    </main>
  )
}
