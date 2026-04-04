import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnostic() {
    console.log("--- Diagnostic Check ---");
    
    // 1. Check all dispensers
    const { data: allDisp, error: err1 } = await supabase.from('dispensers').select('*');
    if (err1) console.error("Error fetching all dispensers:", err1);
    else console.log(`Total dispensers: ${allDisp?.length || 0}`);

    // 2. Check installed dispensers
    const { data: instDisp, error: err2 } = await supabase.from('dispensers').select('id, cliente_id, estado').eq('estado', 'instalado');
    if (err2) console.error("Error fetching installed dispensers:", err2);
    else console.log(`Installed dispensers: ${instDisp?.length || 0}`);

    // 3. Test relationship names
    const { data: testRel, error: err3 } = await supabase.from('dispensers').select('*, clientes(*)').limit(1);
    if (err3) {
        console.error("Error with 'clientes' relationship:", err3.message);
        const { data: testRel2, error: err4 } = await supabase.from('dispensers').select('*, cliente(*)').limit(1);
        if (err4) console.error("Error with 'cliente' relationship:", err4.message);
        else console.log("Relationship name is likely 'cliente' (singular)");
    } else {
        console.log("Relationship name 'clientes' (plural) is CORRECT");
    }

    if (instDisp && instDisp.length > 0) {
        console.log("First installed dispenser:", instDisp[0]);
    }
}

diagnostic();
