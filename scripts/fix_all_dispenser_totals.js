import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Faltan las variables de entorno de Supabase');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDispenserPedidos() {
    console.log('=== Corrigiendo Totales de Pedidos para Clientes con Dispenser ===\n');

    // 1. Obtener todos los dispensers instalados (filtrando en memoria)
    const { data: dispensers, error: dispError } = await supabase
        .from('dispensers')
        .select('id, cliente_id, estado');

    if (dispError) {
        console.error('Error al obtener dispensers:', dispError);
        return;
    }

    // Filtrar dispensers instalados en memoria
    const dispensersInstalados = (dispensers || []).filter(d => 
        d.estado && d.estado.toLowerCase().includes('instalado')
    );

    const clienteIdsConDispenser = new Set(dispensersInstalados.map(d => d.cliente_id));
    console.log(`Clientes con dispenser instalado: ${clienteIdsConDispenser.size}`);

    if (clienteIdsConDispenser.size === 0) {
        console.log('No hay clientes con dispenser.');
        return;
    }

    // 2. Obtener TODOS los pedidos de estos clientes (sin filtro de fecha para revisar todo el historial)
    const { data: pedidos, error: pedError } = await supabase
        .from('pedidos')
        .select('id, cliente_id, fecha, total, estado, detalles_pedido(cantidad, producto, precio_unitario)')
        .in('cliente_id', Array.from(clienteIdsConDispenser))
        .eq('estado', 'Entregado');

    if (pedError) {
        console.error('Error al obtener pedidos:', pedError);
        return;
    }

    console.log(`Pedidos encontrados para clientes con dispenser: ${pedidos?.length || 0}\n`);

    let corregidos = 0;
    let yaCorrectos = 0;
    let errores = 0;

    // Procesar por cliente y mes
    const clientePedidos = {};
    for (const p of (pedidos || [])) {
        const key = `${p.cliente_id}-${p.fecha.substring(0, 7)}`;
        if (!clientePedidos[key]) {
            clientePedidos[key] = { cliente_id: p.cliente_id, mes: p.fecha.substring(0, 7), pedidos: [] };
        }
        clientePedidos[key].pedidos.push(p);
    }

    for (const key of Object.keys(clientePedidos)) {
        const grupo = clientePedidos[key];
        const clienteId = grupo.cliente_id;
        const mes = grupo.mes;

        console.log(`\n--- Cliente ${clienteId} - Mes ${mes} ---`);

        // Ordenar pedidos por fecha
        grupo.pedidos.sort((a, b) => a.fecha.localeCompare(b.fecha));

        let bidonesAcumulados = 0;

        for (const pedido of grupo.pedidos) {
            // Contar bidones del pedido actual
            const detalles = pedido.detalles_pedido || [];
            let bidonesPedido = 0;
            for (const d of detalles) {
                if (d.producto?.toLowerCase().includes('bidon') || 
                    d.producto?.toLowerCase().includes('bidón') ||
                    d.producto?.toLowerCase().includes('20l')) {
                    bidonesPedido += (Number(d.cantidad) || 0);
                }
            }

            // Obtener precio unitario
            let precioUnitario = 2500;
            if (detalles.length > 0 && detalles[0].precio_unitario) {
                precioUnitario = Number(detalles[0].precio_unitario);
            }

            // Calcular bidones grátis usados ANTES de este pedido
            const gratisRestantes = Math.max(0, 3 - (bidonesAcumulados % 3));
            const cobrarBidones = Math.max(0, bidonesPedido - gratisRestantes);
            const totalCorrecto = cobrarBidones * precioUnitario;

            console.log(`  Pedido ${pedido.id.substring(0, 8)}... | Fecha: ${pedido.fecha} | Bidones: ${bidonesPedido} | Total DB: ${pedido.total} | Correcto: ${totalCorrecto}`);

            if (pedido.total !== totalCorrecto) {
                console.log(`    ⚠️ Corrigiendo...`);
                const { error } = await supabase
                    .from('pedidos')
                    .update({ total: totalCorrecto })
                    .eq('id', pedido.id);
                
                if (error) {
                    console.log(`    ❌ Error: ${error.message}`);
                    errores++;
                } else {
                    console.log(`    ✅ Actualizado a ${totalCorrecto}`);
                    corregidos++;
                }
            } else {
                console.log(`    ✅ Ya estaba correcto`);
                yaCorrectos++;
            }

            bidonesAcumulados += bidonesPedido;
        }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Pedidos corregidos: ${corregidos}`);
    console.log(`Pedidos ya correctos: ${yaCorrectos}`);
    console.log(`Errores: ${errores}`);
}

fixDispenserPedidos().catch(console.error);
