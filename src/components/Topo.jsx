import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../features/auth/AuthProvider.jsx'
import '../features/groups/grupos.css'

// Topo das telas internas: logo à esquerda, "Meu perfil" e "Sair" à direita.
export default function Topo() {
  const { sair } = useAuth()
  return (
    <header className="topo-app">
      <Link to="/grupos" aria-label="Início"><Logo tipo="horizontal" largura={130} /></Link>
      <nav className="topo-app__links">
        <Link to="/perfil/eu">Meu perfil</Link>
        <button type="button" onClick={sair}>Sair</button>
      </nav>
    </header>
  )
}
