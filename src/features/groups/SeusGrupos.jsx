import { useEffect, useState } from 'react'
import BotaoInstalar from '../../components/BotaoInstalar.jsx'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import Topo from '../../components/Topo.jsx'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import CartaoGrupo from './CartaoGrupo.jsx'
import AvisoAvaliar from '../ratings/AvisoAvaliar.jsx'
import { pegarConvite } from '../invites/convitePendente.js'
import './grupos.css'

// Telas 06 e 07 do Figma: "Seus grupos" (vazio ou com a lista).
export default function SeusGrupos() {
  const { perfil } = useAuth()
  const navegar = useNavigate()
  const [grupos, setGrupos] = useState(null)   // null = carregando
  const [erro, setErro] = useState('')

  useEffect(() => {
    // Veio de um link de convite antes de entrar na conta? Volta para ele.
    const convite = pegarConvite()
    if (convite) { navegar(`/convite/${convite}`, { replace: true }); return }
    supabase.rpc('meus_grupos').then(({ data, error }) => {
      if (error) { setErro(traduzirErro(error)); setGrupos([]) }
      else setGrupos(data)
    })
  }, [navegar])

  const ativos = (grupos || []).filter((g) => g.situacao === 'ativo')
  const pendentes = (grupos || []).filter((g) => g.situacao === 'pendente')

  return (
    <main className="tela">
      <Topo />
      <BarraTitulo grande as="h1">Seus grupos</BarraTitulo>
      <Aviso>{erro}</Aviso>

      <AvisoAvaliar />

      {grupos === null && <p style={{ textAlign: 'center' }}>Carregando…</p>}

      {grupos?.length === 0 && !erro && (
        <CaixaAzul>
          <div className="vazio">
            <p>Olá, {perfil?.nome?.split(' ')[0]}! Você ainda não está em nenhum grupo.</p>
            <p>Crie o seu grupo ou procure um grupo em {perfil?.municipio || 'sua cidade'}.</p>
          </div>
        </CaixaAzul>
      )}

      {ativos.length > 0 && (
        <section className="lista-grupos" aria-label="Grupos em que você participa">
          {ativos.map((g) => <CartaoGrupo key={g.id} grupo={g} mostrarCargo />)}
        </section>
      )}

      {pendentes.length > 0 && (
        <section className="secao">
          <BarraTitulo>Pedidos enviados</BarraTitulo>
          <div className="lista-grupos">
            {pendentes.map((g) => <CartaoGrupo key={g.id} grupo={g} link={false} mostrarCargo />)}
          </div>
        </section>
      )}

      <div className="acoes-grupo">
        <Botao onClick={() => navegar('/grupos/novo')}>Criar grupo</Botao>
        <Botao onClick={() => navegar('/grupos/buscar')}>Buscar grupos</Botao>
      </div>
      <div className="centro so-celular"><BotaoInstalar /></div>
    </main>
  )
}
