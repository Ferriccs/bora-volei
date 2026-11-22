import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import Logo from '../../components/Logo.jsx'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { nomeDias, nomeModalidade, nomeNivel } from '../groups/textos.js'
import { esquecerConvite, guardarConvite } from './convitePendente.js'
import '../groups/grupos.css'

// Tela 12 do Figma: quem abre o link do convite cai aqui.
export default function EntrarNoGrupo() {
  const { codigo } = useParams()
  const { sessao, perfilCompleto, carregando } = useAuth()
  const navegar = useNavigate()
  const [convite, setConvite] = useState(undefined)   // undefined = carregando, null = não existe
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    if (carregando) return
    supabase.rpc('ver_convite', { p_codigo: codigo }).then(({ data, error }) => {
      if (error) { setErro(traduzirErro(error)); setConvite(null) } else setConvite(data?.[0] ?? null)
    })
  }, [codigo, carregando, sessao])

  // Sem conta (ou sem primeiro acesso): guarda o convite para voltar aqui depois
  useEffect(() => {
    if (!carregando && (!sessao || !perfilCompleto)) guardarConvite(codigo)
  }, [carregando, sessao, perfilCompleto, codigo])

  async function entrar() {
    setErro(''); setEntrando(true)
    const { data, error } = await supabase.rpc('usar_convite', { p_codigo: codigo })
    setEntrando(false)
    if (error) return setErro(traduzirErro(error))
    esquecerConvite()
    navegar(`/grupos/${data}`, { replace: true })
  }

  if (carregando || convite === undefined) return <Carregando />

  if (!convite) {
    return (
      <main className="tela tela--estreita">
        <div className="centro" style={{ marginTop: 24 }}><Logo tipo="vertical" largura={200} /></div>
        <BarraTitulo grande as="h1">Convite</BarraTitulo>
        <Aviso>{erro}</Aviso>
        <CaixaAzul><p>Este convite não existe. Confira se o link está completo.</p></CaixaAzul>
        <div className="centro"><Link to="/" className="link-escuro">Ir para o Bora Vôlei</Link></div>
      </main>
    )
  }

  const invalido = convite.situacao !== 'valido'
  const jaParticipa = convite.minha_situacao === 'ativo'

  return (
    <main className="tela tela--estreita">
      <div className="centro" style={{ marginTop: 16 }}><Logo tipo="vertical" largura={180} /></div>
      <BarraTitulo grande as="h1">Entrar no grupo</BarraTitulo>
      <Aviso>{erro}</Aviso>

      <CaixaAzul titulo={convite.nome}>
        <div className="info-grupo">
          <p><strong>{nomeModalidade(convite.modalidade)}</strong> · {convite.municipio} - {convite.uf}</p>
          {convite.local && <p>Local: {convite.local}</p>}
          {convite.dias?.length > 0 && <p>Dias: {nomeDias(convite.dias)}</p>}
          <p>Nível mínimo: {nomeNivel(convite.nivel_minimo)}</p>
          <p>{convite.qtd_membros} {convite.qtd_membros === 1 ? 'integrante' : 'integrantes'}</p>
          {convite.descricao && <p style={{ fontWeight: 500, marginTop: 4 }}>{convite.descricao}</p>}
        </div>
      </CaixaAzul>

      {invalido && (
        <Aviso>
          {convite.situacao === 'vencido'
            ? 'Este convite expirou. Peça um novo ao admin do grupo.'
            : 'Este convite foi cancelado. Peça um novo ao admin do grupo.'}
        </Aviso>
      )}

      {!invalido && jaParticipa && (
        <>
          <Aviso tipo="sucesso">Você já faz parte deste grupo!</Aviso>
          <div className="centro"><Botao onClick={() => { esquecerConvite(); navegar(`/grupos/${convite.group_id}`) }}>Abrir o grupo</Botao></div>
        </>
      )}

      {!invalido && !jaParticipa && sessao && perfilCompleto && (
        <div className="centro">
          <Botao onClick={entrar} disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar no grupo'}</Botao>
        </div>
      )}

      {!invalido && !jaParticipa && sessao && !perfilCompleto && (
        <>
          <p style={{ textAlign: 'center' }}>Antes de entrar, complete seu primeiro acesso.</p>
          <div className="centro"><Botao onClick={() => navegar('/primeiro-acesso')}>Completar perfil</Botao></div>
        </>
      )}

      {!invalido && !sessao && (
        <>
          <p style={{ textAlign: 'center' }}>Para entrar no grupo, entre na sua conta ou crie uma. Depois você volta para cá sozinho.</p>
          <div className="acoes-grupo">
            <Botao onClick={() => navegar('/login', { state: { voltarPara: `/convite/${codigo}` } })}>Entrar</Botao>
            <Botao onClick={() => navegar('/criar-conta', { state: { voltarPara: `/convite/${codigo}` } })}>Criar conta</Botao>
          </div>
        </>
      )}
    </main>
  )
}
