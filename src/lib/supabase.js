import { createClient } from '@supabase/supabase-js'
import { ehApp } from './site.js'

// Conexão com o Supabase. As chaves ficam no arquivo .env.local (nunca vai para o GitHub).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enquanto as chaves não forem preenchidas, "supabase" fica null e o app mostra um aviso.
// No APK usamos o fluxo "pkce": o login com Google volta para o app com um código,
// que o app troca pela sessão (veja features/auth/loginNoApp.js).
export const supabase = url && anonKey
  ? createClient(url, anonKey, ehApp ? { auth: { flowType: 'pkce', detectSessionInUrl: false } } : undefined)
  : null
export const supabaseConfigurado = Boolean(supabase)
