import './componentes.css'

// Caixa azul com texto branco, onde fica o conteúdo (campos, listas, chat).
// Se receber "titulo", mostra a barra de título encaixada em cima, como em "INTEGRANTES".
export default function CaixaAzul({ titulo, children, className = '' }) {
  return (
    <section className={`caixa ${titulo ? 'caixa--com-titulo' : ''} ${className}`}>
      {titulo && <h2 className="caixa__titulo">{titulo}</h2>}
      <div className="caixa__conteudo">{children}</div>
    </section>
  )
}
