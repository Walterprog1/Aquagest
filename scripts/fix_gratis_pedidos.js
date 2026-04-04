import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixGratisPedidos() {
    console.log('🔍 Buscando pedidos gratuitos mal marcados...\n');

    // 1. Obtener todos los clientes con dispenser instalado
    const { data: dispensers, error: errDisp } = await supabase
        .from('dispensers')
        .select('cliente_id')
        .eq('estado', 'instalado');

    if (errDisp) {
        console.error('❌ Error al obtener dispensers:', errDisp);
        return;
    }

    const clientesConDispenser = [...new Set(dispensers?.map(d => d.cliente_id))];
    console.log(`📋 Clientes con dispenser instalado: ${clientesConDispenser.length}`);

    if (clientesConDispenser.length === 0) {
        console.log('⚠️ No hay clientes con dispenser instalado.');
        return;
    }

    // 2. Buscar pedidos de estos clientes que tengan total = 0 y pago_estado = 'pendiente'
    const { data: pedidosMalMarcados, error: errPedidos } = await supabase
        .from('pedidos')
        .select('id, cliente_id, total, medio_pago, pago_estado, fecha')
        .in('cliente_id', clientesConDispenser)
        .eq('total', 0)
        .eq('pago_estado', 'pendiente');

    if (errPedidos) {
        console.error('❌ Error al obtener pedidos:', errPedidos);
        return;
    }

    if (!pedidosMalMarcados || pedidosMalMarcados.length === 0) {
        console.log('✅ No se encontraron pedidos gratuitos mal marcados.');
        return;
    }

    // 3. Obtener nombres de clientes
    const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nombre')
        .in('id', clientesConDispenser);

    const clientesMap = new Map(clientesData?.map(c => [c.id, c.nombre]) || []);

    console.log(`\n⚠️ Encontrados ${pedidosMalMarcados.length} pedidos para corregir:\n`);

    pedidosMalMarcados.forEach(p => {
        console.log(`   - ID: ${p.id} | Cliente: ${clientesMap.get(p.cliente_id) || 'N/A'} | Fecha: ${p.fecha} | Total: $${p.total}`);
    });

    // 4. Corregir los pedidos
    console.log('\n🔧 Corrigiendo pedidos...');

    const idsToFix = pedidosMalMarcados.map(p => p.id);

    const { error: errUpdate } = await supabase
        .from('pedidos')
        .update({
            pago_estado: 'pagado',
            medio_pago: 'sin_cargo',
            estado: 'Entregado'
        })
        .in('id', idsToFix);

    if (errUpdate) {
        console.error('❌ Error al actualizar pedidos:', errUpdate);
        return;
    }

    console.log(`\n✅ Se corrigieron ${pedidosMalMarcados.length} pedidos correctamente.`);
    console.log('   - Estado cambiado a: Entregado');
    console.log('   - Pago estado cambiado a: pagado');
    console.log('   - Medio de pago establecido a: sin_cargo');
}

fixGratisPedidos()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });