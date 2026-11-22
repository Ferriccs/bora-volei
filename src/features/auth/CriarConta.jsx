import { useState } from 'react'
import { ehApp } from '../../lib/site.js'
import { SITE_URL } from '../../lib/site.js'
import TelaEntrada from '../../components/TelaEntrada.jsx'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from './mensagens.js'
import Logo from '../../components/Logo.jsx'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import BotaoGoogle from './BotaoGoogle.jsx'

// Tela 02 do Figma: Criar conta.
export default function CriarConta() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmarEmail, setConfirmarEmail] = useState(false)

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  // Confere os campos antes de mandar para o Supabase
  function validar() {
    const novos = {}
    if (form.nome.trim().length < 2) novos.nome = 'Digite seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) novos.email = 'Digite um e-mail válido.'
    if (form.senha.length < 6) novos.senha = 'Use pelo menos 6 caracteres.'
    if (form.confirmar !== form.senha) novos.confirmar = 'As senhas não são iguais.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function criar(e) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return
    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.senha,
      options: {
        data: { nome: form.nome.trim() },                       // vai para o perfil automaticamente
        emailRedirectTo: SITE_URL + '/primeiro-acesso',
      },
    })
    setEnviando(false)
    if (error) return setErroGeral(traduzirErro(error))
    // Se o Supabase pede confirmação de e-mail, ainda não há sessão: avisamos a pessoa.
    if (!data.session) setConfirmarEmail(true)
    // Se não pede, a pessoa já entra e vai para o Primeiro acesso sozinha.
  }

  if (confirmarEmail) {
    return (
      <TelaEntrada>
        <div className="centro so-celular" style={{ marginTop: 24 }}><Logo tipo="vertical" largura={200} /></div>
        <BarraTitulo grande as="h1">Quase lá!</BarraTitulo>
        <CaixaAzul>
          <p>Enviamos um link para <strong>{form.email.trim()}</strong>.</p>
          <p>Abra seu e-mail e toque no link para confirmar a conta. Se não achar, olhe a caixa de spam.</p>
        </CaixaAzul>
        <div className="centro"><Link to="/login" className="link-escuro">Voltar para o login</Link></div>
      </TelaEntrada>
    )
  }

  return (
    <TelaEntrada>
      <BarraTitulo grande as="h1">Criar conta</BarraTitulo>

      <form onSubmit={criar} className="secao" noValidate>
        <CaixaAzul>
          <CampoTexto rotulo="Nome" autoComplete="name" placeholder="Como te chamam no vôlei"
            value={form.nome} onChange={mudar('nome')} erro={erros.nome} />
          <CampoTexto rotulo="E-mail" type="email" autoComplete="email" inputMode="email"
            placeholder="voce@email.com" value={form.email} onChange={mudar('email')} erro={erros.email} />
          <CampoTexto rotulo="Senha" type="password" autoComplete="new-password"
            placeholder="Mínimo 6 caracteres" value={form.senha} onChange={mudar('senha')} erro={erros.senha} />
          <CampoTexto rotulo="Confirmar senha" type="password" autoComplete="new-password"
            value={form.confirmar} onChange={mudar('confirmar')} erro={erros.confirmar} />
          <Aviso>{erroGeral}</Aviso>
        </CaixaAzul>
        <div className="centro">
          <Botao type="submit" disabled={enviando}>{enviando ? 'Criando…' : 'Criar conta'}</Botao>
        </div>
      </form>

      {!ehApp && <div className="divisor">ou</div>}
      <BotaoGoogle />

      <p className="link-escuro">
        Já tem conta? <Link to="/login" className="link-escuro">Entrar</Link>
      </p>
    </TelaEntrada>
  )
}
