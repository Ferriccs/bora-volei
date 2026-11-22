import Logo from './Logo.jsx'

// Tela de espera enquanto o app confere se a pessoa está logada.
export default function Carregando() {
  return (
    <main className="tela tela--estreita" style={{ justifyContent: 'center', alignItems: 'center' }} aria-busy="true">
      <Logo tipo="vertical" largura={180} />
      <p>Carregando…</p>
    </main>
  )
}
