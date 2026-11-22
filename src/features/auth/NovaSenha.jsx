import { useState } from 'react'
import TelaEntrada from '../../components/TelaEntrada.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from './AuthProvider.jsx'
import { traduzirErro } from './mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'

// Tela 04 do Figma: aberta pelo link do e-mail. A pessoa escolhe a senha nova.
export default function NovaSenha() {
  const { sessao, carregando, setRecuperandoSenha } = useAuth()
  const navegar = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não são iguais.')
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) return setErro(traduzirErro(error))
    setRecuperandoSenha(false)
    navegar('/grupos', { replace: true })
  }

  if (carregando) return <Carregando />

  // O link do e-mail faz o login sozinho. Sem sessão, o link venceu ou já foi usado.
  if (!sessao) {
    return (
      <TelaEntrada>
        <BarraTitulo grande as="h1">Nova senha</BarraTitulo>
        <CaixaAzul>
          <p>Este link expirou ou já foi usado.</p>
          <Link to="/esqueci-senha" className="link-claro">Pedir um link novo</Link>
        </CaixaAzul>
      </TelaEntrada>
    )
  }

  return (
    <TelaEntrada>
      <BarraTitulo grande as="h1">Nova senha</BarraTitulo>
      <form onSubmit={salvar} className="secao" noValidate>
        <CaixaAzul>
          <CampoTexto rotulo="Nova senha" type="password" autoComplete="new-password"
            placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <CampoTexto rotulo="Confirmar nova senha" type="password" autoComplete="new-password"
            value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          <Aviso>{erro}</Aviso>
        </CaixaAzul>
        <div className="centro">
          <Botao type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</Botao>
        </div>
      </form>
    </TelaEntrada>
  )
}
