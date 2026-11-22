import './componentes.css'

// Barra de título em formato de pílula (ex.: "SEUS GRUPOS", "INTEGRANTES").
export default function BarraTitulo({ children, grande = false, as: Tag = 'h2' }) {
  return <Tag className={`barra-titulo ${grande ? 'barra-titulo--grande' : ''}`}>{children}</Tag>
}
