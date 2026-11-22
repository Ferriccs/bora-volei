import { useId } from 'react'
import './componentes.css'

// Campo de texto com rótulo pequeno em cima (ex.: E-MAIL, SENHA). Feito para ficar dentro da CaixaAzul.
// elemento="select" vira uma lista de opções (passe <option> como filhos); "textarea" vira texto longo.
export default function CampoTexto({ rotulo, erro, elemento = 'input', children, ...props }) {
  const id = useId()
  const Tag = elemento
  const classe = `campo__input ${elemento === 'select' ? 'campo__input--select' : ''}`
  return (
    <div className="campo">
      <label htmlFor={id} className="campo__rotulo">{rotulo}</label>
      <Tag id={id} className={classe} aria-invalid={erro ? true : undefined} {...props}>{children}</Tag>
      {erro && <span className="campo__erro">{erro}</span>}
    </div>
  )
}
