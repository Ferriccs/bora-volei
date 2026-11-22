// Guarda o código de um convite enquanto a pessoa faz login / cria conta,
// para voltar para ele depois. Fica só neste aparelho (localStorage).
const CHAVE = 'boravolei:convitePendente'

export function guardarConvite(codigo) {
  try { localStorage.setItem(CHAVE, codigo) } catch { /* modo anônimo sem armazenamento: tudo bem */ }
}
export function pegarConvite() {
  try { return localStorage.getItem(CHAVE) } catch { return null }
}
export function esquecerConvite() {
  try { localStorage.removeItem(CHAVE) } catch { /* nada */ }
}
