import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
    console.log("--- Verificando Columnas de Pedidos ---")
    // Truco para ver columnas: seleccionar una fila y ver las llaves del objeto
    const { data, error } = await supabase.from('pedidos').select('*').limit(1)
    if (error) {
        console.error("Error al acceder a pedidos:", error.message)
        return
    }
    if (data.length > 0) {
        console.log("Columnas actuales:", Object.keys(data[0]))
    } else {
        console.log("No hay datos para inferir columnas, intentando consulta directa...")
        // Probamos si falla al pedir pago_estado
        const { error: errorCol } = await supabase.from('pedidos').select('pago_estado').limit(1)
        if (errorCol) {
            console.error("¡Columna pago_estado NOT FOUND!", errorCol.message)
        } else {
            console.log("Columna pago_estado existe.")
        }
    }
}

checkSchema()
