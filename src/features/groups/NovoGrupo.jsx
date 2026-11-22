import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import CampoMunicipio from '../../components/CampoMunicipio.jsx'
import Opcoes from '../../components/Opcoes.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import { DIAS, MODALIDADES, NIVEIS } from './textos.js'
import './grupos.css'

const SIM_NAO = [{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }]

// Tela 08 do Figma: Novo grupo. Com um id no endereço, a mesma tela serve para editar.
export default function NovoGrupo() {
  const { id } = useParams()
  const editando = Boolean(id)
  const { perfil } = useAuth()
  const navegar = useNavigate()

  const [form, setForm] = useState({
    nome: '', descricao: '', modalidade: '', uf: perfil?.uf || 'MA', municipio: perfil?.municipio || '',
    local: '', dias: [], nivel_minimo: 'basico', aceita_novatos: 'sim',
  })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)
  const definir = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  // Editando: carrega os dados atuais do grupo
  useEffect(() => {
    if (!editando) return
    supabase.from('groups').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) return setErroGeral(traduzirErro(error))
      setForm({
        nome: data.nome, descricao: data.descricao || '', modalidade: data.modalidade, uf: data.uf,
        municipio: data.municipio, local: data.local || '', dias: data.dias || [],
        nivel_minimo: data.nivel_minimo, aceita_novatos: data.aceita_novatos ? 'sim' : 'nao',
      })
    })
  }, [editando, id])

  function validar() {
    const novos = {}
    if (form.nome.trim().length < 3) novos.nome = 'O nome precisa ter pelo menos 3 letras.'
    if (!form.modalidade) novos.modalidade = 'Escolha a modalidade.'
    if (!form.municipio.trim()) novos.municipio = 'Escolha o município.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(e) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return setErroGeral('Falta preencher alguns campos (veja em vermelho).')
    setSalvando(true)
    const dados = {
      nome: form.nome.trim(), descricao: form.descricao.trim() || null, modalidade: form.modalidade,
      uf: form.uf, municipio: form.municipio.trim(), local: form.local.trim() || null, dias: form.dias,
      nivel_minimo: form.nivel_minimo, aceita_novatos: form.aceita_novatos === 'sim',
    }
    const consulta = editando
      ? supabase.from('groups').update(dados).eq('id', id).select('id').single()
      : supabase.from('groups').insert(dados).select('id').single()   // o dono é você (o banco preenche)
    const { data, error } = await consulta
    setSalvando(false)
    if (error) return setErroGeral(traduzirErro(error))
    navegar(`/grupos/${data.id}`, { replace: true })
  }

  return (
    <main className="tela tela--estreita">
      <BarraTitulo grande as="h1">{editando ? 'Editar grupo' : 'Novo grupo'}</BarraTitulo>

      <form onSubmit={salvar} className="secao" style={{ gap: 'var(--espaco)' }} noValidate>
        <CaixaAzul>
          <CampoTexto rotulo="Nome do grupo" placeholder="Ex.: Vôlei da Beira-Rio" maxLength={60}
            value={form.nome} onChange={(e) => definir('nome', e.target.value)} erro={erros.nome} />
          <CampoTexto rotulo="Descrição (opcional)" elemento="textarea" rows={3} maxLength={400}
            placeholder="Ex.: Jogo descontraído, todo mundo roda."
            value={form.descricao} onChange={(e) => definir('descricao', e.target.value)} />
        </CaixaAzul>

        <section className="secao">
          <BarraTitulo>Modalidade</BarraTitulo>
          <Opcoes nome="modalidade" opcoes={MODALIDADES} valor={form.modalidade} onChange={(v) => definir('modalidade', v)} />
          {erros.modalidade && <p className="erro-escuro">{erros.modalidade}</p>}
        </section>

        <CaixaAzul titulo="Onde vocês jogam?">
          <CampoMunicipio uf={form.uf} municipio={form.municipio} erro={erros.municipio}
            onChange={({ uf, municipio }) => setForm((f) => ({ ...f, uf, municipio }))} />
          <CampoTexto rotulo="Local (opcional)" placeholder="Ex.: Quadra da Beira-Rio"
            value={form.local} onChange={(e) => definir('local', e.target.value)} />
        </CaixaAzul>

        <section className="secao">
          <BarraTitulo>Dias de jogo</BarraTitulo>
          <Opcoes nome="dias" multiplo opcoes={DIAS} valor={form.dias} onChange={(v) => definir('dias', v)} />
        </section>

        <section className="secao">
          <BarraTitulo>Nível mínimo</BarraTitulo>
          <Opcoes nome="nivel_minimo" opcoes={NIVEIS} valor={form.nivel_minimo} onChange={(v) => definir('nivel_minimo', v)} />
        </section>

        <section className="secao">
          <BarraTitulo>Aceita novatos?</BarraTitulo>
          <Opcoes nome="novatos" opcoes={SIM_NAO} valor={form.aceita_novatos} onChange={(v) => definir('aceita_novatos', v)} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>
            Se marcar "Não", quem tem nível menor que o mínimo não consegue pedir para entrar.
          </p>
        </section>

        <Aviso>{erroGeral}</Aviso>
        <div className="centro">
          <Botao type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar grupo'}
          </Botao>
        </div>
      </form>
      <div className="centro">
        <Link to={editando ? `/grupos/${id}` : '/grupos'} className="link-escuro">Cancelar</Link>
      </div>
    </main>
  )
}
