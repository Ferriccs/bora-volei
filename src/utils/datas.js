// Funções pequenas para mostrar datas em português

// "ter, 24/11 · 19h30"
export function dataHoraCurta(iso) {
  const d = new Date(iso)
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const h = d.getHours(), m = d.getMinutes()
  return `${semana}, ${dia} · ${h}h${m ? String(m).padStart(2, '0') : ''}`
}

// "terça-feira, 24 de novembro"
export function dataLonga(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// "19h30"
export function hora(iso) {
  const d = new Date(iso)
  return `${d.getHours()}h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}`
}

// "2026-11-24" de hoje (para o valor inicial do campo de data)
export function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
