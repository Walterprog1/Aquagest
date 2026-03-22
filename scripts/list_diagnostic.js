import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listAll() {
    console.log("--- Listado de Clientes ---")
    const { data: clients } = await supabase.from('clientes').select('nombre, alias_transferencia')
    clients.forEach(c => console.log(`- ${c.nombre} (Alias: ${c.alias_transferencia})`))

    console.log("\n--- Pedidos Pendientes ---")
    const { data: orders } = await supabase.from('pedidos').select('total, pago_estado, cliente_id')
        .eq('pago_estado', 'pendiente')
    
    for (const o of orders) {
        const { data: c } = await supabase.from('clientes').select('nombre').eq('id', o.cliente_id).single()
        console.log(`- Pedido de $${o.total} para ${c.nombre}`)
    }
}

listAll()
