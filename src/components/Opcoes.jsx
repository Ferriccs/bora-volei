import './componentes.css'

// Grupo de opções redondas (ex.: BÁSICO / INTERMEDIÁRIO / AVANÇADO).
// multiplo=true permite marcar várias (ex.: posições secundárias).
export default function Opcoes({ nome, opcoes, valor, onChange, multiplo = false }) {
  const marcado = (v) => (multiplo ? (valor || []).includes(v) : valor === v)

  function alternar(v) {
    if (!multiplo) return onChange(v)
    const lista = valor || []
    onChange(lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v])
  }

  return (
    <div className="opcoes" role={multiplo ? 'group' : 'radiogroup'} aria-label={nome}>
      {opcoes.map((op) => (
        <label key={op.valor} className={`opcao ${marcado(op.valor) ? 'opcao--marcada' : ''}`}>
          <input
            type={multiplo ? 'checkbox' : 'radio'}
            name={nome}
            checked={marcado(op.valor)}
            onChange={() => alternar(op.valor)}
          />
          <span className="opcao__bolinha" aria-hidden="true" />
          {op.rotulo}
        </label>
      ))}
    </div>
  )
}
