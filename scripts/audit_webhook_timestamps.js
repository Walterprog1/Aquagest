import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function auditLogs() {
    console.log("--- Auditoría de Logs (Timestamp Exacto) ---")
    const { data, error } = await supabase
        .from('logs_webhook')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
    
    if (error) {
        console.error("Error:", error.message)
        return
    }

    data.forEach(log => {
        console.log(`ID: ${log.id}`)
        console.log(`Creado (UTC): ${log.created_at}`)
        console.log(`Resultado: ${log.resultado}`)
        console.log(`Payload: ${JSON.stringify(log.payload)}`)
        console.log("--------------------------------")
    })
}

auditLogs()
