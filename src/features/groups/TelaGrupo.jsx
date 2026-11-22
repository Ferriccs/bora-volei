import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Botao from '../../components/Botao.jsx'
import Pilula from '../../components/Pilula.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useGrupo } from './useGrupo.js'
import ProximoEncontro from '../meetings/ProximoEncontro.jsx'
import AvaliacaoGrupo from '../ratings/AvaliacaoGrupo.jsx'
import AvisoAvaliar from '../ratings/AvisoAvaliar.jsx'
import { CARGOS, POSICOES, nomeDias, nomeModalidade, nomeNivel } from './textos.js'
import './grupos.css'

// Tela 09 do Figma: tela do grupo (informações, integrantes, próximo encontro, chat e avaliação).
export default function TelaGrupo() {
  const { id } = useParams()
  const navegar = useNavigate()
  const avisoRecebido = useLocation().state?.aviso
  const { grupo, ativos, pendentes, erro, setErro, carregando, recarregar, minhaSituacao, souDono, souAdmin, meuId } = useGrupo(id)
  const [ocupado, setOcupado] = useState(null)

  // Chama uma função do banco e recarrega a tela
  async function executar(funcao, parametros, chave) {
    setErro(''); setOcupado(chave)
    const { error } = await supabase.rpc(funcao, parametros)
    setOcupado(null)
    if (error) return setErro(traduzirErro(error))
    await recarregar()
  }

  async function sair() {
    if (!window.confirm(`Sair do grupo "${grupo.nome}"?`)) return
    const { error } = await supabase.rpc('sair_do_grupo', { p_grupo: id })
    if (error) return setErro(traduzirErro(error))
    navegar('/grupos', { replace: true })
  }

  async function apagar() {
    if (!window.confirm(`Apagar o grupo "${grupo.nome}" para sempre? Isso não pode ser desfeito.`)) return
    const { error } = await supabase.from('groups').delete().eq('id', id)
    if (error) return setErro(traduzirErro(error))
    navegar('/grupos', { replace: true })
  }

  async function remover(i) {
    if (!window.confirm(`Remover ${i.perfil?.nome} do grupo?`)) return
    executar('remover_membro', { p_grupo: id, p_usuario: i.user_id }, i.user_id)
  }

  if (carregando) return <Carregando />
  if (!grupo) {
    return (
      <main className="tela">
        <BarraTitulo grande as="h1">Grupo</BarraTitulo>
        <CaixaAzul><p>Grupo não encontrado.</p><Link to="/grupos" className="link-claro">Voltar</Link></CaixaAzul>
      </main>
    )
  }

  // Quem não é integrante ativo vê só o resumo público
  const integrante = minhaSituacao === 'ativo'

  return (
    <main className="tela">
      <BarraTitulo grande as="h1">{grupo.nome}</BarraTitulo>
      <Aviso>{erro}</Aviso>
      <Aviso tipo="sucesso">{avisoRecebido}</Aviso>

      <CaixaAzul>
        <div className="info-grupo">
          <p><strong>{nomeModalidade(grupo.modalidade)}</strong> · {grupo.municipio} - {grupo.uf}</p>
          {grupo.local && <p>Local: {grupo.local}</p>}
          {grupo.dias?.length > 0 && <p>Dias: {nomeDias(grupo.dias)}</p>}
          <p>Nível mínimo: {nomeNivel(grupo.nivel_minimo)}{grupo.aceita_novatos ? ' (aceita novatos)' : ''}</p>
          {grupo.descricao && <p style={{ fontWeight: 500, marginTop: 4 }}>{grupo.descricao}</p>}
        </div>
      </CaixaAzul>

      {!integrante && (
        <CaixaAzul>
          <p>{minhaSituacao === 'pendente'
            ? 'Seu pedido foi enviado. Assim que o dono ou um admin aceitar, você vê tudo do grupo aqui.'
            : 'Você ainda não participa deste grupo.'}</p>
          <Link to="/grupos/buscar" className="link-claro">Ir para a busca de grupos</Link>
        </CaixaAzul>
      )}

      {integrante && (
        <>
          {/* No celular: avisos, próximo encontro, integrantes e avaliação, um embaixo do outro.
              No PC: duas colunas, com os integrantes à direita. */}
          <div className="colunas">
            <div className="coluna">
              <AvisoAvaliar grupoId={id} />

              <div className="centro"><Botao onClick={() => navegar(`/grupos/${id}/chat`)}>💬 Chat do grupo</Botao></div>

              {souAdmin && (
                <div className="acoes-grupo">
                  <Botao onClick={() => navegar(`/grupos/${id}/pedidos`)}>Pedidos ({pendentes.length})</Botao>
                  <Botao onClick={() => navegar(`/grupos/${id}/convite`)}>Convidar amigos</Botao>
                  <Botao onClick={() => navegar(`/grupos/${id}/editar`)}>Editar grupo</Botao>
                </div>
              )}


              <div style={{ order: 2 }}><ProximoEncontro grupoId={id} souAdmin={souAdmin} /></div>

              <div style={{ order: 4 }}><AvaliacaoGrupo grupoId={id} integrantes={ativos} meuId={meuId} /></div>
            </div>
            <div className="coluna">
              <div style={{ order: 3 }}>
                  <CaixaAzul titulo={`Integrantes (${ativos.length})`}>
                    {ativos.map((i) => {
                      const ehEu = i.user_id === meuId
                      const podeRemover = !ehEu && i.cargo !== 'dono' && (souDono || (souAdmin && i.cargo === 'membro'))
                      return (
                        <div key={i.user_id} className="integrante">
                          <div>
                            <div className="integrante__nome"><Link to={`/perfil/${i.user_id}`} className="link-nome">{i.perfil?.nome}</Link>{ehEu && ' (você)'}</div>
                            <div className="integrante__detalhe">
                              {nomeNivel(i.perfil?.nivel)}{i.perfil?.posicao_principal && ` · ${POSICOES[i.perfil.posicao_principal]}`}
                            </div>
                          </div>
                          <div className="integrante__direita">
                            {i.cargo !== 'membro' && <Pilula destaque={i.cargo === 'dono'}>{CARGOS[i.cargo]}</Pilula>}
                            {souDono && !ehEu && i.cargo === 'membro' && (
                              <button className="botao botao--mini" disabled={ocupado === i.user_id}
                                onClick={() => executar('mudar_cargo', { p_grupo: id, p_usuario: i.user_id, p_cargo: 'admin' }, i.user_id)}>
                                Tornar admin
                              </button>
                            )}
                            {souDono && !ehEu && i.cargo === 'admin' && (
                              <button className="botao botao--mini" disabled={ocupado === i.user_id}
                                onClick={() => executar('mudar_cargo', { p_grupo: id, p_usuario: i.user_id, p_cargo: 'membro' }, i.user_id)}>
                                Tirar admin
                              </button>
                            )}
                            {podeRemover && (
                              <button className="botao botao--mini botao--perigo" disabled={ocupado === i.user_id} onClick={() => remover(i)}>
                                Remover
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </CaixaAzul>
              </div>
            </div>
          </div>

          <div className="centro">
            {souDono
              ? <Botao variante="claro" onClick={apagar}>Apagar grupo</Botao>
              : <Botao variante="claro" onClick={sair}>Sair do grupo</Botao>}
          </div>
        </>
      )}

      <div className="centro"><Link to="/grupos" className="link-escuro">Voltar para seus grupos</Link></div>
    </main>
  )
}
