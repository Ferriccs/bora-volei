import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Estrelas from '../../components/Estrelas.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useEncontro } from '../meetings/useEncontro.js'
import { dataLonga } from '../../utils/datas.js'
import './avaliacoes.css'
import '../groups/grupos.css'

// Tela 18 do Figma: avaliação pós-encontro.
// Lista só quem jogou naquele dia (sem você). Fica aberta até 3 dias depois do encontro.
export default function AvaliarEncontro() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { encontro, grupo, presencas, carregando, erro, setErro, meuId } = useEncontro(id)
  const [aberta, setAberta] = useState(null)
  const [notas, setNotas] = useState({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.rpc('avaliacao_aberta', { p_encontro: id }),
      supabase.rpc('minhas_avaliacoes_encontro', { p_encontro: id }),
    ]).then(([a, m]) => {
      setAberta(Boolean(a.data))
      setNotas(Object.fromEntries((m.data || []).map((v) => [v.avaliado, v.estrelas])))
    })
  }, [id])

  if (carregando || aberta === null) return <Carregando />
  if (!encontro) return <main className="tela tela--media"><Aviso>Encontro não encontrado.</Aviso></main>

  const jogaram = presencas.filter((p) => p.jogou && p.user_id !== meuId)
  const dadas = jogaram.filter((p) => notas[p.user_id]).length

  async function enviar() {
    setErro('')
    const lista = Object.entries(notas).map(([avaliado, estrelas]) => ({ avaliado, estrelas }))
    if (!lista.length) return setErro('Dê estrelas para pelo menos uma pessoa.')
    setEnviando(true)
    const { error } = await supabase.rpc('avaliar_encontro', { p_encontro: id, p_notas: lista })
    setEnviando(false)
    if (error) return setErro(traduzirErro(error))
    navegar(`/grupos/${grupo.id}`, { replace: true, state: { aviso: 'Avaliações enviadas. Obrigado!' } })
  }

  return (
    <main className="tela tela--media">
      <BarraTitulo grande as="h1">Como foi o jogo?</BarraTitulo>
      <p style={{ textAlign: 'center' }}>{grupo.nome} · {dataLonga(encontro.data_hora)}</p>
      <Aviso>{erro}</Aviso>

      {!aberta && (
        <CaixaAzul>
          <p>A avaliação deste encontro não está aberta para você. Ela é só para quem jogou, e fica aberta até 3 dias depois do jogo, depois que o admin marca "Quem jogou".</p>
        </CaixaAzul>
      )}

      {aberta && (
        <>
          <CaixaAzul titulo="Avaliação (anônimo)">
            <p className="avaliacao__dica">Ninguém vai saber quem deu cada nota. Avaliados: {dadas} de {jogaram.length}.</p>
            {jogaram.length === 0 && <p>Só você foi marcado como "jogou" neste encontro.</p>}
            {jogaram.map((p) => (
              <div key={p.user_id} className="avaliacao__linha">
                <span className="avaliacao__nome">{p.perfil?.nome}</span>
                <Estrelas valor={notas[p.user_id] || 0} rotulo={`Estrelas para ${p.perfil?.nome}`}
                  onChange={(n) => setNotas({ ...notas, [p.user_id]: n })} />
              </div>
            ))}
          </CaixaAzul>
          <div className="centro">
            <Botao onClick={enviar} disabled={enviando || jogaram.length === 0}>{enviando ? 'Enviando…' : 'Enviar avaliações'}</Botao>
          </div>
        </>
      )}
      <div className="centro"><Link to={`/encontros/${id}`} className="link-escuro">Voltar para o encontro</Link></div>
    </main>
  )
}
