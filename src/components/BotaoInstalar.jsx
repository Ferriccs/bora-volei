import { useEffect, useState } from 'react'
import { ehApp } from '../lib/site.js'

// Guarda o pedido de instalação do navegador (Chrome/Edge no Android e no PC),
// que pode chegar antes de este botão aparecer na tela.
let pedidoGuardado = null
const ouvintes = new Set()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    pedidoGuardado = e
    ouvintes.forEach((f) => f(e))
  })
  window.addEventListener('appinstalled', () => {
    pedidoGuardado = null
    ouvintes.forEach((f) => f(null))
  })
}

const instalado = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone
const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

// Botão "Instalar app": coloca o Bora Vôlei na tela inicial do celular (ou no PC), com ícone.
// No iPhone o Safari não tem esse botão, então mostramos como fazer pelo menu Compartilhar.
export default function BotaoInstalar({ className = 'botao botao--claro' }) {
  const [pedido, setPedido] = useState(pedidoGuardado)
  const [dicaIphone, setDicaIphone] = useState(false)

  useEffect(() => {
    ouvintes.add(setPedido)
    return () => ouvintes.delete(setPedido)
  }, [])

  if (ehApp || instalado()) return null

  if (pedido) {
    return (
      <button type="button" className={className} onClick={async () => {
        pedido.prompt()
        await pedido.userChoice
        pedidoGuardado = null
        setPedido(null)
      }}>📲 Instalar app</button>
    )
  }

  if (ehIphone()) {
    return dicaIphone
      ? <p className="dica-instalar">No Safari, toque em <strong>Compartilhar</strong> (o quadrado com a seta) e depois em <strong>Adicionar à Tela de Início</strong>.</p>
      : <button type="button" className={className} onClick={() => setDicaIphone(true)}>📲 Instalar app</button>
  }
  return null
}
