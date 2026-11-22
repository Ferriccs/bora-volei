import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import { UFS, buscarMunicipios } from './municipios.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import Opcoes from '../../components/Opcoes.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'

// Tela 05 do Figma: depois de criar a conta, a pessoa conta como joga.
// Esses dados alimentam a nota inicial (pelo nível) e o sorteio (pelas posições).
const NIVEIS = [
  { valor: 'basico', rotulo: 'Básico' },
  { valor: 'intermediario', rotulo: 'Intermediário' },
  { valor: 'avancado', rotulo: 'Avançado' },
]
const TEMPOS = [
  { valor: '0-1', rotulo: '0 a 1 ano' },
  { valor: '1-3', rotulo: '1 a 3 anos' },
  { valor: '3+', rotulo: 'Mais de 3' },
]
const POSICOES = [
  { valor: 'volei_levantador', rotulo: 'Levantador' },
  { valor: 'volei_ponteiro', rotulo: 'Ponteiro' },
  { valor: 'volei_central', rotulo: 'Central' },
  { valor: 'volei_oposto', rotulo: 'Oposto' },
  { valor: 'volei_libero', rotulo: 'Líbero' },
]

export default function PrimeiroAcesso() {
  const { usuario, perfil, recarregarPerfil } = useAuth()
  const navegar = useNavigate()

  const [form, setForm] = useState({
    nome: perfil?.nome || usuario?.user_metadata?.nome || usuario?.user_metadata?.full_name || '',
    nascimento: perfil?.nascimento || '',
    nivel: perfil?.nivel || '',
    tempo_jogo: perfil?.tempo_jogo || '',
    posicao_principal: perfil?.posicao_principal || '',
    posicoes_secundarias: perfil?.posicoes_secundarias || [],
    uf: perfil?.uf || 'MA',
    municipio: perfil?.municipio || '',
    bio: perfil?.bio || '',
  })
  const [municipios, setMunicipios] = useState([])
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)

  const definir = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  // Se o perfil chegar do banco depois que a tela abriu, preenche o que estiver vazio
  useEffect(() => {
    if (!perfil) return
    setForm((f) => {
      const novo = { ...f }
      for (const campo of Object.keys(f)) {
        const vazio = f[campo] === '' || (Array.isArray(f[campo]) && f[campo].length === 0)
        if (vazio && perfil[campo]) novo[campo] = perfil[campo]
      }
      return novo
    })
  }, [perfil])

  // Quando muda o estado (UF), carrega os municípios dele
  useEffect(() => {
    let ativo = true
    buscarMunicipios(form.uf)
      .then((lista) => ativo && setMunicipios(lista))
      .catch(() => ativo && setMunicipios([]))   // sem IBGE, a pessoa digita o nome livremente
    return () => { ativo = false }
  }, [form.uf])

  // A posição principal não pode aparecer de novo nas secundárias
  const secundariasPossiveis = POSICOES.filter((p) => p.valor !== form.posicao_principal)

  function escolherPrincipal(valor) {
    setForm((f) => ({
      ...f,
      posicao_principal: valor,
      posicoes_secundarias: f.posicoes_secundarias.filter((p) => p !== valor),
    }))
  }

  function validar() {
    const novos = {}
    if (form.nome.trim().length < 2) novos.nome = 'Digite seu nome.'
    if (!form.nivel) novos.nivel = 'Escolha seu nível.'
    if (!form.tempo_jogo) novos.tempo_jogo = 'Escolha há quanto tempo joga.'
    if (!form.posicao_principal) novos.posicao_principal = 'Escolha sua posição principal.'
    if (!form.municipio.trim()) novos.municipio = 'Digite seu município.'
    else if (municipios.length && !municipios.includes(form.municipio.trim()))
      novos.municipio = 'Escolha um município da lista.'
    if (form.nascimento) {
      const ano = Number(form.nascimento.slice(0, 4))
      const agora = new Date().getFullYear()
      if (ano < agora - 100 || ano > agora - 5) novos.nascimento = 'Confira a data de nascimento.'
    }
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(e) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return setErroGeral('Falta preencher alguns campos (veja em vermelho).')
    setSalvando(true)
    const dados = {
      id: usuario.id,
      nome: form.nome.trim(),
      nascimento: form.nascimento || null,
      nivel: form.nivel,
      tempo_jogo: form.tempo_jogo,
      posicao_principal: form.posicao_principal,
      posicoes_secundarias: form.posicoes_secundarias,
      uf: form.uf,
      municipio: form.municipio.trim(),
      bio: form.bio.trim() || null,
    }
    // "upsert" cria o perfil se não existir, ou atualiza se já existir
    const { error } = await supabase.from('profiles').upsert(dados)
    if (error) {
      setSalvando(false)
      return setErroGeral(traduzirErro(error))
    }
    await recarregarPerfil()
    setSalvando(false)
    navegar('/grupos', { replace: true })
  }

  return (
    <main className="tela tela--estreita">
      <BarraTitulo grande as="h1">Primeiro acesso</BarraTitulo>
      <p style={{ textAlign: 'center' }}>Conta pra gente como você joga. Dá para mudar depois no perfil.</p>

      <form onSubmit={salvar} className="secao" style={{ gap: 'var(--espaco)' }} noValidate>
        <CaixaAzul>
          <CampoTexto rotulo="Nome" value={form.nome} onChange={(e) => definir('nome', e.target.value)} erro={erros.nome} />
          <CampoTexto rotulo="Data de nascimento (opcional)" type="date" value={form.nascimento}
            onChange={(e) => definir('nascimento', e.target.value)} erro={erros.nascimento} />
        </CaixaAzul>

        <section className="secao">
          <BarraTitulo>Qual seu nível de vôlei?</BarraTitulo>
          <Opcoes nome="nivel" opcoes={NIVEIS} valor={form.nivel} onChange={(v) => definir('nivel', v)} />
          {erros.nivel && <p className="erro-escuro">{erros.nivel}</p>}
        </section>

        <section className="secao">
          <BarraTitulo>Há quanto tempo joga?</BarraTitulo>
          <Opcoes nome="tempo" opcoes={TEMPOS} valor={form.tempo_jogo} onChange={(v) => definir('tempo_jogo', v)} />
          {erros.tempo_jogo && <p className="erro-escuro">{erros.tempo_jogo}</p>}
        </section>

        <section className="secao">
          <BarraTitulo>Posição principal</BarraTitulo>
          <Opcoes nome="principal" opcoes={POSICOES} valor={form.posicao_principal} onChange={escolherPrincipal} />
          {erros.posicao_principal && <p className="erro-escuro">{erros.posicao_principal}</p>}
        </section>

        <section className="secao">
          <BarraTitulo>Posições secundárias</BarraTitulo>
          <Opcoes nome="secundarias" multiplo opcoes={secundariasPossiveis}
            valor={form.posicoes_secundarias} onChange={(v) => definir('posicoes_secundarias', v)} />
        </section>

        <CaixaAzul titulo="Onde você joga?">
          <CampoTexto rotulo="Estado" elemento="select" value={form.uf}
            onChange={(e) => { definir('uf', e.target.value); definir('municipio', '') }}>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </CampoTexto>
          <CampoTexto rotulo="Município" list="lista-municipios" autoComplete="off"
            placeholder={form.uf === 'MA' ? 'Ex.: Imperatriz' : 'Digite e escolha da lista'}
            value={form.municipio} onChange={(e) => definir('municipio', e.target.value)} erro={erros.municipio} />
          <datalist id="lista-municipios">
            {municipios.map((m) => <option key={m} value={m} />)}
          </datalist>
        </CaixaAzul>

        <CaixaAzul>
          <CampoTexto rotulo="Bio (opcional)" elemento="textarea" maxLength={300} rows={3}
            placeholder="Ex.: Jogo desde a escola, gosto de areia aos sábados."
            value={form.bio} onChange={(e) => definir('bio', e.target.value)} />
        </CaixaAzul>

        <Aviso>{erroGeral}</Aviso>
        <div className="centro">
          <Botao type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Continuar'}</Botao>
        </div>
      </form>
    </main>
  )
}
