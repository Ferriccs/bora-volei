import Logo from './Logo.jsx'

// Moldura das telas de entrada (login, criar conta, esqueci a senha).
// No celular mostra só o conteúdo; no computador aparece um painel azul ao lado, apresentando o app.
export default function TelaEntrada({ children }) {
  return (
    <main className="tela tela--auth">
      <aside className="auth-hero" aria-hidden="true">
        <Logo tipo="fundo-azul" largura={260} />
        <h2>Times equilibrados, jogo mais divertido</h2>
        <ul>
          <li><span>1</span><span>Crie seu grupo de vôlei e chame a galera por link ou QR Code.</span></li>
          <li><span>2</span><span>Marque o encontro e veja quem confirmou presença.</span></li>
          <li><span>3</span><span>Sorteie times com médias parecidas, levando em conta nível e posição.</span></li>
          <li><span>4</span><span>Avalie quem jogou, de forma anônima, e converse no chat do grupo.</span></li>
        </ul>
      </aside>
      <div className="auth-conteudo">{children}</div>
    </main>
  )
}
