import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import CampoMunicipio from '../../components/CampoMunicipio.jsx'
import Opcoes from '../../components/Opcoes.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import CartaoGrupo from './CartaoGrupo.jsx'
import { MODALIDADES } from './textos.js'
import './grupos.css'

const FILTRO_MODALIDADE = [{ valor: '', rotulo: 'Todas' }, ...MODALIDADES.filter((m) => m.valor !== 'ambos')]

// Buscar grupos: abre no município do seu perfil, mas dá para trocar.
export default function BuscarGrupos() {
  const { perfil } = useAuth()
  const [filtro, setFiltro] = useState({
    uf: perfil?.uf || 'MA', municipio: perfil?.municipio || '', modalidade: '', texto: '',
  })
  const [grupos, setGrupos] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(null)   // id do grupo que está processando

  const buscar = useCallback(async (f) => {
    setErro('')
    setGrupos(null)
    const { data, error } = await supabase.rpc('buscar_grupos', {
      p_uf: f.uf, p_municipio: f.municipio.trim(), p_modalidade: f.modalidade || null, p_texto: f.texto.trim() || null,
    })
    if (error) { setErro(traduzirErro(error)); setGrupos([]) } else setGrupos(data)
  }, [])

  // Busca logo ao abrir, no município do perfil
  useEffect(() => { buscar(filtro) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function pedir(grupo) {
    setErro(''); setAviso(''); setOcupado(grupo.id)
    const { error } = await supabase.rpc('pedir_entrada', { p_grupo: grupo.id })
    setOcupado(null)
    if (error) return setErro(traduzirErro(error))
    setAviso(`Pedido enviado para "${grupo.nome}". Agora é só esperar o dono ou um admin aceitar.`)
    setGrupos((lista) => lista.map((g) => (g.id === grupo.id ? { ...g, minha_situacao: 'pendente' } : g)))
  }

  async function cancelar(grupo) {
    setErro(''); setAviso(''); setOcupado(grupo.id)
    const { error } = await supabase.rpc('cancelar_pedido', { p_grupo: grupo.id })
    setOcupado(null)
    if (error) return setErro(traduzirErro(error))
    setGrupos((lista) => lista.map((g) => (g.id === grupo.id ? { ...g, minha_situacao: null } : g)))
  }

  function botaoDoGrupo(g) {
    if (g.minha_situacao === 'ativo') return <Link to={`/grupos/${g.id}`} className="botao botao--mini">Você participa · Abrir</Link>
    if (g.minha_situacao === 'pendente')
      return <button className="botao botao--mini" disabled={ocupado === g.id} onClick={() => cancelar(g)}>Pedido enviado · Cancelar</button>
    return <button className="botao botao--mini" disabled={ocupado === g.id} onClick={() => pedir(g)}>Pedir para entrar</button>
  }

  return (
    <main className="tela">
      <BarraTitulo grande as="h1">Buscar grupos</BarraTitulo>

      <div className="colunas colunas--larga-direita">
        <div className="coluna coluna--fixa">
          <form className="secao" onSubmit={(e) => { e.preventDefault(); buscar(filtro) }}>
            <CaixaAzul>
              <div className="filtros">
                <CampoMunicipio uf={filtro.uf} municipio={filtro.municipio}
                  onChange={({ uf, municipio }) => setFiltro((f) => ({ ...f, uf, municipio }))} />
                <CampoTexto rotulo="Nome do grupo (opcional)" placeholder="Ex.: Beira-Rio"
                  value={filtro.texto} onChange={(e) => setFiltro((f) => ({ ...f, texto: e.target.value }))} />
                <Opcoes nome="filtro-modalidade" opcoes={FILTRO_MODALIDADE} valor={filtro.modalidade}
                  onChange={(v) => setFiltro((f) => ({ ...f, modalidade: v }))} />
              </div>
            </CaixaAzul>
            <div className="centro"><Botao type="submit">Buscar</Botao></div>
          </form>

        </div>
        <div className="coluna">
          <Aviso>{erro}</Aviso>
          <Aviso tipo="sucesso">{aviso}</Aviso>

          {grupos === null && <p style={{ textAlign: 'center' }}>Procurando…</p>}
          {grupos?.length === 0 && !erro && (
            <CaixaAzul>
              <div className="vazio">
                <p>Nenhum grupo encontrado em {filtro.municipio || filtro.uf}.</p>
                <Link to="/grupos/novo" className="link-claro">Que tal criar o primeiro?</Link>
              </div>
            </CaixaAzul>
          )}
          {grupos?.length > 0 && (
            <section className="lista-grupos" aria-label="Resultados">
              {grupos.map((g) => (
                <CartaoGrupo key={g.id} grupo={g} link={g.minha_situacao === 'ativo'} acao={botaoDoGrupo(g)} />
              ))}
            </section>
          )}

        </div>
      </div>

      <div className="centro"><Link to="/grupos" className="link-escuro">Voltar para seus grupos</Link></div>
    </main>
  )
}
