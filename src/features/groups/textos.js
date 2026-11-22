// Nomes bonitos para mostrar na tela (o banco guarda a versão sem acento)
export const NIVEIS = [
  { valor: 'basico', rotulo: 'Básico' },
  { valor: 'intermediario', rotulo: 'Intermediário' },
  { valor: 'avancado', rotulo: 'Avançado' },
]
export const MODALIDADES = [
  { valor: 'quadra', rotulo: 'Quadra' },
  { valor: 'areia', rotulo: 'Areia' },
  { valor: 'ambos', rotulo: 'Os dois' },
]
export const DIAS = [
  { valor: 'seg', rotulo: 'Seg' }, { valor: 'ter', rotulo: 'Ter' }, { valor: 'qua', rotulo: 'Qua' },
  { valor: 'qui', rotulo: 'Qui' }, { valor: 'sex', rotulo: 'Sex' }, { valor: 'sab', rotulo: 'Sáb' },
  { valor: 'dom', rotulo: 'Dom' },
]
export const POSICOES = {
  volei_levantador: 'Levantador', volei_ponteiro: 'Ponteiro', volei_central: 'Central',
  volei_oposto: 'Oposto', volei_libero: 'Líbero',
}
export const CARGOS = { dono: 'Dono', admin: 'Admin', membro: 'Membro' }

const mapa = (lista) => Object.fromEntries(lista.map((i) => [i.valor, i.rotulo]))
export const nomeNivel = (v) => mapa(NIVEIS)[v] || ''
export const nomeModalidade = (v) => mapa(MODALIDADES)[v] || ''
// ['ter','qui'] → "Ter e Qui"
export function nomeDias(dias = []) {
  const nomes = DIAS.filter((d) => dias.includes(d.valor)).map((d) => d.rotulo)
  if (nomes.length <= 1) return nomes[0] || ''
  return nomes.slice(0, -1).join(', ') + ' e ' + nomes.at(-1)
}
