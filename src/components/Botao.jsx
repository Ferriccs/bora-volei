import './componentes.css'

// Botão arredondado azul (ex.: ENTRAR, CONTINUAR).
// variante="claro" deixa o botão cinza com texto azul (ex.: "Sortear times" dentro da caixa azul).
export default function Botao({ children, variante = 'azul', larguraTotal = false, ...props }) {
  return (
    <button
      className={`botao botao--${variante} ${larguraTotal ? 'botao--cheio' : ''}`}
      {...props}
    >
      {children}
    </button>
  )
}
