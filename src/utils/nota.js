import { supabase } from '../lib/supabase.js'

// Nota de 0 a 10 de cada jogador.
// A nota de verdade é calculada no banco (função nota_jogadores), juntando:
// a nota inicial do nível (vale 5 votos), um voto por encontro (os recentes pesam mais)
// e a avaliação geral do grupo (vale como um encontro).
export const NOTA_POR_NIVEL = { basico: 4, intermediario: 6, avancado: 8 }

// Usada para convidados sem conta (eles não recebem avaliações)
export function notaPorNivel(nivel) {
  return NOTA_POR_NIVEL[nivel] ?? 5
}

// Busca a nota de vários jogadores de uma vez. Devolve um Map: id -> { nota, votos, encontros }
export async function buscarNotas(ids) {
  const mapa = new Map()
  if (!ids.length) return mapa
  const { data, error } = await supabase.rpc('nota_jogadores', { p_ids: ids })
  if (error) throw error
  data.forEach((n) => mapa.set(n.user_id, { nota: Number(n.nota), votos: n.votos, encontros: n.encontros }))
  return mapa
}

// 6 → "6,0"
export function formatarNota(nota) {
  return Number(nota).toFixed(1).replace('.', ',')
}
