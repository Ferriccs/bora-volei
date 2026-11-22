import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

// Guarda "quem está logado" e o perfil dessa pessoa, para qualquer tela usar.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  // De qual usuário é o perfil que já buscamos (evita achar que o perfil "não existe" enquanto ainda carrega)
  const [perfilDe, setPerfilDe] = useState(null)

  // Busca o perfil (tabela profiles) do usuário logado
  const carregarPerfil = useCallback(async (usuarioId) => {
    if (!usuarioId) { setPerfil(null); setPerfilDe(null); return null }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', usuarioId)
      .maybeSingle()
    if (error) console.error('Erro ao buscar perfil:', error.message)
    setPerfil(data ?? null)
    setPerfilDe(usuarioId)
    return data
  }, [])

  useEffect(() => {
    if (!supabase) { setCarregando(false); return }

    // 1) Ao abrir o app, vê se já existe alguém logado neste aparelho
    supabase.auth.getSession().then(async ({ data }) => {
      setSessao(data.session)
      await carregarPerfil(data.session?.user.id)
      setCarregando(false)
    })

    // 2) Fica ouvindo: login, logout, link de "nova senha" etc.
    const { data: ouvinte } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      setSessao(novaSessao)
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
      // setTimeout evita travar o Supabase ao fazer outra consulta dentro do ouvinte
      setTimeout(() => carregarPerfil(novaSessao?.user.id), 0)
    })
    return () => ouvinte.subscription.unsubscribe()
  }, [carregarPerfil])

  async function sair() {
    await supabase.auth.signOut()
    setPerfil(null)
  }

  const valor = {
    sessao,
    usuario: sessao?.user ?? null,
    perfil,
    // O primeiro acesso está completo quando o nível e o município foram preenchidos
    perfilCompleto: Boolean(perfil?.nivel && perfil?.municipio),
    // Carregando = abrindo o app OU logado mas o perfil desse usuário ainda não chegou
    carregando: carregando || Boolean(sessao && perfilDe !== sessao.user.id),
    recuperandoSenha,
    setRecuperandoSenha,
    recarregarPerfil: () => carregarPerfil(sessao?.user.id),
    sair,
  }
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
