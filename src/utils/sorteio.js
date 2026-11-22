// =============================================================
// Sorteio balanceado do Bora Vôlei
// Mistura sorte com equilíbrio: os times mudam a cada sorteio,
// mas as médias ficam parecidas.
//
// Cada jogador é um objeto assim:
//   { chave: 'u:123' ou 'g:456', nome, nota (0 a 10), posicao, secundarias: [], prioridade (0 = confirmou primeiro) }
// =============================================================

const LETRAS = 'ABCDEFGHIJ'
// Ordem em que as posições são espalhadas quando "posição influencia"
const ORDEM_POSICOES = ['volei_levantador', 'volei_central', 'volei_ponteiro', 'volei_oposto', 'volei_libero', 'sem']

const media = (lista) => (lista.length ? lista.reduce((s, j) => s + j.nota, 0) / lista.length : 0)
const embaralhar = (lista) => {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[k]] = [copia[k], copia[i]]
  }
  return copia
}
// Nota com um "tempero" de sorte (±0,5) para quem tem nota parecida trocar de lugar entre sorteios
const notaComSorte = (j) => j.nota + (Math.random() - 0.5)

// Diferença entre a maior e a menor média dos times (quanto menor, mais equilibrado)
export function diferencaDeMedias(times) {
  const medias = times.map((t) => media(t.jogadores))
  return Math.max(...medias) - Math.min(...medias)
}

function montarResultado(listas, reservas) {
  return {
    times: listas.map((jogadores, i) => ({ letra: LETRAS[i], jogadores, media: media(jogadores) })),
    reservas,
  }
}

// Passo 1: quem joga e quem fica na Barreira
//  - quem estava na Barreira na rodada anterior entra obrigatoriamente
//  - depois, quem jogou menos rodadas
//  - empate: quem confirmou presença primeiro
function escolherQuemJoga(jogadores, vagas, rodadasJogadas = {}, obrigatorios = new Set()) {
  const ordenados = [...jogadores].sort((a, b) =>
    (obrigatorios.has(b.chave) - obrigatorios.has(a.chave)) ||
    ((rodadasJogadas[a.chave] || 0) - (rodadasJogadas[b.chave] || 0)) ||
    (a.prioridade - b.prioridade))
  const jogam = ordenados.slice(0, vagas)
  const reservas = ordenados.slice(vagas).sort((a, b) => a.prioridade - b.prioridade)
  return { jogam, reservas }
}

// Passo 2 (sem posição): "zigue-zague" A, B, B, A, A, B...
function distribuirZigueZague(jogam, nTimes) {
  const times = Array.from({ length: nTimes }, () => [])
  const ordenados = [...jogam].sort((a, b) => notaComSorte(b) - notaComSorte(a))
  ordenados.forEach((j, i) => {
    const volta = Math.floor(i / nTimes)
    const pos = i % nTimes
    times[volta % 2 === 0 ? pos : nTimes - 1 - pos].push(j)
  })
  return times
}

// Passo 2 (com posição): primeiro um levantador por time, depois centrais, ponteiros...
// Cada jogador vai para o time que tem menos gente daquela posição (empate: menor soma de notas).
function distribuirPorPosicao(jogam, nTimes, porTime) {
  const papel = new Map(jogam.map((j) => [j.chave, j.posicao || 'sem']))

  // Se faltar levantador, quem tem "levantador" como posição secundária assume
  const levantadores = jogam.filter((j) => papel.get(j.chave) === 'volei_levantador').length
  if (levantadores < nTimes) {
    const candidatos = jogam
      .filter((j) => papel.get(j.chave) !== 'volei_levantador' && (j.secundarias || []).includes('volei_levantador'))
      .sort((a, b) => b.nota - a.nota)
      .slice(0, nTimes - levantadores)
    candidatos.forEach((j) => papel.set(j.chave, 'volei_levantador'))
  }

  const times = Array.from({ length: nTimes }, () => [])
  const soma = (t) => t.reduce((s, j) => s + j.nota, 0)
  for (const pos of ORDEM_POSICOES) {
    const grupo = jogam
      .filter((j) => (ORDEM_POSICOES.includes(papel.get(j.chave)) ? papel.get(j.chave) : 'sem') === pos)
      .sort((a, b) => notaComSorte(b) - notaComSorte(a))
    for (const j of grupo) {
      const livres = times.filter((t) => t.length < porTime)
      livres.sort((a, b) =>
        (a.filter((x) => papel.get(x.chave) === pos).length - b.filter((x) => papel.get(x.chave) === pos).length) ||
        (soma(a) - soma(b)) || (a.length - b.length))
      livres[0].push(j)
    }
  }
  return { times, papel }
}

// Passo 3: ajuste fino. Testa trocar duas pessoas de times diferentes e mantém a troca
// se as médias ficarem mais próximas. Com posição, só troca gente da mesma posição.
function ajusteFino(times, papel) {
  const resultado = times.map((t) => [...t])
  const diferenca = () => {
    const medias = resultado.map(media)
    return Math.max(...medias) - Math.min(...medias)
  }
  for (let passada = 0; passada < 60; passada++) {
    let melhorou = false
    const atual = diferenca()
    const pares = []
    for (let a = 0; a < resultado.length; a++)
      for (let b = a + 1; b < resultado.length; b++)
        for (let i = 0; i < resultado[a].length; i++)
          for (let k = 0; k < resultado[b].length; k++) pares.push([a, b, i, k])
    for (const [a, b, i, k] of embaralhar(pares)) {
      const x = resultado[a][i], y = resultado[b][k]
      if (papel && papel.get(x.chave) !== papel.get(y.chave)) continue
      resultado[a][i] = y; resultado[b][k] = x
      if (diferenca() < atual - 0.001) { melhorou = true; break }
      resultado[a][i] = x; resultado[b][k] = y   // desfaz
    }
    if (!melhorou) break
  }
  return resultado
}

/**
 * Faz um sorteio.
 * @param jogadores      lista de jogadores (ver formato no topo)
 * @param porTime        jogadores por time (ex.: 6)
 * @param usaPosicao     true = espalha as posições entre os times
 * @param rodadasJogadas { chave: quantas rodadas já jogou } (para a "Próxima rodada")
 * @param obrigatorios   Set de chaves que estavam na Barreira e precisam jogar agora
 */
export function sortear({ jogadores, porTime, usaPosicao = false, rodadasJogadas = {}, obrigatorios = new Set() }) {
  const nTimes = Math.floor(jogadores.length / porTime)
  if (nTimes < 2) {
    throw new Error(`Com ${jogadores.length} jogadores e ${porTime} por time não dá para formar 2 times completos.`)
  }
  const { jogam, reservas } = escolherQuemJoga(jogadores, nTimes * porTime, rodadasJogadas, obrigatorios)

  let listas, papel = null
  if (usaPosicao) ({ times: listas, papel } = distribuirPorPosicao(jogam, nTimes, porTime))
  else listas = distribuirZigueZague(jogam, nTimes)

  return montarResultado(ajusteFino(listas, papel), reservas)
}

/**
 * Modo "quem perde sai": o time que perdeu vai para a Barreira e os reservas entram.
 * Os outros times continuam iguais. Se não houver reservas suficientes,
 * completa com quem perdeu (quem jogou menos rodadas primeiro).
 */
export function quemPerdeSai({ resultado, letraPerdedor, porTime, rodadasJogadas = {} }) {
  const perdedor = resultado.times.find((t) => t.letra === letraPerdedor)
  const entram = resultado.reservas.slice(0, porTime)
  const sobramReservas = resultado.reservas.slice(porTime)
  const perdedoresOrdenados = embaralhar(perdedor.jogadores)
    .sort((a, b) => (rodadasJogadas[a.chave] || 0) - (rodadasJogadas[b.chave] || 0))
  const completam = perdedoresOrdenados.slice(0, porTime - entram.length)
  const saem = perdedoresOrdenados.slice(porTime - entram.length)

  const listas = resultado.times.map((t) => (t.letra === letraPerdedor ? [...entram, ...completam] : t.jogadores))
  const reservas = [...sobramReservas, ...saem]
  return montarResultado(listas, reservas)
}

// Soma +1 rodada para quem jogou neste resultado (para a "Próxima rodada")
export function contarRodada(rodadasJogadas, resultado) {
  const novo = { ...rodadasJogadas }
  resultado.times.forEach((t) => t.jogadores.forEach((j) => { novo[j.chave] = (novo[j.chave] || 0) + 1 }))
  return novo
}
