import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDispenserPedidos() {
    console.log('=== Corrigiendo Pedidos de Clientes con Dispenser ===\n');

    // 1. Obtener todos los dispensers instalados
    const { data: dispensers } = await supabase
        .from('dispensers')
        .select('id, cliente_id')
        .ilike('estado', '%instalado%');

    const clienteIdsConDispenser = new Set((dispensers || []).map(d => d.cliente_id));
    console.log(`Clientes con dispenser: ${clienteIdsConDispenser.size}`);

    // 2. Obtener todos los pedidos de estos clientes
    if (clienteIdsConDispenser.size === 0) {
        console.log('No hay clientes con dispenser.');
        return;
    }

    const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*, detalles_pedido(*)')
        .in('cliente_id', Array.from(clienteIdsConDispenser))
        .eq('estado', 'Entregado');

    console.log(`Pedidos encontrados: ${pedidos?.length || 0}\n`);

    let corregidos = 0;
    let errores = 0;

    for (const pedido of (pedidos || [])) {
        // Obtener mes del pedido
        const mesPedido = pedido.fecha.substring(0, 7); // YYYY-MM
        const inicioMes = `${mesPedido}-01`;
        
        // Contar bidones entregados este mes (excluyendo el pedido actual)
        let totalBidonesMes = 0;
        
        for (const p of (pedidos || [])) {
            if (p.cliente_id !== pedido.cliente_id) continue;
            if (p.fecha.substring(0, 7) !== mesPedido) continue;
            if (p.id === pedido.id) continue; // Excluir el pedido actual del cálculo

            const detalles = p.detalles_pedido || [];
            for (const d of detalles) {
                if (d.producto?.toLowerCase().includes('bidon') || 
                    d.producto?.toLowerCase().includes('bidón') ||
                    d.producto?.toLowerCase().includes('20l')) {
                    totalBidonesMes += (Number(d.cantidad) || 0);
                }
            }
        }

        // Agregar los bidones del pedido actual
        const detallesActuales = pedido.detalles_pedido || [];
        let bidonesActuales = 0;
        for (const d of detallesActuales) {
            if (d.producto?.toLowerCase().includes('bidon') || 
                d.producto?.toLowerCase().includes('bidón') ||
                d.producto?.toLowerCase().includes('20l')) {
                bidonesActuales += (Number(d.cantidad) || 0);
            }
        }

        // Calcular bidones grátis usados hasta ANTES de este pedido
        const gratisUsadosAntes = totalBidonesMes;
        const gratisRestantes = Math.max(0, 3 - gratisUsadosAntes);
        const cobrarBidones = Math.max(0, bidonesActuales - gratisRestantes);
        
        // Obtener precio unitario del detalle o usar 2500
        let precioUnitario = 2500;
        if (detallesActuales.length > 0) {
            precioUnitario = Number(detallesActuales[0].precio_unitario) || 2500;
        }
        
        const totalCorrecto = cobrarBidones * precioUnitario;

        console.log(`Pedido ${pedido.id}`);
        console.log(`  Cliente: ${pedido.cliente_id}`);
        console.log(`  Fecha: ${pedido.fecha}`);
        console.log(`  Bidones actuales: ${bidonesActuales}`);
        console.log(`  Gratis usados antes: ${gratisUsadosAntes}`);
        console.log(`  Gratis restantes: ${gratisRestantes}`);
        console.log(`  A cobrar: ${cobrarBidones} x ${precioUnitario} = ${totalCorrecto}`);
        console.log(`  Total actual en DB: ${pedido.total}`);

        if (pedido.total !== totalCorrecto) {
            console.log(`  ⚠️ DIFERENCIA - Actualizando...`);
            
            const { error } = await supabase
                .from('pedidos')
                .update({ total: totalCorrecto })
                .eq('id', pedido.id);
            
            if (error) {
                console.log(`  ❌ Error: ${error.message}`);
                errores++;
            } else {
                console.log(`  ✅ Corregido a ${totalCorrecto}`);
                corregidos++;
            }
        } else {
            console.log(`  ✅ Ya está correcto`);
        }
        console.log('');
    }

    console.log('=== RESUMEN ===');
    console.log(`Total corregidos: ${corregidos}`);
    console.log(`Errores: ${errores}`);
}

fixDispenserPedidos().catch(console.error);
