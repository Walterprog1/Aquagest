import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('=== Buscando pedidos de Montenegro Karina y Muñoz Franco ===\n');
    
    const { data: clientes, error: errorClientes } = await supabase
        .from('clientes')
        .select('id, nombre')
        .ilike('nombre', '%Montenegro%');

    const { data: clientes2, error: errorClientes2 } = await supabase
        .from('clientes')
        .select('id, nombre')
        .ilike('nombre', '%Muñoz%');

    const allClientes = [...(clientes || []), ...(clientes2 || [])];
    console.log('Clientes encontrados:', allClientes);
    
    if (allClientes.length === 0) {
        console.log('\nNo se encontraron los clientes');
        return;
    }
    
    const clienteIds = allClientes.map(c => c.id);
    
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('cliente_id', clienteIds)
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('\n=== PEDIDOS ===');
    for (const pedido of pedidos || []) {
        const cliente = allClientes.find(c => c.id === pedido.cliente_id);
        console.log(`\nPedido ID: ${pedido.id}`);
        console.log(`  Cliente: ${cliente?.nombre || 'N/A'}`);
        console.log(`  Estado: ${pedido.estado}`);
        console.log(`  Total: ${pedido.total}`);
        console.log(`  Envases recibidos: ${pedido.envases_recibidos}`);
        console.log(`  Reparto ID: ${pedido.reparto_id}`);
        
        const { data: detalles } = await supabase
            .from('detalles_pedido')
            .select('*')
            .eq('pedido_id', pedido.id);
        
        console.log(`  Detalles (${detalles?.length || 0}):`, detalles);
    }
    
    // También buscar el último reparto con pedidos de estos clientes
    if (pedidos && pedidos.length > 0 && pedidos[0].reparto_id) {
        const ultimoRepartoId = pedidos[0].reparto_id;
        console.log('\n\n=== PEDIDOS DEL ÚLTIMO REPARTO ===');
        const { data: pedidosReparto } = await supabase
            .from('pedidos')
            .select('*')
            .eq('reparto_id', ultimoRepartoId);
        
        console.log(`Total pedidos en reparto: ${pedidosReparto?.length || 0}`);
        
        for (const pedido of pedidosReparto || []) {
            const cliente = allClientes.find(c => c.id === pedido.cliente_id);
            if (!cliente) continue;
            
            console.log(`\n- Cliente: ${cliente.nombre}`);
            console.log(`  Estado: ${pedido.estado}`);
            console.log(`  Total: ${pedido.total}`);
            console.log(`  Envases recibidos: ${pedido.envases_recibidos}`);
            
            const { data: detalles } = await supabase
                .from('detalles_pedido')
                .select('*')
                .eq('pedido_id', pedido.id);
            
            console.log(`  Detalles:`, detalles);
        }
    }
}

main().catch(console.error);
