import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqkcuyfnvejcitgowkeg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa2N1eWZudmVqY2l0Z293a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDA4NTIsImV4cCI6MjA4OTExNjg1Mn0.DDBVkIK3KMnd5qUEyYMAuNhMDd5wxNkpTsC91_bA9T0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    try {
        console.log('Fetching ALL dispensers');
        const { data: dbDispensers, error: dispError } = await supabase
            .from('dispensers')
            .select(`*`);
            
        if (dispError) console.error("Error dispensers:", dispError);
        else console.log("ALL Dispensers data length:", dbDispensers?.length, JSON.stringify(dbDispensers, null, 2));

    } catch (err) {
        console.error("Catch error:", err);
    }
}

testFetch();
