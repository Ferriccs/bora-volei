import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { traduzirErro } from '../auth/mensagens.js'

// Carrega um grupo, seus integrantes (com o perfil de cada um) e o meu cargo nele.
export function useGrupo(id) {
  const { usuario } = useAuth()
  const [grupo, setGrupo] = useState(null)
  const [integrantes, setIntegrantes] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    setErro('')
    const [g, m] = await Promise.all([
      supabase.from('groups').select('*').eq('id', id).maybeSingle(),
      supabase.from('group_members')
        .select('user_id, cargo, situacao, pediu_em, entrou_em, perfil:profiles(nome, nivel, posicao_principal, municipio, uf)')
        .eq('group_id', id),
    ])
    if (g.error || m.error) setErro(traduzirErro(g.error || m.error))
    setGrupo(g.data)
    setIntegrantes(m.data || [])
    setCarregando(false)
  }, [id])

  useEffect(() => { recarregar() }, [recarregar])

  const eu = integrantes.find((i) => i.user_id === usuario?.id)
  const ordemCargo = { dono: 0, admin: 1, membro: 2 }
  const ativos = integrantes
    .filter((i) => i.situacao === 'ativo')
    .sort((a, b) => ordemCargo[a.cargo] - ordemCargo[b.cargo] || a.perfil?.nome.localeCompare(b.perfil?.nome))
  const pendentes = integrantes.filter((i) => i.situacao === 'pendente').sort((a, b) => a.pediu_em.localeCompare(b.pediu_em))

  return {
    grupo, ativos, pendentes, erro, setErro, carregando, recarregar,
    minhaSituacao: eu?.situacao || null,
    souDono: eu?.situacao === 'ativo' && eu.cargo === 'dono',
    souAdmin: eu?.situacao === 'ativo' && (eu.cargo === 'dono' || eu.cargo === 'admin'),
    meuId: usuario?.id,
  }
}
