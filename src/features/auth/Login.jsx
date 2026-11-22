import { useState } from 'react'
import BotaoInstalar from '../../components/BotaoInstalar.jsx'
import TelaEntrada from '../../components/TelaEntrada.jsx'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from './mensagens.js'
import Logo from '../../components/Logo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import BotaoGoogle from './BotaoGoogle.jsx'

// Tela 01 do Figma: Login com e-mail e senha (e Google).
export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e) {
    e.preventDefault()               // não deixa a página recarregar
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) setErro(traduzirErro(error))
    // Se deu certo, o AuthProvider percebe o login e a tela muda sozinha.
  }

  return (
    <TelaEntrada>
      <div className="centro so-celular" style={{ marginTop: 24 }}><Logo tipo="vertical" largura={230} /></div>

      <form onSubmit={entrar} className="secao" noValidate>
        <CaixaAzul>
          <CampoTexto rotulo="E-mail" type="email" autoComplete="email" inputMode="email"
            placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <CampoTexto rotulo="Senha" type="password" autoComplete="current-password"
            placeholder="••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          <Aviso>{erro}</Aviso>
          <Link to="/esqueci-senha" className="link-claro">Esqueci minha senha</Link>
        </CaixaAzul>
        <div className="centro">
          <Botao type="submit" disabled={enviando || !email || !senha}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
        </div>
      </form>

      <div className="divisor">ou</div>
      <BotaoGoogle />

      <p className="link-escuro">
        Ainda não tem conta? <Link to="/criar-conta" className="link-escuro">Criar conta</Link>
      </p>
      <div className="centro"><BotaoInstalar /></div>
      <div className="centro"><Link to="/privacidade" className="link-escuro" style={{ fontSize: 13 }}>Política de privacidade</Link></div>
    </TelaEntrada>
  )
}
