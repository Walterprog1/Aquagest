import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkLogs() {
    console.log("--- Últimos 5 registros del Webhook ---")
    
    const { data, error } = await supabase
        .from('logs_webhook')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
    
    if (error) {
        console.error("Error al leer logs:", error.message)
        return
    }

    if (data.length === 0) {
        console.log("No hay logs registrados todavía.")
        return
    }

    data.forEach(log => {
        const fecha = new Date(log.created_at).toLocaleString()
        console.log(`[${fecha}] Éxito: ${log.exito ? '✅' : '❌'}`)
        console.log(`Resultado: ${log.resultado}`)
        console.log(`Payload: ${JSON.stringify(log.payload)}`)
        console.log("--------------------------------")
    })
}

checkLogs()
