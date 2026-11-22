import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useEncontro } from './useEncontro.js'
import { dataHoraCurta } from '../../utils/datas.js'
import { nomeNivel } from '../groups/textos.js'
import '../groups/grupos.css'

// Tela 17 do Figma: o admin marca quem realmente jogou.
// Quem confirmou já vem marcado; dá para marcar quem apareceu sem confirmar.
export default function QuemJogou() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { encontro, grupo, membros, presencas, carregando, erro, setErro, souAdmin } = useEncontro(id)
  const [marcados, setMarcados] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!presencas || marcados) return
    // Se já foi registrado antes, usa o registro; senão, marca quem confirmou
    const registrado = presencas.some((p) => p.jogou !== null)
    setMarcados(new Set(presencas.filter((p) => (registrado ? p.jogou : true)).map((p) => p.user_id)))
  }, [presencas, marcados])

  if (carregando || !marcados) return <Carregando />
  if (!encontro || !souAdmin) return <Navigate to={`/encontros/${id}`} replace />

  // Quem confirmou aparece primeiro, depois os outros integrantes
  const confirmaram = new Set(presencas.map((p) => p.user_id))
  const lista = [...membros].sort((a, b) =>
    (confirmaram.has(b.user_id) - confirmaram.has(a.user_id)) || a.perfil.nome.localeCompare(b.perfil.nome))

  function alternar(userId) {
    const novo = new Set(marcados)
    novo.has(userId) ? novo.delete(userId) : novo.add(userId)
    setMarcados(novo)
  }

  async function salvar() {
    setErro(''); setSalvando(true)
    const { error } = await supabase.rpc('registrar_quem_jogou', { p_encontro: id, p_jogadores: [...marcados] })
    setSalvando(false)
    if (error) return setErro(traduzirErro(error))
    navegar(`/encontros/${id}`, { replace: true })
  }

  return (
    <main className="tela tela--media">
      <BarraTitulo grande as="h1">Quem jogou?</BarraTitulo>
      <p style={{ textAlign: 'center' }}>{grupo.nome} · {dataHoraCurta(encontro.data_hora)}</p>
      <Aviso>{erro}</Aviso>

      <CaixaAzul titulo={`Marcados: ${marcados.size}`}>
        {lista.map((m) => (
          <label key={m.user_id} className="marcar">
            <input type="checkbox" checked={marcados.has(m.user_id)} onChange={() => alternar(m.user_id)} />
            <span className="marcar__nome">
              {m.perfil.nome}
              <span className="marcar__detalhe">
                {nomeNivel(m.perfil.nivel)}{confirmaram.has(m.user_id) ? ' · confirmou' : ' · não confirmou'}
              </span>
            </span>
          </label>
        ))}
      </CaixaAzul>
      <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
        Isso alimenta o "jogou com você" do perfil e libera a avaliação pós-encontro (aberta por 3 dias para quem jogou).
      </p>

      <div className="centro"><Botao onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</Botao></div>
      <div className="centro"><Link to={`/encontros/${id}`} className="link-escuro">Cancelar</Link></div>
    </main>
  )
}
