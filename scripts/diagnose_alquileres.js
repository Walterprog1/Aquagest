import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bqkcuyfnvejcitgowkeg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'
);

async function diagnose() {
  console.log('\n=== 1. ESTADOS DE DISPENSERS ===');
  const { data: dispensers, error: de } = await supabase.from('dispensers').select('id, estado, cliente_id');
  if (de) { console.error('ERROR:', de.message); } else {
    const estados = [...new Set(dispensers.map(x => `"${x.estado}"`))]
    console.log('Estados encontrados:', estados.join(', '));
    console.log('Total dispensers:', dispensers.length);
    console.log('Con estado "Instalado" (exacto):', dispensers.filter(x => x.estado === 'Instalado').length);
    console.log('Con estado "instalado" (minúscula):', dispensers.filter(x => x.estado === 'instalado').length);
  }

  console.log('\n=== 2. PEDIDOS ENTREGADOS (ABRIL 2026) ===');
  const { data: pedidos, error: pe } = await supabase
    .from('pedidos')
    .select('id, cliente_id, estado, fecha')
    .eq('estado', 'Entregado')
    .gte('fecha', '2026-04-01')
    .lte('fecha', '2026-04-30');
  if (pe) { console.error('ERROR:', pe.message); } else {
    console.log('Pedidos Entregados en abril 2026:', pedidos?.length || 0);
    if (pedidos?.length > 0) console.log('Primer pedido:', JSON.stringify(pedidos[0]));
  }

  console.log('\n=== 3. PEDIDOS ENTREGADOS (MARZO 2026) ===');
  const { data: pedidosMar, error: pem } = await supabase
    .from('pedidos')
    .select('id, cliente_id, estado, fecha')
    .eq('estado', 'Entregado')
    .gte('fecha', '2026-03-01')
    .lte('fecha', '2026-03-31');
  if (pem) { console.error('ERROR:', pem.message); } else {
    console.log('Pedidos Entregados en marzo 2026:', pedidosMar?.length || 0);
  }

  console.log('\n=== 4. TEST JOIN detalles_pedido ===');
  const { data: join, error: je } = await supabase
    .from('pedidos')
    .select('id, detalles_pedido(cantidad, producto)')
    .eq('estado', 'Entregado')
    .limit(3);
  if (je) { console.error('ERROR JOIN:', je.message, je.code); } else {
    console.log('JOIN funciona. Muestra:', JSON.stringify(join));
  }

  console.log('\n=== 5. TODOS LOS ESTADOS DE PEDIDOS ===');
  const { data: allPed } = await supabase.from('pedidos').select('estado');
  const estadosPed = [...new Set(allPed?.map(x => `"${x.estado}"`) || [])];
  console.log('Estados de pedidos en BD:', estadosPed.join(', '));
}

diagnose().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
