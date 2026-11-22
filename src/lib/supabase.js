import { createClient } from '@supabase/supabase-js'

// Conexão com o Supabase. As chaves ficam no arquivo .env.local (nunca vai para o GitHub).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enquanto as chaves não forem preenchidas, "supabase" fica null e o app mostra um aviso.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const supabaseConfigurado = Boolean(supabase)
