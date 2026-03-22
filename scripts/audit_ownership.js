import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function auditOrders() {
    console.log("--- Auditoría de Pedidos Pendientes ---")
    
    // Obtenemos los pedidos pendientes y sus IDs de usuario
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, user_id, pago_estado, estado, total')
        .eq('pago_estado', 'pendiente')
        .limit(5)
    
    if (error) {
        console.error("Error al consultar pedidos:", error.message)
        return
    }

    if (pedidos.length === 0) {
        console.log("No se encontraron pedidos pendientes para auditar.")
        return
    }

    console.log(`Encontrados ${pedidos.length} pedidos pendientes:`)
    pedidos.forEach(p => {
        console.log(`- ID: ${p.id} | Dueño: ${p.user_id} | Total: ${p.total}`)
    })

    console.log("\n--- Verificando Sesión Actual ---")
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
        console.log("No hay sesión activa de usuario.")
    } else {
        console.log(`Usuario en sesión: ${user.id}`)
    }
}

auditOrders()
