import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'

const PERFIL = 'nome, nivel, posicao_principal, posicoes_secundarias'

// Carrega tudo de um encontro: o encontro, o grupo, os integrantes, quem confirmou,
// os convidados sem conta e os sorteios salvos.
export function useEncontro(id) {
  const { usuario } = useAuth()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    setErro('')
    const enc = await supabase.from('meetings').select('*, grupo:groups(*)').eq('id', id).maybeSingle()
    if (enc.error || !enc.data) {
      setErro(enc.error ? traduzirErro(enc.error) : '')
      setDados({ encontro: null })
      return
    }
    const [membros, presencas, convidados, sorteios] = await Promise.all([
      supabase.from('group_members').select(`user_id, cargo, situacao, perfil:profiles(${PERFIL})`)
        .eq('group_id', enc.data.group_id).eq('situacao', 'ativo'),
      supabase.from('attendance').select(`user_id, confirmado_em, jogou, perfil:profiles(${PERFIL})`)
        .eq('meeting_id', id).order('confirmado_em'),
      supabase.from('guests').select('*').eq('meeting_id', id).order('criado_em'),
      supabase.from('draws').select('*, jogadores:draw_players(*)').eq('meeting_id', id).order('rodada'),
    ])
    const falha = membros.error || presencas.error || convidados.error || sorteios.error
    if (falha) setErro(traduzirErro(falha))
    setDados({
      encontro: enc.data,
      grupo: enc.data.grupo,
      membros: membros.data || [],
      presencas: presencas.data || [],
      convidados: convidados.data || [],
      sorteios: sorteios.data || [],
    })
  }, [id])

  useEffect(() => { recarregar() }, [recarregar])

  const eu = dados?.membros?.find((m) => m.user_id === usuario?.id)
  return {
    ...(dados || {}),
    carregando: dados === null,
    erro, setErro, recarregar,
    meuId: usuario?.id,
    souAdmin: eu?.cargo === 'dono' || eu?.cargo === 'admin',
    confirmei: Boolean(dados?.presencas?.find((p) => p.user_id === usuario?.id)),
  }
}
