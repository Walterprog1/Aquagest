import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugOwnership() {
    console.log("--- Verificando Propiedad de Pedidos (Contexto Anónimo/RLS) ---")
    
    const { data: { session } } = await supabase.auth.getSession()
    console.log("Sesión actual:", session ? "Activa" : "No detectada")
    
    const { data, error } = await supabase
        .from('pedidos')
        .select('id, user_id, total, estado')
    
    if (error) {
        console.error("Error al leer pedidos:", error)
        return
    }

    console.log(`Pedidos visibles para este cliente: ${data.length}`)
    data.forEach(p => {
        console.log(`- Pedido: ${p.id}, Dueño (user_id): ${p.user_id}, Total: ${p.total}`)
    })
}

debugOwnership()
