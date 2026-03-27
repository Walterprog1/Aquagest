import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    // Intentar leer un registro para ver qué columnas vienen
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columnas en la tabla 'pedidos':");
        console.log(Object.keys(data[0]));
    } else {
        console.log("No hay datos en la tabla 'pedidos'.");
    }
}

checkColumns();
