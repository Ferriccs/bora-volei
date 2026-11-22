import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useGrupo } from '../groups/useGrupo.js'
import { dataHoraCurta, hora } from '../../utils/datas.js'
import './chat.css'

const CAMPOS = 'id, group_id, autor, tipo, conteudo, meeting_id, criado_em, perfil:profiles(nome), encontro:meetings(data_hora, local, situacao)'
const CHAVE_TELEFONE = 'boravolei:telefone'

function lerTelefone() {
  try { return localStorage.getItem(CHAVE_TELEFONE) || '' } catch { return '' }
}
function guardarTelefone(t) {
  try { localStorage.setItem(CHAVE_TELEFONE, t) } catch { /* sem problema */ }
}

// Link do WhatsApp: só números, com 55 (Brasil) na frente se faltar
function linkWhatsApp(telefone) {
  let n = telefone.replace(/\D/g, '')
  if (n.length <= 11) n = '55' + n
  return `https://wa.me/${n}`
}

// Tela 10 do Figma: chat do grupo, em tempo real.
// Só integrantes leem e escrevem. O telefone só aparece aqui quando a própria pessoa compartilha.
export default function ChatGrupo() {
  const { id } = useParams()
  const { grupo, carregando, minhaSituacao, meuId } = useGrupo(id)
  const [mensagens, setMensagens] = useState(null)
  const [texto, setTexto] = useState('')
  const [telefone, setTelefone] = useState(lerTelefone)
  const [mostrarContato, setMostrarContato] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const fim = useRef(null)

  // Carrega as últimas mensagens e fica ouvindo as novas
  useEffect(() => {
    let ativo = true
    supabase.from('messages').select(CAMPOS).eq('group_id', id)
      .order('criado_em', { ascending: false }).limit(100)
      .then(({ data, error }) => {
        if (!ativo) return
        if (error) setErro(traduzirErro(error))
        setMensagens((data || []).reverse())
      })

    const canal = supabase.channel(`chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${id}` },
        async (payload) => {
          // Busca a mensagem completa (com o nome de quem enviou)
          const { data } = await supabase.from('messages').select(CAMPOS).eq('id', payload.new.id).maybeSingle()
          if (data) adicionar(data)
        })
      .subscribe()

    return () => { ativo = false; supabase.removeChannel(canal) }
  }, [id])

  // Rola para a última mensagem
  useEffect(() => { fim.current?.scrollIntoView({ block: 'end' }) }, [mensagens?.length])

  function adicionar(m) {
    setMensagens((lista) => (lista && !lista.some((x) => x.id === m.id) ? [...lista, m] : lista))
  }

  async function enviar(tipo, conteudo) {
    setErro(''); setEnviando(true)
    const { data, error } = await supabase.from('messages')
      .insert({ group_id: id, autor: meuId, tipo, conteudo }).select(CAMPOS).single()
    setEnviando(false)
    if (error) { setErro(traduzirErro(error)); return false }
    adicionar(data)
    return true
  }

  async function enviarTexto(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    if (await enviar('texto', t)) setTexto('')
  }

  async function compartilharContato(e) {
    e.preventDefault()
    const t = telefone.trim()
    if (t.replace(/\D/g, '').length < 10) return setErro('Digite o telefone com DDD, ex.: (99) 98888-7777.')
    guardarTelefone(t)
    if (await enviar('contato', t)) setMostrarContato(false)
  }

  async function apagar(m) {
    if (!window.confirm('Apagar esta mensagem?')) return
    const { error } = await supabase.from('messages').delete().eq('id', m.id)
    if (error) return setErro(traduzirErro(error))
    setMensagens((lista) => lista.filter((x) => x.id !== m.id))
  }

  if (carregando || mensagens === null) return <Carregando />
  if (minhaSituacao !== 'ativo') return <Navigate to={`/grupos/${id}`} replace />

  // Mostra a data entre as mensagens quando muda o dia
  let diaAnterior = ''

  return (
    <main className="tela tela--media tela--chat">
      <BarraTitulo grande as="h1">{grupo?.nome}</BarraTitulo>

      <CaixaAzul titulo="Chat" className="chat">
        <div className="chat__lista" role="log" aria-live="polite">
          {mensagens.length === 0 && <p className="chat__vazio">Nenhuma mensagem ainda. Diga um oi para o grupo!</p>}
          {mensagens.map((m) => {
            const dia = new Date(m.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            const separador = dia !== diaAnterior ? <div className="chat__dia">{dia}</div> : null
            diaAnterior = dia
            const minha = m.autor === meuId
            const nome = m.perfil?.nome || 'Alguém'

            if (m.tipo === 'encontro') {
              return (
                <div key={m.id}>
                  {separador}
                  <Link to={`/encontros/${m.meeting_id}`} className="chat__encontro">
                    <strong>{nome} {m.conteudo}</strong>
                    {m.encontro && <span>{dataHoraCurta(m.encontro.data_hora)}{m.encontro.local ? ` · ${m.encontro.local}` : ''}</span>}
                    <span className="chat__encontro-acao">{m.encontro?.situacao === 'cancelado' ? 'Cancelado' : 'Ver e confirmar presença'}</span>
                  </Link>
                </div>
              )
            }

            return (
              <div key={m.id}>
                {separador}
                <div className={`chat__msg ${minha ? 'chat__msg--minha' : ''}`}>
                  {!minha && <Link to={`/perfil/${m.autor}`} className="chat__autor">{nome}</Link>}
                  {m.tipo === 'contato' ? (
                    <div className="chat__contato">
                      <span>📞 {minha ? 'Você compartilhou seu contato' : 'Compartilhou o contato'}</span>
                      <strong>{m.conteudo}</strong>
                      <a href={linkWhatsApp(m.conteudo)} target="_blank" rel="noreferrer">Chamar no WhatsApp</a>
                    </div>
                  ) : (
                    <p className="chat__texto">{m.conteudo}</p>
                  )}
                  <span className="chat__hora">
                    {hora(m.criado_em)}
                    {minha && <button type="button" className="chat__apagar" onClick={() => apagar(m)} aria-label="Apagar mensagem">apagar</button>}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={fim} />
        </div>
      </CaixaAzul>

      <Aviso>{erro}</Aviso>

      {mostrarContato ? (
        <form className="chat__form" onSubmit={compartilharContato}>
          <input className="campo__input chat__input" type="tel" inputMode="tel" placeholder="Seu telefone com DDD"
            aria-label="Seu telefone com DDD" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={20} autoFocus />
          <button type="submit" className="botao botao--azul chat__enviar" disabled={enviando}>Enviar</button>
          <button type="button" className="link-escuro chat__cancelar" onClick={() => setMostrarContato(false)}>Cancelar</button>
        </form>
      ) : (
        <form className="chat__form" onSubmit={enviarTexto}>
          <input className="campo__input chat__input" placeholder="Escreva uma mensagem" aria-label="Mensagem"
            value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} />
          <button type="submit" className="botao botao--azul chat__enviar" disabled={enviando || !texto.trim()}>Enviar</button>
        </form>
      )}

      {!mostrarContato && (
        <div className="centro">
          <button type="button" className="botao botao--claro" onClick={() => setMostrarContato(true)}>📞 Compartilhar contato</button>
        </div>
      )}
      <p className="chat__nota">Seu telefone só aparece para o grupo quando você toca em "Compartilhar contato".</p>
      <div className="centro"><Link to={`/grupos/${id}`} className="link-escuro">Voltar para o grupo</Link></div>
    </main>
  )
}
