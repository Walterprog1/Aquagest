import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPedidos() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('id, fecha, total, reparto_id')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.log("Recent Pedidos:");
    data.forEach(p => {
        console.log(`ID: ${p.id}, Fecha: ${p.fecha}, Total: ${p.total}, RepartoID: ${p.reparto_id}`);
    });
}

checkPedidos();
