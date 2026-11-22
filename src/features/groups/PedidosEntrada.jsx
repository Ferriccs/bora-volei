import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useGrupo } from './useGrupo.js'
import { POSICOES, nomeNivel } from './textos.js'
import './grupos.css'

// Tela 10 do Figma: pedidos de entrada (só dono e admins).
export default function PedidosEntrada() {
  const { id } = useParams()
  const { grupo, pendentes, erro, setErro, carregando, recarregar, souAdmin } = useGrupo(id)
  const [ocupado, setOcupado] = useState(null)
  const [aviso, setAviso] = useState('')

  async function responder(pedido, aceitar) {
    setErro(''); setAviso(''); setOcupado(pedido.user_id)
    const { error } = await supabase.rpc('responder_pedido', { p_grupo: id, p_usuario: pedido.user_id, p_aceitar: aceitar })
    setOcupado(null)
    if (error) return setErro(traduzirErro(error))
    setAviso(aceitar ? `${pedido.perfil?.nome} agora faz parte do grupo!` : `Pedido de ${pedido.perfil?.nome} recusado.`)
    await recarregar()
  }

  if (carregando) return <Carregando />
  if (!souAdmin) return <Navigate to={`/grupos/${id}`} replace />

  return (
    <main className="tela tela--media">
      <BarraTitulo grande as="h1">Pedidos de entrada</BarraTitulo>
      <p style={{ textAlign: 'center' }}>{grupo?.nome}</p>
      <Aviso>{erro}</Aviso>
      <Aviso tipo="sucesso">{aviso}</Aviso>

      <CaixaAzul titulo={`Aguardando (${pendentes.length})`}>
        {pendentes.length === 0 && <p>Nenhum pedido no momento.</p>}
        {pendentes.map((p) => (
          <div key={p.user_id} className="integrante">
            <div>
              <div className="integrante__nome"><Link to={`/perfil/${p.user_id}`} className="link-nome">{p.perfil?.nome}</Link></div>
              <div className="integrante__detalhe">
                {nomeNivel(p.perfil?.nivel)}
                {p.perfil?.posicao_principal && ` · ${POSICOES[p.perfil.posicao_principal]}`}
                {p.perfil?.municipio && ` · ${p.perfil.municipio}`}
              </div>
            </div>
            <div className="integrante__direita">
              <button className="botao botao--mini" disabled={ocupado === p.user_id} onClick={() => responder(p, true)}>Aceitar</button>
              <button className="botao botao--mini botao--perigo" disabled={ocupado === p.user_id} onClick={() => responder(p, false)}>Recusar</button>
            </div>
          </div>
        ))}
      </CaixaAzul>

      <div className="centro"><Link to={`/grupos/${id}`} className="link-escuro">Voltar para o grupo</Link></div>
    </main>
  )
}
