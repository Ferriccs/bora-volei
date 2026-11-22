import { useState } from 'react'
import './componentes.css'

// Avaliação de 1 a 5 estrelas. Se "onChange" não for passado, as estrelas só mostram a nota.
export default function Estrelas({ valor = 0, onChange, tamanho = 22, rotulo = 'Avaliação' }) {
  const [hover, setHover] = useState(0)
  const ativo = hover || valor
  const editavel = Boolean(onChange)

  return (
    <div className="estrelas" role={editavel ? 'radiogroup' : 'img'} aria-label={`${rotulo}: ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`estrela ${n <= ativo ? 'estrela--cheia' : ''}`}
          style={{ fontSize: tamanho }}
          disabled={!editavel}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          aria-checked={editavel ? n === valor : undefined}
          role={editavel ? 'radio' : undefined}
          onMouseEnter={() => editavel && setHover(n)}
          onMouseLeave={() => editavel && setHover(0)}
          onClick={() => editavel && onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}
