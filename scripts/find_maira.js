import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findCustomer() {
    console.log("--- Buscando Cliente: Maira Ayelen Bricco ---")
    const { data: clientes, error } = await supabase
        .from('clientes')
        .select('id, nombre, alias_transferencia')
    
    if (error) {
        console.error("Error:", error.message)
        return
    }

    const match = clientes.find(c => {
        const fullText = (c.nombre + " " + (c.alias_transferencia || "")).toLowerCase()
        return fullText.includes("maira") || fullText.includes("bricco")
    })

    if (match) {
        console.log("Cliente encontrado:")
        console.log(`- Nombre: ${match.nombre}`)
        console.log(`- Alias: ${match.alias_transferencia}`)
    } else {
        console.log("No se encontró ningún cliente que coincida con 'Maira' o 'Bricco'.")
    }
}

findCustomer()
