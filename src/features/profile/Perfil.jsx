import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Pilula from '../../components/Pilula.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import Estrelas from '../../components/Estrelas.jsx'
import { buscarNotas, formatarNota } from '../../utils/nota.js'
import { POSICOES, nomeNivel } from '../groups/textos.js'
import '../groups/grupos.css'

const TEMPO = { '0-1': '0 a 1 ano de vôlei', '1-3': '1 a 3 anos de vôlei', '3+': 'Mais de 3 anos de vôlei' }

function idade(nascimento) {
  if (!nascimento) return null
  const hoje = new Date()
  const n = new Date(nascimento + 'T12:00:00')
  let anos = hoje.getFullYear() - n.getFullYear()
  if (hoje < new Date(hoje.getFullYear(), n.getMonth(), n.getDate())) anos--
  return anos
}

// Tela 13 do Figma: perfil do jogador. "/perfil/eu" abre o seu próprio.
export default function Perfil() {
  const { id: idParam } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const id = idParam === 'eu' ? usuario?.id : idParam
  const ehEu = id === usuario?.id

  const [perfil, setPerfil] = useState(undefined)
  const [emComum, setEmComum] = useState([])
  const [nota, setNota] = useState(null)        // { nota, votos, encontros }
  const [jogouComigo, setJogouComigo] = useState(0)
  const [grupoAvaliar, setGrupoAvaliar] = useState('')
  const [meuVoto, setMeuVoto] = useState(0)
  const [salvo, setSalvo] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      ehEu ? Promise.resolve({ data: [] }) : supabase.rpc('grupos_em_comum', { p_usuario: id }),
      ehEu ? Promise.resolve({ data: 0 }) : supabase.rpc('jogou_comigo', { p_usuario: id }),
      buscarNotas([id]).catch(() => new Map()),
    ]).then(([p, g, j, notas]) => {
      if (p.error || g.error) setErro(traduzirErro(p.error || g.error))
      setPerfil(p.data ?? null)
      setEmComum(g.data || [])
      setJogouComigo(j.data || 0)
      setNota(notas.get(id) || null)
      if (g.data?.length) setGrupoAvaliar(g.data[0].id)
    })
  }, [id, ehEu])

  // Estrelas que eu já dei para esta pessoa no grupo escolhido
  useEffect(() => {
    if (!grupoAvaliar || ehEu) return
    setSalvo('')
    supabase.rpc('minhas_avaliacoes_gerais', { p_grupo: grupoAvaliar }).then(({ data }) => {
      setMeuVoto((data || []).find((v) => v.avaliado === id)?.estrelas || 0)
    })
  }, [grupoAvaliar, id, ehEu])

  async function avaliar(estrelas) {
    setErro(''); setSalvo('')
    const antes = meuVoto
    setMeuVoto(estrelas)
    const { error } = await supabase.rpc('avaliar_geral', { p_grupo: grupoAvaliar, p_avaliado: id, p_estrelas: estrelas })
    if (error) { setMeuVoto(antes); return setErro(traduzirErro(error)) }
    setSalvo('Avaliação salva. Ninguém vai saber que foi você.')
    buscarNotas([id]).then((n) => setNota(n.get(id) || null)).catch(() => {})
  }

  if (perfil === undefined) return <Carregando />
  if (!perfil) {
    return (
      <main className="tela">
        <BarraTitulo grande as="h1">Perfil</BarraTitulo>
        <Aviso>{erro}</Aviso>
        <CaixaAzul><p>Jogador não encontrado.</p></CaixaAzul>
        <div className="centro"><button className="link-escuro" onClick={() => navegar(-1)}>Voltar</button></div>
      </main>
    )
  }

  const anos = idade(perfil.nascimento)
  const iniciais = perfil.nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  return (
    <main className="tela">
      <BarraTitulo grande as="h1">{ehEu ? 'Meu perfil' : 'Perfil'}</BarraTitulo>
      <Aviso>{erro}</Aviso>

      <div className="colunas colunas--larga-direita">
        <div className="coluna coluna--fixa">
          <div className="perfil-topo">
            <div className="avatar" aria-hidden="true">{iniciais}</div>
            <h2 style={{ fontSize: 24, textTransform: 'uppercase', color: 'var(--azul)' }}>{perfil.nome}</h2>
            {nota && (
              <div className="perfil-nota" aria-label={`Nota ${formatarNota(nota.nota)}`}>
                {formatarNota(nota.nota)}
                <small>{nota.votos === 0 ? 'nota inicial pelo nível' : `${nota.votos} ${nota.votos === 1 ? 'avaliação' : 'avaliações'}`}</small>
              </div>
            )}
          </div>

          <div className="pilulas">
            {perfil.nivel && <Pilula>{nomeNivel(perfil.nivel)}</Pilula>}
            {anos !== null && <Pilula>{anos} anos</Pilula>}
            {perfil.municipio && <Pilula>{perfil.municipio} - {perfil.uf}</Pilula>}
            {perfil.posicao_principal && <Pilula destaque>{POSICOES[perfil.posicao_principal]}</Pilula>}
            {(perfil.posicoes_secundarias || []).map((p) => <Pilula key={p}>{POSICOES[p]}</Pilula>)}
          </div>

          {ehEu && <div className="centro" style={{ order: 9 }}><Botao onClick={() => navegar('/primeiro-acesso')}>Editar meus dados</Botao></div>}
        </div>
        <div className="coluna">
          {(perfil.bio || perfil.tempo_jogo) && (
            <CaixaAzul titulo="Sobre">
              {perfil.tempo_jogo && <p>{TEMPO[perfil.tempo_jogo]}</p>}
              {perfil.bio && <p style={{ fontWeight: 500 }}>{perfil.bio}</p>}
            </CaixaAzul>
          )}

          {!ehEu && (
            <CaixaAzul titulo={`Grupos em comum (${emComum.length})`}>
              {emComum.length === 0 && <p>Nenhum grupo em comum.</p>}
              {emComum.map((g) => <Link key={g.id} to={`/grupos/${g.id}`} className="link-claro" style={{ textAlign: 'left' }}>{g.nome}</Link>)}
              <p>Jogou com você {jogouComigo} {jogouComigo === 1 ? 'vez' : 'vezes'}</p>
            </CaixaAzul>
          )}

          {!ehEu && emComum.length > 0 && (
            <CaixaAzul titulo="Avaliar (anônimo)">
              {emComum.length > 1 && (
                <label className="campo">
                  <span className="campo__rotulo">Grupo</span>
                  <select className="campo__input campo__input--select" value={grupoAvaliar} onChange={(e) => setGrupoAvaliar(e.target.value)}>
                    {emComum.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                </label>
              )}
              <div className="centro"><Estrelas valor={meuVoto} tamanho={34} rotulo={`Estrelas para ${perfil.nome}`} onChange={avaliar} /></div>
              <p style={{ fontSize: 13, fontWeight: 500, textAlign: 'center' }}>Toque nas estrelas. Votar de novo troca o seu voto.</p>
              <Aviso tipo="sucesso">{salvo}</Aviso>
            </CaixaAzul>
          )}

        </div>
      </div>

      <div className="centro"><button className="link-escuro" style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }} onClick={() => navegar(-1)}>Voltar</button></div>
    </main>
  )
}
