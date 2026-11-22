import './componentes.css'

// Mensagem de erro ou de sucesso dentro das caixas (ex.: "E-mail ou senha incorretos").
export default function Aviso({ tipo = 'erro', children }) {
  if (!children) return null
  return (
    <p className={`aviso aviso--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}
