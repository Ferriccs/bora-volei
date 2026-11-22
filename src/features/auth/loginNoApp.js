import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from '../../lib/supabase.js'
import { ehApp } from '../../lib/site.js'

// Login com Google dentro do APK.
// O Google não deixa fazer login dentro do app, então abrimos o navegador do celular.
// Depois do login, o Supabase manda o navegador para "br.com.boravolei.app://login?code=...",
// o Android reabre o app com esse endereço, e o app troca o código pela sessão.
export const ENDERECO_VOLTA = 'br.com.boravolei.app://login'

export async function entrarComGoogleNoApp() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: ENDERECO_VOLTA, skipBrowserRedirect: true },
  })
  if (error) throw error
  await Browser.open({ url: data.url })
}

// Fica esperando o Android reabrir o app pelo endereço de volta (chamado uma vez, no main.jsx)
export function ouvirVoltaDoLogin() {
  if (!ehApp || !supabase) return
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(ENDERECO_VOLTA)) return
    const codigo = new URL(url).searchParams.get('code')
    try { await Browser.close() } catch { /* o navegador já fechou */ }
    if (!codigo) return
    const { error } = await supabase.auth.exchangeCodeForSession(codigo)
    if (error) console.error('Erro no login com Google:', error.message)
  })
}
