import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDispensers() {
    console.log('=== Debug Dispensers ===\n');

    // Obtener todos los dispensers con su cliente
    const { data: dispensers } = await supabase
        .from('dispensers')
        .select('id, cliente_id, estado, clientes(nombre)');

    console.log(`Total dispensers: ${dispensers?.length || 0}`);
    
    dispensers?.forEach(d => {
        console.log(`ID: ${d.id}`);
        console.log(`Estado: "${d.estado}"`);
        console.log(`Cliente: ${d.clientes?.nombre || 'N/A'}`);
        console.log('---');
    });

    // Ahora filtrar en memoria
    const instalados = (dispensers || []).filter(d => 
        d.estado && d.estado.toLowerCase().includes('instalado')
    );
    
    console.log(`\nFiltrados (instalados): ${instalados.length}`);
    instalados.forEach(d => {
        console.log(`  - ${d.clientes?.nombre || d.cliente_id}`);
    });
}

debugDispensers().catch(console.error);
