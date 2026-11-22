import { useCallback, useEffect, useState } from 'react'
import { SITE_URL } from '../../lib/site.js'
import { Link, Navigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useGrupo } from '../groups/useGrupo.js'
import '../groups/grupos.css'

// "28/11, 16h" a partir de uma data
function formatarValidade(data) {
  const d = new Date(data)
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const hora = d.getMinutes() ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : `${d.getHours()}h`
  return `${dia}, ${hora}`
}

// Tela 11 do Figma: convite por link e QR Code (só dono e admins).
export default function Convite() {
  const { id } = useParams()
  const { grupo, carregando, souAdmin } = useGrupo(id)
  const [convite, setConvite] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  // Usa o convite mais novo que ainda vale; se não houver, cria um
  const prepararConvite = useCallback(async () => {
    setErro('')
    const { data, error } = await supabase.from('invites').select('*')
      .eq('group_id', id).eq('cancelado', false).gt('vence_em', new Date().toISOString())
      .order('criado_em', { ascending: false }).limit(1)
    if (error) return setErro(traduzirErro(error))
    if (data.length) return setConvite(data[0])
    const novo = await supabase.rpc('criar_convite', { p_grupo: id })
    if (novo.error) return setErro(traduzirErro(novo.error))
    setConvite(novo.data)
  }, [id])

  useEffect(() => { if (souAdmin) prepararConvite() }, [souAdmin, prepararConvite])

  const link = convite ? `${SITE_URL}/convite/${convite.codigo}` : ''
  const texto = grupo ? `Bora jogar vôlei? Entra no grupo "${grupo.nome}" no Bora Vôlei:` : ''

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      setAviso('Link copiado! Agora é só colar no WhatsApp.')
    } catch {
      setAviso('Não deu para copiar sozinho. Segure o dedo no link acima e copie.')
    }
  }

  async function compartilhar() {
    // No celular abre a lista de apps (WhatsApp etc.); no computador, abre o WhatsApp Web
    if (navigator.share) {
      try { await navigator.share({ title: 'Bora Vôlei', text: texto, url: link }) } catch { /* cancelou */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${link}`)}`, '_blank', 'noopener')
    }
  }

  async function cancelar() {
    if (!window.confirm('Cancelar este convite? Quem tiver o link não vai mais conseguir entrar.')) return
    setOcupado(true); setAviso('')
    const { error } = await supabase.rpc('cancelar_convite', { p_convite: convite.id })
    if (error) { setOcupado(false); return setErro(traduzirErro(error)) }
    const novo = await supabase.rpc('criar_convite', { p_grupo: id })
    setOcupado(false)
    if (novo.error) return setErro(traduzirErro(novo.error))
    setConvite(novo.data)
    setAviso('Convite antigo cancelado. Este é o novo link.')
  }

  if (carregando) return <Carregando />
  if (!souAdmin) return <Navigate to={`/grupos/${id}`} replace />

  return (
    <main className="tela tela--media">
      <BarraTitulo grande as="h1">{grupo?.nome}</BarraTitulo>
      <Aviso>{erro}</Aviso>

      <CaixaAzul titulo="Convide seus amigos">
        {!convite && !erro && <p>Gerando convite…</p>}
        {convite && (
          <div className="convite">
            <div className="convite__qr">
              <QRCodeSVG value={link} size={210} marginSize={2} fgColor="#16384A" title="QR Code do convite" />
            </div>
            <p className="convite__validade">Válido até {formatarValidade(convite.vence_em)}</p>
            <p className="convite__link">{link}</p>
          </div>
        )}
      </CaixaAzul>

      {convite && (
        <>
          <div className="acoes-grupo">
            <Botao onClick={copiar}>Copiar link</Botao>
            <Botao onClick={compartilhar}>Compartilhar</Botao>
          </div>
          <Aviso tipo="sucesso">{aviso}</Aviso>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
            Quem abrir o link entra direto no grupo, sem precisar de aprovação.
          </p>
          <div className="centro">
            <button className="link-escuro" style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              disabled={ocupado} onClick={cancelar}>
              Cancelar este convite
            </button>
          </div>
        </>
      )}

      <div className="centro"><Link to={`/grupos/${id}`} className="link-escuro">Voltar para o grupo</Link></div>
    </main>
  )
}
