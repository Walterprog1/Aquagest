const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bqkcuyfnvejcitgowkeg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0');

async function test() {
    const { data, error } = await supabase.from('dispensers').select('id, estado');
    console.log('Error:', error);
    if (data) {
        const statuses = [...new Set(data.map(d => d.estado))];
        console.log('Statuses in DB:', JSON.stringify(statuses));
        console.log('Count:', data.length);
    }
}
test();
