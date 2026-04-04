import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bqkcuyfnvejcitgowkeg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0'
);

async function diagnose() {
  // 1. Count with .count() approach (sometimes bypasses RLS differently)
  console.log('\n=== 1. COUNT de dispensers (sin filtro) ===');
  const { count: totalDisp, error: ce } = await supabase
    .from('dispensers')
    .select('*', { count: 'exact', head: true });
  console.log('Count total dispensers:', totalDisp, 'Error:', ce?.message || 'ninguno');

  // 2. Leer TODAS las columnas de 1 dispenser (sin filtro)
  console.log('\n=== 2. Primer dispenser (sin filtrar estado) ===');
  const { data: anyDisp, error: ae } = await supabase
    .from('dispensers')
    .select('*')
    .limit(5);
  if (ae) console.error('Error:', ae.message);
  else {
    console.log('Dispensers encontrados (sin filtro):', anyDisp?.length || 0);
    if (anyDisp?.length > 0) {
      console.log('Columnas disponibles:', Object.keys(anyDisp[0]));
      console.log('Datos:', JSON.stringify(anyDisp, null, 2));
    }
  }

  // 3. Verificar si el campo se llama 'cliente_id' o algo distinto
  console.log('\n=== 3. Test JOIN con clientes ===');
  const { data: joinData, error: je } = await supabase
    .from('dispensers')
    .select('*, clientes(id, nombre)')
    .limit(3);
  if (je) {
    console.error('Error JOIN clientes:', je.message);
  } else {
    console.log('JOIN ok, registros:', joinData?.length);
    if (joinData?.length > 0) console.log('Ejemplo:', JSON.stringify(joinData[0]));
  }

  // 4. Verificar pedidos (sin filtro de estado)
  console.log('\n=== 4. COUNT pedidos total ===');
  const { count: totalPed, error: pe } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true });
  console.log('Count total pedidos:', totalPed, 'Error:', pe?.message || 'ninguno');

  // 5. Verificar si hay clientes
  console.log('\n=== 5. COUNT clientes total ===');
  const { count: totalCli, error: clie } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true });
  console.log('Count total clientes:', totalCli, 'Error:', clie?.message || 'ninguno');
}

diagnose().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
