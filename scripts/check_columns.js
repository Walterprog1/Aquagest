import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
    console.log("--- Verificando columnas de la tabla 'clientes' ---")
    
    // Consultamos una fila para ver qué columnas devuelve
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .limit(1)
    
    if (error) {
        console.error("Error al consultar la tabla:", error.message)
        if (error.message.includes("alias_transferencia")) {
            console.log("CONFIRMADO: La API NO ve la columna 'alias_transferencia'.")
        }
        return
    }

    if (data && data.length > 0) {
        console.log("Columnas detectadas en la primera fila:")
        console.log(Object.keys(data[0]))
        if (Object.keys(data[0]).includes('alias_transferencia')) {
            console.log("✅ La columna EXISTE y es visible para la API.")
        } else {
            console.log("❌ La columna NO existe en la respuesta de la API.")
        }
    } else {
        console.log("La tabla está vacía, no se pueden verificar columnas por este método.")
    }
}

checkColumns()
