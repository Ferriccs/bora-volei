import { NavLink, useLocation } from 'react-router-dom'
import BotaoInstalar from './BotaoInstalar.jsx'
import Logo from './Logo.jsx'
import { useAuth } from '../features/auth/AuthProvider.jsx'

// Barra de cima, só no computador e só com a pessoa logada.
// No celular ela fica escondida (lá o app segue o Figma, com o topo dentro de cada tela).
const SEM_BARRA = ['/login', '/criar-conta', '/esqueci-senha', '/nova-senha', '/primeiro-acesso', '/amostra']

export default function BarraPc() {
  const { sessao, perfilCompleto, sair } = useAuth()
  const { pathname } = useLocation()
  if (!sessao || !perfilCompleto || SEM_BARRA.includes(pathname)) return null

  const classe = ({ isActive }) => (isActive ? 'ativo' : '')
  return (
    <header className="barra-pc so-pc">
      <div className="barra-pc__dentro">
        <NavLink to="/grupos" aria-label="Início"><Logo tipo="horizontal" largura={150} /></NavLink>
        <nav className="barra-pc__links" aria-label="Menu principal">
          <NavLink to="/grupos" end className={classe}>Seus grupos</NavLink>
          <NavLink to="/grupos/buscar" className={classe}>Buscar grupos</NavLink>
          <NavLink to="/perfil/eu" className={classe}>Meu perfil</NavLink>
          <BotaoInstalar className="" />
          <button type="button" onClick={sair}>Sair</button>
        </nav>
      </div>
    </header>
  )
}
