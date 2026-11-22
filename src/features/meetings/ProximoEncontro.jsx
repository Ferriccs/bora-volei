import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Aviso from '../../components/Aviso.jsx'
import { dataHoraCurta } from '../../utils/datas.js'
import { nomeModalidade } from '../groups/textos.js'

// Caixa "Próximo encontro" da tela do grupo: mostra o próximo jogo e o botão de confirmar presença.
export default function ProximoEncontro({ grupoId, souAdmin }) {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [encontros, setEncontros] = useState(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(async () => {
    // Encontros marcados a partir de 3 horas atrás (o jogo de hoje ainda aparece enquanto acontece)
    const desde = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    const { data, error } = await supabase.from('meetings')
      .select('*, presencas:attendance(user_id)')
      .eq('group_id', grupoId).eq('situacao', 'marcado').gte('data_hora', desde)
      .order('data_hora').limit(3)
    if (error) setErro(traduzirErro(error))
    setEncontros(data || [])
  }, [grupoId])

  useEffect(() => { carregar() }, [carregar])

  async function alternarPresenca(encontro, confirmado) {
    setErro(''); setOcupado(true)
    const { error } = confirmado
      ? await supabase.from('attendance').delete().eq('meeting_id', encontro.id).eq('user_id', usuario.id)
      : await supabase.from('attendance').insert({ meeting_id: encontro.id, user_id: usuario.id })
    setOcupado(false)
    if (error) return setErro(traduzirErro(error))
    carregar()
  }

  return (
    <CaixaAzul titulo="Próximo encontro">
      <Aviso>{erro}</Aviso>
      {encontros === null && <p>Carregando…</p>}
      {encontros?.length === 0 && <p>Nenhum encontro marcado.</p>}
      {encontros?.map((e, i) => {
        const confirmado = e.presencas.some((p) => p.user_id === usuario?.id)
        return (
          <div key={e.id} className="encontro-linha" style={i > 0 ? { opacity: 0.85 } : undefined}>
            <Link to={`/encontros/${e.id}`} className="encontro-linha__info">
              <strong>{dataHoraCurta(e.data_hora)}</strong>
              <span>{nomeModalidade(e.modalidade)}{e.local ? ` · ${e.local}` : ''}</span>
              <span>{e.presencas.length} confirmado{e.presencas.length === 1 ? '' : 's'}</span>
            </Link>
            <button className={`botao botao--mini ${confirmado ? 'botao--confirmado' : ''}`} disabled={ocupado}
              onClick={() => alternarPresenca(e, confirmado)}>
              {confirmado ? '✓ Vou' : 'Confirmar presença'}
            </button>
          </div>
        )
      })}
      {souAdmin && (
        <button className="link-claro" onClick={() => navegar(`/grupos/${grupoId}/encontros/novo`)}>+ Criar encontro</button>
      )}
    </CaixaAzul>
  )
}
