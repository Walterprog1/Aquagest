import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkOrders() {
    console.log("--- Verificando Pedidos ---")
    const { data, error } = await supabase.from('pedidos').select('id, estado, pago_estado, medio_pago')
    if (error) {
        console.error("Error:", error)
        return
    }
    console.log(`Total pedidos: ${data.length}`)
    data.forEach(o => {
        console.log(`ID: ${o.id.split('-')[0]}, Estado: ${o.estado}, Pago: ${o.pago_estado}, Medio: ${o.medio_pago}`)
    })
}

checkOrders()
