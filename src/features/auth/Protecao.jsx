import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import Carregando from '../../components/Carregando.jsx'

// Telas que só abrem para quem está logado.
// Se o primeiro acesso ainda não foi preenchido, manda para ele antes.
export function ExigeLogin({ children, permitirPerfilIncompleto = false }) {
  const { sessao, perfilCompleto, carregando } = useAuth()
  const local = useLocation()

  if (carregando) return <Carregando />
  if (!sessao) return <Navigate to="/login" replace state={{ voltarPara: local.pathname }} />
  if (!perfilCompleto && !permitirPerfilIncompleto) return <Navigate to="/primeiro-acesso" replace />
  return children
}

// Telas de quem ainda NÃO entrou (login, criar conta). Quem já está logado pula direto.
export function SoVisitante({ children }) {
  const { sessao, carregando } = useAuth()
  const local = useLocation()

  if (carregando) return <Carregando />
  if (sessao) return <Navigate to={local.state?.voltarPara || '/grupos'} replace />
  return children
}
