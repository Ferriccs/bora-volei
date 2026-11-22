import './componentes.css'

// Etiqueta em pílula do perfil (ex.: EXPERIENTE, 25 ANOS, PONTEIRO).
// destaque=true mostra a borda azul clara, como a posição principal no Figma.
export default function Pilula({ children, destaque = false }) {
  return <span className={`pilula ${destaque ? 'pilula--destaque' : ''}`}>{children}</span>
}
