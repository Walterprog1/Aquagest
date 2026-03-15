import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Exportar una bandera para saber si la configuración está completa
export const isConfigValid = supabaseUrl.length > 0 && supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 0

if (!isConfigValid) {
  console.warn("⚠️ Advertencia: Configuración de Supabase incompleta o inválida.")
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-missing-url.supabase.co', 
  supabaseAnonKey || 'placeholder-missing-key'
)
