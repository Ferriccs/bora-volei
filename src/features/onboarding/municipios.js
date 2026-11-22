// Estados do Brasil e busca de municípios na API pública do IBGE (gratuita, sem chave).
export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const cache = {}

// Devolve a lista de nomes de municípios de um estado (ex.: "MA" → ["Açailândia", ..., "Imperatriz", ...])
export async function buscarMunicipios(uf) {
  if (cache[uf]) return cache[uf]
  const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
  if (!resp.ok) throw new Error('IBGE fora do ar')
  const lista = (await resp.json()).map((m) => m.nome)
  cache[uf] = lista
  return lista
}
