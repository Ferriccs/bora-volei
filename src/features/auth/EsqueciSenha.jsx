import { useState } from 'react'
import { SITE_URL } from '../../lib/site.js'
import TelaEntrada from '../../components/TelaEntrada.jsx'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from './mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'

// Tela 03 do Figma: pede o e-mail e o Supabase manda um link para criar senha nova.
export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: SITE_URL + '/nova-senha',
    })
    setEnviando(false)
    if (error) return setErro(traduzirErro(error))
    setEnviado(true)
  }

  return (
    <TelaEntrada>
      <BarraTitulo grande as="h1">Esqueci a senha</BarraTitulo>

      {enviado ? (
        <CaixaAzul>
          <p>Pronto! Confira seu e-mail.</p>
          <p>Se existir uma conta com <strong>{email.trim()}</strong>, vai chegar um link para criar uma senha nova.</p>
        </CaixaAzul>
      ) : (
        <form onSubmit={enviar} className="secao" noValidate>
          <CaixaAzul>
            <p>Vamos te enviar um link para criar uma senha nova.</p>
            <CampoTexto rotulo="E-mail" type="email" autoComplete="email" inputMode="email"
              placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Aviso>{erro}</Aviso>
          </CaixaAzul>
          <div className="centro">
            <Botao type="submit" disabled={enviando || !email}>{enviando ? 'Enviando…' : 'Enviar'}</Botao>
          </div>
        </form>
      )}

      <div className="centro"><Link to="/login" className="link-escuro">Voltar para o login</Link></div>
    </TelaEntrada>
  )
}
