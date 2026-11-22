import vertical from '../assets/logo-vertical.svg'
import horizontal from '../assets/logo-horizontal.svg'
import fundoAzul from '../assets/logo-fundo-azul.svg'

const arquivos = { vertical, horizontal, 'fundo-azul': fundoAzul }

// Logo do Bora Vôlei. tipo: "vertical" (login), "horizontal" (topo) ou "fundo-azul".
export default function Logo({ tipo = 'vertical', largura = 220 }) {
  return <img src={arquivos[tipo]} alt="Bora Vôlei" width={largura} style={{ height: 'auto', display: 'block' }} />
}
