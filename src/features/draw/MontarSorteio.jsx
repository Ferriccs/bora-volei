import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import BarraTitulo from '../../components/BarraTitulo.jsx'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Opcoes from '../../components/Opcoes.jsx'
import Botao from '../../components/Botao.jsx'
import Aviso from '../../components/Aviso.jsx'
import Carregando from '../../components/Carregando.jsx'
import { useEncontro } from '../meetings/useEncontro.js'
import { sortear, quemPerdeSai, contarRodada } from '../../utils/sorteio.js'
import { notaPorNivel, formatarNota, buscarNotas } from '../../utils/nota.js'
import { POSICOES, nomeNivel } from '../groups/textos.js'
import ResultadoSorteio from './ResultadoSorteio.jsx'
import '../groups/grupos.css'

const SIM_NAO = [{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }]
const MODOS = [{ valor: 'rodizio', rotulo: 'Rodízio justo' }, { valor: 'perdedor_sai', rotulo: 'Quem perde sai' }]

// Tela 15 do Figma: escolher quem joga, quantos por time e se a posição influencia. Depois, o resultado.
export default function MontarSorteio() {
  const { id } = useParams()
  const enc = useEncontro(id)
  const { encontro, membros, presencas, convidados, sorteios, carregando, erro, setErro, souAdmin } = enc

  const [marcados, setMarcados] = useState(null)
  const [porTime, setPorTime] = useState(null)
  const [usaPosicao, setUsaPosicao] = useState(null)
  const [modo, setModo] = useState('rodizio')
  // Cada rodada guarda o resultado e os dados usados para sortear (para "Sortear de novo")
  const [rodadas, setRodadas] = useState([])
  const [salvas, setSalvas] = useState(new Set())
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [notas, setNotas] = useState(null)   // nota real de cada integrante (avaliações + nível)

  useEffect(() => {
    if (!membros) return
    buscarNotas(membros.map((m) => m.user_id))
      .then(setNotas)
      .catch((e) => { setErro(traduzirErro(e)); setNotas(new Map()) })
  }, [membros, setErro])

  // Todos que podem jogar: confirmados (em ordem), convidados, depois os outros integrantes
  const candidatos = useMemo(() => {
    if (!membros || !notas) return []
    const lista = []
    const jaNaLista = new Set()
    const doPerfil = (userId, perfil, extra) => ({
      chave: `u:${userId}`, user_id: userId, nome: perfil?.nome || '?', nota: notas.get(userId)?.nota ?? notaPorNivel(perfil?.nivel),
      nivel: perfil?.nivel, posicao: perfil?.posicao_principal, secundarias: perfil?.posicoes_secundarias || [], ...extra,
    })
    presencas.forEach((p) => { lista.push(doPerfil(p.user_id, p.perfil, { confirmou: true })); jaNaLista.add(p.user_id) })
    convidados.forEach((c) => lista.push({
      chave: `g:${c.id}`, guest_id: c.id, nome: c.nome, nota: notaPorNivel(c.nivel), nivel: c.nivel,
      posicao: null, secundarias: [], convidado: true, confirmou: true,
    }))
    membros.filter((m) => !jaNaLista.has(m.user_id))
      .sort((a, b) => a.perfil.nome.localeCompare(b.perfil.nome))
      .forEach((m) => lista.push(doPerfil(m.user_id, m.perfil, { confirmou: false })))
    return lista.map((j, i) => ({ ...j, prioridade: i }))
  }, [membros, notas, presencas, convidados])

  // Valores iniciais quando os dados chegam
  useEffect(() => {
    if (!encontro || !notas || marcados) return
    setMarcados(new Set(candidatos.filter((c) => c.confirmou).map((c) => c.chave)))
    setPorTime(encontro.modalidade === 'areia' ? 4 : 6)
    setUsaPosicao(encontro.modalidade === 'areia' ? 'nao' : 'sim')
  }, [encontro, notas, candidatos, marcados])

  // Continuação de sorteios já salvos: próxima rodada, quem já jogou e quem ficou na Barreira
  const historicoSalvo = useMemo(() => {
    let rodadasJogadas = {}
    let obrigatorios = new Set()
    ;(sorteios || []).forEach((s) => {
      s.jogadores.forEach((j) => {
        const chave = j.user_id ? `u:${j.user_id}` : `g:${j.guest_id}`
        if (j.time !== 'R') rodadasJogadas[chave] = (rodadasJogadas[chave] || 0) + 1
      })
    })
    const ultimo = sorteios?.at(-1)
    if (ultimo) obrigatorios = new Set(ultimo.jogadores.filter((j) => j.time === 'R').map((j) => (j.user_id ? `u:${j.user_id}` : `g:${j.guest_id}`)))
    return { proxima: (ultimo?.rodada || 0) + 1, rodadasJogadas, obrigatorios }
  }, [sorteios])

  if (carregando || !marcados) return <Carregando />
  if (!encontro) return <main className="tela"><Aviso>Encontro não encontrado.</Aviso></main>

  const jogadores = candidatos.filter((c) => marcados.has(c.chave))
  const nTimes = Math.floor(jogadores.length / porTime)
  const atual = rodadas.at(-1)

  function alternar(chave) {
    const novo = new Set(marcados)
    novo.has(chave) ? novo.delete(chave) : novo.add(chave)
    setMarcados(novo)
  }

  function fazerSorteio(entrada) {
    try {
      const resultado = sortear({ jogadores, porTime, usaPosicao: usaPosicao === 'sim', ...entrada })
      return { resultado, entrada }
    } catch (e) {
      setErro(e.message)
      return null
    }
  }

  function primeiroSorteio() {
    setErro(''); setAviso('')
    const r = fazerSorteio({ rodadasJogadas: historicoSalvo.rodadasJogadas, obrigatorios: historicoSalvo.obrigatorios })
    if (r) setRodadas([{ ...r, numero: historicoSalvo.proxima }])
  }

  function sortearDeNovo() {
    setErro(''); setAviso('')
    const r = fazerSorteio(atual.entrada)
    if (r) setRodadas([...rodadas.slice(0, -1), { ...r, numero: atual.numero }])
  }

  function proximaRodada(letraPerdedor) {
    setErro(''); setAviso('')
    const rodadasJogadas = contarRodada(atual.entrada.rodadasJogadas, atual.resultado)
    if (modo === 'perdedor_sai') {
      const resultado = quemPerdeSai({ resultado: atual.resultado, letraPerdedor, porTime, rodadasJogadas })
      setRodadas([...rodadas, { resultado, entrada: { rodadasJogadas, obrigatorios: new Set() }, numero: atual.numero + 1 }])
    } else {
      const r = fazerSorteio({ rodadasJogadas, obrigatorios: new Set(atual.resultado.reservas.map((j) => j.chave)) })
      if (r) setRodadas([...rodadas, { ...r, numero: atual.numero + 1 }])
    }
  }

  async function salvar() {
    setErro(''); setAviso(''); setOcupado(true)
    const lista = [
      ...atual.resultado.times.flatMap((t) => t.jogadores.map((j) => ({ ...j, time: t.letra }))),
      ...atual.resultado.reservas.map((j) => ({ ...j, time: 'R' })),
    ].map((j) => ({ user_id: j.user_id || null, guest_id: j.guest_id || null, time: j.time, nota: j.nota }))
    const { error } = await supabase.rpc('salvar_sorteio', {
      p_encontro: id, p_rodada: atual.numero, p_por_time: porTime,
      p_usa_posicao: usaPosicao === 'sim', p_modo: modo, p_jogadores: lista,
    })
    setOcupado(false)
    if (error) return setErro(traduzirErro(error))
    setSalvas(new Set([...salvas, atual.numero]))
    setAviso(`Sorteio da ${atual.numero}ª rodada salvo! Todos do grupo já podem ver.`)
  }

  // ---------- Tela do resultado ----------
  if (atual) {
    const salva = salvas.has(atual.numero)
    return (
      <main className="tela">
        <BarraTitulo grande as="h1">Resultado do sorteio</BarraTitulo>
        <Aviso>{erro}</Aviso>
        <ResultadoSorteio encontro={encontro} times={atual.resultado.times} reservas={atual.resultado.reservas} rodada={atual.numero} />
        <Aviso tipo="sucesso">{aviso}</Aviso>

        <div className="acoes-grupo">
          {!salva && <Botao onClick={sortearDeNovo}>Sortear de novo</Botao>}
          {souAdmin && !salva && <Botao onClick={salvar} disabled={ocupado}>{ocupado ? 'Salvando…' : 'Salvar sorteio'}</Botao>}
          {atual.resultado.reservas.length > 0 && modo === 'rodizio' && <Botao onClick={() => proximaRodada()}>Próxima rodada</Botao>}
        </div>

        {atual.resultado.reservas.length > 0 && modo === 'perdedor_sai' && (
          <CaixaAzul titulo="Quem perdeu?">
            <p>O time que perdeu vai para a Barreira e os reservas entram.</p>
            <div className="acoes-grupo">
              {atual.resultado.times.map((t) => (
                <button key={t.letra} className="botao botao--claro" onClick={() => proximaRodada(t.letra)}>Time {t.letra} perdeu</button>
              ))}
            </div>
          </CaixaAzul>
        )}

        {!souAdmin && <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 500 }}>Este é um sorteio de teste. Só o dono ou um admin salva o oficial.</p>}
        <div className="centro">
          <button className="link-escuro" style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            onClick={() => { setRodadas([]); setAviso('') }}>Mudar jogadores ou ajustes</button>
        </div>
        <div className="centro"><Link to={`/encontros/${id}`} className="link-escuro">Voltar para o encontro</Link></div>
      </main>
    )
  }

  // ---------- Tela de montar ----------
  return (
    <main className="tela">
      <BarraTitulo grande as="h1">Montar sorteio</BarraTitulo>
      <Aviso>{erro}</Aviso>

      <div className="colunas colunas--larga-esquerda">
        <div className="coluna">
          <CaixaAzul titulo={`Quem joga (${jogadores.length})`}>
            {candidatos.map((c) => (
              <label key={c.chave} className="marcar">
                <input type="checkbox" checked={marcados.has(c.chave)} onChange={() => alternar(c.chave)} />
                <span className="marcar__nome">
                  {c.nome}
                  <span className="marcar__detalhe">
                    {c.convidado ? 'Convidado · ' : ''}{nomeNivel(c.nivel)} · nota {formatarNota(c.nota)}
                    {c.posicao && ` · ${POSICOES[c.posicao]}`}{!c.confirmou && ' · não confirmou'}
                  </span>
                </span>
              </label>
            ))}
          </CaixaAzul>

        </div>
        <div className="coluna coluna--fixa">
          <section className="secao">
            <BarraTitulo>Jogadores por time</BarraTitulo>
            <div className="numero">
              <button type="button" aria-label="Menos" onClick={() => setPorTime(Math.max(1, porTime - 1))}>−</button>
              <output aria-live="polite">{porTime}</output>
              <button type="button" aria-label="Mais" onClick={() => setPorTime(Math.min(12, porTime + 1))}>+</button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 14 }}>
              {nTimes >= 2
                ? `${nTimes} times de ${porTime}${jogadores.length - nTimes * porTime > 0 ? ` e ${jogadores.length - nTimes * porTime} na Barreira` : ''}`
                : 'Faltam jogadores para 2 times completos.'}
            </p>
          </section>

          <section className="secao">
            <BarraTitulo>A posição influencia?</BarraTitulo>
            <Opcoes nome="posicao" opcoes={SIM_NAO} valor={usaPosicao} onChange={setUsaPosicao} />
          </section>

          <section className="secao">
            <BarraTitulo>Próximas rodadas</BarraTitulo>
            <Opcoes nome="modo" opcoes={MODOS} valor={modo} onChange={setModo} />
            <p style={{ fontSize: 13, fontWeight: 500 }}>
              {modo === 'rodizio'
                ? 'Quem ficou na Barreira entra na próxima, e sai quem jogou mais rodadas.'
                : 'O time que perde vai para a Barreira e os reservas entram.'}
            </p>
          </section>

          {historicoSalvo.proxima > 1 && (
            <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
              Já existem {historicoSalvo.proxima - 1} rodada(s) salva(s). Este será o sorteio da {historicoSalvo.proxima}ª rodada.
            </p>
          )}

          <div className="centro"><Botao onClick={primeiroSorteio} disabled={nTimes < 2}>Sortear times</Botao></div>
        </div>
      </div>

      <div className="centro"><Link to={`/encontros/${id}`} className="link-escuro">Voltar para o encontro</Link></div>
    </main>
  )
}
