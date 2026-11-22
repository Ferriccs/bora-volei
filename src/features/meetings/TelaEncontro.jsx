import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useEncontro } from './useEncontro.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { dataLonga, hora } from '../../utils/datas.js'
import { NIVEIS, POSICOES, nomeModalidade, nomeNivel } from '../groups/textos.js'
import '../groups/grupos.css'

const SITUACAO = { marcado: 'Marcado', realizado: 'Realizado', cancelado: 'Cancelado' }

// Tela do encontro: quem confirmou (em ordem), convidados sem conta e os botões de sorteio.
export default function TelaEncontro() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const { encontro, grupo, presencas, convidados, sorteios, carregando, erro, setErro, recarregar, souAdmin, confirmei, meuId } = useEncontro(id)
  const [convidado, setConvidado] = useState({ nome: '', nivel: 'basico' })
  const [ocupado, setOcupado] = useState(false)

  async function rodar(promessa) {
    setErro(''); setOcupado(true)
    const { error } = await promessa
    setOcupado(false)
    if (error) { setErro(traduzirErro(error)); return false }
    await recarregar()
    return true
  }

  const alternarPresenca = () => rodar(confirmei
    ? supabase.from('attendance').delete().eq('meeting_id', id).eq('user_id', usuario.id)
    : supabase.from('attendance').insert({ meeting_id: id, user_id: usuario.id }))

  async function adicionarConvidado(e) {
    e.preventDefault()
    if (convidado.nome.trim().length < 2) return setErro('Digite o nome do convidado.')
    const ok = await rodar(supabase.from('guests').insert({
      meeting_id: id, nome: convidado.nome.trim(), nivel: convidado.nivel, criado_por: usuario.id,
    }))
    if (ok) setConvidado({ nome: '', nivel: convidado.nivel })
  }

  function cancelarEncontro() {
    if (!window.confirm('Cancelar este encontro?')) return
    rodar(supabase.from('meetings').update({ situacao: 'cancelado' }).eq('id', id))
  }

  if (carregando) return <Carregando />
  if (!encontro) {
    return (
      <main className="tela">
        <BarraTitulo grande as="h1">Encontro</BarraTitulo>
        <Aviso>{erro}</Aviso>
        <CaixaAzul><p>Encontro não encontrado (ou você não participa do grupo).</p></CaixaAzul>
        <div className="centro"><Link to="/grupos" className="link-escuro">Voltar</Link></div>
      </main>
    )
  }

  const marcado = encontro.situacao === 'marcado'
  const jaComecou = new Date(encontro.data_hora) <= new Date()
  const ultimoSorteio = sorteios.at(-1)
  // Avaliação pós-encontro: para quem jogou, até 3 dias depois
  const joguei = presencas.some((p) => p.user_id === meuId && p.jogou)
  const podeAvaliar = encontro.situacao === 'realizado' && joguei &&
    Date.now() < new Date(encontro.data_hora).getTime() + 3 * 24 * 3600 * 1000

  return (
    <main className="tela">
      <BarraTitulo grande as="h1">{grupo.nome}</BarraTitulo>
      <Aviso>{erro}</Aviso>

      <div className="colunas">
        <div className="coluna">
          <CaixaAzul>
            <div className="cabecalho-sorteio">
              <div><strong>Data</strong>{dataLonga(encontro.data_hora)}</div>
              <div><strong>Horário</strong>{hora(encontro.data_hora)}</div>
              <div><strong>Local</strong>{encontro.local || '—'}</div>
              <div><strong>Modalidade</strong>{nomeModalidade(encontro.modalidade)}</div>
              <div><strong>Situação</strong>{SITUACAO[encontro.situacao]}</div>
            </div>
            {encontro.observacao && <p style={{ fontWeight: 500 }}>{encontro.observacao}</p>}
          </CaixaAzul>

          {marcado && (
            <div className="centro">
              <Botao onClick={alternarPresenca} disabled={ocupado} variante={confirmei ? 'claro' : 'azul'}>
                {confirmei ? '✓ Presença confirmada · desfazer' : 'Confirmar presença'}
              </Botao>
            </div>
          )}

        <div style={{ order: 2 }}>
          {souAdmin && marcado && (
            <form onSubmit={adicionarConvidado}>
              <CaixaAzul titulo="Convidado sem conta">
                <CampoTexto rotulo="Nome" placeholder="Ex.: Primo do Luis" maxLength={40}
                  value={convidado.nome} onChange={(e) => setConvidado({ ...convidado, nome: e.target.value })} />
                <CampoTexto rotulo="Nível" elemento="select" value={convidado.nivel}
                  onChange={(e) => setConvidado({ ...convidado, nivel: e.target.value })}>
                  {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.rotulo}</option>)}
                </CampoTexto>
                <div className="centro"><button type="submit" className="botao botao--claro" disabled={ocupado}>Adicionar convidado</button></div>
              </CaixaAzul>
            </form>
          )}
        </div>
        <div style={{ order: 3 }}>
          <div className="acoes-grupo">
            {encontro.situacao !== 'cancelado' && <Botao onClick={() => navegar(`/encontros/${id}/sorteio`)}>Montar sorteio</Botao>}
            {ultimoSorteio && <Botao onClick={() => navegar(`/sorteio/${ultimoSorteio.id}`)}>Ver sorteio salvo</Botao>}
            {podeAvaliar && <Botao onClick={() => navegar(`/encontros/${id}/avaliar`)}>Avaliar quem jogou</Botao>}
            {souAdmin && encontro.situacao !== 'cancelado' && jaComecou && (
              <Botao onClick={() => navegar(`/encontros/${id}/quem-jogou`)}>Quem jogou</Botao>
            )}
          </div>
        </div>
        <div style={{ order: 4 }}>
          {souAdmin && marcado && (
            <div className="centro"><Botao variante="claro" onClick={cancelarEncontro} disabled={ocupado}>Cancelar encontro</Botao></div>
          )}
        </div>
        </div>
        <div className="coluna">
        <div style={{ order: 1 }}>
          <CaixaAzul titulo={`Confirmados (${presencas.length + convidados.length})`}>
            {presencas.length === 0 && convidados.length === 0 && <p>Ninguém confirmou ainda.</p>}
            {presencas.map((p, i) => (
              <div key={p.user_id} className="integrante">
                <div>
                  <div className="integrante__nome">{i + 1}. <Link to={`/perfil/${p.user_id}`} className="link-nome">{p.perfil?.nome}</Link></div>
                  <div className="integrante__detalhe">
                    {nomeNivel(p.perfil?.nivel)}{p.perfil?.posicao_principal && ` · ${POSICOES[p.perfil.posicao_principal]}`}
                    {p.jogou === true && ' · jogou ✓'}{p.jogou === false && ' · faltou'}
                  </div>
                </div>
              </div>
            ))}
            {convidados.map((c) => (
              <div key={c.id} className="integrante">
                <div>
                  <div className="integrante__nome">{c.nome} <span className="integrante__detalhe">(convidado)</span></div>
                  <div className="integrante__detalhe">{nomeNivel(c.nivel)}</div>
                </div>
                {souAdmin && marcado && (
                  <button className="botao botao--mini botao--perigo" disabled={ocupado}
                    onClick={() => rodar(supabase.from('guests').delete().eq('id', c.id))}>Remover</button>
                )}
              </div>
            ))}
            <p style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>A ordem de confirmação define quem joga primeiro se sobrar gente.</p>
          </CaixaAzul>
        </div>
        </div>
      </div>

      <div className="centro"><Link to={`/grupos/${grupo.id}`} className="link-escuro">Voltar para o grupo</Link></div>
    </main>
  )
}
