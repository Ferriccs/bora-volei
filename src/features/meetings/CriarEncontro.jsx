import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import Opcoes from '../../components/Opcoes.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useGrupo } from '../groups/useGrupo.js'
import { hojeISO } from '../../utils/datas.js'
import '../groups/grupos.css'

const MODALIDADES = [{ valor: 'quadra', rotulo: 'Quadra' }, { valor: 'areia', rotulo: 'Areia' }]
const REPETIR = [{ valor: '1', rotulo: 'Só este' }, { valor: '4', rotulo: 'Repetir por 4 semanas' }]

// Tela 14 do Figma: criar encontro (só dono e admins).
export default function CriarEncontro() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const { grupo, carregando, souAdmin } = useGrupo(id)
  const [form, setForm] = useState(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  if (carregando) return <Carregando />
  if (!souAdmin) return <Navigate to={`/grupos/${id}`} replace />

  // Valores iniciais vêm do grupo (local e modalidade)
  const f = form || {
    data: hojeISO(), hora: '19:00', local: grupo.local || '',
    modalidade: grupo.modalidade === 'ambos' ? 'quadra' : grupo.modalidade, observacao: '', repetir: '1',
  }
  const definir = (campo, valor) => setForm({ ...f, [campo]: valor })

  async function criar(e) {
    e.preventDefault()
    setErro('')
    if (!f.data || !f.hora) return setErro('Escolha a data e o horário.')
    const inicio = new Date(`${f.data}T${f.hora}`)
    if (inicio < new Date(Date.now() - 3600 * 1000)) return setErro('Esta data já passou.')
    const linhas = Array.from({ length: Number(f.repetir) }, (_, semana) => ({
      group_id: id,
      data_hora: new Date(inicio.getTime() + semana * 7 * 24 * 3600 * 1000).toISOString(),
      local: f.local.trim() || null,
      modalidade: f.modalidade,
      observacao: f.observacao.trim() || null,
      criado_por: usuario.id,
    }))
    setSalvando(true)
    const { data, error } = await supabase.from('meetings').insert(linhas).select('id, data_hora')
    setSalvando(false)
    if (error) return setErro(traduzirErro(error))
    // Abre o primeiro encontro (o mais cedo)
    const primeiro = [...data].sort((a, b) => a.data_hora.localeCompare(b.data_hora))[0]
    navegar(`/encontros/${primeiro.id}`, { replace: true })
  }

  return (
    <main className="tela tela--estreita">
      <BarraTitulo grande as="h1">Criar encontro</BarraTitulo>
      <p style={{ textAlign: 'center' }}>{grupo.nome}</p>

      <form onSubmit={criar} className="secao" style={{ gap: 'var(--espaco)' }} noValidate>
        <CaixaAzul>
          <CampoTexto rotulo="Data" type="date" value={f.data} onChange={(e) => definir('data', e.target.value)} />
          <CampoTexto rotulo="Horário" type="time" value={f.hora} onChange={(e) => definir('hora', e.target.value)} />
          <CampoTexto rotulo="Local" placeholder="Ex.: Quadra da Beira-Rio" value={f.local}
            onChange={(e) => definir('local', e.target.value)} />
        </CaixaAzul>

        <section className="secao">
          <BarraTitulo>Modalidade</BarraTitulo>
          <Opcoes nome="modalidade" opcoes={MODALIDADES} valor={f.modalidade} onChange={(v) => definir('modalidade', v)} />
        </section>

        <CaixaAzul>
          <CampoTexto rotulo="Observação (opcional)" elemento="textarea" rows={2} maxLength={300}
            placeholder="Ex.: Levem água, a quadra não tem bebedouro."
            value={f.observacao} onChange={(e) => definir('observacao', e.target.value)} />
        </CaixaAzul>

        <section className="secao">
          <BarraTitulo>Repetir?</BarraTitulo>
          <Opcoes nome="repetir" opcoes={REPETIR} valor={f.repetir} onChange={(v) => definir('repetir', v)} />
        </section>

        <Aviso>{erro}</Aviso>
        <div className="centro"><Botao type="submit" disabled={salvando}>{salvando ? 'Criando…' : 'Criar encontro'}</Botao></div>
      </form>
      <div className="centro"><Link to={`/grupos/${id}`} className="link-escuro">Cancelar</Link></div>
    </main>
  )
}
