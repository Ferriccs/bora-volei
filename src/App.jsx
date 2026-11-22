import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './features/auth/AuthProvider.jsx'
import { ExigeLogin, SoVisitante } from './features/auth/Protecao.jsx'
import Login from './features/auth/Login.jsx'
import CriarConta from './features/auth/CriarConta.jsx'
import EsqueciSenha from './features/auth/EsqueciSenha.jsx'
import NovaSenha from './features/auth/NovaSenha.jsx'
import PrimeiroAcesso from './features/onboarding/PrimeiroAcesso.jsx'
import SeusGrupos from './features/groups/SeusGrupos.jsx'
import NovoGrupo from './features/groups/NovoGrupo.jsx'
import BuscarGrupos from './features/groups/BuscarGrupos.jsx'
import TelaGrupo from './features/groups/TelaGrupo.jsx'
import PedidosEntrada from './features/groups/PedidosEntrada.jsx'
import Convite from './features/invites/Convite.jsx'
import EntrarNoGrupo from './features/invites/EntrarNoGrupo.jsx'
import Perfil from './features/profile/Perfil.jsx'
import CriarEncontro from './features/meetings/CriarEncontro.jsx'
import TelaEncontro from './features/meetings/TelaEncontro.jsx'
import QuemJogou from './features/meetings/QuemJogou.jsx'
import MontarSorteio from './features/draw/MontarSorteio.jsx'
import SorteioSalvo from './features/draw/SorteioSalvo.jsx'
import AvaliarEncontro from './features/ratings/AvaliarEncontro.jsx'
import ChatGrupo from './features/chat/ChatGrupo.jsx'
import Amostra from './pages/Amostra.jsx'
import EmBreve from './pages/EmBreve.jsx'
import SemChaves from './pages/SemChaves.jsx'
import { supabaseConfigurado } from './lib/supabase.js'
import BarraPc from './components/BarraPc.jsx'
import Privacidade from './pages/Privacidade.jsx'

// Se a pessoa abriu o link de "nova senha" do e-mail, leva direto para a tela certa.
function RedirecionaRecuperacao() {
  const { recuperandoSenha } = useAuth()
  const local = useLocation()
  const navegar = useNavigate()
  useEffect(() => {
    if (recuperandoSenha && local.pathname !== '/nova-senha') navegar('/nova-senha', { replace: true })
  }, [recuperandoSenha, local.pathname, navegar])
  return null
}

// Lista de rotas: qual tela abre em cada endereço.
// As telas marcadas como "EmBreve" serão construídas nas próximas etapas.
export default function App() {
  if (!supabaseConfigurado) return <SemChaves />

  return (
    <>
      <RedirecionaRecuperacao />
      <BarraPc />
      <Routes>
        <Route path="/" element={<Navigate to="/grupos" replace />} />
        <Route path="/amostra" element={<Amostra />} />
        <Route path="/privacidade" element={<Privacidade />} />

        {/* Etapa 2: contas */}
        <Route path="/login" element={<SoVisitante><Login /></SoVisitante>} />
        <Route path="/criar-conta" element={<SoVisitante><CriarConta /></SoVisitante>} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/nova-senha" element={<NovaSenha />} />
        <Route path="/primeiro-acesso" element={<ExigeLogin permitirPerfilIncompleto><PrimeiroAcesso /></ExigeLogin>} />

        {/* Etapa 3: grupos */}
        <Route path="/grupos" element={<ExigeLogin><SeusGrupos /></ExigeLogin>} />
        <Route path="/grupos/novo" element={<ExigeLogin><NovoGrupo /></ExigeLogin>} />
        <Route path="/grupos/buscar" element={<ExigeLogin><BuscarGrupos /></ExigeLogin>} />
        <Route path="/grupos/:id" element={<ExigeLogin><TelaGrupo /></ExigeLogin>} />
        <Route path="/grupos/:id/editar" element={<ExigeLogin><NovoGrupo /></ExigeLogin>} />
        <Route path="/grupos/:id/pedidos" element={<ExigeLogin><PedidosEntrada /></ExigeLogin>} />
        <Route path="/grupos/:id/convite" element={<ExigeLogin><Convite /></ExigeLogin>} />

        {/* Etapa 4: convites e perfil */}
        <Route path="/convite/:codigo" element={<EntrarNoGrupo />} />
        <Route path="/perfil/:id" element={<ExigeLogin><Perfil /></ExigeLogin>} />

        {/* Etapa 5: encontros e sorteio */}
        <Route path="/grupos/:id/encontros/novo" element={<ExigeLogin><CriarEncontro /></ExigeLogin>} />
        <Route path="/encontros/:id" element={<ExigeLogin><TelaEncontro /></ExigeLogin>} />
        <Route path="/encontros/:id/sorteio" element={<ExigeLogin><MontarSorteio /></ExigeLogin>} />
        <Route path="/encontros/:id/quem-jogou" element={<ExigeLogin><QuemJogou /></ExigeLogin>} />
        <Route path="/sorteio/:id" element={<ExigeLogin><SorteioSalvo /></ExigeLogin>} />

        {/* Etapa 6: avaliações e chat */}
        <Route path="/encontros/:id/avaliar" element={<ExigeLogin><AvaliarEncontro /></ExigeLogin>} />
        <Route path="/grupos/:id/chat" element={<ExigeLogin><ChatGrupo /></ExigeLogin>} />

        <Route path="*" element={<EmBreve titulo="Página não encontrada" />} />
      </Routes>
    </>
  )
}
